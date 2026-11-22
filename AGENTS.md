# AGENTS.md

Guide for AI agents (and humans) working on **Antares SQL**, a cross-platform SQL client built with Electron + Vue 3 + TypeScript.
Supported engines: MySQL/MariaDB, PostgreSQL, SQLite, Firebird SQL.

See also [CONTRIBUTING.md](CONTRIBUTING.md) for the original contributor guide and [DESIGN.md](DESIGN.md) for UI guidelines.

## Stack

| Area | Tech |
|---|---|
| Shell | Electron 45 (`@electron/remote` enabled, `nodeIntegration: true`, `contextIsolation: false`) |
| UI | Vue 3.5 (mostly `<script setup lang="ts">`), Pinia, vue-i18n, Spectre.css (vendored in `src/renderer/scss/spectre/`, no npm dependency) + SCSS, CodeMirror 6 editor |
| Bundling | webpack 5 (three configs: main, renderer, workers), `ts-loader`, `babel-loader`, `vue-loader` |
| Language | TypeScript **5.8** (project-local, non-strict) |
| Persistence | `electron-store` (settings, connections; credentials encrypted via `safeStorage`) |
| DB drivers | `mysql2`, `pg` + `pg-query-stream`, `better-sqlite3` (N-API, prebuilds bundled), `node-firebird`, SSH tunnels via `@fabio286/ssh2-promise` |
| Packaging | electron-builder (config in `package.json` → `build`) |
| Tests | Vitest unit + integration ([tests/unit/](tests/unit/), [tests/integration/](tests/integration/)), Playwright e2e ([tests/app.spec.ts](tests/app.spec.ts), minimal) |

## Layout

```
src/
  main/                 Electron main process
    main.ts             Window creation, single-instance lock, app lifecycle
    ipc-handlers/       One file per domain (tables, schema, views, routines, ...). Each module gets `ipc` injected
                        (default ipcMain); handle.ts: `handle(channel, fn)` = sender check + success/error envelope
    libs/
      ClientsFactory.ts Deprecated wrapper of db/EngineRegistry.createClient()
      clients/          BaseClient + one class per engine (all DB introspection/DDL; being split up into db/)
      db/               Target architecture of the clients refactor
        EngineRegistry.ts  One entry per engine (engines/<engine>/index.ts): client factory + optional exporter/importer
        core/           QueryBuilder (one instance per query, no shared state), QueryDialect (pure SQL rendering),
                        DdlGenerator (base of DDL builders), contracts.ts (client interfaces), formatValue.ts,
                        SshTunnel (one tunnel per client, shared by pool/tabs/workers), ConnectionLease
        engines/<engine>/  Per-engine pieces:
                        <Engine>Dialect: identifier quoting, literals, JSON comparison
                        <Engine>Ddl: pure CREATE/ALTER/DROP builders returning SQL (clients only execute it;
                        multi-step operations like alterTrigger stay in the client)
                        <Engine>Connections: pool/single connection, query tab transactions, running query ids,
                        keepalive; raw() borrows a connection with acquire() and frees it with lease.release()
                        <Engine>Parsers: pure parsers of server metadata (SHOW CREATE ..., pg_get_functiondef, ...)
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
  integration/          Vitest against real DBs from docker/ (pin known, unfixed bugs with `it.fails`)
  fixtures/introspection/  Rows recorded from the docker DBs + expected outputs: unit tests replay them offline
                        (clients/introspection.spec.ts). Re-record: `npm run test:fixtures:record`
  helpers/              rawRecorder (record/replay raw()), offlineClient
docker/                 docker-compose.yml with test DBs (MySQL, MariaDB, PostgreSQL, Firebird) and an SSH server
                        (tunnel tests) on non-standard ports
```

### Path aliases

- `common/*` → `src/common/*` (main, renderer, workers)
- `@/*` → `src/renderer/*` (renderer)
- `src/*` → `src/*` (used in a few places, e.g. `common/interfaces/antares.ts`)

Aliases are defined both in [tsconfig.json](tsconfig.json) `paths` and in each `webpack.*.config.js` `resolve.alias` — keep them in sync.

## How a feature flows

1. **Component** calls a static method from `src/renderer/ipc-api/*.ts` (e.g. `Tables.getTableColumns(params)`).
2. The ipc-api method calls `ipcRenderer.invoke('<kebab-case-event>', unproxify(params))` (`unproxify` strips Vue proxies).
3. **Handler** in `src/main/ipc-handlers/*.ts`: `handle(channel, params => connections[params.uid].<method>(params))` (sender validation and the `{ status, response }` envelope are done by `handle`).
4. **Client** (`src/main/libs/clients/<Engine>Client.ts`) implements the method; returns `{ status: 'success' | 'error', response }` via the handler.

