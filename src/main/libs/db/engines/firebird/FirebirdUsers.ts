import * as antares from 'common/interfaces/antares';

import { changedAttributes, listDiff, trimmed } from '../../core/users';
import { FirebirdDialect } from './FirebirdDialect';

/** Text attributes: attribute → [SEC$USERS column, CREATE/ALTER USER option] */
export const nameColumns: Record<string, [string, string]> = {
   firstName: ['SEC$FIRST_NAME', 'FIRSTNAME'],
   middleName: ['SEC$MIDDLE_NAME', 'MIDDLENAME'],
   lastName: ['SEC$LAST_NAME', 'LASTNAME']
};

/**
 * Users management SQL for Firebird 3+ (SEC$USERS). Pure: builds statements and parses rows, never executes them.
 */
export class FirebirdUsers {
   private readonly _dialect = new FirebirdDialect();

   /**
    * User name as written in SQL. Regular identifiers are stored uppercase, so they stay unquoted;
    * other names (lowercase, spaces...) were created quoted and need quotes to keep their case.
    */
   userName (name: string, isNew = false): string {
      const regular = isNew ? /^[A-Za-z][A-Za-z0-9_$]*$/ : /^[A-Z][A-Z0-9_$]*$/;
      return regular.test(name) ? name : `"${name.replaceAll('"', '""')}"`;
   }

   roleName (name: string): string {
      return `"${name.replaceAll('"', '""')}"`;
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   attributesOfRow (row: Record<string, any>): Record<string, antares.UserAttributeValue> {
      const attributes: Record<string, antares.UserAttributeValue> = {};

      for (const [attribute, [column]] of Object.entries(nameColumns))
         attributes[attribute] = (trimmed(row[column]) as string) || null;

      attributes.active = !!row.SEC$ACTIVE;
      attributes.admin = !!row.SEC$ADMIN;

      return attributes;
   }

   private _options (attributes: Record<string, antares.UserAttributeValue>, password?: string): string {
      const options: string[] = [];

      if (password)
         options.push(`PASSWORD ${this._dialect.quoteString(password)}`);

      for (const [attribute, [, option]] of Object.entries(nameColumns)) {
         if (attribute in attributes)
            options.push(`${option} ${this._dialect.quoteString(String(attributes[attribute] ?? ''))}`);
      }

      if ('active' in attributes)
         options.push(attributes.active ? 'ACTIVE' : 'INACTIVE');

      if ('admin' in attributes)
         options.push(attributes.admin ? 'GRANT ADMIN ROLE' : 'REVOKE ADMIN ROLE');

      return options.join(' ');
   }

   private _plugin (user: antares.UserIdentity): string {
      return user.plugin ? ` USING PLUGIN ${user.plugin}` : '';
   }

   private _roles (params: antares.SaveUserParams, userName: string): string[] {
      const roles = listDiff(params.original?.roles, params.user.roles);

      return [
         ...roles.removed.map(role => `REVOKE ${this.roleName(role)} FROM USER ${userName}`),
         ...roles.added.map(role => `GRANT ${this.roleName(role)} TO USER ${userName}`)
      ];
   }

   createUser (params: antares.SaveUserParams): string[] {
      const { user, password } = params;
      const name = this.userName(user.name, true);
      const attributes = { ...user.attributes };

      // REVOKE ADMIN ROLE is not valid on CREATE USER
      if (!attributes.admin) delete attributes.admin;

      return [
         `CREATE USER ${name} ${this._options(attributes, password)}${this._plugin(user)}`,
         ...this._roles(params, name)
      ];
   }

   alterUser (params: antares.SaveUserParams): string[] {
      const { user, original, password } = params;
      const name = this.userName(original?.name ?? user.name);
      const options = this._options(changedAttributes(user, original), password);

      return [
         ...(options ? [`ALTER USER ${name} SET ${options}${this._plugin(original ?? user)}`] : []),
         ...this._roles(params, name)
      ];
   }

   /** Revokes the roles of the user in this database (they are not removed with the user), then drops it */
   dropUser (user: antares.UserDetails): string[] {
      const name = this.userName(user.name);

      return [
         ...(user.roles ?? []).map(role => `REVOKE ${this.roleName(role)} FROM USER ${name}`),
         `DROP USER ${name}${this._plugin(user)}`
      ];
   }
}
