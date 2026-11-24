import { ClientCode } from 'common/interfaces/antares';

/**
 * Lexical scanner of SQL scripts, used to split them into statements and to remove comments
 * without touching string literals, quoted identifiers and routine bodies (#580, #1003, #1025).
 */

type SegmentType =
   | 'code'
   | 'string' // '...', E'...', MySQL "..."
   | 'identifier' // "...", `...`, [...]
   | 'dollar' // PostgreSQL $tag$...$tag$
   | 'comment' // -- ..., # ..., /* ... */
   | 'hint'; // MySQL /*! ... */ and /*+ ... */: executed by the server, never removed

interface Segment {
   type: SegmentType;
   start: number;
   end: number; // exclusive
}

const isMySQL = (dbType: ClientCode) => dbType === 'mysql' || dbType === 'maria';
const isIdentifierChar = (char: string) => !!char && /[\w$\u0080-￿]/.test(char);

/** End (exclusive) of a quoted section opened at `start`, with doubled closing chars and optional backslash escapes */
function quotedEnd (sql: string, start: number, close: string, backslashEscapes: boolean) {
   for (let i = start + 1; i < sql.length; i++) {
      const char = sql[i];
      if (backslashEscapes && char === '\\')
         i++;
      else if (char === close) {
         if (sql[i + 1] === close) i++; // Doubled: escaped closing char
         else return i + 1;
      }
   }
   return sql.length;
}

export function scanSql (sql: string, dbType: ClientCode): Segment[] {
   const segments: Segment[] = [];
   let codeStart = 0;
   let i = 0;

   const push = (type: SegmentType, end: number) => {
      if (i > codeStart) segments.push({ type: 'code', start: codeStart, end: i });
      segments.push({ type, start: i, end });
      i = end;
      codeStart = end;
   };

   while (i < sql.length) {
      const char = sql[i];
      const next = sql[i + 1];
      const prev = sql[i - 1];

      if (char === '\'') {
         // PostgreSQL E'...' strings accept backslash escapes (the E is part of the literal)
         const isEscapeString = dbType === 'pg' && /[eE]/.test(prev) && !isIdentifierChar(sql[i - 2]);
         push('string', quotedEnd(sql, i, '\'', isMySQL(dbType) || isEscapeString));
      }
      else if (char === '"')
         push(isMySQL(dbType) ? 'string' : 'identifier', quotedEnd(sql, i, '"', isMySQL(dbType)));
      else if (char === '`' && (isMySQL(dbType) || dbType === 'sqlite'))
         push('identifier', quotedEnd(sql, i, '`', false));
      else if (char === '[' && dbType === 'sqlite')
         push('identifier', quotedEnd(sql, i, ']', false));
      else if (char === '-' && next === '-' && (!isMySQL(dbType) || !sql[i + 2] || /\s/.test(sql[i + 2]))) {
         // MySQL needs a whitespace after "--" (SELECT 1--1 is a subtraction)
         const newline = sql.indexOf('\n', i);
         push('comment', newline === -1 ? sql.length : newline);
      }
      else if (char === '#' && isMySQL(dbType)) {
         const newline = sql.indexOf('\n', i);
         push('comment', newline === -1 ? sql.length : newline);
      }
      else if (char === '/' && next === '*') {
         const close = sql.indexOf('*/', i + 2);
         const end = close === -1 ? sql.length : close + 2;
         const isHint = isMySQL(dbType) && (sql[i + 2] === '!' || sql[i + 2] === '+');
         push(isHint ? 'hint' : 'comment', end);
      }
      else if (char === '$' && dbType === 'pg' && !isIdentifierChar(prev)) {
         const tag = /^\$(?:[A-Za-z_\u0080-￿][\w\u0080-￿]*)?\$/.exec(sql.slice(i, i + 64))?.[0];
         if (tag) {
            const close = sql.indexOf(tag, i + tag.length);
            push('dollar', close === -1 ? sql.length : close + tag.length);
         }
         else i++;
      }
      else
         i++;
   }

   if (sql.length > codeStart) segments.push({ type: 'code', start: codeStart, end: sql.length });
   return segments;
}

