# AGENTS.md

Guide for AI agents (and humans) working on **Antares SQL**, a cross-platform SQL client built with Electron + Vue 3 + TypeScript.
Supported engines: MySQL/MariaDB, PostgreSQL, SQLite, Firebird SQL.

See also [CONTRIBUTING.md](CONTRIBUTING.md) for the original contributor guide.

## Stack

| Area | Tech |
|---|---|
| Shell | Electron 30 (`@electron/remote` enabled, `nodeIntegration: true`, `contextIsolation: false`) |
| UI | Vue 3 (mostly `<script setup lang="ts">`), Pinia, vue-i18n, Spectre.css + SCSS, Ace editor |
| Bundling | webpack 5 (three configs: main, renderer, workers), `ts-loader`, `babel-loader`, `vue-loader` |
| Language | TypeScript **5.8** (project-local, non-strict) |
| Persistence | `electron-store` (settings, connections; credentials encrypted via `safeStorage`) |
| DB drivers | `mysql2`, `pg` + `pg-query-stream`, `better-sqlite3` (native), `node-firebird`, SSH tunnels via `@fabio286/ssh2-promise` |
| Packaging | electron-builder (config in `package.json` → `build`) |
| Tests | Vitest unit + integration ([tests/unit/](tests/unit/), [tests/integration/](tests/integration/)), Playwright e2e ([tests/app.spec.ts](tests/app.spec.ts), minimal) |

## Layout

```
src/
  main/                 Electron main process
    main.ts             Window creation, single-instance lock, app lifecycle
    ipc-handlers/       One file per domain (tables, schema, views, routines, ...). Registers ipcMain.handle(...)
    libs/
      ClientsFactory.ts Picks client class from `client` ('mysql'|'maria'|'pg'|'sqlite'|'firebird')
      clients/          BaseClient + one class per engine (all DB introspection/DDL; being split up into db/)
      db/               Target architecture of the clients refactor
        core/           QueryBuilder (one instance per query, no shared state), QueryDialect (pure SQL rendering)
        engines/<engine>/  Per-engine pieces, e.g. MySQLDialect (identifier quoting, string/blob/bit/boolean literals, JSON comparison)
      exporters/ importers/  SQL dump/import logic, run inside worker threads
      parsers/          Engine-specific SQL parsers
      misc/             validateSender (IPC origin check), ipcLogger
    workers/            exporter.ts / importer.ts (worker_threads entry points, own webpack config)
  renderer/             Vue app
    index.ts, App.vue
    components/         ~90 SFCs (naming: Base*, The*, Modal*, Workspace*, WorkspaceTab*, SettingBar*)
    stores/             Pinia stores (workspaces.ts is the core one: open connections, tabs, structure)
    ipc-api/            Thin static classes wrapping ipcRenderer.invoke(...) — one per ipc-handlers file
    composables/, libs/, scss/, i18n/ (one file per locale, en-US is the reference)
  common/               Shared by main and renderer
    interfaces/         Shared types (antares.ts holds most of them)
    customizations/     Per-engine feature flags merged over defaults.ts
    data-types/         Per-engine column type catalogs
    fieldTypes.ts, shortcuts.ts, libs/
scripts/                devRunner.js (dev server + electron), devtoolsInstaller.js, translationCheck.ts, vitest.js (runs Vitest inside Electron)
tests/
  unit/                 Vitest, no I/O. clients/sqlGeneration.spec.ts = SQL snapshots of every client (characterization)
  integration/          Vitest against real DBs from docker/; knownIssues.spec.ts pins known bugs with it.fails
docker/                 docker-compose.yml with test DBs (MySQL, MariaDB, PostgreSQL, Firebird) on non-standard ports
```

### Path aliases

- `common/*` → `src/common/*` (main, renderer, workers)
- `@/*` → `src/renderer/*` (renderer)
- `src/*` → `src/*` (used in a few places, e.g. `common/interfaces/antares.ts`)

Aliases are defined both in [tsconfig.json](tsconfig.json) `paths` and in each `webpack.*.config.js` `resolve.alias` — keep them in sync.

## How a feature flows

1. **Component** calls a static method from `src/renderer/ipc-api/*.ts` (e.g. `Tables.getTableColumns(params)`).
2. The ipc-api method calls `ipcRenderer.invoke('<kebab-case-event>', unproxify(params))` (`unproxify` strips Vue proxies).
3. **Handler** in `src/main/ipc-handlers/*.ts` runs `validateSender(event.senderFrame)`, then calls `connections[uid].<method>()`.
4. **Client** (`src/main/libs/clients/<Engine>Client.ts`) implements the method; returns `{ status: 'success' | 'error', response }` via the handler.

