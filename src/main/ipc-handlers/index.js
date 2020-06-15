import connection from './connection';
import structure from './structure';

const connections = {};

export default () => {
   connection(connections);
   structure(connections);
};
