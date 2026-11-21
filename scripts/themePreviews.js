#!/usr/bin/env node
/**
 * Screenshots of the gallery themes, taken with the real app (scripts/appDriver.js).
 *
 *   node scripts/themePreviews.js <gallery dir> [theme ids...]
 *
 * Start the app and prepare the scene first (e.g. a query tab with results), see .claude/skills/run-app:
 * for each theme the script installs it, activates it, takes a screenshot and saves it as
 * themes/<id>/preview.png. At the end the previous theme is restored and the gallery themes removed.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [galleryDir, ...only] = process.argv.slice(2);
if (!galleryDir) {
   console.error('Usage: node scripts/themePreviews.js <gallery dir> [theme ids...]');
   process.exit(1);
}

const driver = (...args) => execFileSync(process.execPath, [path.join(__dirname, 'appDriver.js'), ...args], { encoding: 'utf8' }).trim();
const evalInApp = js => JSON.parse(driver('eval', js) || 'null');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const pinia = 'document.querySelector(\'#app\').__vue_app__.config.globalProperties.$pinia._s';

(async () => {
   const themesDir = path.join(galleryDir, 'themes');
   const ids = only.length ? only : fs.readdirSync(themesDir).filter(id => fs.existsSync(path.join(themesDir, id, 'theme.json')));
   const previous = evalInApp(`${pinia}.get('settings').applicationTheme`);

   for (const id of ids) {
      const file = path.join(themesDir, id, 'theme.json').replace(/\\/g, '/');
      const result = evalInApp(`(() => {
         const themes = ${pinia}.get('themes');
         const parsed = themes.parseThemeFile(require('fs').readFileSync('${file}', 'utf8'));
         if (parsed.status !== 'success') return parsed;
         themes.installTheme(parsed.theme);
         ${pinia}.get('settings').changeApplicationTheme(parsed.theme.id);
         return { status: 'success' };
      })()`);
      if (result.status !== 'success') {
         console.error(`${id}: ${result.errors.join('; ')}`);
         continue;
      }
      await sleep(600); // editor reconfiguration and transitions
      const shot = driver('ss', `theme-${id}`).replace(/^screenshot:\s*/, '');
      fs.copyFileSync(shot, path.join(themesDir, id, 'preview.png'));
      console.log(`${id}: preview.png`);
   }

   evalInApp(`(() => {
      ${pinia}.get('settings').changeApplicationTheme(${JSON.stringify(previous)});
      for (const id of ${JSON.stringify(ids)}) ${pinia}.get('themes').removeTheme(id);
      return true;
   })()`);
})();
