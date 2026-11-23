/**
 * Sample databases for development, from https://github.com/antares-sql/test-databases
 *
 * - downloads the dumps once (cached in docker/samples/.cache, pinned to SAMPLES_REF);
 * - loads them into the running test DBs of docker/docker-compose.yml (start them with `npm run test:db:up`):
 *   MySQL gets the classicmodels, sakila and world_x databases, MariaDB the first two
 *   (world_x holds an X DevAPI document collection, MySQL-only),
 *   PostgreSQL gets the chinook, netflix and pagila schemas in antares_test;
 * - copies the SQLite ones into docker/samples/sqlite, where "Apply debug connections" finds them;
 * - creates the Firebird database samples.fdb from docker/firebird/samples (kept in this repository).
 *
 * Running it again resets the samples to their original content.
 * Usage: npm run test:db:samples [-- mysql maria pg firebird sqlite]
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SAMPLES_REPO = 'antares-sql/test-databases';
const SAMPLES_REF = 'b81c67b234900a6cc8e53974b39c5a27013310a1';

const ROOT = path.resolve(__dirname, '..');
const COMPOSE_FILE = path.join(ROOT, 'docker', 'docker-compose.yml');
const SAMPLES_DIR = path.join(ROOT, 'docker', 'samples');
const CACHE_DIR = path.join(SAMPLES_DIR, '.cache');
const SQLITE_DIR = process.env.ANTARES_TEST_SQLITE_DIR || path.join(SAMPLES_DIR, 'sqlite');

const mysqlDumps = [
   'docker/mysql/init-sql/01-classicmodels.sql',
   'docker/mysql/init-sql/02-sakila-schema.sql',
   'docker/mysql/init-sql/03-sakila-data.sql',
   'docker/mysql/init-sql/04-world_x.sql'
];
const mysqlReset = 'DROP DATABASE IF EXISTS classicmodels; DROP DATABASE IF EXISTS sakila; DROP DATABASE IF EXISTS world_x;';

/** Engines that run in docker: compose service, CLI that reads SQL from stdin, dumps */
const dockerEngines = {
   mysql: {
      service: 'mysql',
      command: ['mysql', '-uroot', '--default-character-set=utf8mb4'],
      env: { MYSQL_PWD: 'antares' },
      reset: mysqlReset,
      dumps: mysqlDumps
   },
   maria: {
      service: 'mariadb',
      command: ['mariadb', '-uroot', '--default-character-set=utf8mb4'],
      env: { MYSQL_PWD: 'antares' },
      reset: mysqlReset,
      dumps: mysqlDumps.filter(dump => !dump.includes('world_x'))
   },
   pg: {
      service: 'postgres',
      command: ['psql', '-U', 'postgres', '-d', 'antares_test', '-q', '-v', 'ON_ERROR_STOP=1'],
      env: {},
      reset: 'DROP SCHEMA IF EXISTS chinook, netflix, pagila CASCADE;',
      dumps: [
         'docker/pg/init-sql/01-chinook.sql',
         'docker/pg/init-sql/02-netflix.sql',
         'docker/pg/init-sql/03-pagila.sql'
      ]
   }
};

const sqliteFiles = ['sqlite/chinook.db', 'sqlite/northwind.db'];

/** Firebird has no schemas: the samples are a database of their own, created by isql */
const firebirdSample = {
   service: 'firebird',
   database: '/var/lib/firebird/data/samples.fdb',
   scripts: [path.join(ROOT, 'docker', 'firebird', 'samples', 'bookshop.sql')]
};

const cachePath = file => path.join(CACHE_DIR, ...file.split('/'));

async function download (file) {
   const target = cachePath(file);
   if (fs.existsSync(target)) return;

   const url = `https://raw.githubusercontent.com/${SAMPLES_REPO}/${SAMPLES_REF}/${file}`;
   console.log(`Downloading ${file}`);
   const res = await fetch(url);
   if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);

   fs.mkdirSync(path.dirname(target), { recursive: true });
   fs.writeFileSync(`${target}.part`, Buffer.from(await res.arrayBuffer()));
   fs.renameSync(`${target}.part`, target);
}

function compose (args, options = {}) {
   return spawnSync('docker', ['compose', '-f', COMPOSE_FILE, ...args], { encoding: 'utf8', ...options });
}

function runningServices () {
   const res = compose(['ps', '--services', '--status', 'running']);
   if (res.error || res.status !== 0)
      throw new Error(`docker compose ps failed: ${res.error?.message || res.stderr}`);
   return res.stdout.split(/\r?\n/).filter(Boolean);
}

