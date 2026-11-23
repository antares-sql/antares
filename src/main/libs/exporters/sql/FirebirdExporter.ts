import * as exporter from 'common/interfaces/exporter';
import * as firebird from 'node-firebird';

import { FirebirdSQLClient } from '../../clients/FirebirdSQLClient';
import { DataColumn, NUMERIC_LITERAL, SqlExporter, ValueFormatter } from './SqlExporter';

/** Type of a column, parameter or domain (RDB$FIELDS) */
interface FieldType {
   type: number;
   subType: number | null;
   length: number | null;
   charLength: number | null;
   precision: number | null;
   scale: number | null;
   charset: string | null;
   collation: string | null;
}

interface ColumnInfo extends FieldType {
   name: string;
   /** Domain or system field (RDB$...) */
   source: string;
   notnull: number | null;
   default: string | null;
   computed: string | null;
   /** 0: ALWAYS, 1: BY DEFAULT (Firebird 3+) */
   identity: number | null;
   generator: string | null;
   comment: string | null;
}

interface TableInfo {
   relationType: number | null;
   comment: string | null;
   columns: ColumnInfo[];
}

/** Literals longer than this are split and concatenated as BLOB (string literals are limited to 32K bytes) */
const LITERAL_CHUNK = 8000;

const TYPE_NAMES: Record<number, string> = {
   7: 'SMALLINT',
   8: 'INTEGER',
   16: 'BIGINT',
   26: 'INT128',
   10: 'FLOAT',
   11: 'DOUBLE PRECISION',
   27: 'DOUBLE PRECISION',
   12: 'DATE',
   13: 'TIME',
   35: 'TIMESTAMP',
   28: 'TIME WITH TIME ZONE',
   29: 'TIMESTAMP WITH TIME ZONE',
   23: 'BOOLEAN',
   24: 'DECFLOAT(16)',
   25: 'DECFLOAT(34)'
};
const INTEGER_TYPES = [7, 8, 16, 26];
const DEFAULT_PRECISION: Record<number, number> = { 7: 4, 8: 9, 16: 18, 26: 38 };
const DATETIME_TYPES = [12, 13, 35, 28, 29];
const TEXT_TYPES = [14, 37, 40];
const BLOB_TYPE = 261;

/** Columns of a type definition, for queries on RDB$FIELDS aliased f */
const FIELD_TYPE_COLUMNS = `
   f.RDB$FIELD_TYPE AS "type",
   f.RDB$FIELD_SUB_TYPE AS "subType",
   f.RDB$FIELD_LENGTH AS "length",
   f.RDB$CHARACTER_LENGTH AS "charLength",
   f.RDB$FIELD_PRECISION AS "precision",
   f.RDB$FIELD_SCALE AS "scale",
   TRIM(cs.RDB$CHARACTER_SET_NAME) AS "charset"`;

/**
 * Firebird dump, a script for isql (and the Antares query editor): PSQL code is written between
 * SET TERM ^ ; and SET TERM ; ^. The structure is read from the system tables, all the rows
 * inside one snapshot transaction.
 */
export default class FirebirdExporter extends SqlExporter {
   protected _client: FirebirdSQLClient;
   protected _multiRowInsert = false; // No multi-row INSERT ... VALUES
   // Procedures are created empty before the views and the triggers that may use them, their body is set at the end
   protected _extraItemsOrder: ('routines' | 'views' | 'triggers')[] = ['routines', 'views', 'triggers'];
   private _db?: firebird.Database;
   private _transaction?: firebird.Transaction;
   private _major = 0;
   private readonly _tableInfos = new Map<string, Promise<TableInfo>>();

   constructor (client: FirebirdSQLClient, tables: exporter.TableParams[], options: exporter.ExportOptions) {
      super(tables, options);

      this._client = client;
   }

   get host () {
      return this._client.host;
   }

   async getServerVersion () {
      const version = await this._client.getVersion();
      return `${version.name} ${version.number}`;
   }

   quoteName (name: string) {
      return `"${name.replaceAll('"', '""')}"`;
   }

   quoteString (value: string) {
      return `'${value.replaceAll('\'', '\'\'')}'`;
   }

   async prepare () {
      this._db = await this._client.getConnection();
      this._transaction = await new Promise<firebird.Transaction>((resolve, reject) => {
         this._db.transaction(firebird.ISOLATION_REPEATABLE_READ, (err, transaction) => {
            if (err) reject(err);
            else resolve(transaction);
         });
      });

      const [{ version }] = await this._query<{ version: string }>('SELECT rdb$get_context(\'SYSTEM\', \'ENGINE_VERSION\') AS "version" FROM RDB$DATABASE');
      this._major = parseInt(version);
   }

