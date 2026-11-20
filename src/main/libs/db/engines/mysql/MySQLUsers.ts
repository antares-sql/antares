import * as antares from 'common/interfaces/antares';

import { QueryDialect } from '../../core/QueryDialect';
import { changedAttributes, isRenamed, listDiff, scopeDiff } from '../../core/users';
import { MySQLDialect } from './MySQLDialect';

/** `*_priv` columns of mysql.user / mysql.db and the privilege they hold. Columns depend on server and version */
export const privilegeColumns: Record<string, string> = {
   Select_priv: 'SELECT',
   Insert_priv: 'INSERT',
   Update_priv: 'UPDATE',
   Delete_priv: 'DELETE',
   Create_priv: 'CREATE',
   Drop_priv: 'DROP',
   Reload_priv: 'RELOAD',
   Shutdown_priv: 'SHUTDOWN',
   Process_priv: 'PROCESS',
   File_priv: 'FILE',
   Grant_priv: 'GRANT OPTION',
   References_priv: 'REFERENCES',
   Index_priv: 'INDEX',
   Alter_priv: 'ALTER',
   Show_db_priv: 'SHOW DATABASES',
   Super_priv: 'SUPER',
   Create_tmp_table_priv: 'CREATE TEMPORARY TABLES',
   Lock_tables_priv: 'LOCK TABLES',
   Execute_priv: 'EXECUTE',
   Repl_slave_priv: 'REPLICATION SLAVE',
   Repl_client_priv: 'REPLICATION CLIENT',
   Create_view_priv: 'CREATE VIEW',
   Show_view_priv: 'SHOW VIEW',
   Create_routine_priv: 'CREATE ROUTINE',
   Alter_routine_priv: 'ALTER ROUTINE',
   Create_user_priv: 'CREATE USER',
   Event_priv: 'EVENT',
   Trigger_priv: 'TRIGGER',
   Create_tablespace_priv: 'CREATE TABLESPACE',
   Create_role_priv: 'CREATE ROLE',
   Drop_role_priv: 'DROP ROLE',
   Delete_history_priv: 'DELETE HISTORY',
   Show_create_routine_priv: 'SHOW CREATE ROUTINE'
};

/** Resource limits: attribute → [mysql.user column, CREATE/ALTER USER option] */
export const limitColumns: Record<string, [string, string]> = {
   maxQueriesPerHour: ['max_questions', 'MAX_QUERIES_PER_HOUR'],
   maxUpdatesPerHour: ['max_updates', 'MAX_UPDATES_PER_HOUR'],
   maxConnectionsPerHour: ['max_connections', 'MAX_CONNECTIONS_PER_HOUR'],
   maxUserConnections: ['max_user_connections', 'MAX_USER_CONNECTIONS']
};

const GRANT_OPTION = 'GRANT OPTION';

/**
 * Users management SQL for MySQL and MariaDB. Pure: builds statements and parses rows, never executes them.
 */
export class MySQLUsers {
   private readonly _dialect: QueryDialect;
   private readonly _isMaria: boolean;

   constructor (dialect: QueryDialect = new MySQLDialect(), isMaria = false) {
      this._dialect = dialect;
      this._isMaria = isMaria;
   }

   /** Privileges held by the existing `*_priv` columns, in column order */
   privilegesFromColumns (columns: string[]): string[] {
      return columns.filter(column => privilegeColumns[column]).map(column => privilegeColumns[column]);
   }

   /** Privileges set to 'Y' in a mysql.user / mysql.db row */
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   privilegesOfRow (row: Record<string, any>): string[] {
      return Object.keys(row)
         .filter(column => privilegeColumns[column] && row[column] === 'Y')
         .map(column => privilegeColumns[column]);
   }

   /** Attributes of a mysql.user row. `locked` overrides account_locked (MariaDB keeps it in mysql.global_priv) */
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   attributesOfRow (row: Record<string, any>, locked?: boolean): Record<string, antares.UserAttributeValue> {
      const attributes: Record<string, antares.UserAttributeValue> = {};

      if (locked !== undefined)
         attributes.accountLocked = locked;
      else if ('account_locked' in row)
         attributes.accountLocked = row.account_locked === 'Y';

      if ('plugin' in row)
         attributes.plugin = row.plugin || null;

      for (const [attribute, [column]] of Object.entries(limitColumns)) {
         if (column in row)
            attributes[attribute] = Number(row[column]) || 0;
      }

      return attributes;
   }

