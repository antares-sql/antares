import formatter from 'pg-connection-string'; // parses a connection string

const formatHost = host => {
   const results = host === 'localhost' ? '127.0.0.1' : host;
   return results;
};

const checkForSSl = conn => {
   return conn.includes('ssl=true');
};

const connStringConstruct = (args) => {
   if (!args.pgConnString)
      return args;

   if (typeof args.pgConnString !== 'string')
      return args;

   const stringArgs = formatter.parse(args.pgConnString);

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
