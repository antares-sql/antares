import { ConnectionParams } from 'common/interfaces/antares';
import * as formatter from 'pg-connection-string'; // parses a connection string

const formatHost = (host: string) => {
   const results = host === 'localhost' ? '127.0.0.1' : host;
   return results;
};

const checkForSSl = (conn: string) => {
   return conn.includes('ssl=true');
};

const connStringConstruct = (args: ConnectionParams & { pgConnString?: string }): ConnectionParams => {
   if (!args.pgConnString)
      return args;

   if (typeof args.pgConnString !== 'string')
      return args;

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const stringArgs: any = formatter.parse(args.pgConnString);

   const client = args.client || 'pg';

   args.client = client;
   args.host = formatHost(stringArgs.host);
   args.database = stringArgs.database;
   args.port = stringArgs.port || '5432';
   args.user = stringArgs.user;
   args.password = stringArgs.password;

   // ssh
   args.ssh = stringArgs.ssh || args.ssh;
   args.sshHost = stringArgs.sshHost;
   args.sshUser = stringArgs.sshUser;
   args.sshPass = stringArgs.sshPass;
   args.sshKey = stringArgs.sshKey;
   args.sshPort = stringArgs.sshPort;

   // ssl mode
   args.ssl = checkForSSl(args.pgConnString);
   args.cert = stringArgs.sslcert;
   args.key = stringArgs.sslkey;
   args.ca = stringArgs.sslrootcert;
   args.ciphers = stringArgs.ciphers;

   return args;
};

export default connStringConstruct;