/** The script without comments (MySQL optimizer hints and versioned comments are kept) */
export function removeComments (sql: string, dbType: ClientCode = 'pg'): string {
   return scanSql(sql, dbType).map(segment => {
      if (segment.type !== 'comment') return sql.slice(segment.start, segment.end);
      // A block comment can separate two tokens (SELECT/* x */1)
      return sql[segment.start] === '/' ? ' ' : '';
   }).join('');
}

/** Statements whose body can contain semicolons inside BEGIN ... END blocks */
const ROUTINE_START = /^\s*(?:CREATE|ALTER|RECREATE)\b[\s\S]*?\b(?:PROCEDURE|FUNCTION|TRIGGER|EVENT|PACKAGE)\b|^\s*EXECUTE\s+BLOCK\b/i;
/** END of a MySQL flow control statement: its opening keyword is not counted */
const END_OF_CONTROL_FLOW = /^\s+(?:IF|LOOP|WHILE|REPEAT|FOR)\b/i;
/** isql command changing the statement terminator of Firebird scripts: SET TERM ^ ; ... SET TERM ; ^ */
const SET_TERM = /^SET\s+TERM\s+(\S+)$/i;

/** Tokens of a code segment: words, the statement terminator, semicolons and other characters */
function tokenizer (terminator: string) {
   if (terminator === ';')
      return /[A-Za-z_][\w$]*|;|[^A-Za-z_;]+/g;

   const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
   return new RegExp(`${escape(terminator)}|[A-Za-z_][\\w$]*|;|[^A-Za-z_;${escape(terminator[0])}]+|[\\s\\S]`, 'g');
}

/**
 * Splits a script into statements on semicolons outside strings, identifiers, comments,
 * PostgreSQL dollar quotes and BEGIN ... END blocks of routines. Each statement is the original
 * text, trimmed, with its semicolon; statements made only of comments are left out.
 * Firebird scripts can change the terminator with the isql SET TERM command: statements then end
 * only at the new terminator, which is removed (the SET TERM commands are not returned).
 * MySQL scripts do the same with the mysql client command DELIMITER, which ends at the end of its line.
 */
export function querySplitter (sql: string, dbType: ClientCode): string[] {
   return splitStatements(sql, dbType, { final: true }).statements;
}

export interface SplitResult {
   /** Complete statements */
   statements: string[];
   /** End (exclusive) of each statement in the text */
   ends: number[];
   /** Text after the last complete statement (an unfinished statement) */
   rest: string;
   /** Statement terminator at the end of the text (changed by SET TERM in Firebird scripts) */
   terminator: string;
}

/**
 * querySplitter for scripts read in chunks: the text after the last terminated statement is returned as rest,
 * to prepend to the next chunk. With final, the rest is the last statement (end of the script).
 */
