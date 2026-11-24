/**
 * Smoke tests of the packaged app (electron-builder output), the only place where bugs of the bundles
 * show up: modules that webpack leaves external but electron-builder doesn't ship (devDependencies),
 * modules missing inside a worker thread (`electron`), paths that differ inside app.asar.
 *
 *   npm run test:packaged        # compile + electron-builder --dir + these tests
 *   npm run test:packaged-dry    # these tests only, against the last build
 *
 * ANTARES_PACKAGED_APP overrides the path of the packaged executable.
 */
import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { _electron as electron, ElectronApplication, Page } from 'playwright';

declare const require: (id: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any

const ROOT = path.resolve(__dirname, '..', '..');

/** Executable produced by `electron-builder --dir` for the current platform */
function findPackagedApp (): string {
   if (process.env.ANTARES_PACKAGED_APP) return process.env.ANTARES_PACKAGED_APP;

   const build = path.join(ROOT, 'build');
   const candidates = {
      win32: ['win-unpacked/Antares.exe', 'win-arm64-unpacked/Antares.exe'],
      linux: ['linux-unpacked/antares', 'linux-arm64-unpacked/antares'],
      darwin: ['mac-arm64/Antares.app/Contents/MacOS/Antares', 'mac/Antares.app/Contents/MacOS/Antares']
   }[process.platform as 'win32' | 'linux' | 'darwin'] ?? [];

   const found = candidates.map(c => path.join(build, c)).find(c => fs.existsSync(c));
   if (!found) throw new Error(`Packaged app not found in ${build}: run "npm run test:packaged"`);
   return found;
}

let tmpDir: string;
let electronApp: ElectronApplication;
let appWindow: Page;

test.beforeAll(async () => {
   tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'antares-packaged-'));

   electronApp = await electron.launch({
      executablePath: findPackagedApp(),
      // Own profile: no stored connections and no conflict with the single instance lock of an open Antares
      args: [`--user-data-dir=${path.join(tmpDir, 'profile')}`, ...(process.platform === 'linux' ? ['--no-sandbox'] : [])],
      env: Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== 'ELECTRON_RUN_AS_NODE'))
   });
   appWindow = await electronApp.firstWindow();
   await appWindow.waitForLoadState('load');
});

