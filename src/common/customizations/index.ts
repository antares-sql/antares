import * as mysql from 'common/customizations/mysql';
import * as postgresql from 'common/customizations/postgresql';
import * as sqlite from 'common/customizations/sqlite';
import { Customizations } from 'common/interfaces/customizations';

export default {
   maria: mysql.customizations,
   mysql: mysql.customizations,
   pg: postgresql.customizations,
   sqlite: sqlite.customizations
} as {
   maria: Customizations;
   mysql: Customizations;
   pg: Customizations;
   sqlite: Customizations;
};
