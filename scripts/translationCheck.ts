/* eslint-disable @typescript-eslint/ban-ts-comment */
import { localesNames } from '../src/renderer/i18n/supported-locales';
import { enUS } from '../src/renderer/i18n/en-US';
const locale = process.argv[2];
let fullCount = 0;
let checkCount = 0;

if (!locale) {
   console.log('Please specify locale code as first argument.');
   process.exit();
}

if (!Object.keys(localesNames).includes(locale)) {
   console.log(`Translation ${locale} not fount in supported locales.`);
   process.exit();
}

console.log('Checking missing translations for:', locale);

const i18nFile = require(`../src/renderer/i18n/${locale}`)[locale.replace('-', '')];

for (const group in enUS) {
   // @ts-ignore
   fullCount += Object.keys(enUS[group]).length;

   if (!Object.keys(i18nFile).includes(group)) {
      console.log(`Group "\u001b[31m${group}\u001b[0m" missing!`);
      continue;
   }

   // @ts-ignore
   for (const term in enUS[group]) {
      if (!Object.keys(i18nFile[group]).includes(term))
         console.log(`Translation "\u001b[33m${group}.${term}\u001b[0m" missing!`);
      // @ts-ignore
      else if (i18nFile[group][term] === enUS[group][term]) {
         console.log(`Term "\u001b[36m${group}.${term}\u001b[0m" not translated!`);
         checkCount++;
      }
      else
         checkCount++;
   }
}

console.log(checkCount, 'of', fullCount, 'strings are present in', locale, `(\u001b[32m${(checkCount*100/fullCount).toFixed(1)}%\u001b[0m)`);
