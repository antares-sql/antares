import * as mysql from 'common/customizations/mysql';
import * as postgresql from 'common/customizations/postgresql';
import * as sqlite from 'common/customizations/sqlite';

export default {
   maria: mysql.customizations,
   mysql: mysql.customizations,
   pg: postgresql.customizations,
   sqlite: sqlite.customizations
};