Rules:
- Everything above the client class must be **client-agnostic**. Engine differences live in the client classes and in `common/customizations/<engine>.ts` (UI checks `workspace.customizations.<flag>` to enable/disable features).
- Adding a new capability usually touches: `BaseClient`/engine clients → ipc handler → ipc-api → store/component → customizations flag → i18n strings.
- SQL values in main must go through the engine dialect (`client.dialect.quoteString()`, `blobLiteral()`, ... or `formatValue()` for UI values): never build literals with `sqlEscaper` or engine `switch`es in handlers.
- Client contract: [contracts.ts](src/main/libs/db/core/contracts.ts). `DatabaseClient` = methods every engine has; optional features are **capability** interfaces (`RoutinesCapability`, `SchedulersCapability`, ...) declared with `implements` on the engine class. Handlers call them through `requireCapability(client, 'routines')`, which throws `UnsupportedCapabilityError` if the engine lacks it. Never add "not implemented" stubs to `BaseClient`. [capabilities.spec.ts](tests/unit/clients/capabilities.spec.ts) checks that every feature enabled in customizations is implemented.
- Long-running export/import runs in `src/main/workers/*` (separate webpack build output `dist/exporter.js`, `dist/importer.js`).

## Commands

```bash
npm install                 # runs postinstall → electron-builder install-app-deps (native rebuild)
npm run debug               # rebuild native deps + install Vue devtools + debug-runner
npm run debug-runner        # dev server on :9080 + main/workers watch + electron with --inspect=9222 / --remote-debugging-port=9223
npm run compile             # production webpack builds into dist/
npm run build               # compile + electron-builder (output in build/)
npm run lint / lint:fix     # eslint + stylelint (also run by husky pre-commit)
npm run translation:check -- it-IT   # list missing keys vs en-US
npm test                    # unit tests (alias of test:unit)
npm run test:unit:watch     # unit tests in watch mode
npm run test:db:up          # start test DBs (docker compose, waits until healthy)
npm run test:integration    # integration tests (ANTARES_TEST_ENGINES=sqlite,pg to pick engines)
npm run test:db:down        # stop and remove test DBs
npm run test:e2e            # compile + playwright
npx tsc --noEmit -p .       # type check (.ts only; .vue files are checked only by the Vue VS Code extension)
```

VS Code debugging: start `npm run debug` (or `debug-runner`) in a terminal, then use the **Electron: All** compound in [.vscode/launch.json](.vscode/launch.json) (attaches to 9222 main + 9223 renderer).

## Environment gotchas

- **Node**: `.nvmrc` says 18.16, CI uses Node 20. Both work.
- **Native modules** must match Electron's ABI. `postinstall` / `rebuild:electron` / `build` run electron-builder's native rebuild with `build.buildDependenciesFromSource: false`, so `better-sqlite3` uses its **prebuilt Electron binary** (no C++ toolchain needed). Compilation from source only happens for modules without prebuilds; a C++ toolchain (on Windows: VS 2019/2022 Build Tools, "Desktop development with C++") is then required.
  - `cpu-features` is an optional ssh2 dependency (not a direct one) and is aliased to `false` in the main/workers webpack configs, so it is never loaded. If it is present in `node_modules` but can't be compiled, delete `node_modules/cpu-features`.
  - Upgrading Electron: check that the `better-sqlite3` version publishes prebuilds for it, and that `node-abi` knows the new Electron version (otherwise "Could not detect abi").
- **`ELECTRON_RUN_AS_NODE`**: terminals spawned by VS Code / Electron tools may have it set; Electron then starts as plain Node (`app` is undefined). `scripts/devRunner.js` deletes it before spawning Electron.
- **TypeScript in VS Code**: the editor's bundled TS (6.x) defaults to `strict: true` and deprecates `baseUrl`. The tsconfig therefore sets `"strict": false` explicitly and avoids `baseUrl`; do not re-add it. The codebase is **not** strict-null-safe — don't "fix" thousands of strictness errors unless that is the task.
- `validateSender` currently returns `true` on Windows (`TEMP HOTFIX`).
- **Tests run inside Electron** (`ELECTRON_RUN_AS_NODE`, see [scripts/vitest.js](scripts/vitest.js)) because native modules are built for Electron's ABI. Always use the npm scripts, not `npx vitest`.
- **Module interop**: webpack compiles to CommonJS, Vitest loads ESM. `import * as x` namespaces are read-only and not callable under Vitest: for CommonJS modules that are called or mutated use `import x = require('...')`.
- **SQL snapshots**: [`tests/unit/clients/__snapshots__`](tests/unit/clients/__snapshots__) pins the SQL generated by each client. A changed snapshot must be intentional: update with `npm run test:unit -- -u` and justify it in the PR.
- **CI**: [.github/workflows/test.yml](.github/workflows/test.yml) runs on PRs and on `develop`, and gates the beta/stable release workflows.
- `src/renderer/libs/ext-language_tools.js` is a patched copy of Ace's file (adds icons); don't replace it with the npm version.

## Conventions

- Indentation: **3 spaces**; single quotes; semicolons; `simple-import-sort` for imports. Run `npm run lint:fix`.
- IPC event names: kebab-case. Vue component files: PascalCase with prefixes `Base`/`The`/tightly coupled names.
- Commits: Conventional Commits enforced by commitlint (`feat|fix|docs|chore|style|refactor|build|ci|test|revert|perf`, subject not upper/Pascal/Start case). Common scopes (from `.vscode/settings.json`): `UI, core, MySQL, PostgreSQL, SQLite, Firebird SQL, Windows, Linux, MacOS, translation, deps, Flatpak`.
- Branches: work on `develop`; `master` is the release branch (stable build workflow only runs there). Releases via `standard-version` (`npm run release` / `release:beta`).
- New UI strings: add to `src/renderer/i18n/en-US.ts` first; other locales fall back to English.
