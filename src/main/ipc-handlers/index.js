import connection from './connection';
import structure from './structure';
import updates from './updates';

const connections = {};

export default () => {
   connection(connections);
   structure(connections);
   updates();
};
