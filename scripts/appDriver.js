/**
 * Drives the compiled Antares app like a user (for agents and quick manual checks).
 *
 * `start` launches Electron detached, with an isolated profile and a CDP port; every other
 * command connects over CDP, performs one action and exits, so the app stays open between commands.
 *
 *   node scripts/appDriver.js start [--build] [--fresh]
 *   node scripts/appDriver.js seed            # adds the docker test connections
 *   node scripts/appDriver.js open "Docker PostgreSQL"
 *   node scripts/appDriver.js ss after-connect
 *   node scripts/appDriver.js stop
 *
 * Env: ANTARES_DRIVER_DIR (profile, logs, screenshots; default <tmp>/antares-driver),
 *      ANTARES_DRIVER_PORT (CDP port; default 9339)
 */
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIR = process.env.ANTARES_DRIVER_DIR || path.join(os.tmpdir(), 'antares-driver');
const PROFILE = path.join(DIR, 'profile');
const SHOTS = path.join(DIR, 'shots');
const LOG = path.join(DIR, 'app.log');
const PID_FILE = path.join(DIR, 'app.pid');
const PORT = +(process.env.ANTARES_DRIVER_PORT || 9339);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function readPid () {
   try {
      return +fs.readFileSync(PID_FILE, 'utf-8');
   }
   catch {
      return null;
   }
}

function isAlive (pid) {
   if (!pid) return false;
   try {
      process.kill(pid, 0);
      return true;
   }
   catch {
      return false;
   }
}

function cdpVersion () {
   return new Promise(resolve => {
      const req = http.get(`http://127.0.0.1:${PORT}/json/version`, res => {
         res.resume();
         resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(1000, () => {
         req.destroy();
         resolve(false);
      });
   });
}

async function getPage () {
   const { chromium } = require('playwright-core');
   const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
   const pages = browser.contexts().flatMap(c => c.pages());
   const page = pages.find(p => p.url().endsWith('index.html')) || pages[0];
   if (!page) throw new Error('App window not found');
   return page;
}

/**
 * First visible match of a CSS/Playwright selector: every open connection keeps its
 * workspace (tabs, editors, buttons) in the DOM, hidden, so plain selectors often hit hidden copies
 */
function visible (page, sel) {
   return page.locator(`${sel} >> visible=true`).first();
}

/** Runs `fn(pinia stores map, arg)` inside the renderer */
function withStores (page, fn, arg) {
   return page.evaluate(([src, arg]) => {
      const stores = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s;
      // eslint-disable-next-line no-new-func
      return new Function('stores', 'arg', `return (${src})(stores, arg)`)(stores, arg);
   }, [fn.toString(), arg]);
}

const INTERACTIVE_ROLES = new Set([
   'button', 'link', 'textbox', 'searchbox', 'combobox', 'checkbox', 'radio', 'switch', 'tab', 'menuitem',
   'menuitemcheckbox', 'menuitemradio', 'treeitem', 'option', 'slider', 'spinbutton', 'listbox', 'tree', 'tablist',
   'radiogroup', 'grid', 'columnheader'
]);

/**
 * One line describing the focused element: accessibility role and name, tag, and whether a focus ring
 * is drawn (outline on the element or, when it has no size, on its nearest visible ancestor)
 */
async function describeFocus (page, cdp) {
   const { result } = await cdp.send('Runtime.evaluate', { expression: 'document.activeElement' });
   const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      let box = el;
      while (box && box.getBoundingClientRect().width < 2) box = box.parentElement;
      const cs = box ? getComputedStyle(box) : null;
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
      return {
         tag: el.tagName.toLowerCase() + (cls ? `.${cls}` : ''),
         ring: !!cs && cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0
      };
   });
   if (!info) return 'BODY (no focus)';
   const { node } = await cdp.send('DOM.describeNode', { objectId: result.objectId });
   const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { backendNodeId: node.backendNodeId, fetchRelatives: false });
   const ax = nodes[0] || {};
   const states = (ax.properties || [])
      .filter(p => ['expanded', 'selected', 'checked', 'pressed'].includes(p.name) && p.value?.value !== undefined)
      .map(p => `${p.name}=${p.value.value}`).join(' ');
   return `${ax.role?.value || '?'} "${String(ax.name?.value || '').slice(0, 60)}"${states ? ` [${states}]` : ''} <${info.tag}> ring=${info.ring ? 'yes' : 'no'}`;
}

async function axSession (page) {
   const cdp = await page.context().newCDPSession(page);
   await cdp.send('DOM.enable');
   await cdp.send('Accessibility.enable');
   return cdp;
}