   account (user: antares.UserIdentity): string {
      return `${this._dialect.quoteString(user.name)}@${this._dialect.quoteString(user.host || '%')}`;
   }

   private _database (name: string): string {
      return `\`${name.replaceAll('`', '``')}\`.*`;
   }

   private _limits (attributes: Record<string, antares.UserAttributeValue>): string {
      const limits = Object.entries(limitColumns)
         .filter(([attribute]) => attribute in attributes)
         .map(([attribute, [, option]]) => `${option} ${Math.max(0, Number(attributes[attribute]) || 0)}`);

      return limits.length ? `WITH ${limits.join(' ')}` : '';
   }

   private _grants (privileges: string[], on: string, account: string): string[] {
      const plain = privileges.filter(privilege => privilege !== GRANT_OPTION);
      const statements: string[] = [];

      if (plain.length)
         statements.push(`GRANT ${plain.join(', ')} ON ${on} TO ${account}`);
      if (privileges.includes(GRANT_OPTION))
         statements.push(`GRANT GRANT OPTION ON ${on} TO ${account}`);

      return statements;
   }

   private _revokes (privileges: string[], on: string, account: string): string[] {
      const plain = privileges.filter(privilege => privilege !== GRANT_OPTION);
      const statements: string[] = [];

      if (plain.length)
         statements.push(`REVOKE ${plain.join(', ')} ON ${on} FROM ${account}`);
      if (privileges.includes(GRANT_OPTION))
         statements.push(`REVOKE GRANT OPTION ON ${on} FROM ${account}`);

      return statements;
   }

   private _privileges (params: antares.SaveUserParams, account: string): string[] {
      const { user, original } = params;
      const statements: string[] = [];

      const global = listDiff(original?.globalPrivileges, user.globalPrivileges);
      statements.push(...this._revokes(global.removed, '*.*', account));
      statements.push(...this._grants(global.added, '*.*', account));

      for (const { object, added, removed } of scopeDiff(original?.privileges?.database, user.privileges?.database)) {
         statements.push(...this._revokes(removed, this._database(object), account));
         statements.push(...this._grants(added, this._database(object), account));
      }

      return statements;
   }

   createUser (params: antares.SaveUserParams): string[] {
      const { user, password } = params;
      const account = this.account(user);
      const attributes = user.attributes ?? {};

      const sql = [
         `CREATE USER ${account}`,
         password ? `IDENTIFIED BY ${this._dialect.quoteString(password)}` : '',
         this._limits(attributes),
         'accountLocked' in attributes ? `ACCOUNT ${attributes.accountLocked ? 'LOCK' : 'UNLOCK'}` : ''
      ].filter(Boolean).join(' ');

      return [sql, ...this._privileges(params, account)];
   }

   alterUser (params: antares.SaveUserParams): string[] {
      const { user, original, password } = params;
      const statements: string[] = [];
      const account = this.account(user);
      const changed = changedAttributes(user, original);

      if (isRenamed(user, original))
         statements.push(`RENAME USER ${this.account(original)} TO ${account}`);

      if (password) {
         // MariaDB: ALTER USER needs CREATE USER even on the own account, SET PASSWORD doesn't
         statements.push(this._isMaria
            ? `SET PASSWORD FOR ${account} = PASSWORD(${this._dialect.quoteString(password)})`
            : `ALTER USER ${account} IDENTIFIED BY ${this._dialect.quoteString(password)}`);
      }

      const limits = this._limits(changed);
      if (limits)
         statements.push(`ALTER USER ${account} ${limits}`);

      if ('accountLocked' in changed)
         statements.push(`ALTER USER ${account} ACCOUNT ${changed.accountLocked ? 'LOCK' : 'UNLOCK'}`);

      return [...statements, ...this._privileges(params, account)];
   }

   dropUser (user: antares.UserIdentity): string[] {
      return [`DROP USER ${this.account(user)}`];
   }
}
