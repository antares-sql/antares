import { MariaSQL, MySQL, PostgreSQL, SQLDialect, SQLDialectSpec, SQLite } from '@codemirror/lang-sql';
import { parseMixed } from '@lezer/common';

import { aceSqlWords, SqlWordLists } from './aceSqlWords';

/** Code of a SQL dialect, set per engine by the `sqlDialect` customization */
export type SqlDialectCode = 'mysql' | 'mariadb' | 'postgresql' | 'sqlite' | 'firebird' | 'sql';

export interface SqlSnippet {
   /** Text typed to pick the snippet */
   label: string;
   /** Snippet template: `${1:name}` fields, `\t` indentation */
   template: string;
}

export interface SqlDialectDefinition {
   dialect: SQLDialect;
   snippets?: SqlSnippet[];
}

/** lang-sql highlights these as atoms: listing them as keywords would override that */
const atoms = ['true', 'false', 'null', 'unknown'];

/** Adds the words known by the Ace SQL modes to a lang-sql dialect spec */
const withWords = (spec: SQLDialectSpec, words: SqlWordLists): SQLDialectSpec => ({
   ...spec,
   keywords: [spec.keywords, words.keywords, words.constants]
      .filter(Boolean)
      .join(' ')
      .split(' ')
      .filter(word => !atoms.includes(word))
      .join(' '),
   types: [spec.types, words.types].filter(Boolean).join(' '),
   builtin: [spec.builtin, words.functions].filter(Boolean).join(' ')
});

/** Snippets of Ace's generic "sql" mode (Oracle only ones left out) */
/* eslint-disable no-template-curly-in-string */
const sqlSnippets: SqlSnippet[] = [
   { label: 'tbl', template: 'create table ${1:table} (\n\t${2:columns}\n);' },
   { label: 'col', template: '${1:name}\t${2:type}\t${3:default \'\'}\t${4:not null}' },
   { label: 'ind', template: 'create index ${3:index} on ${1:table}(${2:column});' },
   { label: 'uind', template: 'create unique index ${1:name} on ${2:table}(${3:column});' },
   { label: 'tblcom', template: 'comment on table ${1:table} is \'${2:comment}\';' },
   { label: 'colcom', template: 'comment on column ${1:table}.${2:column} is \'${3:comment}\';' },
   { label: 'addcol', template: 'alter table ${1:table} add (${2:column} ${3:type});' },
   { label: 'seq', template: 'create sequence ${1:name} start with ${2:1} increment by ${3:1} minvalue ${4:1};' },
   { label: 's*', template: 'select * from ${1:table}' }
];
/* eslint-enable no-template-curly-in-string */

