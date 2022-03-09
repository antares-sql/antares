import formatter from 'pg-connection-string'; // parses a connection string

const formatHost = host => {
  const results = host === 'localhost' ? '127.0.0.1' : host;
  return results;
};

const connString = (stringArgs, args) => {
  stringArgs = typeof stringArgs === 'string' ? formatter.parse(stringArgs) : stringArgs;

  const client = args.client ? args.client : 'pg';

  args.client = client;
  args.host = formatHost(stringArgs.host) || '';
  args.database = stringArgs.database || '';
  args.port = stringArgs.port || '5432';
  args.user = stringArgs.user || '';
  args.password = stringArgs.password || '';

  // ssh
  args.ssh = stringArgs.ssh || args.ssh;
  args.sshHost = stringArgs.sshHost || args.sshHost;
  args.sshUser = stringArgs.sshUser || args.sshUser;
  args.sshPass = stringArgs.sshPass || args.sshPass;
  args.sshKey = stringArgs.sshKey || args.sshKey;
  args.sshPort = stringArgs.sshPort || args.sshPort;

  // ssl mode
  args.ssl = args.includes('ssl=true') || args.ssl;
  args.cert = stringArgs.sslcert || '';
  args.key = stringArgs.sslkey || '';
  args.ca = stringArgs.sslrootcert || '';
  args.ciphers = stringArgs.ciphers || '';

  return args;
};

export default connString;