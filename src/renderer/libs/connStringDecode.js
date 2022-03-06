
const getUrlScheme = pgString => {
   const scheme = pgString ? pgString.split('://')[0] : '';

   return scheme === 'postgresql' ? 'postgres' : scheme;
};

const passAndHost = part => {
   const host = part.split('@')[1] === 'localhost' ? '127.0.0.1' : part.split('@')[1];
   return [part.split('@')[0], host];
};

const portAndDb = part => {
   return part.split('/');
};

const pass = (part) => {
   return part.split('@');
};

const hostAndDb = (part) => {
   return part.split('/');
};

const localConnectionString = (stringArgs, args) => {
   let scheme = '';
   if (getUrlScheme(stringArgs) === 'postgres' || getUrlScheme(stringArgs) === 'postgresql')
      scheme = 'pg';

   const values = stringArgs.split('://')[1];
   const parts = values.split(':');

   const userName = parts[0];

   const password = passAndHost(parts[1])[0];
   const host = passAndHost(parts[1])[1];

   const port = portAndDb(parts[2])[0];
   const dbName = portAndDb(parts[2])[1];

   const client = args.client ? args.client : scheme;

   args.client = client;
   args.host = host;
   args.database = dbName;
   args.port = port;
   args.user = userName;
   args.password = password;

   return args;
};

const onlineConnectionString = (stringArgs, args) => {
   let scheme = '';
   const defaultPort = '5432';
   if (getUrlScheme(stringArgs) === 'postgres' || getUrlScheme(stringArgs) === 'postgresql')
      scheme = 'pg';

   const values = stringArgs.split('://')[1];
   const parts = values.split(':');

   const userName = parts[0];

   const password = pass(parts[1])[0];

   const host = hostAndDb(pass(parts[1])[1])[0];
   const dbName = hostAndDb(pass(parts[1])[1])[1];

   const port = defaultPort;

   console.log(userName, password, host, dbName, port);

   const client = args.client ? args.client : scheme;

   args.client = client;
   args.host = host;
   args.database = dbName;
   args.port = port;
   args.user = userName;
   args.password = password;

   return args;
};

const connectionType = part => {
   return part.split('=')[1];
};

const connStringConstruct = args => {
   if (!args.pgConnString)
      return args;

   const pgConnString = args.pgConnString;

   if (!pgConnString.includes('?'))
      return localConnectionString(pgConnString, args);

   const pgConnStringPrepared = pgConnString.split('?')[0];

   switch (connectionType(pgConnString.split('?')[1])) {
      case 'local':
         return localConnectionString(pgConnStringPrepared, args);

      case 'server':
         return onlineConnectionString(pgConnStringPrepared, args);

      default:
         return args;
   };
};

export default connStringConstruct;