const commands = {
   async start (...flags) {
      if (isAlive(readPid()) && await cdpVersion()) return console.log('already running');

      if (flags.includes('--fresh')) fs.rmSync(PROFILE, { recursive: true, force: true });
      if (flags.includes('--build') || !fs.existsSync(path.join(ROOT, 'dist/index.html'))) {
         console.log('compiling...');
         execSync('npm run compile', { cwd: ROOT, stdio: 'ignore' });
      }

      fs.mkdirSync(PROFILE, { recursive: true });
      const env = { ...process.env };
      delete env.ELECTRON_RUN_AS_NODE; // otherwise Electron starts as plain Node

      const out = fs.openSync(LOG, 'w');
      const child = spawn(require('electron'), [
         path.join(ROOT, 'dist/main.js'),
         `--user-data-dir=${PROFILE}`,
         `--remote-debugging-port=${PORT}`
      ], { cwd: ROOT, env, detached: true, stdio: ['ignore', out, out] });
      child.unref();
      fs.writeFileSync(PID_FILE, String(child.pid));

      for (let i = 0; i < 60 && !await cdpVersion(); i++) await sleep(500);
      const page = await getPage();
      await page.waitForSelector('#settingbar', { timeout: 30000 });
      console.log(`started (pid ${child.pid}, profile ${PROFILE})`);
   },

   async stop () {
      const pid = readPid();
      if (isAlive(pid)) {
         if (process.platform === 'win32') execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
         else process.kill(-pid);
      }
      fs.rmSync(PID_FILE, { force: true });
      console.log('stopped');
   },

   async status () {
      console.log(isAlive(readPid()) && await cdpVersion() ? `running on CDP port ${PORT}` : 'not running');
   },

   /** Adds (or replaces) the connections to the docker test databases */
   async seed () {
      const page = await getPage();
      const names = await withStores(page, stores => {
         const connections = stores.get('connections');
         connections.applyDebugConnections();
         return connections.connections.map(c => connections.getConnectionName(c.uid));
      });
      console.log('connections:', names.join(', '));
   },

   /** Lists saved connections and their workspace status */
   async connections () {
      const page = await getPage();
      const list = await withStores(page, stores => stores.get('connections').connections.map(c => ({
         uid: c.uid,
         name: stores.get('connections').getConnectionName(c.uid),
         connected: stores.get('workspaces').getWorkspace(c.uid)?.connectionStatus ?? 'disconnected'
      })));
      for (const c of list) console.log(`${c.uid}\t${c.connected}\t${c.name}`);
   },

   /** Selects a connection (by name or uid) and presses Connect if not connected yet */
   async open (...name) {
      const page = await getPage();
      const target = name.join(' ');
      const uid = await withStores(page, (stores, target) => {
         const connections = stores.get('connections');
         const conn = connections.connections.find(c => c.uid === target || connections.getConnectionName(c.uid) === target);
         if (!conn) return null;
         stores.get('workspaces').selectWorkspace(conn.uid);
         return conn.uid;
      }, target);
      if (!uid) throw new Error(`connection "${target}" not found (see: connections)`);

      const getStatus = () => withStores(page, (stores, uid) => stores.get('workspaces').getWorkspace(uid)?.connectionStatus, uid);

      if (await getStatus() !== 'connected') {
         // Every workspace keeps its (hidden) panel in the DOM: only the selected one is visible
         await visible(page, '#connection-connect').click({ timeout: 10000 });
         for (let i = 0; i < 60 && !['connected', 'failed'].includes(await getStatus()); i++) await sleep(500);
         await sleep(500); // let the explore bar render
      }
      console.log(`${target}: ${await getStatus()}`);
   },

   async ss (name) {
      const page = await getPage();
      fs.mkdirSync(SHOTS, { recursive: true });
      const file = path.join(SHOTS, `${name || `ss-${Date.now()}`}.png`);
      await page.screenshot({ path: file });
      console.log('screenshot:', file);
   },

   async click (...sel) {
      const page = await getPage();
      await visible(page, sel.join(' ')).click({ timeout: 10000 });
      console.log('clicked');
   },

   /** Clicks the first visible element whose text matches */
   async 'click-text' (...text) {
      const page = await getPage();
      await visible(page, `text=${text.join(' ')}`).click({ timeout: 10000 });
      console.log('clicked');
   },

   async fill (sel, ...value) {
      const page = await getPage();
      await visible(page, sel).fill(value.join(' '), { timeout: 10000 });
      console.log('filled');
   },

   /** Types into the focused element (works with the code editors too) */
   async type (...text) {
      const page = await getPage();
      await page.keyboard.type(text.join(' '), { delay: 10 });
      console.log('typed');
   },

   /**
    * e.g. press Control+Enter, press Escape.
    * App shortcuts are native menu accelerators, which synthetic CDP key events never reach:
    * when the key matches one, its menu item is clicked like the OS would do.
    */
   async press (key) {
      const page = await getPage();
      const shortcut = await page.evaluate(key => {
         const norm = k => k.split('+').map(p => p.trim().toLowerCase()
            .replace(/^(commandorcontrol|cmdorctrl)$/, process.platform === 'darwin' ? 'meta' : 'control')
            .replace(/^(command|cmd)$/, 'meta')
            .replace(/^ctrl$/, 'control')
            .replace(/^option$/, 'alt')
            .replace(/^return$/, 'enter')).sort().join('+');
         const wanted = norm(key);
         const find = items => {
            for (const item of items) {
               if (item.accelerator && norm(item.accelerator) === wanted) return item;
               const found = item.submenu && find(item.submenu.items);
               if (found) return found;
            }
         };
         // eslint-disable-next-line no-undef
         const menu = require('@electron/remote').Menu.getApplicationMenu();
         const item = menu && find(menu.items);
         if (!item) return null;
         item.click();
         return item.label;
      }, key);

      if (shortcut) console.log(`pressed ${key} (shortcut: ${shortcut})`);
      else {
         await page.keyboard.press(key);
         console.log('pressed', key);
      }
   },

   async wait (sel, timeout = '10000') {
      const page = await getPage();
      await visible(page, sel).waitFor({ timeout: +timeout });
      console.log('found', sel);
   },

   /** innerText of the first visible match (whole page without selector) */
   async text (...sel) {
      const page = await getPage();
      console.log(await visible(page, sel.join(' ') || 'body').innerText({ timeout: 5000 }));
   },

   async eval (...expr) {
      const page = await getPage();
      console.log(JSON.stringify(await page.evaluate(expr.join(' ')), null, 2));
   },

   /** Role, name, states and focus ring of the focused element */
   async focus () {
      const page = await getPage();
      console.log(await describeFocus(page, await axSession(page)));
   },

   /** Presses Tab (or Shift+Tab with --shift) n times, describing the focus after each press */
   async walk (n = '10', ...flags) {
      const page = await getPage();
      const cdp = await axSession(page);
      const key = flags.includes('--shift') ? 'Shift+Tab' : 'Tab';
      for (let i = 1; i <= +n; i++) {
         await page.keyboard.press(key);
         await sleep(80);
         console.log(String(i).padStart(3), await describeFocus(page, cdp));
      }
   },

   /** Visible interactive elements without an accessible name, plus the page structure (landmarks, widgets) */
   async 'ax-audit' () {
      const page = await getPage();
      const cdp = await axSession(page);
      const { nodes } = await cdp.send('Accessibility.getFullAXTree');
      const unnamed = [];
      const structure = [];
      for (const n of nodes) {
         if (n.ignored || !n.role) continue;
         const role = n.role.value;
         const name = String(n.name?.value || '').trim();
         if (['main', 'navigation', 'region', 'dialog', 'alertdialog', 'tree', 'tablist', 'grid', 'table', 'radiogroup', 'listbox', 'toolbar'].includes(role))
            structure.push(`${role} "${name.slice(0, 50)}"`);
         if (!INTERACTIVE_ROLES.has(role) || name || !n.backendDOMNodeId) continue;
         const { object } = await cdp.send('DOM.resolveNode', { backendNodeId: n.backendDOMNodeId });
         const { result } = await cdp.send('Runtime.callFunctionOn', {
            objectId: object.objectId,
            functionDeclaration: 'function () { const r = this.getBoundingClientRect(); return r.width && r.height ? this.outerHTML.replace(/\\s+/g, " ").slice(0, 140) : null; }',
            returnByValue: true
         });
         if (result.value) unnamed.push(`${role}: ${result.value}`);
      }
      console.log(`unnamed interactive elements: ${unnamed.length}`);
      unnamed.forEach(line => console.log(`  ${line}`));
      console.log(`structure: ${structure.join(', ')}`);
   },

   /** Last lines of the app stdout/stderr */
   async log (lines = '40') {
      console.log(fs.readFileSync(LOG, 'utf-8').split('\n').slice(-+lines).join('\n'));
   },

   help () {
      console.log(`commands: ${Object.keys(commands).join(', ')}\ndir: ${DIR}`);
   }
};

(async () => {
   const [cmd = 'help', ...args] = process.argv.slice(2);
   if (!commands[cmd]) {
      console.log(`unknown command: ${cmd}`);
      commands.help();
      process.exit(1);
   }
   try {
      await commands[cmd](...args);
      process.exit(0);
   }
   catch (err) {
      console.error('ERROR:', err.message.split('\n')[0]);
      process.exit(1);
   }
})();
