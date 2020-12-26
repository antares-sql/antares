import connection from './connection';
import tables from './tables';
import views from './views';
import updates from './updates';
import application from './application';
import database from './database';

const connections = {};

export default () => {
   connection(connections);
   tables(connections);
   views(connections);
   database(connections);
   updates();
   application();
};
