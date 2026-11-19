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

/**
 * Splits a script into statements on semicolons outside strings, identifiers, comments,
 * PostgreSQL dollar quotes and BEGIN ... END blocks of routines. Each statement is the original
 * text, trimmed, with its semicolon; statements made only of comments are left out.
 */
export function querySplitter (sql: string, dbType: ClientCode): string[] {
   const statements: string[] = [];
   let statementStart = 0;
   let statementCode = ''; // Code of the current statement, without strings and comments
   let hasContent = false;
   let isRoutine = false;
   let depth = 0;
   let previousWord = '';
   let bodyStarted = false;

   const endStatement = (end: number) => {
      const text = sql.slice(statementStart, end).trim();
      if (hasContent && text) statements.push(text);
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

   for (const segment of scanSql(sql, dbType)) {
      if (segment.type !== 'code') {
         if (segment.type !== 'comment') hasContent = true;
         statementCode += ' ';
         continue;
      }

      const tokens = /[A-Za-z_][\w$]*|;|[^A-Za-z_;]+/g;
      const text = sql.slice(segment.start, segment.end);
      let match: RegExpExecArray;

      while ((match = tokens.exec(text))) {
         const token = match[0];
         const position = segment.start + match.index;

         if (token === ';') {
            if (depth > 0 || isInFirebirdDeclarations()) {
               statementCode += token;
               continue;
            }
            endStatement(position + 1);
            continue;
         }

         if (/\S/.test(token)) hasContent = true;
         const word = token.toUpperCase();

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

   endStatement(sql.length);
   return statements;
}
