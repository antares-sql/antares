import connection from './connection';
import tables from './tables';
import views from './views';
import triggers from './triggers';
import routines from './routines';
import functions from './functions';
import schedulers from './schedulers';
import updates from './updates';
import application from './application';
import schema from './schema';
import users from './users';

const connections = {};

export default () => {
   connection(connections);
   tables(connections);
   views(connections);
   triggers(connections);
   routines(connections);
   functions(connections);
   schedulers(connections);
   schema(connections);
   users(connections);
   updates();
   application();
};
