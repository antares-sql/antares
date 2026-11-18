/**
 * Runs Vitest inside Electron in Node mode (ELECTRON_RUN_AS_NODE).
 * Tests run on the Node runtime bundled with Electron (the one the main process uses),
 * so native modules (better-sqlite3) and Node APIs behave as in the app.
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
