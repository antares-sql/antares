process.env.NODE_ENV = 'development';
// process.env.ELECTRON_ENABLE_LOGGING = true
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = false;

const chalk = require('chalk');
const electron = require('electron');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const kill = require('tree-kill');

const path = require('path');
const { spawn } = require('child_process');

const mainConfig = require('../webpack.main.config');
const rendererConfig = require('../webpack.renderer.config');
const workersConfig = require('../webpack.workers.config');

let electronProcess = null;
let manualRestart = null;
const remoteDebugging = process.argv.includes('--remote-debug');

if (remoteDebugging) {
   // disable devtools open in electron
   process.env.RENDERER_REMOTE_DEBUGGING = true;
}

async function killElectron (pid) {
   return new Promise((resolve, reject) => {
      if (pid) {
         kill(pid, 'SIGKILL', err => {
            if (err) reject(err);

            resolve();
         });
      }
      else
         resolve();
   });
}

async function restartElectron () {
   console.log(chalk.gray('\nStarting electron...'));

   const { pid } = electronProcess || {};
   await killElectron(pid);

   electronProcess = spawn(electron, [
      path.join(__dirname, '../dist/main.js'),
      // '--enable-logging', // Enable to show logs from all electron processes
      remoteDebugging ? '--inspect=9222' : '',
      remoteDebugging ? '--remote-debugging-port=9223' : ''
   ]);

   electronProcess.stdout.on('data', data => {
      console.log(chalk.white(data.toString()));
   });

   electronProcess.stderr.on('data', data => {
      console.error(chalk.red(data.toString()));
   });

   electronProcess.on('exit', () => {
      if (!manualRestart) process.exit(0);
   });
}

function startMain () {
   const webpackSetup = webpack([mainConfig, workersConfig]);

   webpackSetup.compilers.forEach((compiler) => {
      const { name } = compiler;

      switch (name) {
         case 'workers':
            compiler.hooks.afterEmit.tap('afterEmit', async () => {
               console.log(chalk.gray(`\nCompiled ${name} script!`));
               console.log(
                  chalk.gray(`\nWatching file changes for ${name} script...`)
               );
            });
            break;
         case 'main':
         default:
            compiler.hooks.afterEmit.tap('afterEmit', async () => {
               console.log(chalk.gray(`\nCompiled ${name} script!`));

               manualRestart = true;
               await restartElectron();

               setTimeout(() => {
                  manualRestart = false;
               }, 2500);

               console.log(
                  chalk.gray(`\nWatching file changes for ${name} script...`)
               );
            });
            break;
      }
   });

   webpackSetup.watch({ aggregateTimeout: 500 }, err => {
      if (err) console.error(chalk.red(err));
   });
}

function startRenderer (callback) {
   const compiler = webpack(rendererConfig);
   const { name } = compiler;

   compiler.hooks.afterEmit.tap('afterEmit', () => {
      console.log(chalk.gray(`\nCompiled ${name} script!`));
      console.log(chalk.gray(`\nWatching file changes for ${name} script...`));
   });

   const server = new WebpackDevServer(compiler, {
      port: 9080,
      client: {
         overlay: true,
         logging: 'warn'
      }
   });

   server.startCallback(err => {
      if (err) console.error(chalk.red(err));

      callback();
   });
}

startRenderer(startMain);
