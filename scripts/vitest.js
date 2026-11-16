/**
 * Runs Vitest inside Electron in Node mode (ELECTRON_RUN_AS_NODE).
 * Native modules (better-sqlite3) are rebuilt for Electron's ABI by `postinstall`,
 * so tests must run on the same runtime the main process uses.
 *
 * Usage: node scripts/vitest.js [vitest args...]
 */
const { spawn } = require('child_process');
const path = require('path');
const electron = require('electron');

const vitestBin = path.join(__dirname, '..', 'node_modules', 'vitest', 'vitest.mjs');

const child = spawn(electron, [vitestBin, ...process.argv.slice(2)], {
   stdio: 'inherit',
   env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
});

child.on('exit', code => process.exit(code ?? 1));
