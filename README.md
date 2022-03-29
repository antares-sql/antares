
<!-- markdownlint-disable -->
<p align="center">
    <img width="800" src="https://raw.githubusercontent.com/Fabio286/antares/master/docs/gh-logo.png">
</p>
<!-- markdownlint-restore -->

# Antares SQL Client

![GitHub package.json version](https://img.shields.io/github/package-json/v/fabio286/antares) ![GitHub](https://img.shields.io/github/license/fabio286/antares) [![Build Status](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Ffabio286%2Fantares%2Fbadge&style=flat)](https://actions-badge.atrox.dev/fabio286/antares/goto) [![antares](https://snapcraft.io/antares/badge.svg)](https://snapcraft.io/antares) [![antares](https://snapcraft.io/antares/trending.svg?name=0)](https://snapcraft.io/antares) [![Twitter Follow](https://img.shields.io/twitter/follow/AntaresSQL?style=social)](https://twitter.com/AntaresSQL) [![Plant a Tree](https://raw.githubusercontent.com/Fabio286/treedom-badge/master/svg/plant-a-tree.svg)](https://www.treedom.net/en/user/fabio-di-stasio/event/antares-for-the-planet)

Antares is an SQL client based on [Electron.js](https://github.com/electron/electron) and [Vue.js](https://github.com/vuejs/vue) that aims to become a useful tool, especially for developers.  
Our target is to support as many databases as possible, and all major operating systems, including the ARM versions.  

**At the moment this application is in development state, many features will come in future updates**, and supports only MySQL/MariaDB, PostgreSQL and SQLite.  
At the moment, however, there are all the features necessary to have a pleasant database management experience, so give it a chance and send us your feedback, we would really appreciate it.  
We are actively working on it, hoping to provide new cool features, improvements and fixes as soon as possible.  

🔗 If you are curious to try Antares you can download and install the [latest release](https://github.com/Fabio286/antares/releases/latest).  
👁 To stay tuned for new releases [follow Antares SQL](https://twitter.com/AntaresSQL) on Twitter.  
🌟 Don't forget to **leave a star** if you appreciate this project.

## Current key features

- Multiple database connections at same time.
- Database management (add/edit/delete).
- Full tables management, including indexes and foreign keys.
- Views, triggers, stored routines, functions and schedulers management (add/edit/delete).
- A modern and friendly tab system; keep open every kind of tab you need in your workspace.
- Fake table data filler to generate tons of data for test purpose.
- Query suggestions and auto complete.
- Query history: search through the last 1000 queries.
- SSH tunnel support.
- Manual commit mode.
- Import and export database dumps.
- Dark and light theme.
- Editor themes.

## Philosophy

Why are we developing an SQL client when there are a lot of them on the market?  
The main goal is to develop a totally free, full featured, cross platform and open source alternative, empowered by JavaScript's ecosystem.  
A modern application created with minimalism and semplicity in mind, with features in the right places, not hundreds of tiny buttons, nested tabs or submenu; productivity comes first.  

## Installation

Based on your operating system you can have one or more distribution formats to choose based on your preferences.  
Since Antares SQL is a free software we haven't a budget to spend in annual licenses or certificates. This can result that on some platforms you need some additional passages to install this app.

### Linux

On Linux you can simply download and run `.AppImage` distributions, install from Snap Store or from AUR.

### Windows

On Windows you can choose between Microsoft Store and download `.exe` distribution. The latter lacks of a certificate, so to install you need to click on "More info" and then "Run anyway" on SmartScreen prompt.

### MacOS

On macOS you can run `.dmg` distribution following [this guide](https://support.apple.com/guide/mac-help/mh40616/mac) to install apps from unknown developers.

## Download

[![Get it from the Snap Store](https://snapcraft.io/static/images/badges/en/snap-store-black.svg)](https://snapcraft.io/antares) [![Get it from AUR](https://raw.githubusercontent.com/Fabio286/antares/3e00c4bae6e036300c752c1a40c5a038fea9c169/docs/aur-badge.svg)](https://aur.archlinux.org/packages/antares-sql/) [![Get it from Microsoft Store](https://raw.githubusercontent.com/Fabio286/antares/gh-pages/src/assets/ms-store.png)](https://www.microsoft.com/p/antares-sql-client/9nhtb9sq51r1?cid=storebadge&ocid=badge&rtc=1&activetab=pivot:overviewtab)  
🚀 **[Other Downloads](https://github.com/Fabio286/antares/releases/latest)**

## Coming soon

This is a roadmap with major features will come in near future.

- Database tools.
- Users management (add/edit/delete).
- More context menu shortcuts.
- More keyboard shortcuts.
- Support for other databases.
- Apple Silicon distribution

## Currently supported

### Databases

- [x] MySQL/MariaDB
- [x] PostgreSQL
- [x] SQLite
- [ ] MSSQL
- [ ] OracleDB
- [ ] More...

### Operating Systems

#### • x64

- [x] Windows
- [x] Linux
- [x] MacOS

#### • ARM

- [ ] Windows
- [x] Linux
- [ ] MacOS

## How to contribute

- 🌍 [Translate Antares](https://github.com/Fabio286/antares/wiki/Translate-Antares)
- 📖 [Contributors Guide](https://github.com/Fabio286/antares/wiki/Contributors-Guide)
- 🚧 [Project Board](https://github.com/antares-sql/antares/projects/1)

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://fabiodistasio.it/"><img src="https://avatars.githubusercontent.com/u/31471771?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Fabio Di Stasio</b></sub></a><br /><a href="https://github.com/Fabio286/antares/commits?author=Fabio286" title="Code">💻</a> <a href="#translation-Fabio286" title="Translation">🌍</a> <a href="https://github.com/Fabio286/antares/commits?author=Fabio286" title="Documentation">📖</a></td>
    <td align="center"><a href="https://www.linkedin.com/in/giulioganci/"><img src="https://avatars.githubusercontent.com/u/4192159?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Giulio Ganci</b></sub></a><br /><a href="https://github.com/Fabio286/antares/commits?author=toriphes" title="Code">💻</a></td>
    <td align="center"><a href="https://christianratz.de/"><img src="https://avatars.githubusercontent.com/u/2630316?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Christian Ratz</b></sub></a><br /><a href="https://github.com/Fabio286/antares/commits?author=digitalgopnik" title="Code">💻</a> <a href="#translation-digitalgopnik" title="Translation">🌍</a></td>
    <td align="center"><a href="https://reverb6821.github.io/"><img src="https://avatars.githubusercontent.com/u/55198803?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Giuseppe Gigliotti</b></sub></a><br /><a href="#translation-reverb6821" title="Translation">🌍</a></td>
    <td align="center"><a href="https://github.com/Mohd-PH"><img src="https://avatars.githubusercontent.com/u/9362157?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Mohd-PH</b></sub></a><br /><a href="#translation-Mohd-PH" title="Translation">🌍</a></td>
    <td align="center"><a href="https://github.com/hongkfui"><img src="https://avatars.githubusercontent.com/u/37477191?v=4?s=100" width="100px;" alt=""/><br /><sub><b>hongkfui</b></sub></a><br /><a href="#translation-hongkfui" title="Translation">🌍</a></td>
    <td align="center"><a href="https://github.com/MrAnyx"><img src="https://avatars.githubusercontent.com/u/44176707?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Robin</b></sub></a><br /><a href="#translation-MrAnyx" title="Translation">🌍</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/daeleduardo"><img src="https://avatars.githubusercontent.com/u/8599078?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Daniel Eduardo</b></sub></a><br /><a href="#translation-daeleduardo" title="Translation">🌍</a></td>
    <td align="center"><a href="https://ngoquocdat.com/"><img src="https://avatars.githubusercontent.com/u/56961917?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ngô Quốc Đạt</b></sub></a><br /><a href="#translation-datlechin" title="Translation">🌍</a></td>
    <td align="center"><a href="https://github.com/IsamuSugi"><img src="https://avatars.githubusercontent.com/u/7746658?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Isamu Sugiura</b></sub></a><br /><a href="#translation-IsamuSugi" title="Translation">🌍</a></td>
    <td align="center"><a href="http://rsacchetto.nexxontech.it/"><img src="https://avatars.githubusercontent.com/u/18429412?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Riccardo Sacchetto</b></sub></a><br /><a href="#platform-Occhioverde" title="Packaging/porting to new platform">📦</a></td>
    <td align="center"><a href="https://kilianstallinger.com"><img src="https://avatars.githubusercontent.com/u/5290318?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Kilian Stallinger</b></sub></a><br /><a href="https://github.com/Fabio286/antares/commits?author=kilianstallz" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/wenj91"><img src="https://avatars.githubusercontent.com/u/12549338?v=4?s=100" width="100px;" alt=""/><br /><sub><b>文杰</b></sub></a><br /><a href="https://github.com/Fabio286/antares/commits?author=wenj91" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/goYou"><img src="https://avatars.githubusercontent.com/u/62732795?v=4?s=100" width="100px;" alt=""/><br /><sub><b>goYou</b></sub></a><br /><a href="#translation-goYou" title="Translation">🌍</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/raliqala"><img src="https://avatars.githubusercontent.com/u/30502407?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Topollo</b></sub></a><br /><a href="https://github.com/Fabio286/antares/commits?author=raliqala" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/SmileYzn"><img src="https://avatars.githubusercontent.com/u/5851851?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Cleverson</b></sub></a><br /><a href="#translation-SmileYzn" title="Translation">🌍</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
