/**
 * Native addons shipped as prebuilds must load on the oldest supported Linux: the snap is based on
 * core22 (Ubuntu 22.04, glibc 2.35). #950: a better-sqlite3 binary built on a newer system required
 * GLIBC_2.38 and SQLite connections failed in the snap.
 */
import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

const MAX_GLIBC = [2, 35];

const requiredGlibc = (file: string) => {
   const versions = [...fs.readFileSync(file).toString('latin1').matchAll(/GLIBC_(\d+)\.(\d+)/g)]
      .map(([, major, minor]) => [Number(major), Number(minor)]);
   return versions.reduce((max, v) => v[0] > max[0] || (v[0] === max[0] && v[1] > max[1]) ? v : max, [0, 0]);
};

describe('native modules', () => {
   it.each(['linux-x64', 'linux-arm64'])('better-sqlite3 %s prebuild runs on glibc 2.35 (snap core22)', target => {
      const file = path.join(__dirname, '../../../node_modules/better-sqlite3/prebuilds', `${target}.node`);
      const [major, minor] = requiredGlibc(file);

      expect(major * 1000 + minor).toBeLessThanOrEqual(MAX_GLIBC[0] * 1000 + MAX_GLIBC[1]);
   });
});
