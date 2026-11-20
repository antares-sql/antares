import * as antares from 'common/interfaces/antares';

import { changedAttributes, isRenamed, listDiff, scopeDiff } from '../../core/users';
import { PostgreSQLDialect } from './PostgreSQLDialect';

/** Boolean role attributes: attribute → [pg_roles column, keyword] (NO<keyword> when false) */
export const roleFlags: Record<string, [string, string]> = {
   canLogin: ['rolcanlogin', 'LOGIN'],
   superuser: ['rolsuper', 'SUPERUSER'],
   createDb: ['rolcreatedb', 'CREATEDB'],
   createRole: ['rolcreaterole', 'CREATEROLE'],
   inherit: ['rolinherit', 'INHERIT'],
   replication: ['rolreplication', 'REPLICATION'],
   bypassRls: ['rolbypassrls', 'BYPASSRLS']
};

export const databasePrivileges = ['CONNECT', 'CREATE', 'TEMPORARY'];
export const schemaPrivileges = ['USAGE', 'CREATE'];

const scopeObject = { database: 'DATABASE', schema: 'SCHEMA' } as const;

/**
 * Users (roles) management SQL for PostgreSQL. Pure: builds statements and parses rows, never executes them.
 */
export class PostgreSQLUsers {
   private readonly _dialect = new PostgreSQLDialect();

   identifier (name: string): string {
      return `"${name.replaceAll('"', '""')}"`;
   }

   /** Attributes of a pg_roles row (valid_until is read as text, NULL when infinite) */
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   attributesOfRow (row: Record<string, any>): Record<string, antares.UserAttributeValue> {
      const attributes: Record<string, antares.UserAttributeValue> = {};

      for (const [attribute, [column]] of Object.entries(roleFlags)) {
         if (column in row)
            attributes[attribute] = !!row[column];
      }

      attributes.connectionLimit = Number(row.rolconnlimit ?? -1);
      attributes.validUntil = row.valid_until || null;

      return attributes;
   }

   private _options (attributes: Record<string, antares.UserAttributeValue>, password?: string): string {
      const options: string[] = [];

      for (const [attribute, [, keyword]] of Object.entries(roleFlags)) {
         if (attribute in attributes)
            options.push(attributes[attribute] ? keyword : `NO${keyword}`);
      }

      if ('connectionLimit' in attributes) {
         const limit = Number(attributes.connectionLimit);
         options.push(`CONNECTION LIMIT ${Number.isInteger(limit) && limit >= -1 ? limit : -1}`);
      }

      if ('validUntil' in attributes)
         options.push(`VALID UNTIL ${this._dialect.quoteString(String(attributes.validUntil || 'infinity'))}`);

      if (password)
         options.push(`PASSWORD ${this._dialect.quoteString(password)}`);

      return options.join(' ');
   }

   private _privileges (params: antares.SaveUserParams): string[] {
      const { user, original } = params;
      const role = this.identifier(user.name);
      const statements: string[] = [];

      for (const scope of Object.keys(scopeObject) as (keyof typeof scopeObject)[]) {
         for (const { object, added, removed } of scopeDiff(original?.privileges?.[scope], user.privileges?.[scope])) {
            const target = `${scopeObject[scope]} ${this.identifier(object)}`;
            if (removed.length)
               statements.push(`REVOKE ${removed.join(', ')} ON ${target} FROM ${role}`);
            if (added.length)
               statements.push(`GRANT ${added.join(', ')} ON ${target} TO ${role}`);
         }
      }

      const roles = listDiff(original?.roles, user.roles);
      if (roles.removed.length)
         statements.push(`REVOKE ${roles.removed.map(r => this.identifier(r)).join(', ')} FROM ${role}`);
      if (roles.added.length)
         statements.push(`GRANT ${roles.added.map(r => this.identifier(r)).join(', ')} TO ${role}`);

      return statements;
   }

   createUser (params: antares.SaveUserParams): string[] {
      const { user, password } = params;
      const options = this._options(user.attributes ?? {}, password);

      return [
         `CREATE ROLE ${this.identifier(user.name)}${options ? ` WITH ${options}` : ''}`,
         ...this._privileges(params)
      ];
   }

   alterUser (params: antares.SaveUserParams): string[] {
      const { user, original, password } = params;
      const statements: string[] = [];

      if (isRenamed(user, original))
         statements.push(`ALTER ROLE ${this.identifier(original.name)} RENAME TO ${this.identifier(user.name)}`);

      const options = this._options(changedAttributes(user, original), password);
      if (options)
         statements.push(`ALTER ROLE ${this.identifier(user.name)} WITH ${options}`);

      return [...statements, ...this._privileges(params)];
   }

   /** Revokes the privileges the UI manages (they would block DROP ROLE), then drops the role */
   dropUser (user: antares.UserDetails): string[] {
      const role = this.identifier(user.name);
      const revokes = (Object.keys(scopeObject) as (keyof typeof scopeObject)[])
         .flatMap(scope => Object.keys(user.privileges?.[scope] ?? {})
            .map(object => `REVOKE ALL ON ${scopeObject[scope]} ${this.identifier(object)} FROM ${role}`));

      return [...revokes, `DROP ROLE ${role}`];
   }
}
