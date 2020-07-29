import connection from './connection';
import tables from './tables';
import updates from './updates';
import application from './application';

const connections = {};

export default () => {
   connection(connections);
   tables(connections);
   updates();
   application();
};
