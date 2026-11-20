import * as antares from 'common/interfaces/antares';

import { PostgreSQLDialect } from './PostgreSQLDialect';

/** pg_type.typtype → kind of the types managed by the UI */
export const typeKinds: Record<string, antares.UserTypeKind> = {
   e: 'enum',
   c: 'composite',
   d: 'domain',
   r: 'range'
};

/**
 * User-defined types (enum, composite, domain, range) SQL for PostgreSQL.
 * Pure: builds statements and parses rows, never executes them.
 */
export class PostgreSQLTypes {
   private readonly _dialect = new PostgreSQLDialect();

   identifier (name: string): string {
      return `"${name.replaceAll('"', '""')}"`;
   }

   qualified (schema: string, name: string): string {
      return `${this.identifier(schema)}.${this.identifier(name)}`;
   }

   private _literal (value: string): string {
      return this._dialect.quoteString(value);
   }

   /** Domains have their own statements (CREATE/ALTER/DROP/COMMENT ON DOMAIN) */
   private _object (kind: antares.UserTypeKind): string {
      return kind === 'domain' ? 'DOMAIN' : 'TYPE';
   }

   private _comment (type: antares.UserTypeDetails, name: string): string {
      return `COMMENT ON ${this._object(type.kind)} ${this.qualified(type.schema, name)} IS ${type.comment ? this._literal(type.comment) : 'NULL'}`;
   }

   private _check (check: antares.UserTypeCheck): string {
      return `${check.name ? `CONSTRAINT ${this.identifier(check.name)} ` : ''}CHECK (${check.clause})`;
   }

   private _validate (type: antares.UserTypeDetails) {
      if (!type.name?.trim()) throw new Error('The type name is required');
      if (['domain', 'range'].includes(type.kind) && !type.baseType?.trim())
         throw new Error(`The ${type.kind === 'domain' ? 'base type' : 'subtype'} is required`);
      if (type.kind === 'enum' && type.values.some(value => !value.name))
         throw new Error('Enum values can not be empty');
      if (type.kind === 'composite' && type.attributes.some(attribute => !attribute.name?.trim() || !attribute.type?.trim()))
         throw new Error('Every attribute needs a name and a type');
      if (type.kind === 'domain' && type.checks.some(check => !check.clause?.trim()))
         throw new Error('Every check constraint needs a clause');
   }

   createType (type: antares.UserTypeDetails): string[] {
      this._validate(type);
      const name = this.qualified(type.schema, type.name);
      let sql: string;

      switch (type.kind) {
         case 'enum':
            sql = `CREATE TYPE ${name} AS ENUM (${type.values.map(value => this._literal(value.name)).join(', ')})`;
            break;
         case 'composite':
            sql = `CREATE TYPE ${name} AS (${type.attributes.map(attribute => `${this.identifier(attribute.name)} ${attribute.type}`).join(', ')})`;
            break;
         case 'domain':
            sql = [
               `CREATE DOMAIN ${name} AS ${type.baseType}`,
               type.default ? `DEFAULT ${type.default}` : '',
               type.notNull ? 'NOT NULL' : '',
               ...type.checks.map(check => this._check(check))
            ].filter(Boolean).join(' ');
            break;
         case 'range':
            sql = `CREATE TYPE ${name} AS RANGE (SUBTYPE = ${type.baseType})`;
            break;
         default:
            throw new Error(`Unsupported type kind: ${type.kind}`);
      }

      return type.comment ? [sql, this._comment(type, type.name)] : [sql];
   }

   alterType ({ type, original }: antares.AlterUserTypeParams): string[] {
      this._validate(type);
      if (type.kind !== original.kind) throw new Error('The kind of a type can not be changed');
      if (['domain', 'range'].includes(type.kind) && type.baseType !== original.baseType)
         throw new Error(`The ${type.kind === 'domain' ? 'base type of a domain' : 'subtype of a range'} can not be changed`);

      const name = this.qualified(original.schema, original.name);
      const object = this._object(type.kind);
      let statements: string[] = [];

      if (type.kind === 'enum')
         statements = this._alterEnum(name, type.values, original.values);
      else if (type.kind === 'composite')
         statements = this._alterComposite(name, type.attributes, original.attributes);
      else if (type.kind === 'domain')
         statements = this._alterDomain(name, type, original);

      if ((type.comment || '') !== (original.comment || ''))
         statements.push(this._comment({ ...type, schema: original.schema }, original.name));

      if (type.name !== original.name)
         statements.push(`ALTER ${object} ${name} RENAME TO ${this.identifier(type.name)}`);

      return statements;
   }