const firebirdSpec: SQLDialectSpec = {
   keywords: 'absolute accent action active add admin after all alter always and any as asc ascending at auto autonomous ' +
      'backup before begin between block body both break by caller cascade case close collate collation column comment ' +
      'commit committed common computed conditional connect constraint containing continue create cross current ' +
      'current_connection current_date current_role current_time current_timestamp current_transaction current_user ' +
      'cursor data database ddl debug declare default definer delete deleting desc descending deterministic difference ' +
      'disable disconnect distinct do domain drop else enable end engine entry_point escape exception excess exclude ' +
      'execute exists exit external fetch filter first following for foreign free_it from full function gdscode generated ' +
      'generator global grant granted group having identity idle if ignore in inactive include increment index inner ' +
      'input_type insensitive insert inserting into invoker is isolation join key last lateral leading leave level ' +
      'lifetime like limbo linger local localtime localtimestamp lock locked manual mapping matched matching merge ' +
      'message module_name names national natural next no not nulls of offset oldest on only open option or order ' +
      'others outer output_type over overflow overriding owner package pad page page_size pages parameter partition ' +
      'password plan plugin pool post_event preceding preserve primary prior privilege privileges procedure protected ' +
      'publication range read record_version recreate recursive references release replace requests reserving ' +
      'resetting restart restrict retain return returning returning_values returns revoke role rollback row row_count ' +
      'rows savepoint schema scroll security segment select sensitive sequence serverwide session set shadow shared ' +
      'similar singular size skip snapshot some sort source space sql sqlcode sqlstate stability start starting statement ' +
      'statistics sub_type suspend system table tags temporary then ties timeout to trailing transaction traps trigger ' +
      'trusted two_phase type uncommitted undo union unique update updating usage user using value values variable ' +
      'view wait week weekday when where while window with without work write yearday zone ' +
      'day hour minute second millisecond month year timezone_hour timezone_minute',
   types: 'bigint binary blob boolean char character cstring date decfloat decimal double float int int128 integer ' +
      'long nchar numeric precision real smallint time timestamp varbinary varchar varying',
   builtin: 'abs acos acosh ascii_char ascii_val asin asinh atan atan2 atanh avg base64_decode base64_encode bin_and ' +
      'bin_not bin_or bin_shl bin_shr bin_xor bit_length blob_append cast ceil ceiling char_length char_to_uuid ' +
      'character_length coalesce corr cos cosh cot count covar_pop covar_samp crypt_hash cume_dist dateadd datediff ' +
      'decode decrypt dense_rank encrypt exp extract first_day first_value floor gen_id gen_uuid hash hex_decode ' +
      'hex_encode iif lag last_day last_value lead left list ln log log10 lower lpad make_dbkey max min mod ' +
      'nth_value ntile nullif octet_length overlay percent_rank pi position power rand rank rdb$error rdb$get_context ' +
      'rdb$get_transaction_cn rdb$role_in_use rdb$set_context rdb$system_privilege regr_avgx regr_avgy regr_count ' +
      'regr_intercept regr_r2 regr_slope regr_sxx regr_sxy regr_syy replace reverse right round row_number rpad ' +
      'rsa_decrypt rsa_encrypt rsa_private rsa_public rsa_sign_hash rsa_verify_hash sign sin sinh sqrt stddev_pop ' +
      'stddev_samp substring sum tan tanh trim trunc unicode_char unicode_val upper uuid_to_char var_pop var_samp',
   identifierQuotes: '"',
   caseInsensitiveIdentifiers: true,
   specialVar: ':?'
};

/** Opening delimiter of a dollar-quoted string: `$$` or `$tag$` */
const dollarQuote = /^\$([A-Za-z_\u0080-￿][\w\u0080-￿]*)?\$/;

/**
 * PostgreSQL with the content of dollar-quoted strings (`$function$ ... $function$`,
 * `$$ ... $$`) parsed as SQL, like Ace did: they are mostly routine bodies.
 */
const postgresqlDialect = (() => {
   const base = SQLDialect.define(withWords(PostgreSQL.spec, aceSqlWords.pgsql));
   let dialect: SQLDialect = null;
   dialect = base.configureLanguage({
      wrap: parseMixed((node, input) => {
         if (node.type.name !== 'String') return null;
         const quote = dollarQuote.exec(input.read(node.from, Math.min(node.to, node.from + 64)));
         if (!quote) return null;
         const length = quote[0].length;
         if (node.to - node.from < length * 2) return null; // Unterminated
         return {
            parser: dialect.language.parser, // Nested bodies are parsed the same way
            overlay: [{ from: node.from + length, to: node.to - length }]
         };
      })
   });
   return dialect;
})();

const dialects: Record<string, SqlDialectDefinition> = {
   mysql: { dialect: SQLDialect.define(withWords(MySQL.spec, aceSqlWords.mysql)) },
   mariadb: { dialect: SQLDialect.define(withWords(MariaSQL.spec, aceSqlWords.mysql)) },
   postgresql: { dialect: postgresqlDialect },
   sqlite: { dialect: SQLDialect.define(withWords(SQLite.spec, aceSqlWords.sql)), snippets: sqlSnippets },
   firebird: { dialect: SQLDialect.define(withWords(firebirdSpec, aceSqlWords.sql)), snippets: sqlSnippets },
   // Generic SQL: the standard keywords (SQLite's are the standard ones plus a few) and the words of Ace's "sql" mode
   sql: { dialect: SQLDialect.define(withWords({ keywords: SQLite.spec.keywords, types: SQLite.spec.types }, aceSqlWords.sql)), snippets: sqlSnippets }
};

/** Registers a new SQL dialect (or replaces one), e.g. for a new engine */
export const registerSqlDialect = (code: string, definition: SqlDialectDefinition) => {
   dialects[code] = definition;
};

export const getSqlDialect = (code: string): SqlDialectDefinition => dialects[code] ?? dialects.sql;