   async cleanup () {
      const { _db: db, _transaction: transaction } = this;
      this._db = undefined;
      this._transaction = undefined;

      if (transaction) await new Promise<void>(resolve => transaction.rollback(() => resolve()));
      db?.detach();
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   private async _query<T = any> (sql: string, params: unknown[] = []): Promise<T[]> {
      const rows = await new Promise<T[]>((resolve, reject) => {
         this._transaction.query(sql, params, (err, result) => {
            if (err) reject(err);
            else resolve(result as T[]);
         });
      });

      // Text BLOBs (sources of views, triggers...) not read by blobAsText
      for (const row of rows) {
         for (const key in row) {
            const value = row[key] as unknown;
            if (typeof value === 'function') row[key] = (await this._readBlob(value)).toString('utf8') as never;
         }
      }

      return rows;
   }

   /** Content of a BLOB value (node-firebird returns a function reading it) */
   private _readBlob (blob: unknown) {
      return new Promise<Buffer>((resolve, reject) => {
         // Read in the transaction of the dump: (transaction, callback)
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         (blob as any)(this._transaction, (err: Error, _name: string, event: any) => {
            if (err) return reject(err);
            if (!event) return resolve(Buffer.alloc(0));

            const chunks: Buffer[] = [];
            event.on('data', (chunk: Buffer) => chunks.push(chunk));
            event.on('end', () => resolve(Buffer.concat(chunks)));
            event.on('error', reject);
         });
      });
   }

   async getFooter () {
      return `COMMIT;\n\n${await super.getFooter()}\n`;
   }

   /** PSQL statements, terminated by ^ */
   private _psql (statements: string[]) {
      return statements.length ? `SET TERM ^ ;\n\n${statements.join('^\n\n')}^\n\nSET TERM ; ^\n` : '';
   }

   async getSqlHeader () {
      let dump = await super.getSqlHeader();
      dump += `\n${this.buildComment('Run it with: isql -ch UTF8 -i <file> <database>')}\n\n\n`;

      // Objects used by the tables
      dump += await this._domains();
      dump += await this._sequences();
      dump += await this._exceptions();

      return dump;
   }

   private async _domains () {
      const domains = await this._query<FieldType & { name: string; default: string | null; notnull: number | null; check: string | null }>(`
         SELECT TRIM(f.RDB$FIELD_NAME) AS "name", ${FIELD_TYPE_COLUMNS},
            f.RDB$DEFAULT_SOURCE AS "default",
            f.RDB$NULL_FLAG AS "notnull",
            f.RDB$VALIDATION_SOURCE AS "check",
            TRIM(co.RDB$COLLATION_NAME) AS "collation"
         FROM RDB$FIELDS f
         LEFT JOIN RDB$CHARACTER_SETS cs ON cs.RDB$CHARACTER_SET_ID = f.RDB$CHARACTER_SET_ID
         LEFT JOIN RDB$COLLATIONS co ON co.RDB$CHARACTER_SET_ID = f.RDB$CHARACTER_SET_ID AND co.RDB$COLLATION_ID = f.RDB$COLLATION_ID
         WHERE COALESCE(f.RDB$SYSTEM_FLAG, 0) = 0 AND f.RDB$FIELD_NAME NOT STARTING WITH 'RDB$'
         ORDER BY f.RDB$FIELD_NAME
      `);
      if (!domains.length) return '';

      let sql = this.buildComment('Dump of domains\n------------------------------------------------------------') + '\n\n';
      for (const domain of domains) {
         sql += `CREATE DOMAIN ${this.quoteName(domain.name)} AS ${this._typeSql(domain)}`;
         if (domain.default) sql += ` ${domain.default.trim()}`;
         if (domain.notnull) sql += ' NOT NULL';
         if (domain.check) sql += ` ${domain.check.trim()}`;
         sql += `${this._collateSql(domain)};\n`;
      }
      return `${sql}\n`;
   }

   private async _sequences () {
      const sequences = await this._query<{ name: string; start: number; increment: number }>(`
         SELECT TRIM(RDB$GENERATOR_NAME) AS "name",
            ${this._major >= 3 ? 'RDB$INITIAL_VALUE' : '0'} AS "start",
            ${this._major >= 3 ? 'RDB$GENERATOR_INCREMENT' : '1'} AS "increment"
         FROM RDB$GENERATORS
         WHERE COALESCE(RDB$SYSTEM_FLAG, 0) = 0
         ORDER BY RDB$GENERATOR_NAME
      `);
      if (!sequences.length) return '';

      let sql = this.buildComment('Dump of sequences\n------------------------------------------------------------') + '\n\n';
      for (const sequence of sequences) {
         const name = this.quoteName(sequence.name);
         sql += this._major >= 3
            ? `CREATE OR ALTER SEQUENCE ${name} START WITH ${sequence.start} INCREMENT BY ${sequence.increment};\n`
            : `CREATE SEQUENCE ${name};\n`;

         // Current values are restored after the data
         const value = await this._generatorValue(sequence.name);
         this._postTablesSql += `ALTER SEQUENCE ${name} RESTART WITH ${this._restartValue(value, sequence.increment)};\n`;
      }
      return `${sql}\n`;
   }

   private async _generatorValue (name: string) {
      const [{ value }] = await this._query<{ value: number | string }>(`SELECT GEN_ID(${this.quoteName(name)}, 0) AS "value" FROM RDB$DATABASE`);
      return BigInt(value);
   }

   /** Firebird 4 changed RESTART WITH: the next value is the restart value, before it was the restart value + increment */
   private _restartValue (current: bigint, increment: number) {
      return this._major >= 4 ? current + BigInt(increment ?? 1) : current;
   }

   private async _exceptions () {
      const exceptions = await this._query<{ name: string; message: string }>(`
         SELECT TRIM(RDB$EXCEPTION_NAME) AS "name", RDB$MESSAGE AS "message"
         FROM RDB$EXCEPTIONS
         WHERE COALESCE(RDB$SYSTEM_FLAG, 0) = 0
         ORDER BY RDB$EXCEPTION_NAME
      `);
      if (!exceptions.length) return '';

      let sql = this.buildComment('Dump of exceptions\n------------------------------------------------------------') + '\n\n';
      for (const exception of exceptions)
         sql += `CREATE OR ALTER EXCEPTION ${this.quoteName(exception.name)} ${this.quoteString(exception.message ?? '')};\n`;
      return `${sql}\n`;
   }

   /** SQL type of a column, parameter or domain */
   private _typeSql (field: FieldType) {
      const { type, subType, scale, charset } = field;

      if (INTEGER_TYPES.includes(type) && (subType === 1 || subType === 2 || scale < 0))
         return `${subType === 2 ? 'DECIMAL' : 'NUMERIC'}(${field.precision || DEFAULT_PRECISION[type]}, ${-scale})`;

      if (TYPE_NAMES[type]) return TYPE_NAMES[type];

      const charsetSql = charset ? ` CHARACTER SET ${charset}` : '';
      const length = field.charLength ?? field.length;

      switch (type) {
         case 14: return `CHAR(${length})${charsetSql}`;
         case 37: return `VARCHAR(${length})${charsetSql}`;
         case 40: return `CSTRING(${length})${charsetSql}`;
         case BLOB_TYPE:
            if (subType === 1) return `BLOB SUB_TYPE TEXT${charsetSql}`;
            if (!subType) return 'BLOB SUB_TYPE BINARY';
            return `BLOB SUB_TYPE ${subType}`;
         default:
            throw new Error(`Unsupported Firebird type: ${type}`);
      }
   }

   /** COLLATE clause, when the collation is not the default one of the character set */
   private _collateSql (field: { collation: string | null; charset: string | null }) {
      return field.collation && field.collation !== field.charset ? ` COLLATE ${field.collation}` : '';
   }

   private _tableInfo (tableName: string) {
      if (!this._tableInfos.has(tableName))
         this._tableInfos.set(tableName, this._readTableInfo(tableName));
      return this._tableInfos.get(tableName);
   }

   private async _readTableInfo (tableName: string): Promise<TableInfo> {
      const [relation] = await this._query<{ relationType: number | null; comment: string | null }>(
         'SELECT RDB$RELATION_TYPE AS "relationType", RDB$DESCRIPTION AS "comment" FROM RDB$RELATIONS WHERE RDB$RELATION_NAME = ?',
         [tableName]
      );
      if (!relation) throw new Error(`Table "${tableName}" not found`);

      const columns = await this._query<ColumnInfo>(`
         SELECT TRIM(rf.RDB$FIELD_NAME) AS "name",
            TRIM(rf.RDB$FIELD_SOURCE) AS "source",
            rf.RDB$NULL_FLAG AS "notnull",
            rf.RDB$DEFAULT_SOURCE AS "default",
            rf.RDB$DESCRIPTION AS "comment",
            f.RDB$COMPUTED_SOURCE AS "computed",
            ${this._major >= 3 ? 'rf.RDB$IDENTITY_TYPE' : 'NULL'} AS "identity",
            ${this._major >= 3 ? 'TRIM(rf.RDB$GENERATOR_NAME)' : 'NULL'} AS "generator",
            TRIM(co.RDB$COLLATION_NAME) AS "collation",
            ${FIELD_TYPE_COLUMNS}
         FROM RDB$RELATION_FIELDS rf
         JOIN RDB$FIELDS f ON f.RDB$FIELD_NAME = rf.RDB$FIELD_SOURCE
         LEFT JOIN RDB$CHARACTER_SETS cs ON cs.RDB$CHARACTER_SET_ID = f.RDB$CHARACTER_SET_ID
         LEFT JOIN RDB$COLLATIONS co ON co.RDB$CHARACTER_SET_ID = f.RDB$CHARACTER_SET_ID
            AND co.RDB$COLLATION_ID = COALESCE(rf.RDB$COLLATION_ID, f.RDB$COLLATION_ID)
         WHERE rf.RDB$RELATION_NAME = ?
         ORDER BY rf.RDB$FIELD_POSITION
      `, [tableName]);

      return { ...relation, columns };
   }

   /** Columns of an index, in order */
   private async _indexColumns (indexName: string) {
      const rows = await this._query<{ name: string }>(
         'SELECT TRIM(RDB$FIELD_NAME) AS "name" FROM RDB$INDEX_SEGMENTS WHERE RDB$INDEX_NAME = ? ORDER BY RDB$FIELD_POSITION',
         [indexName]
      );
      return rows.map(row => this.quoteName(row.name)).join(', ');
   }

   async getCreateTable (tableName: string) {
      const { relationType, comment, columns } = await this._tableInfo(tableName);
      const table = this.quoteName(tableName);

      const definitions = [];
      for (const column of columns) {
         let definition = this.quoteName(column.name);

         if (column.computed)
            definition += ` COMPUTED BY ${/^\s*\(/.test(column.computed) ? column.computed.trim() : `(${column.computed.trim()})`}`;
         else {
            const isDomain = !column.source.startsWith('RDB$');
            definition += ` ${isDomain ? this.quoteName(column.source) : this._typeSql(column)}`;

            if (column.identity !== null && column.identity !== undefined && column.generator) {
               const [generator] = await this._query<{ start: number; increment: number }>(
                  'SELECT RDB$INITIAL_VALUE AS "start", RDB$GENERATOR_INCREMENT AS "increment" FROM RDB$GENERATORS WHERE RDB$GENERATOR_NAME = ?',
                  [column.generator]
               );
               definition += ` GENERATED ${column.identity === 0 ? 'ALWAYS' : 'BY DEFAULT'} AS IDENTITY`;
               if (generator) {
                  definition += this._major >= 4
                     ? ` (START WITH ${generator.start} INCREMENT BY ${generator.increment})`
                     : ` (START WITH ${generator.start})`;
               }
            }

            if (column.default) definition += ` ${column.default.trim()}`;
            if (column.notnull) definition += ' NOT NULL';
            if (!isDomain) definition += this._collateSql(column);
         }

         definitions.push(definition);
      }

      // Primary keys and unique constraints
      const constraints = await this._query<{ name: string; type: string; index: string; descending: number | null; onUpdate: string | null; onDelete: string | null; refTable: string | null; refIndex: string | null }>(`
         SELECT TRIM(rc.RDB$CONSTRAINT_NAME) AS "name",
            TRIM(rc.RDB$CONSTRAINT_TYPE) AS "type",
            TRIM(rc.RDB$INDEX_NAME) AS "index",
            i.RDB$INDEX_TYPE AS "descending",
            TRIM(ref.RDB$UPDATE_RULE) AS "onUpdate",
            TRIM(ref.RDB$DELETE_RULE) AS "onDelete",
            TRIM(uq.RDB$RELATION_NAME) AS "refTable",
            TRIM(uq.RDB$INDEX_NAME) AS "refIndex"
         FROM RDB$RELATION_CONSTRAINTS rc
         LEFT JOIN RDB$INDICES i ON i.RDB$INDEX_NAME = rc.RDB$INDEX_NAME
         LEFT JOIN RDB$REF_CONSTRAINTS ref ON ref.RDB$CONSTRAINT_NAME = rc.RDB$CONSTRAINT_NAME
         LEFT JOIN RDB$RELATION_CONSTRAINTS uq ON uq.RDB$CONSTRAINT_NAME = ref.RDB$CONST_NAME_UQ
         WHERE rc.RDB$RELATION_NAME = ? AND rc.RDB$CONSTRAINT_TYPE IN ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY')
         ORDER BY rc.RDB$CONSTRAINT_TYPE DESC, rc.RDB$CONSTRAINT_NAME
      `, [tableName]);

      // The index name is kept when it was chosen by the user
      const usingIndex = (constraint: { name: string; index: string; descending: number | null }) =>
         constraint.index && constraint.index !== constraint.name && !constraint.index.startsWith('RDB$')
            ? ` USING ${constraint.descending ? 'DESC ' : ''}INDEX ${this.quoteName(constraint.index)}`
            : '';

      // Names generated by Firebird (INTEG_n) are generated again, like the names of their indexes
      const constraintName = (name: string) => name.startsWith('INTEG_') ? '' : `CONSTRAINT ${this.quoteName(name)} `;

      for (const constraint of constraints.filter(c => c.type !== 'FOREIGN KEY'))
         definitions.push(`${constraintName(constraint.name)}${constraint.type} (${await this._indexColumns(constraint.index)})${usingIndex(constraint)}`);

      // Check constraints (each one has an insert and an update trigger with the same source)
      const checks = await this._query<{ name: string; source: string }>(`
         SELECT TRIM(cc.RDB$CONSTRAINT_NAME) AS "name", t.RDB$TRIGGER_SOURCE AS "source"
         FROM RDB$RELATION_CONSTRAINTS rc
         JOIN RDB$CHECK_CONSTRAINTS cc ON cc.RDB$CONSTRAINT_NAME = rc.RDB$CONSTRAINT_NAME
         JOIN RDB$TRIGGERS t ON t.RDB$TRIGGER_NAME = cc.RDB$TRIGGER_NAME
         WHERE rc.RDB$RELATION_NAME = ? AND rc.RDB$CONSTRAINT_TYPE = 'CHECK'
         ORDER BY cc.RDB$CONSTRAINT_NAME
      `, [tableName]);
      for (const check of checks.filter((c, i) => checks.findIndex(other => other.name === c.name) === i))
         definitions.push(`${constraintName(check.name)}${check.source.trim()}`);

      const temporary = relationType === 4 || relationType === 5;
      let sql = `CREATE ${temporary ? 'GLOBAL TEMPORARY ' : ''}TABLE ${table} (\n   ${definitions.join(',\n   ')}\n)`;
      if (temporary) sql += ` ON COMMIT ${relationType === 4 ? 'PRESERVE' : 'DELETE'} ROWS`;
      sql += ';\n';

      if (comment) sql += `COMMENT ON TABLE ${table} IS ${this.quoteString(comment)};\n`;
      for (const column of columns.filter(c => c.comment))
         sql += `COMMENT ON COLUMN ${table}.${this.quoteName(column.name)} IS ${this.quoteString(column.comment)};\n`;

      // Indexes and foreign keys after the data of all tables
      await this._indexes(tableName);

      for (const fk of constraints.filter(c => c.type === 'FOREIGN KEY')) {
         let fkSql = `ALTER TABLE ${table} ADD ${constraintName(fk.name)}FOREIGN KEY (${await this._indexColumns(fk.index)}) REFERENCES ${this.quoteName(fk.refTable)} (${await this._indexColumns(fk.refIndex)})`;
         if (fk.onUpdate && fk.onUpdate !== 'RESTRICT') fkSql += ` ON UPDATE ${fk.onUpdate}`;
         if (fk.onDelete && fk.onDelete !== 'RESTRICT') fkSql += ` ON DELETE ${fk.onDelete}`;
         this._postTablesSql += `${fkSql}${usingIndex(fk)};\n`;
      }

      return sql;
   }

   /** CREATE INDEX statements of the indexes not created by constraints */
   private async _indexes (tableName: string) {
      const indexes = await this._query<{ name: string; unique: number | null; descending: number | null; inactive: number | null; expression: string | null; condition: string | null }>(`
         SELECT TRIM(i.RDB$INDEX_NAME) AS "name",
            i.RDB$UNIQUE_FLAG AS "unique",
            i.RDB$INDEX_TYPE AS "descending",
            i.RDB$INDEX_INACTIVE AS "inactive",
            i.RDB$EXPRESSION_SOURCE AS "expression",
            ${this._major >= 5 ? 'i.RDB$CONDITION_SOURCE' : 'NULL'} AS "condition"
         FROM RDB$INDICES i
         WHERE i.RDB$RELATION_NAME = ? AND COALESCE(i.RDB$SYSTEM_FLAG, 0) = 0
         AND NOT EXISTS (SELECT 1 FROM RDB$RELATION_CONSTRAINTS rc WHERE rc.RDB$INDEX_NAME = i.RDB$INDEX_NAME)
         ORDER BY i.RDB$INDEX_NAME
      `, [tableName]);

      for (const index of indexes) {
         const name = this.quoteName(index.name);
         const columns = index.expression
            ? `COMPUTED BY ${/^\s*\(/.test(index.expression) ? index.expression.trim() : `(${index.expression.trim()})`}`
            : `(${await this._indexColumns(index.name)})`;

         this._postTablesSql += `CREATE ${index.unique ? 'UNIQUE ' : ''}${index.descending ? 'DESCENDING ' : ''}INDEX ${name} ON ${this.quoteName(tableName)} ${columns}${index.condition ? ` ${index.condition.trim()}` : ''};\n`;
         if (index.inactive) this._postTablesSql += `ALTER INDEX ${name} INACTIVE;\n`;
      }
   }

   /** No DROP TABLE IF EXISTS: the table and the foreign keys referencing it are dropped if they exist */
   getDropTable (tableName: string) {
      const name = this.quoteString(tableName);
      const statement = this.quoteString(`DROP TABLE ${this.quoteName(tableName)}`);

      return this._psql([`EXECUTE BLOCK AS
   DECLARE fk VARCHAR(255) CHARACTER SET UTF8;
   DECLARE tbl VARCHAR(255) CHARACTER SET UTF8;
BEGIN
   FOR SELECT TRIM(rc.RDB$CONSTRAINT_NAME), TRIM(rc.RDB$RELATION_NAME)
      FROM RDB$RELATION_CONSTRAINTS rc
      JOIN RDB$REF_CONSTRAINTS ref ON ref.RDB$CONSTRAINT_NAME = rc.RDB$CONSTRAINT_NAME
      JOIN RDB$RELATION_CONSTRAINTS uq ON uq.RDB$CONSTRAINT_NAME = ref.RDB$CONST_NAME_UQ
      WHERE uq.RDB$RELATION_NAME = ${name}
      INTO :fk, :tbl
   DO
      EXECUTE STATEMENT 'ALTER TABLE "' || REPLACE(tbl, '"', '""') || '" DROP CONSTRAINT "' || REPLACE(fk, '"', '""') || '"';

   IF (EXISTS (SELECT 1 FROM RDB$RELATIONS WHERE RDB$RELATION_NAME = ${name})) THEN
      EXECUTE STATEMENT ${statement};
END`]) + 'COMMIT;\n';
   }

   async getDataColumns (tableName: string): Promise<DataColumn[]> {
      const { columns } = await this._tableInfo(tableName);

      return columns
         .filter(column => !column.computed)
         .map(column => {
            const name = this.quoteName(column.name);
            // BIGINT, INT128, NUMERIC and DECIMAL: no rounding beyond 2^53
            const isExactNumber = INTEGER_TYPES.includes(column.type) && (column.type >= 16 || !!column.subType || column.scale < 0);
            const isDecfloat = column.type === 24 || column.type === 25;
            // Read as text: dates with all their precision, exact numbers
            const asText = DATETIME_TYPES.includes(column.type) || isExactNumber || isDecfloat;

            return {
               name: column.name,
               select: asText ? `CAST(${name} AS VARCHAR(100))` : name,
               format: this._formatter(column, isExactNumber || isDecfloat)
            };
         });
   }

   private _formatter (column: ColumnInfo, isNumber: boolean): ValueFormatter {
      const isBlob = column.type === BLOB_TYPE;
      const isTextBlob = isBlob && column.subType === 1;
      const isBinary = column.charset === 'OCTETS' && TEXT_TYPES.includes(column.type);

      return value => {
         if (value === null || value === undefined) return 'NULL';

         if (isNumber && typeof value === 'string' && NUMERIC_LITERAL.test(value)) return value;

         if (Buffer.isBuffer(value) && (isBinary || (isBlob && !isTextBlob)))
            return this._binaryLiteral(value, isBlob);

         if (isTextBlob && Buffer.isBuffer(value))
            value = value.toString('utf8');

         if (typeof value === 'string')
            return isBlob ? this._textBlobLiteral(value) : this.quoteString(value);

         return this.formatValue(value, v => this.quoteString(v), data => this._binaryLiteral(data, isBlob));
      };
   }

   private _binaryLiteral (data: Buffer, isBlob: boolean) {
      const hex = data.toString('hex').toUpperCase();
      if (!isBlob || data.length <= LITERAL_CHUNK) return `X'${hex}'`;

      const chunks = hex.match(new RegExp(`.{1,${LITERAL_CHUNK * 2}}`, 'g'));
      return `CAST(X'${chunks[0]}' AS BLOB SUB_TYPE BINARY)${chunks.slice(1).map(chunk => ` || X'${chunk}'`).join('')}`;
   }

   private _textBlobLiteral (text: string) {
      if (text.length <= LITERAL_CHUNK) return this.quoteString(text);

      const chunks = [];
      for (let i = 0; i < text.length; i += LITERAL_CHUNK)
         chunks.push(this.quoteString(text.slice(i, i + LITERAL_CHUNK)));
      return `CAST(${chunks[0]} AS BLOB SUB_TYPE TEXT)${chunks.slice(1).map(chunk => ` || ${chunk}`).join('')}`;
   }

   async * streamRows (tableName: string, columns: DataColumn[]): AsyncIterable<unknown[]> {
      const sql = `SELECT ${columns.map(c => c.select).join(', ')} FROM ${this.quoteName(tableName)}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stream = (this._transaction as any).queryStream(sql, [], { asObject: false, highWaterMark: 500 });

      for await (const row of stream as AsyncIterable<unknown[]>) {
         // Binary BLOBs are read on demand
         for (let i = 0; i < row.length; i++) {
            if (typeof row[i] === 'function')
               row[i] = await this._readBlob(row[i]);
         }
         yield row;
      }
   }

   async writeTableData (tableName: string) {
      await super.writeTableData(tableName);
      // isql: the DDL statements on the table (identity restart, indexes, foreign keys) need the rows committed
      await this.writeString('\nCOMMIT;\n');

      // Next values of the identity columns, also when the table is empty
      const { columns } = await this._tableInfo(tableName);
      for (const column of columns.filter(c => c.identity !== null && c.identity !== undefined && c.generator)) {
         const [generator] = await this._query<{ increment: number }>(
            'SELECT RDB$GENERATOR_INCREMENT AS "increment" FROM RDB$GENERATORS WHERE RDB$GENERATOR_NAME = ?',
            [column.generator]
         );
         const value = this._restartValue(await this._generatorValue(column.generator), generator?.increment ?? 1);
         await this.writeString(`\nALTER TABLE ${this.quoteName(tableName)} ALTER COLUMN ${this.quoteName(column.name)} RESTART WITH ${value};\n`);
      }
   }

   async getViews () {
      const views = await this._query<{ name: string; source: string }>(`
         SELECT TRIM(RDB$RELATION_NAME) AS "name", RDB$VIEW_SOURCE AS "source"
         FROM RDB$RELATIONS
         WHERE RDB$VIEW_BLR IS NOT NULL AND COALESCE(RDB$SYSTEM_FLAG, 0) = 0
         ORDER BY RDB$RELATION_ID
      `);
      if (!views.length) return '';

      // Views using other views are created after them
      const dependencies = await this._query<{ view: string; ref: string }>(`
         SELECT DISTINCT TRIM(RDB$DEPENDENT_NAME) AS "view", TRIM(RDB$DEPENDED_ON_NAME) AS "ref"
         FROM RDB$DEPENDENCIES
         WHERE RDB$DEPENDENT_TYPE = 1 AND RDB$DEPENDED_ON_TYPE = 0
      `);
      const byName = new Map(views.map(view => [view.name, view]));
      const sorted: typeof views = [];
      const visited = new Set<string>();
      const visit = (name: string) => {
         if (visited.has(name) || !byName.has(name)) return;
         visited.add(name);
         for (const dependency of dependencies.filter(d => d.view === name && d.ref !== name))
            visit(dependency.ref);
         sorted.push(byName.get(name));
      };
      views.forEach(view => visit(view.name));

      let sql = '';
      for (const view of sorted) {
         const columns = await this._query<{ name: string }>(
            'SELECT TRIM(RDB$FIELD_NAME) AS "name" FROM RDB$RELATION_FIELDS WHERE RDB$RELATION_NAME = ? ORDER BY RDB$FIELD_POSITION',
            [view.name]
         );
         sql += `CREATE OR ALTER VIEW ${this.quoteName(view.name)} (${columns.map(c => this.quoteName(c.name)).join(', ')}) AS\n${view.source.trim()};\n\n`;
      }
      return sql;
   }

   async getTriggers () {
      const triggers = await this._query<{ name: string; table: string | null; type: number; position: number; inactive: number | null; source: string }>(`
         SELECT TRIM(t.RDB$TRIGGER_NAME) AS "name",
            TRIM(t.RDB$RELATION_NAME) AS "table",
            t.RDB$TRIGGER_TYPE AS "type",
            t.RDB$TRIGGER_SEQUENCE AS "position",
            t.RDB$TRIGGER_INACTIVE AS "inactive",
            t.RDB$TRIGGER_SOURCE AS "source"
         FROM RDB$TRIGGERS t
         WHERE COALESCE(t.RDB$SYSTEM_FLAG, 0) = 0
         AND NOT EXISTS (SELECT 1 FROM RDB$CHECK_CONSTRAINTS cc WHERE cc.RDB$TRIGGER_NAME = t.RDB$TRIGGER_NAME)
         ORDER BY t.RDB$RELATION_NAME, t.RDB$TRIGGER_SEQUENCE, t.RDB$TRIGGER_NAME
      `);

      const statements = [];
      let skipped = '';

      for (const trigger of triggers) {
         const event = this._triggerEvent(Number(trigger.type));
         if (!event || !trigger.source) {
            skipped += `${this.buildComment(`Trigger ${trigger.name} not exported (DDL triggers are not supported)`)}\n`;
            continue;
         }

         const header = trigger.table
            ? `CREATE OR ALTER TRIGGER ${this.quoteName(trigger.name)} FOR ${this.quoteName(trigger.table)}`
            : `CREATE OR ALTER TRIGGER ${this.quoteName(trigger.name)}`;

         statements.push(`${header}\n${trigger.inactive ? 'INACTIVE' : 'ACTIVE'} ${event} POSITION ${trigger.position ?? 0}\n${trigger.source.trim()}`);
      }

      return skipped + this._psql(statements);
   }

   /** BEFORE INSERT OR UPDATE, AFTER DELETE, ON CONNECT... from RDB$TRIGGER_TYPE */
   private _triggerEvent (type: number) {
      const databaseEvents: Record<number, string> = {
         8192: 'ON CONNECT',
         8193: 'ON DISCONNECT',
         8194: 'ON TRANSACTION START',
         8195: 'ON TRANSACTION COMMIT',
         8196: 'ON TRANSACTION ROLLBACK'
      };
      if (type >= 8192) return databaseEvents[type] ?? null;

      // DML triggers: (type + 1) holds the phase in bit 0 and up to three events in 2-bit slots
      const events = [1, 3, 5]
         .map(shift => ((type + 1) >> shift) & 3)
         .filter(Boolean)
         .map(slot => ['', 'INSERT', 'UPDATE', 'DELETE'][slot]);

      return `${type % 2 ? 'BEFORE' : 'AFTER'} ${events.join(' OR ')}`;
   }

   /** Procedures: empty ones here (see _extraItemsOrder), the real bodies after the views and triggers */
   async getRoutines () {
      const procedures = await this._query<{ name: string; source: string | null; kind: number | null }>(`
         SELECT TRIM(RDB$PROCEDURE_NAME) AS "name", RDB$PROCEDURE_SOURCE AS "source", RDB$PROCEDURE_TYPE AS "kind"
         FROM RDB$PROCEDURES
         WHERE COALESCE(RDB$SYSTEM_FLAG, 0) = 0 ${this._major >= 3 ? 'AND RDB$PACKAGE_NAME IS NULL' : ''}
         ORDER BY RDB$PROCEDURE_NAME
      `);

      const stubs = [];
      const bodies = [];

      for (const procedure of procedures) {
         if (!procedure.source) continue; // External procedures
         const header = await this._procedureHeader(procedure.name);
         const isSelectable = procedure.kind === 1;

         stubs.push(`${header}\nAS\nBEGIN\n   ${isSelectable ? 'SUSPEND;\n   ' : ''}EXIT;\nEND`);
         // RDB$PROCEDURE_SOURCE starts after the AS keyword
         const source = procedure.source.trim();
         bodies.push(`${header}\n${/^AS\b/i.test(source) ? '' : 'AS\n'}${source}`);
      }

      if (bodies.length) {
         this._postExtrasSql += this.buildComment('Procedure bodies\n------------------------------------------------------------') + '\n\n';
         this._postExtrasSql += this._psql(bodies);
      }

      return this._psql(stubs);
   }

   private async _procedureHeader (name: string) {
      const parameters = await this._query<FieldType & { name: string; output: number; source: string; mechanism: number | null; relation: string | null; field: string | null; default: string | null; notnull: number | null }>(`
         SELECT TRIM(pp.RDB$PARAMETER_NAME) AS "name",
            pp.RDB$PARAMETER_TYPE AS "output",
            TRIM(pp.RDB$FIELD_SOURCE) AS "source",
            pp.RDB$PARAMETER_MECHANISM AS "mechanism",
            TRIM(pp.RDB$RELATION_NAME) AS "relation",
            TRIM(pp.RDB$FIELD_NAME) AS "field",
            pp.RDB$DEFAULT_SOURCE AS "default",
            pp.RDB$NULL_FLAG AS "notnull",
            TRIM(co.RDB$COLLATION_NAME) AS "collation",
            ${FIELD_TYPE_COLUMNS}
         FROM RDB$PROCEDURE_PARAMETERS pp
         JOIN RDB$FIELDS f ON f.RDB$FIELD_NAME = pp.RDB$FIELD_SOURCE
         LEFT JOIN RDB$CHARACTER_SETS cs ON cs.RDB$CHARACTER_SET_ID = f.RDB$CHARACTER_SET_ID
         LEFT JOIN RDB$COLLATIONS co ON co.RDB$CHARACTER_SET_ID = f.RDB$CHARACTER_SET_ID
            AND co.RDB$COLLATION_ID = COALESCE(pp.RDB$COLLATION_ID, f.RDB$COLLATION_ID)
         WHERE pp.RDB$PROCEDURE_NAME = ? ${this._major >= 3 ? 'AND pp.RDB$PACKAGE_NAME IS NULL' : ''}
         ORDER BY pp.RDB$PARAMETER_TYPE, pp.RDB$PARAMETER_NUMBER
      `, [name]);

      const parameterSql = (parameter: typeof parameters[number]) => {
         let type: string;
         if (parameter.relation && parameter.field)
            type = `TYPE OF COLUMN ${this.quoteName(parameter.relation)}.${this.quoteName(parameter.field)}`;
         else if (!parameter.source.startsWith('RDB$'))
            type = `${parameter.mechanism === 1 ? 'TYPE OF ' : ''}${this.quoteName(parameter.source)}`;
         else
            type = this._typeSql(parameter) + this._collateSql(parameter);

         let sql = `${this.quoteName(parameter.name)} ${type}`;
         if (parameter.notnull) sql += ' NOT NULL';
         if (parameter.default) sql += ` ${parameter.default.trim()}`;
         return sql;
      };

      const inputs = parameters.filter(p => !p.output).map(parameterSql);
      const outputs = parameters.filter(p => p.output).map(parameterSql);

      let header = `CREATE OR ALTER PROCEDURE ${this.quoteName(name)}`;
      if (inputs.length) header += ` (\n   ${inputs.join(',\n   ')}\n)`;
      if (outputs.length) header += `\nRETURNS (\n   ${outputs.join(',\n   ')}\n)`;
      return header;
   }
}
