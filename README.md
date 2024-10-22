
<!-- markdownlint-disable -->
<p align="center">
    <img width="800" src="https://raw.githubusercontent.com/Fabio286/antares/master/docs/gh-logo.png">
</p>
<!-- markdownlint-restore -->

# Antares SQL Client

![GitHub package.json version](https://img.shields.io/github/package-json/v/fabio286/antares) ![GitHub](https://img.shields.io/github/license/fabio286/antares) ![Test e2e](https://github.com/antares-sql/antares/actions/workflows/test-e2e-win.yml/badge.svg?branch=develop) ![Mastodon Follow](https://img.shields.io/mastodon/follow/%20110860460902482117?domain=https%3A%2F%2Ffosstodon.org&style=social) [![Plant a Tree](https://raw.githubusercontent.com/Fabio286/treedom-badge/master/svg/plant-a-tree.svg)](https://www.treedom.net/en/user/fabio-di-stasio/event/antares-for-the-planet)

Antares is an SQL client based on [Electron.js](https://github.com/electron/electron) and [Vue.js](https://github.com/vuejs/vue) that aims to become a useful tool, especially for developers.  
Our target is to support as many databases as possible, and all major operating systems, including the ARM versions.  

**At the moment this application is in development state, many features will come in future updates**, and supports only MySQL/MariaDB, PostgreSQL, SQLite and Firebird SQL.  
However, there are all the features necessary to have a pleasant database management experience, so give it a chance and send us your feedback, we would really appreciate it.  
We are actively working on it, hoping to provide new cool features, improvements and fixes as soon as possible.  

🔗 If you are curious to try Antares you can download and install the [latest release](https://github.com/Fabio286/antares/releases/latest).  
👁 To stay tuned for new releases follow Antares SQL on [Mastodon](https://fosstodon.org/@AntaresSQL).  
🌟 Don't forget to **leave a star** if you appreciate this project.  

🗳️ Polls:

- **[Which is the main OS you use Antares on?](https://github.com/antares-sql/antares/discussions/379)**
- **[Which database do you use the most?](https://github.com/antares-sql/antares/discussions/594)**

## Current key features

- Multiple database connections at same time.
- Database management (add/edit/delete).
- Full tables management, including indexes and foreign keys.
- Views, triggers, stored routines, functions and schedulers management (add/edit/delete).
- A modern and friendly tab system; keep open every kind of tab you need in your workspace.
- Fake table data filler to generate tons of data for test purpose.
- Query suggestions and auto complete.
- Query history: search through the last 1000 queries.
- Save queries, notes or todo.
- SSH tunnel support.
- Manual commit mode.
- Import and export database dumps.
- Customizable keyboard shortcuts.
- Dark and light theme.
- Editor themes.

## Philosophy

Why are we developing an SQL client when there are a lot of them on the market?  
The main goal is to develop a **forever 100% free (without paid premium feature)**, full featured, as possible community driven, cross platform and open source alternative, empowered by JavaScript ecosystem.  
A modern application created with minimalism and simplicity in mind, with features in the right places, not hundreds of tiny buttons, nested tabs or submenues; productivity comes first.  

## Installation

Based on your operating system you can have one or more distribution formats to choose based on your preferences.  
Since Antares SQL is a free software we don't have a budget to spend on annual licenses or certificates. This can result that on some platforms you might need to put in some additional work to install this app.

### Linux

On Linux you can simply download and run the `.AppImage` distribution, install from FlatHub, Snap Store, AUR or from our [PPA repository](https://github.com/antares-sql/antares-ppa).

### Windows

On Windows you can choose between downloading the app from Microsoft Store or downloading the `.exe` from our [website](https://antares-sql.app/downloads) or [this github repo](https://github.com/Fabio286/antares/releases/latest). Distributions that are not from Microsoft Store are not signed with a certificate, so to install you need to click on "More info" and then "Run anyway" on SmartScreen prompt.

### MacOS

On macOS you can run `.dmg` distribution following [this guide](https://support.apple.com/guide/mac-help/mh40616/mac) to install apps from unknown developers.

## Download

[<img height='56' alt='Download on Flathub' src='https://dl.flathub.org/assets/badges/flathub-badge-en.svg'/>](https://flathub.org/apps/it.fabiodistasio.AntaresSQL) [![Get it from the Snap Store](https://snapcraft.io/static/images/badges/en/snap-store-black.svg)](https://snapcraft.io/antares) [![Get it from AUR](https://raw.githubusercontent.com/antares-sql/antares/master/docs/aur-badge.svg)](https://aur.archlinux.org/packages/antares-sql-bin) [<img src="https://developer.microsoft.com/store/badges/images/English_get-it-from-MS.png" style="height: 56px">](https://www.microsoft.com/p/antares-sql-client/9nhtb9sq51r1?cid=storebadge&ocid=badge&rtc=1&activetab=pivot:overviewtab)  
🚀 **[Other Downloads](https://github.com/antares-sql/antares/releases/latest)**

## Currently supported

### Databases

- [x] MySQL/MariaDB
- [x] PostgreSQL
- [x] SQLite
- [x] Firebird SQL
- [ ] DuckDB
- [ ] SQL Server
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
- 🚧 [Project Board](https://github.com/orgs/antares-sql/projects/3/views/2)

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://fabiodistasio.it/"><img src="https://avatars.githubusercontent.com/u/31471771?v=4?s=100" width="100px;" alt="Fabio Di Stasio"/><br /><sub><b>Fabio Di Stasio</b></sub></a><br /><a href="https://github.com/antares-sql/antares/commits?author=Fabio286" title="Code">💻</a> <a href="#translation-Fabio286" title="Translation">🌍</a> <a href="https://github.com/antares-sql/antares/commits?author=Fabio286" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/giulioganci/"><img src="https://avatars.githubusercontent.com/u/4192159?v=4?s=100" width="100px;" alt="Giulio Ganci"/><br /><sub><b>Giulio Ganci</b></sub></a><br /><a href="https://github.com/antares-sql/antares/commits?author=toriphes" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://christianratz.de/"><img src="https://avatars.githubusercontent.com/u/2630316?v=4?s=100" width="100px;" alt="Christian Ratz"/><br /><sub><b>Christian Ratz</b></sub></a><br /><a href="https://github.com/antares-sql/antares/commits?author=digitalgopnik" title="Code">💻</a> <a href="#translation-digitalgopnik" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://reverb6821.github.io/"><img src="https://avatars.githubusercontent.com/u/55198803?v=4?s=100" width="100px;" alt="Giuseppe Gigliotti"/><br /><sub><b>Giuseppe Gigliotti</b></sub></a><br /><a href="#translation-reverb6821" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Mohd-PH"><img src="https://avatars.githubusercontent.com/u/9362157?v=4?s=100" width="100px;" alt="Mohd-PH"/><br /><sub><b>Mohd-PH</b></sub></a><br /><a href="#translation-Mohd-PH" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hongkfui"><img src="https://avatars.githubusercontent.com/u/37477191?v=4?s=100" width="100px;" alt="hongkfui"/><br /><sub><b>hongkfui</b></sub></a><br /><a href="#translation-hongkfui" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/MrAnyx"><img src="https://avatars.githubusercontent.com/u/44176707?v=4?s=100" width="100px;" alt="Robin"/><br /><sub><b>Robin</b></sub></a><br /><a href="#translation-MrAnyx" title="Translation">🌍</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/daeleduardo"><img src="https://avatars.githubusercontent.com/u/8599078?v=4?s=100" width="100px;" alt="Daniel Eduardo"/><br /><sub><b>Daniel Eduardo</b></sub></a><br /><a href="#translation-daeleduardo" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://ngoquocdat.com/"><img src="https://avatars.githubusercontent.com/u/56961917?v=4?s=100" width="100px;" alt="Ngô Quốc Đạt"/><br /><sub><b>Ngô Quốc Đạt</b></sub></a><br /><a href="#translation-datlechin" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/IsamuSugi"><img src="https://avatars.githubusercontent.com/u/7746658?v=4?s=100" width="100px;" alt="Isamu Sugiura"/><br /><sub><b>Isamu Sugiura</b></sub></a><br /><a href="#translation-IsamuSugi" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://rsacchetto.nexxontech.it/"><img src="https://avatars.githubusercontent.com/u/18429412?v=4?s=100" width="100px;" alt="Riccardo Sacchetto"/><br /><sub><b>Riccardo Sacchetto</b></sub></a><br /><a href="#platform-Occhioverde" title="Packaging/porting to new platform">📦</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://kilianstallinger.com"><img src="https://avatars.githubusercontent.com/u/5290318?v=4?s=100" width="100px;" alt="Kilian Stallinger"/><br /><sub><b>Kilian Stallinger</b></sub></a><br /><a href="https://github.com/antares-sql/antares/commits?author=kilianstallz" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/wenj91"><img src="https://avatars.githubusercontent.com/u/12549338?v=4?s=100" width="100px;" alt="文杰"/><br /><sub><b>文杰</b></sub></a><br /><a href="https://github.com/antares-sql/antares/commits?author=wenj91" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/goYou"><img src="https://avatars.githubusercontent.com/u/62732795?v=4?s=100" width="100px;" alt="goYou"/><br /><sub><b>goYou</b></sub></a><br /><a href="#translation-goYou" title="Translation">🌍</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/raliqala"><img src="https://avatars.githubusercontent.com/u/30502407?v=4?s=100" width="100px;" alt="Topollo"/><br /><sub><b>Topollo</b></sub></a><br /><a href="https://github.com/antares-sql/antares/commits?author=raliqala" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/SmileYzn"><img src="https://avatars.githubusercontent.com/u/5851851?v=4?s=100" width="100px;" alt="Cleverson"/><br /><sub><b>Cleverson</b></sub></a><br /><a href="#translation-SmileYzn" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/fredatgithub"><img src="https://avatars.githubusercontent.com/u/6720055?v=4?s=100" width="100px;" alt="fred"/><br /><sub><b>fred</b></sub></a><br /><a href="#translation-fredatgithub" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/xak666"><img src="https://avatars.githubusercontent.com/u/38811437?v=4?s=100" width="100px;" alt="xaka_xak"/><br /><sub><b>xaka_xak</b></sub></a><br /><a href="#translation-xak666" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://codepen.io/theo-billardey"><img src="https://avatars.githubusercontent.com/u/48206778?v=4?s=100" width="100px;" alt="Théo Billardey"/><br /><sub><b>Théo Billardey</b></sub></a><br /><a href="#translation-brdtheo" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://yaskur.net"><img src="https://avatars.githubusercontent.com/u/9539970?v=4?s=100" width="100px;" alt="Muhammad Dyas Yaskur"/><br /><sub><b>Muhammad Dyas Yaskur</b></sub></a><br /><a href="#translation-dyaskur" title="Translation">🌍</a> <a href="https://github.com/antares-sql/antares/commits?author=dyaskur" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jimcat8"><img src="https://avatars.githubusercontent.com/u/86754294?v=4?s=100" width="100px;" alt="tianci li"/><br /><sub><b>tianci li</b></sub></a><br /><a href="#translation-jimcat8" title="Translation">🌍</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/555cider"><img src="https://avatars.githubusercontent.com/u/73565447?v=4?s=100" width="100px;" alt="555cider"/><br /><sub><b>555cider</b></sub></a><br /><a href="#translation-555cider" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/m1khal3v"><img src="https://avatars.githubusercontent.com/u/41085561?v=4?s=100" width="100px;" alt="Anton Mikhalev"/><br /><sub><b>Anton Mikhalev</b></sub></a><br /><a href="#translation-m1khal3v" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://64k.nl/"><img src="https://avatars.githubusercontent.com/u/3864423?v=4?s=100" width="100px;" alt="René"/><br /><sub><b>René</b></sub></a><br /><a href="https://github.com/antares-sql/antares/commits?author=64knl" title="Code">💻</a> <a href="#translation-64knl" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/zxp19821005"><img src="https://avatars.githubusercontent.com/u/4915850?v=4?s=100" width="100px;" alt="Woodenman"/><br /><sub><b>Woodenman</b></sub></a><br /><a href="#platform-zxp19821005" title="Packaging/porting to new platform">📦</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/markusand"><img src="https://avatars.githubusercontent.com/u/12972543?v=4?s=100" width="100px;" alt="Marc Vilella"/><br /><sub><b>Marc Vilella</b></sub></a><br /><a href="#translation-markusand" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Lawondyss"><img src="https://avatars.githubusercontent.com/u/272130?v=4?s=100" width="100px;" alt="Ladislav Vondráček"/><br /><sub><b>Ladislav Vondráček</b></sub></a><br /><a href="#translation-Lawondyss" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/zvlad"><img src="https://avatars.githubusercontent.com/u/9055134?v=4?s=100" width="100px;" alt="Vladyslav"/><br /><sub><b>Vladyslav</b></sub></a><br /><a href="#translation-zvlad" title="Translation">🌍</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/bagusindrayana"><img src="https://avatars.githubusercontent.com/u/36830534?v=4?s=100" width="100px;" alt="Bagus Indrayana"/><br /><sub><b>Bagus Indrayana</b></sub></a><br /><a href="https://github.com/antares-sql/antares/commits?author=bagusindrayana" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/penguinlab"><img src="https://avatars.githubusercontent.com/u/10959317?v=4?s=100" width="100px;" alt="Naoki Ishikawa"/><br /><sub><b>Naoki Ishikawa</b></sub></a><br /><a href="#translation-penguinlab" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://fazevedo.dev"><img src="https://avatars.githubusercontent.com/u/1640325?v=4?s=100" width="100px;" alt="Filipe Azevedo"/><br /><sub><b>Filipe Azevedo</b></sub></a><br /><a href="https://github.com/antares-sql/antares/commits?author=mangas" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/zwei-c"><img src="https://avatars.githubusercontent.com/u/55912811?v=4?s=100" width="100px;" alt="CHANG, CHIH WEI"/><br /><sub><b>CHANG, CHIH WEI</b></sub></a><br /><a href="#translation-zwei-c" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/mirrorb"><img src="https://avatars.githubusercontent.com/u/34116207?v=4?s=100" width="100px;" alt="GaoChun"/><br /><sub><b>GaoChun</b></sub></a><br /><a href="https://github.com/antares-sql/antares/commits?author=mirrorb" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/LeviEyal"><img src="https://avatars.githubusercontent.com/u/48846533?v=4?s=100" width="100px;" alt="Eyal Levi"/><br /><sub><b>Eyal Levi</b></sub></a><br /><a href="#translation-LeviEyal" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://telegram.dog/SawGoD"><img src="https://avatars.githubusercontent.com/u/67802757?v=4?s=100" width="100px;" alt="Nikita Karelikov"/><br /><sub><b>Nikita Karelikov</b></sub></a><br /><a href="#translation-SawGoD" title="Translation">🌍</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
