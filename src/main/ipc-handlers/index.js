import connection from './connection';
import tables from './tables';
import updates from './updates';

const connections = {};

export default () => {
   connection(connections);
   tables(connections);
   updates();
};
