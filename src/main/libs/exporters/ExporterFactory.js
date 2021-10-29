import { MysqlExporter } from './sql/MysqlExporter';

export class ExporterFactory {
   /**
    * Returns a data exporter class instance.
    *
    * @param {Object} args
    * @param {String} args.client
    * @param {Object} args.params
    * @param {String} args.params.host
    * @param {Number} args.params.port
    * @param {String} args.params.password
    * @param {String=} args.params.database
    * @param {String=} args.params.schema
    * @param {String} args.params.ssh.host
    * @param {String} args.params.ssh.username
    * @param {String} args.params.ssh.password
    * @param {Number} args.params.ssh.port
    * @param {Number=} args.poolSize
    * @returns Exporter Instance
    * @memberof ExporterFactory
    */
   static get (args) {
      switch (type) {
         case 'mysql':
            exporter = new MysqlExporter(connections[uid], rest);
            break;
         default:
            return {
               status: 'error',
               response: `${type} exporter not aviable`
            };
      }
   }
}