/** Runs the engine CLI inside its container, feeding `input` (string or file path) to stdin */
function execSql (engine, input, isFile) {
   const envArgs = Object.entries(engine.env).flatMap(([key, value]) => ['-e', `${key}=${value}`]);
   const args = ['exec', '-T', ...envArgs, engine.service, ...engine.command];
   const fd = isFile ? fs.openSync(input, 'r') : null;

   try {
      const res = compose(args, isFile
         ? { stdio: [fd, 'ignore', 'pipe'] }
         : { input, stdio: ['pipe', 'ignore', 'pipe'] });
      if (res.status !== 0)
         throw new Error(res.stderr || `exit code ${res.status}`);
   }
   finally {
      if (fd !== null) fs.closeSync(fd);
   }
}

function loadDocker (name, engine) {
   console.log(`Loading samples into ${name}...`);
   execSql(engine, engine.reset, false);
   for (const dump of engine.dumps) {
      console.log(`  ${path.basename(dump)}`);
      execSql(engine, cachePath(dump), true);
   }
}

function loadFirebird () {
   console.log('Loading samples into firebird...');
   const { service, database } = firebirdSample;

   // Reset: the database is created again
   const rm = compose(['exec', '-T', service, 'rm', '-f', database], { stdio: ['ignore', 'ignore', 'pipe'] });
   if (rm.status !== 0) throw new Error(rm.stderr || `exit code ${rm.status}`);

   const create = `SET NAMES UTF8;\nCREATE DATABASE 'localhost:${database}' USER 'SYSDBA' PASSWORD 'antares' PAGE_SIZE 16384 DEFAULT CHARACTER SET UTF8;\n`;
   const scripts = firebirdSample.scripts.map(script => {
      console.log(`  ${path.basename(script)}`);
      return fs.readFileSync(script, 'utf8');
   });

   // -bail: stops at the first error, with a non-zero exit code
   const res = compose(['exec', '-T', service, '/opt/firebird/bin/isql', '-q', '-bail', '-ch', 'UTF8'], {
      input: create + scripts.join('\n'),
      stdio: ['pipe', 'pipe', 'pipe']
   });
   if (res.status !== 0) throw new Error(res.stderr || res.stdout || `exit code ${res.status}`);
   console.log(`Firebird sample ready: ${database} (debug connection "Docker Firebird samples")`);
}

function copySqlite () {
   fs.mkdirSync(SQLITE_DIR, { recursive: true });
   for (const file of sqliteFiles) {
      const target = path.join(SQLITE_DIR, path.basename(file));
      fs.copyFileSync(cachePath(file), target);
      console.log(`SQLite sample ready: ${target}`);
   }
}

async function main () {
   const all = [...Object.keys(dockerEngines), 'firebird', 'sqlite'];
   const requested = process.argv.slice(2);
   const unknown = requested.filter(e => !all.includes(e));
   if (unknown.length) throw new Error(`Unknown engines: ${unknown.join(', ')} (available: ${all.join(', ')})`);
   const selected = requested.length ? requested : all;

   const docker = selected.filter(e => dockerEngines[e]);
   const withFirebird = selected.includes('firebird');
   const running = docker.length || withFirebird ? runningServices() : [];
   const toLoad = docker.filter(name => {
      if (running.includes(dockerEngines[name].service)) return true;
      console.warn(`Skipping ${name}: service "${dockerEngines[name].service}" is not running (npm run test:db:up)`);
      return false;
   });

   const files = new Set(toLoad.flatMap(name => dockerEngines[name].dumps));
   if (selected.includes('sqlite')) sqliteFiles.forEach(f => files.add(f));
   for (const file of files) await download(file);

   const failed = [];
   for (const name of toLoad) {
      try {
         loadDocker(name, dockerEngines[name]);
      }
      catch (err) {
         failed.push(name);
         console.error(`Failed to load samples into ${name}:\n${err.message}`);
      }
   }

   if (withFirebird) {
      if (!running.includes(firebirdSample.service))
         console.warn(`Skipping firebird: service "${firebirdSample.service}" is not running (npm run test:db:up)`);
      else {
         try {
            loadFirebird();
         }
         catch (err) {
            failed.push('firebird');
            console.error(`Failed to load samples into firebird:\n${err.message}`);
         }
      }
   }

   if (selected.includes('sqlite')) copySqlite();

   if (failed.length) process.exit(1);
   console.log('Done. In the app (development only): Settings → Data → Apply debug connections');
}

main().catch(err => {
   console.error(err.message);
   process.exit(1);
});