test.afterAll(async () => {
   await electronApp?.close();
   if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('runs as packaged app from app.asar', async () => {
   const { isPackaged, appPath } = await electronApp.evaluate(({ app }) => ({
      isPackaged: app.isPackaged,
      appPath: app.getAppPath()
   }));

   expect(isPackaged).toBe(true);
   expect(appPath).toMatch(/app\.asar$/);
});

test('main window renders', async () => {
   await expect(appWindow.locator('#wrapper')).toBeVisible({ timeout: 30000 });
   await expect(appWindow.locator('#settingbar')).toBeVisible();
});

/**
 * Every `require()` left in the bundles must resolve in the packaged app, from the thread that runs it:
 * webpack treats all dependencies and devDependencies as externals, but devDependencies aren't shipped.
 * `electron` is skipped: it is built in for the main thread and absent in workers, where it is covered by
 * the export/import tests below (only guarded, lazy requires of it are allowed there).
 */
test('external modules of the bundles resolve', async () => {
   const unresolved = await electronApp.evaluate(async ({ app }) => {
      const nodeRequire = process.mainModule.require;
      const fs = nodeRequire('fs');
      const path = nodeRequire('path');
      const { createRequire } = nodeRequire('module');
      const { Worker } = nodeRequire('worker_threads');

      const externalsOf = (file: string) => {
         const source: string = fs.readFileSync(file, 'utf-8');
         const names = [...source.matchAll(/\brequire\("([^"]+)"\)/g)].map(m => m[1]);
         return [...new Set(names)].filter(name => name !== 'electron' && !name.startsWith('node:'));
      };
      const dist = path.join(app.getAppPath(), 'dist');
      const missing: string[] = [];

      // Main bundle: resolved from the main thread
      const mainFile = path.join(dist, 'main.js');
      const mainRequire = createRequire(mainFile);
      for (const name of externalsOf(mainFile)) {
         try {
            mainRequire.resolve(name);
         }
         catch {
            missing.push(`main.js → ${name}`);
         }
      }

      // Worker bundles: resolved from a worker thread, as at runtime
      for (const bundle of ['exporter.js', 'importer.js']) {
         const file = path.join(dist, bundle);
         const result: string[] = await new Promise((resolve, reject) => {
            const worker = new Worker(`
               const { parentPort, workerData } = require('worker_threads');
               const { createRequire } = require('module');
               const req = createRequire(workerData.file);
               parentPort.postMessage(workerData.names.filter(name => {
                  try { req.resolve(name); return false; }
                  catch { return true; }
               }));
            `, { eval: true, workerData: { file, names: externalsOf(file) } });
            worker.once('message', resolve);
            worker.once('error', reject);
         });
         missing.push(...result.map(name => `${bundle} → ${name}`));
      }

      return missing;
   });

   expect(unresolved).toEqual([]);
});

/** Calls an IPC handler from the renderer, as the ipc-api classes do */
function invoke (channel: string, params: unknown) {
   return appWindow.evaluate(async ({ channel, params }) => {
      return require('electron').ipcRenderer.invoke(channel, params);
   }, { channel, params });
}

test.describe('SQLite import and export (worker threads)', () => {
   const uid = 'PACKAGEDTEST';

   test.beforeAll(async () => {
      // The client opens existing files only; an empty file is a valid empty database
      const databasePath = path.join(tmpDir, 'packaged.db');
      fs.writeFileSync(databasePath, '');

      const result = await invoke('connect', {
         uid,
         client: 'sqlite',
         databasePath,
         host: '127.0.0.1',
         port: null,
         user: '',
         password: '',
         ask: false,
         readonly: false,
         singleConnectionMode: false,
         ssl: false,
         ssh: false
      });
      expect(result.status, JSON.stringify(result.response)).toBe('success');

      // Data for the export test, written from the main thread so that the two tests are independent
      const seed = await invoke('raw-query', {
         uid,
         schema: 'main',
         query: 'CREATE TABLE "fruits" ("id" INTEGER PRIMARY KEY, "name" TEXT NOT NULL);\n' +
            'INSERT INTO "fruits" ("id", "name") VALUES (1, \'apple\'), (2, \'pear\');'
      });
      expect(seed.status, JSON.stringify(seed.response)).toBe('success');
   });

   test.afterAll(async () => {
      await invoke('disconnect', uid).catch((): null => null);
   });

   test('imports a SQL file', async () => {
      const file = path.join(tmpDir, 'import.sql');
      fs.writeFileSync(file, [
         'CREATE TABLE "colors" ("id" INTEGER PRIMARY KEY, "name" TEXT NOT NULL);',
         'INSERT INTO "colors" ("id", "name") VALUES (1, \'red\'), (2, \'green\'), (3, \'blue\');'
      ].join('\n'));

      const result = await invoke('import-sql', { uid, type: 'sqlite', schema: 'main', file });
      expect(result.status, JSON.stringify(result.response)).toBe('success');

      const check = await invoke('raw-query', { uid, schema: 'main', query: 'SELECT COUNT(*) AS "n" FROM "colors"' });
      expect(check.status, JSON.stringify(check.response)).toBe('success');
      expect(JSON.stringify(check.response)).toMatch(/"n":3\b/);
   });

   test('exports the database to a SQL file', async () => {
      const outputFile = path.join(tmpDir, 'export.sql');

      const result = await invoke('export', {
         uid,
         type: 'sqlite',
         schema: 'main',
         outputFile,
         outputFormat: 'sql',
         sqlInsertAfter: 250,
         sqlInsertDivider: 'bytes',
         includes: {},
         tables: [{ table: 'fruits', includeStructure: true, includeContent: true, includeDropStatement: true }]
      });
      expect(result.status, JSON.stringify(result.response)).toBe('success');

      const dump = fs.readFileSync(outputFile, 'utf-8');
      expect(dump).toMatch(/CREATE TABLE "fruits"/);
      expect(dump).toMatch(/'apple'/);
      expect(dump).toMatch(/'pear'/);
   });
});
