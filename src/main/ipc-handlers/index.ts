import * as antares from 'common/interfaces/antares';

import application from './application';
import connection from './connection';
import database from './database';
import functions from './functions';
import routines from './routines';
import schedulers from './schedulers';
import schema from './schema';
import tables from './tables';
import triggers from './triggers';
import updates from './updates';
import users from './users';
import views from './views';

const connections: {[key: string]: antares.Client} = {};

export default () => {
   connection(connections);
   tables(connections);
   views(connections);
   triggers(connections);
   routines(connections);
   functions(connections);
   schedulers(connections);
   database(connections);
   schema(connections);
   users(connections);
   updates();
   application();
};
