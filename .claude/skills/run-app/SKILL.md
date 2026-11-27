---
name: run-app
description: Launch the Antares Electron app and drive it like a user (connect to the docker test databases, open tabs, type and run queries, click, take screenshots). Use when asked to run/start the app, take a screenshot, or verify a change in the real app rather than with tests.
---

Antares is driven through [scripts/appDriver.js](../../../scripts/appDriver.js), a stateless CLI.
`start` launches the **compiled** app (`dist/`) detached, with an isolated profile and a CDP port.
Every other command connects over CDP, does one action and exits, so the app stays open between commands.
Commands run from the repo root; works on Windows, macOS and Linux (headless Linux: prefix `start` with `xvfb-run -a`).

## Flow

```bash
npm run test:db:up                                   # docker test DBs (skip if already up)
node scripts/appDriver.js start --build --fresh      # compile + launch on a clean profile
node scripts/appDriver.js press Escape               # fresh profile opens the changelog modal
node scripts/appDriver.js seed                       # add the docker test connections
node scripts/appDriver.js open "Docker PostgreSQL"   # select + Connect, prints connected/failed
node scripts/appDriver.js click-text "Open a new tab"
node scripts/appDriver.js type "SELECT 1 AS one"     # the new query editor is already focused
node scripts/appDriver.js press Escape               # close the autocomplete popup
node scripts/appDriver.js press F5                   # run (app shortcut, see Gotchas)
node scripts/appDriver.js text .workspace-query-results
node scripts/appDriver.js ss after-query             # then Read the printed PNG path
node scripts/appDriver.js stop
```

**Look at the screenshots.** They land in `<tmp>/antares-driver/shots/` (the command prints the path).

## Commands

| command | what it does |
|---|---|
| `start [--build] [--fresh]` | launch; `--build` runs `npm run compile` first (needed after source changes: the driver runs `dist/`, no hot reload), `--fresh` wipes the profile |
| `stop` / `status` | close the app / is it running |
| `seed` | add or replace the docker test connections (MySQL, MariaDB, PostgreSQL direct + SSH, Firebird) |
| `connections` | list connections: uid, status, name |
| `open <name or uid>` | select a connection and press Connect, waits for connected/failed |
| `click <selector>` | click first **visible** match (CSS or Playwright selector) |
| `click-text <text>` | click first visible element containing text |
| `fill <selector> <value>` | fill an input |
| `type <text>` / `press <key>` | keyboard into the focused element (`Control+Enter`, `Escape`, `F5`...) |
| `wait <selector> [ms]` | wait until visible |
| `text [selector]` | innerText of first visible match (page body if omitted) |
| `eval <js>` | evaluate in the renderer, prints JSON (`require` and `@electron/remote` available) |
| `ss [name]` | screenshot |
| `focus` | the focused element: accessibility role, name, states, tag and `ring=yes/no` (focus outline drawn) |
| `walk [n] [--shift]` | press Tab (Shift+Tab) n times, printing `focus` after each press: keyboard order check |
| `ax-audit` | visible interactive elements without an accessible name, plus landmarks and widgets |
| `log [lines]` | tail of the app stdout/stderr |

## Gotchas

- **Isolated profile** (`<tmp>/antares-driver/profile`, override with `ANTARES_DRIVER_DIR`): the user's real connections are never touched, and it doesn't clash with the user's open Antares windows (the single-instance lock is per profile). It persists between `start`s; `--fresh` resets it.
- **Hidden duplicates**: every open connection keeps its workspace in the DOM with `v-show`, so plain selectors match hidden copies. The driver always targets the first visible match.
- **App shortcuts are native menu accelerators** (`src/main/libs/ShortcutRegister.ts`), which synthetic key events never reach. `press` finds the application menu item with that accelerator and clicks it (like the OS would); other keys go to the page.
- The driver runs the **production** build, so dev-only UI (e.g. Settings → Data → Apply debug connections) is hidden there: use `seed`, which calls the same store action.
- `seed`/`open`/`connections` reach the Pinia stores through `#app.__vue_app__`; everything else is plain UI interaction.
- CDP port defaults to 9339 (`ANTARES_DRIVER_PORT`).
