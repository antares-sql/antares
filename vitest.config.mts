import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Keep in sync with tsconfig.json `paths` and webpack `resolve.alias`
const alias = {
   common: r('./src/common'),
   '@': r('./src/renderer'),
   src: r('./src')
};

export default defineConfig({
   resolve: { alias },
   test: {
      // Native modules (better-sqlite3) are built for Electron's ABI:
      // see scripts/vitest.js, which runs Vitest through Electron in Node mode.
      pool: 'forks',
      projects: [
         {
            resolve: { alias },
            test: {
               name: 'unit',
               include: ['tests/unit/**/*.spec.ts'],
               environment: 'node'
            }
         },
         {
            resolve: { alias },
            test: {
               name: 'integration',
               include: ['tests/integration/**/*.spec.ts'],
               environment: 'node',
               testTimeout: 30_000,
               hookTimeout: 120_000,
               fileParallelism: false
            }
         }
      ]
   }
});