export function splitStatements (sql: string, dbType: ClientCode, options: { terminator?: string; final?: boolean } = {}): SplitResult {
   const statements: string[] = [];
   const ends: number[] = [];
   let statementStart = 0;
   let statementCode = ''; // Code of the current statement, without strings and comments
   let hasContent = false;
   let isRoutine = false;
   let depth = 0;
   let previousWord = '';
   let bodyStarted = false;
   let terminator = options.terminator ?? ';';

   const endStatement = (end: number) => {
      let text = sql.slice(statementStart, end).trim();
      let command = text.replace(/;$/, '').trim(); // Without the terminator
      if (terminator !== ';' && text.endsWith(terminator))
         command = text = text.slice(0, -terminator.length).trim();

      const setTerm = dbType === 'firebird' ? SET_TERM.exec(removeComments(command, dbType).trim()) : null;
      if (setTerm)
         terminator = setTerm[1];
      else if (hasContent && text) {
         statements.push(text);
         ends.push(end);
      }
      statementStart = end;
      statementCode = '';
      hasContent = false;
      isRoutine = false;
      depth = 0;
      bodyStarted = false;
   };

   // Firebird PSQL declares variables between AS and the BEGIN of the body: AS DECLARE x INT; BEGIN ... END
   const isInFirebirdDeclarations = () => dbType === 'firebird' && !bodyStarted &&
      ROUTINE_START.test(statementCode) && /\bAS\b/i.test(statementCode);

   /** End of the last DELIMITER command: the text before it is already read */
   let skipUntil = 0;
   /** A DELIMITER command without the end of its line: read again with the next chunk */
   let incomplete = false;

   for (const segment of scanSql(sql, dbType)) {
      if (incomplete) break;
      if (segment.end <= skipUntil) continue;

      if (segment.type !== 'code') {
         if (segment.type !== 'comment') hasContent = true;
         statementCode += ' ';
         continue;
      }

      const text = sql.slice(segment.start, segment.end);
      let tokens = tokenizer(terminator);
      if (segment.start < skipUntil) tokens.lastIndex = skipUntil - segment.start;
      let match: RegExpExecArray;

      // After a SET TERM the tokens are read with the new terminator
      const endAt = (end: number) => {
         const previous = terminator;
         endStatement(end);
         if (terminator !== previous) {
            const lastIndex = tokens.lastIndex;
            tokens = tokenizer(terminator);
            tokens.lastIndex = lastIndex;
         }
      };

      while ((match = tokens.exec(text))) {
         const token = match[0];
         const position = segment.start + match.index;

         if (terminator !== ';') {
            if (token === terminator) {
               endAt(position + token.length);
               continue;
            }
            if (token === ';') { // A plain character until the default terminator is restored
               statementCode += token;
               continue;
            }
         }

         if (token === ';') {
            if (depth > 0 || isInFirebirdDeclarations()) {
               statementCode += token;
               continue;
            }
            endAt(position + 1);
            continue;
         }

         const word = token.toUpperCase();

         // mysql client command changing the statement terminator: DELIMITER ;; (up to the end of the line)
         if (word === 'DELIMITER' && isMySQL(dbType) && !hasContent && /^(\s|$)/.test(sql.slice(position + token.length, position + token.length + 1))) {
            const newline = sql.indexOf('\n', position);
            if (newline === -1 && !options.final) {
               incomplete = true;
               break;
            }

            const end = newline === -1 ? sql.length : newline + 1;
            const delimiter = sql.slice(position + token.length, end).trim().split(/\s+/)[0];
            if (delimiter) terminator = delimiter;
            statementStart = end;
            statementCode = '';
            skipUntil = end;
            if (end >= segment.end) break;
            tokens = tokenizer(terminator);
            tokens.lastIndex = end - segment.start;
            continue;
         }

         if (/\S/.test(token)) hasContent = true;

         if (word === 'BEGIN') {
            // MariaDB anonymous blocks: BEGIN NOT ATOMIC ... END
            if (!statementCode.trim() && /^\s+NOT\s+ATOMIC\b/i.test(sql.slice(position + 5)))
               isRoutine = true;
            else
               isRoutine ||= ROUTINE_START.test(statementCode);

            if (isRoutine) {
               depth++;
               bodyStarted = true;
            }
         }
         else if (isRoutine && word === 'CASE' && previousWord !== 'END') // END CASE closes a CASE statement
            depth++;
         else if (isRoutine && word === 'END' && depth > 0 && !END_OF_CONTROL_FLOW.test(sql.slice(position + 3)))
            depth--;

         if (/\w/.test(token)) previousWord = word;
         statementCode += token;
      }
   }

   if (!options.final || incomplete)
      return { statements, ends, rest: sql.slice(statementStart), terminator };

   endStatement(sql.length);
   return { statements, ends, rest: '', terminator };
}