Rules:
- Everything above the client class must be **client-agnostic**. Engine differences live in the client classes and in `common/customizations/<engine>.ts` (UI checks `workspace.customizations.<flag>` to enable/disable features).
- **Renderer**: never branch on `client === '...'`. Add a flag or value to `Customizations` (e.g. `sqlDialect`, `formatterLanguage`, `connectionString`, `procedureCall`/`functionCall` templates, `elementsWrapper`) and read it from `workspace.customizations`. Routine/function calls: `common/libs/routineCalls.ts`; literals: `escapeAndQuote()` in `common/libs/sqlUtils.ts`. MariaDB has its own customizations (`mariaCustomizations`, inherits MySQL).
- Adding a new capability usually touches: `BaseClient`/engine clients → ipc handler → ipc-api → store/component → customizations flag → i18n strings.
- Adding a new engine: client class (+ Dialect, Ddl, Connections, Parsers under `src/main/libs/db/engines/<engine>/`) → `engines/<engine>/index.ts` definition → register it in `EngineRegistry.ts` → `common/customizations/<engine>.ts` + data types → record introspection fixtures.
- SQL values in main must go through the engine dialect (`client.dialect.quoteString()`, `blobLiteral()`, ... or `formatValue()` for UI values): never build literals with `sqlEscaper` or engine `switch`es in handlers.
- Client contract: [contracts.ts](src/main/libs/db/core/contracts.ts). `DatabaseClient` = methods every engine has; optional features are **capability** interfaces (`RoutinesCapability`, `SchedulersCapability`, ...) declared with `implements` on the engine class. Handlers call them through `requireCapability(client, 'routines')`, which throws `UnsupportedCapabilityError` if the engine lacks it. Never add "not implemented" stubs to `BaseClient`. [capabilities.spec.ts](tests/unit/clients/capabilities.spec.ts) checks that every feature enabled in customizations is implemented.
- Long-running export/import runs in `src/main/workers/*` (separate webpack build output `dist/exporter.js`, `dist/importer.js`).

## Commands

```bash
npm install                 # no native rebuild needed (see Environment gotchas)
npm run debug               # clean dist + install Vue devtools + debug-runner
npm run debug-runner        # dev server on :9080 + main/workers watch + electron with --inspect=9222 / --remote-debugging-port=9223
npm run compile             # production webpack builds into dist/
npm run build               # compile + electron-builder (output in build/)
npm run build:linux:docker  # Linux build (deb + AppImage) in a container from any OS; extra args go to electron-builder
npm run lint / lint:fix     # eslint + stylelint (also run by husky pre-commit)
npm run translation:check -- it-IT   # list missing keys vs en-US
npm test                    # unit tests (alias of test:unit)
npm run test:unit:watch     # unit tests in watch mode
npm run test:db:up          # start test DBs (docker compose, waits until healthy)
npm run test:integration    # integration tests (ANTARES_TEST_ENGINES=sqlite,pg to pick engines)
npm run test:db:samples     # load sample DBs (sakila, pagila, chinook, ...) into the running test DBs and SQLite
                            # samples into docker/samples/sqlite; re-run to reset them (args: mysql maria pg sqlite)
npm run test:db:down        # stop and remove test DBs
npm run test:fixtures:record # re-record introspection fixtures (needs test DBs) after changing an introspection query
npm run test:e2e            # compile + playwright
node scripts/appDriver.js start --build   # launch the compiled app (isolated profile) and drive it like a user:
                            # seed, open "Docker PostgreSQL", click, type, press F5, ss... (see .claude/skills/run-app)
npx tsc --noEmit -p .       # type check (.ts only; .vue files are checked only by the Vue VS Code extension)
```

VS Code debugging: start `npm run debug` (or `debug-runner`) in a terminal, then use the **Electron: All** compound in [.vscode/launch.json](.vscode/launch.json) (attaches to 9222 main + 9223 renderer).

## Environment gotchas

- **Node**: 22.12+ is required (Electron 45, better-sqlite3 13 and VueUse 15 declare it); `.nvmrc` and CI use Node 22.
- **Native modules**: `better-sqlite3` (13+) is an N-API addon that ships prebuilds for win/mac/linux x64+arm64 inside the npm package, so it works on any Electron version without rebuilding. There is therefore no `postinstall` native rebuild and `build.npmRebuild` is `false`: `electron-builder install-app-deps` would try to compile it with node-gyp (C++ toolchain required) because the package no longer uses prebuild-install. Linux `armv7l` is not a build target: Electron 45 no longer publishes 32-bit ARM Linux binaries.
  - `cpu-features` is an optional ssh2 dependency (not a direct one) and is aliased to `false` in the main/workers webpack configs, so it is never loaded. If it is present in `node_modules` but can't be compiled, delete `node_modules/cpu-features`.
  - ESM-only dependencies (electron-store 12, conf, pinia 4, VueUse 15) stay `externals` in main and are loaded with `require()` (Electron 45 runs Node 24, where `require(esm)` works). TypeScript resolves types with `moduleResolution: node10`, which ignores `exports`: if a package exposes its types only there, map it in `tsconfig.json` `paths` (as done for `conf`).