   /** Enum values can only be renamed (PostgreSQL 10+) or added: they can not be removed or reordered */
   private _alterEnum (name: string, values: antares.UserTypeEnumValue[], originalValues: antares.UserTypeEnumValue[]): string[] {
      const kept = values.filter(value => value.oldName !== undefined).map(value => value.oldName);
      const originalNames = originalValues.map(value => value.name);
      const removed = originalNames.filter(value => !kept.includes(value));

      if (removed.length)
         throw new Error(`Enum values can not be removed: ${removed.join(', ')}`);
      if (kept.join('\0') !== originalNames.join('\0'))
         throw new Error('Existing enum values can not be reordered');

      const statements = values
         .filter(value => value.oldName !== undefined && value.oldName !== value.name)
         .map(value => `ALTER TYPE ${name} RENAME VALUE ${this._literal(value.oldName)} TO ${this._literal(value.name)}`);

      // New values are placed next to their neighbors (renamed above, or added before them)
      values.forEach((value, i) => {
         if (value.oldName !== undefined) return;

         let position = '';
         if (i > 0) position = ` AFTER ${this._literal(values[i - 1].name)}`;
         else if (values.length > 1) position = ` BEFORE ${this._literal(values[1].name)}`;

         statements.push(`ALTER TYPE ${name} ADD VALUE ${this._literal(value.name)}${position}`);
      });

      return statements;
   }

   /** New attributes are appended: existing ones keep their position */
   private _alterComposite (name: string, attributes: antares.UserTypeAttribute[], originalAttributes: antares.UserTypeAttribute[]): string[] {
      const statements: string[] = [];

      for (const original of originalAttributes) {
         if (!attributes.some(attribute => attribute.oldName === original.name))
            statements.push(`ALTER TYPE ${name} DROP ATTRIBUTE ${this.identifier(original.name)}`);
      }

      for (const attribute of attributes) {
         if (attribute.oldName === undefined) continue;
         if (attribute.oldName !== attribute.name)
            statements.push(`ALTER TYPE ${name} RENAME ATTRIBUTE ${this.identifier(attribute.oldName)} TO ${this.identifier(attribute.name)}`);

         const original = originalAttributes.find(o => o.name === attribute.oldName);
         if (original && original.type !== attribute.type)
            statements.push(`ALTER TYPE ${name} ALTER ATTRIBUTE ${this.identifier(attribute.name)} TYPE ${attribute.type}`);
      }

      for (const attribute of attributes.filter(attribute => attribute.oldName === undefined))
         statements.push(`ALTER TYPE ${name} ADD ATTRIBUTE ${this.identifier(attribute.name)} ${attribute.type}`);

      return statements;
   }

   private _alterDomain (name: string, type: antares.UserTypeDetails, original: antares.UserTypeDetails): string[] {
      const statements: string[] = [];

      if ((type.default || '') !== (original.default || ''))
         statements.push(`ALTER DOMAIN ${name} ${type.default ? `SET DEFAULT ${type.default}` : 'DROP DEFAULT'}`);

      if (!!type.notNull !== !!original.notNull)
         statements.push(`ALTER DOMAIN ${name} ${type.notNull ? 'SET' : 'DROP'} NOT NULL`);

      const added: antares.UserTypeCheck[] = type.checks.filter(check => check.oldName === undefined);

      for (const originalCheck of original.checks) {
         const check = type.checks.find(check => check.oldName === originalCheck.name);

         if (!check || check.clause !== originalCheck.clause) {
            statements.push(`ALTER DOMAIN ${name} DROP CONSTRAINT ${this.identifier(originalCheck.name)}`);
            if (check) added.push(check);
         }
         else if (check.name !== originalCheck.name)
            statements.push(`ALTER DOMAIN ${name} RENAME CONSTRAINT ${this.identifier(originalCheck.name)} TO ${this.identifier(check.name)}`);
      }

      for (const check of added)
         statements.push(`ALTER DOMAIN ${name} ADD ${this._check(check)}`);

      return statements;
   }

   dropType ({ schema, name, kind }: { schema: string; name: string; kind: antares.UserTypeKind }): string {
      return `DROP ${this._object(kind)} ${this.qualified(schema, name)}`;
   }

   /** CHECK clause of a pg_get_constraintdef() result: `CHECK ((VALUE > 0)) NOT VALID` → `(VALUE > 0)` */
   checkClause (definition: string): string {
      const match = definition.match(/^CHECK \(([\s\S]*)\)(?: NOT VALID)?$/);
      return match ? match[1] : definition;
   }
}
