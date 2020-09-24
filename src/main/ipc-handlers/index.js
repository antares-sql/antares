import connection from './connection';
import tables from './tables';
import updates from './updates';
import application from './application';
import properties from './properties';

const connections = {};

export default () => {
   connection(connections);
   tables(connections);
   properties(connections);
   updates();
   application();
};