- **`ELECTRON_RUN_AS_NODE`**: terminals spawned by VS Code / Electron tools may have it set; Electron then starts as plain Node (`app` is undefined). `scripts/devRunner.js` deletes it before spawning Electron.
- **TypeScript in VS Code**: the editor's bundled TS (6.x) defaults to `strict: true` and deprecates `baseUrl`. The tsconfig therefore sets `"strict": false` explicitly and avoids `baseUrl`; do not re-add it. The codebase is **not** strict-null-safe — don't "fix" thousands of strictness errors unless that is the task.
- `validateSender` currently returns `true` on Windows (`TEMP HOTFIX`).
- **Stored connections** are encrypted with a key cached in the renderer's `localStorage`; if the key is lost (e.g. running more than one app instance in dev) the connections are reset. In development, *Settings → Data → Apply debug connections* re-creates the connections to the docker test DBs (params in [testConnections.ts](src/common/libs/testConnections.ts), shared with the integration tests). `npm run test:db:samples` fills them with the sample databases of [antares-sql/test-databases](https://github.com/antares-sql/test-databases) (downloaded once into the gitignored `docker/samples/`) and adds SQLite sample files there, which become `SQLite <name>` debug connections. Firebird has no samples yet.
- **Tests run inside Electron** (`ELECTRON_RUN_AS_NODE`, see [scripts/vitest.js](scripts/vitest.js)) so they use the same Node runtime as the app. Always use the npm scripts, not `npx vitest`.
- **Module interop**: webpack compiles to CommonJS, Vitest loads ESM. `import * as x` namespaces are read-only and not callable under Vitest: for CommonJS modules that are called, instantiated or mutated (moment, better-sqlite3, pg-query-stream, ...) use `import x = require('...')`; for classes use named imports (`import { EventEmitter } from 'events'`).
- **SQL snapshots**: [`tests/unit/clients/__snapshots__`](tests/unit/clients/__snapshots__) pins the SQL generated by each client. A changed snapshot must be intentional: update with `npm run test:unit -- -u` and justify it in the PR.
- **Themes**: a theme is a validated JSON file (`common/themes/theme.ts`: metadata, `appearance` dark/light, UI color tokens, shape tokens, editor colors + syntax, folder color palette `accent`). Built-in `dark`/`light` token values live in `src/renderer/scss/themes/*.scss`; installed themes (imported from file) are stored in `themes.json` (electron-store) and applied by `stores/themes.ts` as CSS variables on `#wrapper`, over the built-in theme of the same appearance. The setting `application_theme` holds the active theme id. Gallery repo: antares-sql/themes.
- **CI**: [.github/workflows/test.yml](.github/workflows/test.yml) runs on PRs and on `develop`, and gates the beta/stable release workflows.
- **Code editors** (CodeMirror 6): `QueryEditor.vue` (SQL, schema-aware autocompletion) and `BaseTextEditor.vue` (other languages) share `src/renderer/libs/editor/` (setup, themes, keymap, search widget, `sql/` dialects and completion). Don't wrap an `EditorView` in a Vue `ref` (the proxy breaks it). Editor colors are plain data (`EditorThemeDefinition`, in `common/themes/editorTheme.ts`) and belong to the app theme: there is no separate editor theme setting (see Themes below). Editor key bindings go through `yieldingToAppShortcuts()`: Electron runs a menu accelerator only if the page didn't handle the key.

## Conventions

- Indentation: **3 spaces**; single quotes; semicolons; `simple-import-sort` for imports. Run `npm run lint:fix`.
- IPC event names: kebab-case. Vue component files: PascalCase with prefixes `Base`/`The`/tightly coupled names.
- Commits: Conventional Commits enforced by commitlint (`feat|fix|docs|chore|style|refactor|build|ci|test|revert|perf`, subject not upper/Pascal/Start case). Common scopes (from `.vscode/settings.json`): `UI, core, MySQL, PostgreSQL, SQLite, Firebird SQL, Windows, Linux, MacOS, translation, deps, Flatpak`.
- Branches: work on `develop`; `master` is the release branch (stable build workflow only runs there). Releases via `standard-version` (`npm run release` / `release:beta`).
- New UI strings: add to `src/renderer/i18n/en-US.ts` first; other locales fall back to English.
