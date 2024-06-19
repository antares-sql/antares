# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.7.25](https://github.com/antares-sql/antares/compare/v0.7.25-beta.2...v0.7.25) (2024-06-19)

### [0.7.25-beta.2](https://github.com/antares-sql/antares/compare/v0.7.25-beta.1...v0.7.25-beta.2) (2024-06-16)


### Features

* **PostgreSQL:** support to materialized views, closes [#804](https://github.com/antares-sql/antares/issues/804) ([0b9898f](https://github.com/antares-sql/antares/commit/0b9898f3e714d2cb24d100f55dd3858a644de162))


### Improvements

* **UI:** views grouped in folders ([a973ec3](https://github.com/antares-sql/antares/commit/a973ec3c60398cb16685a4f991c43ec4ee74c986))

### [0.7.25-beta.1](https://github.com/antares-sql/antares/compare/v0.7.25-beta.0...v0.7.25-beta.1) (2024-06-08)


### Bug Fixes

* issue switching table after using a filter, fixes[#691](https://github.com/antares-sql/antares/issues/691) ([4a1697d](https://github.com/antares-sql/antares/commit/4a1697d63351b9990efff5804b95d92ac2fc9783))

### [0.7.25-beta.0](https://github.com/antares-sql/antares/compare/v0.7.24...v0.7.25-beta.0) (2024-05-26)


### Features

* update japanese translation ([bb3c87b](https://github.com/antares-sql/antares/commit/bb3c87b2cf6fa38e3cfb68317c02aa350aae7887))


### Bug Fixes

* missing resizebars on mouse over ([25123e3](https://github.com/antares-sql/antares/commit/25123e34ef860d8bf019c496097e68e0101c9ab9))
* **PostgreSQL:** unable to search for databases, fixes [#798](https://github.com/antares-sql/antares/issues/798) ([d1bb50b](https://github.com/antares-sql/antares/commit/d1bb50b2bb48d3445080990c28fdc656cf27a6d3))

### [0.7.24](https://github.com/antares-sql/antares/compare/v0.7.24-beta.1...v0.7.24) (2024-05-03)


### Bug Fixes

* missing accent color change ([09c274a](https://github.com/antares-sql/antares/commit/09c274a724b5020efc650aaf7eecb2404343a6fc))

### [0.7.24-beta.1](https://github.com/antares-sql/antares/compare/v0.7.24-beta.0...v0.7.24-beta.1) (2024-04-30)


### Features

* accent color based on folder color, closes [#762](https://github.com/antares-sql/antares/issues/762) ([058fc2f](https://github.com/antares-sql/antares/commit/058fc2fc0b34cde5aa19233a4a999ef3624dae71))


### Bug Fixes

* **PostgreSQL:** better handle connection errors, should fix [#794](https://github.com/antares-sql/antares/issues/794) ([33bbc0e](https://github.com/antares-sql/antares/commit/33bbc0e7e6be370c944e979a34ab2cb19562d1e3))
* **PostgreSQL:** issue with similar tabs on differend databases ([23c59b4](https://github.com/antares-sql/antares/commit/23c59b4d4e8f250acad75f54d157c7c162e1c4f8))


### Improvements

* **UI:** hide "insert row" button in read-only mode, closes [#695](https://github.com/antares-sql/antares/issues/695) ([6600197](https://github.com/antares-sql/antares/commit/6600197b8286ced4c79378883594d21e69a83d8c))
* **UI:** improvements on light theme ([ece2ee0](https://github.com/antares-sql/antares/commit/ece2ee05cc90a58c1926e882e3ccf4f057f02d68))

### [0.7.24-beta.0](https://github.com/antares-sql/antares/compare/v0.7.23...v0.7.24-beta.0) (2024-04-12)


### Features

* add shortcut open,save, and save as file ([6b56c60](https://github.com/antares-sql/antares/commit/6b56c60b68647bc7182548a137cccc3413e3fbd5))
* add translation for  open,save, and save as file ([f7204dc](https://github.com/antares-sql/antares/commit/f7204dc0ae721534eaefbde097d1c26c1d72ad41))
* open,save, and save as file in query tab ([c1e58eb](https://github.com/antares-sql/antares/commit/c1e58eb695de78fbf1d2b26c608692f0962373df))
* unsaved file reminder closing file tabs ([8d8650f](https://github.com/antares-sql/antares/commit/8d8650fbe76c79fd66be857d049b3baaa9ab1f9f))


### Bug Fixes

* **translation:** missing translation for "Open notes" shortcut ([0565ae1](https://github.com/antares-sql/antares/commit/0565ae12042901b9d67fe3e0ea269562ec444994))

### [0.7.23](https://github.com/antares-sql/antares/compare/v0.7.23-beta.1...v0.7.23) (2024-04-07)

### [0.7.23-beta.1](https://github.com/antares-sql/antares/compare/v0.7.23-beta.0...v0.7.23-beta.1) (2024-04-02)


### Features

* add the page reference in the export file name, closes [#772](https://github.com/antares-sql/antares/issues/772) ([2064294](https://github.com/antares-sql/antares/commit/2064294119ed9dfab2a9968dfb5b35d52e2ae03b))
* move connections out of folder from context menu, related to [#773](https://github.com/antares-sql/antares/issues/773) ([62e3115](https://github.com/antares-sql/antares/commit/62e311586073ae7ee4896305198c7168f637c1af))
* move connections to folders from context menu, related to [#773](https://github.com/antares-sql/antares/issues/773) ([9aef287](https://github.com/antares-sql/antares/commit/9aef287a983754158cdbdc9b2a72db9ab82f76c8))


### Bug Fixes

* bad format of timestamp fields on CSV export, fixes 776 ([65ec4c5](https://github.com/antares-sql/antares/commit/65ec4c5da6187a7ab2dfff59326cd12bfa788c3b))

### [0.7.23-beta.0](https://github.com/antares-sql/antares/compare/v0.7.22...v0.7.23-beta.0) (2024-03-21)


### Bug Fixes

* CSV export does not escape strings when needed, fixes [#770](https://github.com/antares-sql/antares/issues/770) ([dd5b417](https://github.com/antares-sql/antares/commit/dd5b41716a10cf9500f2c611b232f5b5b0756a68))
* query result sort not working with aliased tables, fixes [#765](https://github.com/antares-sql/antares/issues/765) ([de9dac3](https://github.com/antares-sql/antares/commit/de9dac3e8abf3b3261f8c54c88cf2386a5be2207))
* shortcut not working on mac os ([0bb5ced](https://github.com/antares-sql/antares/commit/0bb5cedda6a67ccbeea8c127b799f533395101a2))

### [0.7.22](https://github.com/antares-sql/antares/compare/v0.7.22-beta.2...v0.7.22) (2024-02-26)


### Bug Fixes

* delete record modal pressing del when editing a field, fixes [#767](https://github.com/antares-sql/antares/issues/767) ([586f901](https://github.com/antares-sql/antares/commit/586f901bae9a80c0e53ac1d804cbae3f05e26d8e))

### [0.7.22-beta.2](https://github.com/antares-sql/antares/compare/v0.7.22-beta.1...v0.7.22-beta.2) (2024-02-18)


### Features

* **MySQL:** option to enable single connection mode ([d3f71e6](https://github.com/antares-sql/antares/commit/d3f71e65cef88838f03f95a4b34e197fb61878f8))

### [0.7.22-beta.1](https://github.com/antares-sql/antares/compare/v0.7.22-beta.0...v0.7.22-beta.1) (2024-02-12)


### Features

* update dutch translation + fix spelling mistake ([30ada13](https://github.com/antares-sql/antares/commit/30ada13663e88f89beb3dd7291010837059585d5))


### Bug Fixes

* some issues related to previous commit ([259d051](https://github.com/antares-sql/antares/commit/259d051a21e334496d3a52b662f1855ba9a9046d))
* unable to edit tables containing SET fields, fixes [#755](https://github.com/antares-sql/antares/issues/755) ([d698f27](https://github.com/antares-sql/antares/commit/d698f2798a2423f86e6d786dd3ab80439b372a08))


### Improvements

* **MySQL:** improvements in connection handling ([876d5ea](https://github.com/antares-sql/antares/commit/876d5ea48185334e9e2fc981c4282a9c42d22b10))

### [0.7.22-beta.0](https://github.com/antares-sql/antares/compare/v0.7.21...v0.7.22-beta.0) (2024-02-04)


### Features

* **UI:** resizable textarea in new/edito note, closes [#747](https://github.com/antares-sql/antares/issues/747) ([1a0c5da](https://github.com/antares-sql/antares/commit/1a0c5da2f14b99d6f5581b2bf6e916d67d097245))


### Improvements

* **UI:** improved notes, fixes [#746](https://github.com/antares-sql/antares/issues/746) ([bb36e98](https://github.com/antares-sql/antares/commit/bb36e98bebc5e1e55735e98d272428df2ab682e8))

### [0.7.21](https://github.com/antares-sql/antares/compare/v0.7.21-beta.1...v0.7.21) (2024-01-13)


### Features

* **SQLite:** enable schema reloat button on sidebar ([20b2734](https://github.com/antares-sql/antares/commit/20b27343cd95998bd83403b7556ea35fcad9fa1b))


### Bug Fixes

* **SQLite:** unable to change integer fields length to 0, fixes [#732](https://github.com/antares-sql/antares/issues/732) ([3b9228a](https://github.com/antares-sql/antares/commit/3b9228a7230dcd9f47f5794a83b60d28207bdce1))

### [0.7.21-beta.1](https://github.com/antares-sql/antares/compare/v0.7.21-beta.0...v0.7.21-beta.1) (2024-01-06)


### Bug Fixes

* **PostgreSQL:** error adding MONEY fields to a table ([0f8d2cb](https://github.com/antares-sql/antares/commit/0f8d2cb4ef5c327f96f788179be0b309689b4ce8))
* **PostgreSQL:** exception deleting a table with one or less tabs open ([23946ff](https://github.com/antares-sql/antares/commit/23946ff2cef6d63e1529e2c8c4357d7fdedc3284))
* **PostgreSQL:** unhandled error on connection lost, fixes [#740](https://github.com/antares-sql/antares/issues/740) ([cdd2a11](https://github.com/antares-sql/antares/commit/cdd2a11f8e33d6607337989723774d60c7c1a030))

### [0.7.21-beta.0](https://github.com/antares-sql/antares/compare/v0.7.20...v0.7.21-beta.0) (2023-12-25)


### Features

* ability to edit notes ([08e5a13](https://github.com/antares-sql/antares/commit/08e5a13f723bc3ae95b0f529b79f0b558bc2a377))
* buttons to save and access to saved queryes from query tab ([a52fc3f](https://github.com/antares-sql/antares/commit/a52fc3fd923fec30cfdd3d804554e6fe4534c400))
* highlithg sql in notes, history and console ([bfa3924](https://github.com/antares-sql/antares/commit/bfa3924d57c2ea2cc2857006d6bd6279865dbc99))
* new notes system ([eaaf1b7](https://github.com/antares-sql/antares/commit/eaaf1b756a6b5ffb77f7f07f3e4c0971822d48c3))
* open saved queries in a tab ([9a732ea](https://github.com/antares-sql/antares/commit/9a732ea1971d223f3278ad02d3dd77837fecb377))


### Bug Fixes

* JavaScript error at first startup, fixes [#736](https://github.com/antares-sql/antares/issues/736) ([b734b24](https://github.com/antares-sql/antares/commit/b734b246795fb240f6728714be68c22cc221bbe9))

### [0.7.20](https://github.com/antares-sql/antares/compare/v0.7.20-beta.2...v0.7.20) (2023-12-08)


### Bug Fixes

* missing update indicator on setting icon ([b055350](https://github.com/antares-sql/antares/commit/b055350726774e05a4e04ea6d890c46f64f2112e))

### [0.7.20-beta.2](https://github.com/antares-sql/antares/compare/v0.7.20-beta.1...v0.7.20-beta.2) (2023-12-06)


### Bug Fixes

* communication with worker thread not working ([6a72f6b](https://github.com/antares-sql/antares/commit/6a72f6b4ae3f4c1d6c42ca7a817d2f2c135696a7))

### [0.7.20-beta.1](https://github.com/antares-sql/antares/compare/v0.7.20-beta.0...v0.7.20-beta.1) (2023-12-02)


### Features

* copy element names on sidebar from context menu, closes [#718](https://github.com/antares-sql/antares/issues/718) ([f13d4e6](https://github.com/antares-sql/antares/commit/f13d4e6dceb70b0c7cb8d56ddfb5f00e938571cc))
* logging errors on log file ([315d9d8](https://github.com/antares-sql/antares/commit/315d9d84c2caa29852d68bd189750b2a4028d953))


### Bug Fixes

* **Flatpak:** import/export schema not working ([e26809f](https://github.com/antares-sql/antares/commit/e26809f260099ba194bf5d00671cae14d438197b))

### [0.7.20-beta.0](https://github.com/antares-sql/antares/compare/v0.7.19...v0.7.20-beta.0) (2023-11-15)


### Features

* ability to open multiple app sessions ([075f542](https://github.com/antares-sql/antares/commit/075f542dc8f4a48bef07b86b78c40d03fcdccc56))
* nl string updates ([8628711](https://github.com/antares-sql/antares/commit/8628711374269c29c4b1e6722fe66b0d8179477e))
* **translation:** add Ukrainian language, thanks to [#707](https://github.com/antares-sql/antares/issues/707) ([e14302b](https://github.com/antares-sql/antares/commit/e14302bdc0038b84a1a06089753205149cd1a92b))


### Bug Fixes

* error with multiple sessions in non-dev environment ([169f610](https://github.com/antares-sql/antares/commit/169f610b2ee4857661ec3da7f04b628fec21f1f0))
* **Firebird SQL:** error "Cannot read properties of null" connecting to some databases, fixes [#708](https://github.com/antares-sql/antares/issues/708) ([186fc18](https://github.com/antares-sql/antares/commit/186fc18363b6f14678465a8e38d85b1319e47b50))
* missing open folder icon for trigger, function and other database elements on sidebar ([1bc95b0](https://github.com/antares-sql/antares/commit/1bc95b0c2cd91bbf0410a23266e23bbbf2a71995))

### [0.7.19](https://github.com/antares-sql/antares/compare/v0.7.19-beta.2...v0.7.19) (2023-11-01)


### Bug Fixes

* table field changes not saved on text fields if pressing enter on textarea modal ([f6fb266](https://github.com/antares-sql/antares/commit/f6fb266771f2d798c8ae42b997c1e33520cf21c3))

### [0.7.19-beta.2](https://github.com/antares-sql/antares/compare/v0.7.19-beta.1...v0.7.19-beta.2) (2023-10-29)


### Bug Fixes

* ssh tunnel keep-alive not working properly ([debc1da](https://github.com/antares-sql/antares/commit/debc1da289d5e35d59adf69d094b329cf93af536))

### [0.7.19-beta.1](https://github.com/antares-sql/antares/compare/v0.7.19-beta.0...v0.7.19-beta.1) (2023-10-25)


### Features

* **MySQL:** RLIKE and NOT RLIKE regular expression filters, closes [#688](https://github.com/antares-sql/antares/issues/688) ([e4eb27d](https://github.com/antares-sql/antares/commit/e4eb27d503e8f912178359c01c62a9b523d17848))

### [0.7.19-beta.0](https://github.com/antares-sql/antares/compare/v0.7.18...v0.7.19-beta.0) (2023-10-14)


### Features

* "now" and "random" options added in datetime related data in insert rows tool, closes [#402](https://github.com/antares-sql/antares/issues/402) ([9f9c63b](https://github.com/antares-sql/antares/commit/9f9c63bfcc3423bfeef143cd835f48c62900a799))


### Bug Fixes

* IN and NOT IN filters not working properly, fixes [#687](https://github.com/antares-sql/antares/issues/687) ([c0dcf30](https://github.com/antares-sql/antares/commit/c0dcf30e73a69b25b01ba31d21b27c1983ed2db6))
* timeout issue on long time sql import ([ddd290c](https://github.com/antares-sql/antares/commit/ddd290c90344241eaa70cb528552e942fd7edec0))

### [0.7.18](https://github.com/antares-sql/antares/compare/v0.7.17...v0.7.18) (2023-10-03)


### Bug Fixes

* hotfix for Microsoft Store unauthorized process ([b3b698b](https://github.com/antares-sql/antares/commit/b3b698b3a23a3c848921ab40fc0fec5d8178ef0e))

### [0.7.17](https://github.com/antares-sql/antares/compare/v0.7.17-beta.2...v0.7.17) (2023-09-30)

### [0.7.17-beta.2](https://github.com/antares-sql/antares/compare/v0.7.17-beta.1...v0.7.17-beta.2) (2023-09-28)


### Features

* add NOT LIKE to table filters, closes [#672](https://github.com/antares-sql/antares/issues/672) ([9c66fd5](https://github.com/antares-sql/antares/commit/9c66fd51cbbe6f21a1fa6a34cc962496d3db7a98))


### Bug Fixes

* nsis updater not working ([198ff01](https://github.com/antares-sql/antares/commit/198ff0103bfa95e3491296d352c944165f31b87e))
* **UI:** small icons in foreign key modal ([b37781d](https://github.com/antares-sql/antares/commit/b37781df84cf7ee99a69ecaa54480d662d79c4aa))

### [0.7.17-beta.1](https://github.com/antares-sql/antares/compare/v0.7.17-beta.0...v0.7.17-beta.1) (2023-09-23)


### Bug Fixes

* flip not working on BaseIcon component ([922f56f](https://github.com/antares-sql/antares/commit/922f56f69b168302a9d1ff86565d3f09400d6a7c))
* **SQLite:** field length lost when editing a table, fixes [#664](https://github.com/antares-sql/antares/issues/664) ([b321e64](https://github.com/antares-sql/antares/commit/b321e64b835e0b39da116c4a77bac50247f240f3))
* **SQLite:** table content not refresh after an update, fixes [#665](https://github.com/antares-sql/antares/issues/665) ([6dceaf0](https://github.com/antares-sql/antares/commit/6dceaf09be7bd46f1915721abd03253ffc517256))
* table filter not working when search string on integer field, [#671](https://github.com/antares-sql/antares/issues/671) ([7e36260](https://github.com/antares-sql/antares/commit/7e36260cdb0438197152b5c6ac61db8ae8a9791a))
* **UI:** small icons in sidebar elements with long name ([354928e](https://github.com/antares-sql/antares/commit/354928e302437d608903d1434d99d68eb79aa6e9))

### [0.7.17-beta.0](https://github.com/antares-sql/antares/compare/v0.7.16...v0.7.17-beta.0) (2023-09-17)


### Features

* customize keep-alive-interval for ssh-tunnel ([b4731d6](https://github.com/antares-sql/antares/commit/b4731d67a5b819bf87c437eb626f30a7489477f9))
* keep alive interval in seconds ([8d605ee](https://github.com/antares-sql/antares/commit/8d605ee2872c20495f0ac4de84bf17d61c6455ae))
* **translation:** Update Dutch ([b43c400](https://github.com/antares-sql/antares/commit/b43c4000d5905838348c391f25b3228dc6a6b2ac))


### Bug Fixes

* empty workspace deleting connections in some conditions ([0de5ef8](https://github.com/antares-sql/antares/commit/0de5ef8a985cc8d9f1fa4479eeaf7dbb20f5fd7c))
* **SQLite:** disconnecting a sqlite connection does not truly close it, fixes [#661](https://github.com/antares-sql/antares/issues/661) ([757a2b3](https://github.com/antares-sql/antares/commit/757a2b3cbf0d7f4df37eb5d90faa2f9821794e5f))
* **UI:** update notification indicator moves settings icon ([e6f45d7](https://github.com/antares-sql/antares/commit/e6f45d71c75206187a7ae87e5f90a22d288a53ef))


### Improvements

* **core:** improved app security, fixes [#666](https://github.com/antares-sql/antares/issues/666) ([1359242](https://github.com/antares-sql/antares/commit/13592425afc643fe7188463fe4a2d02b6e27f87c))
* improved ipc validation on Linux ([9de5f67](https://github.com/antares-sql/antares/commit/9de5f67d189c9b56fff41b29e6df69a3909bfa26))
* migration from font icons to svg icons ([e7bec0a](https://github.com/antares-sql/antares/commit/e7bec0aaaf019fe0c3040d2d9443233e46a60188))

### [0.7.16](https://github.com/antares-sql/antares/compare/v0.7.16-beta.1...v0.7.16) (2023-08-26)

### [0.7.16-beta.1](https://github.com/antares-sql/antares/compare/v0.7.16-beta.0...v0.7.16-beta.1) (2023-08-18)


### Features

* ability to export connections ([f5b86e5](https://github.com/antares-sql/antares/commit/f5b86e59e7e41bbbe1555ec8a85ec1f849e8271d))
* ability to import connections ([6df2145](https://github.com/antares-sql/antares/commit/6df214558f8186dd5fbf101505465f4c07c8ad5f))
* Add catalan language ([9c6f1a9](https://github.com/antares-sql/antares/commit/9c6f1a9ea52b4791082bdbae91b764c486684c3b))


### Bug Fixes

* add some missing titles of buttons ([52e42fa](https://github.com/antares-sql/antares/commit/52e42fa1b529512154c0680124c5e425964a5b1a))
* **SQLite:** improved view body parsing ([832aa75](https://github.com/antares-sql/antares/commit/832aa75ebe46776b9c365dde2dd13db3746adcd5))

### [0.7.16-beta.0](https://github.com/antares-sql/antares/compare/v0.7.15...v0.7.16-beta.0) (2023-08-11)


### Features

* ability to change sql dump file name ([2e39d81](https://github.com/antares-sql/antares/commit/2e39d810b519401d0410cbb76520c07c595329fc))
* ability to export a table dump from table context menu ([84b2255](https://github.com/antares-sql/antares/commit/84b2255bf405431070511890b2bca770fc4cc2bc))
* support to links in changelog ([ad7e459](https://github.com/antares-sql/antares/commit/ad7e459c689d70ca664b9a3091d3dcab3f26ce4d))


### Bug Fixes

* **MySQL:** missing error details on mysql importer with some exceptione ([7b1cb4f](https://github.com/antares-sql/antares/commit/7b1cb4ff86dddb5fb4b4d960b47ea17f38a24aa6))

### [0.7.15](https://github.com/antares-sql/antares/compare/v0.7.14...v0.7.15) (2023-07-31)


### Features

* export file name with hour, minutes and seconds, closes [#610](https://github.com/antares-sql/antares/issues/610) ([2f5fa0f](https://github.com/antares-sql/antares/commit/2f5fa0f2e416e88753c9dc2bf32edefba8c4e072))


### Bug Fixes

* display content of BLOB fields if not binary, fixes [#628](https://github.com/antares-sql/antares/issues/628) ([f831fcd](https://github.com/antares-sql/antares/commit/f831fcd442f16a03f0ea83ff5bf77a4a79906eb6))
* **MySQL:** error insertinf new fields with some MySQL configurations, fixes [#360](https://github.com/antares-sql/antares/issues/360) ([51b1419](https://github.com/antares-sql/antares/commit/51b14195a8a6c7e7f1b12bd4b86b7164a56b2aa5))
* **MySQL:** unable to set more than one value in SET fields ([7c820b1](https://github.com/antares-sql/antares/commit/7c820b18276e4ed5e381d91110acd032862a5be9))

### [0.7.14](https://github.com/antares-sql/antares/compare/v0.7.13...v0.7.14) (2023-07-07)


### Features

* button to open view settings tab ([32bbc45](https://github.com/antares-sql/antares/commit/32bbc453294736970ddbcadd3cc45597277f5bda))


### Bug Fixes

* unable to insert new rows ([1c73503](https://github.com/antares-sql/antares/commit/1c735031380c48aa8b08ed5ce3df80008dc72af8))


### Improvements

* **PostgreSQL:** minor improvement to schema selection ([9d8e9a5](https://github.com/antares-sql/antares/commit/9d8e9a5e1fda190ee7b3d4fd59e6178dd5ec1651))

### [0.7.13](https://github.com/antares-sql/antares/compare/v0.7.12...v0.7.13) (2023-07-06)


### Features

* button to open table settings tab, closes [#608](https://github.com/antares-sql/antares/issues/608) ([38bfea2](https://github.com/antares-sql/antares/commit/38bfea279ce93366dfd2021d0e91622a5a88878e))
* update connection ([462ede8](https://github.com/antares-sql/antares/commit/462ede8dc701aaf9c6089b3ec41eea0f31babdf9))


### Bug Fixes

* **PostgreSQL:** unable to connect to database, fixes [#614](https://github.com/antares-sql/antares/issues/614) ([e808b86](https://github.com/antares-sql/antares/commit/e808b86c52b8488e0c079a9f0ddce225338af4c0))
* unable to copy as sql inserts with BIT fileds, fixes [#613](https://github.com/antares-sql/antares/issues/613) ([6e01f0f](https://github.com/antares-sql/antares/commit/6e01f0f2e7194284341f89a44839d16398358f9b))

### [0.7.12](https://github.com/antares-sql/antares/compare/v0.7.11...v0.7.12) (2023-07-03)


### Features

* add Dutch language support ([4ff1d10](https://github.com/antares-sql/antares/commit/4ff1d107b8837887ceb3ffecaed46b9bdb908127))
* format options of csv export, closes [#196](https://github.com/antares-sql/antares/issues/196) ([3ad1e51](https://github.com/antares-sql/antares/commit/3ad1e51f42f3cc37ad66bdab64e9a8a0eadea74b))
* more translations ([575c8ea](https://github.com/antares-sql/antares/commit/575c8ea8cabc1fb315bad1693df6cd4ccd869838))
* **PostgreSQL:** ability to switch the database, closes [#432](https://github.com/antares-sql/antares/issues/432) ([89815bf](https://github.com/antares-sql/antares/commit/89815bf5e7c4062950b7418b31b45552ae0e1276))
* Sort available languages alphabetically ([3ff8d25](https://github.com/antares-sql/antares/commit/3ff8d2571be306a8a72e5ad2b9f963b285e8db26))


### Bug Fixes

* **PostgreSQL:** unable to export as sql inserts ([e07e7b7](https://github.com/antares-sql/antares/commit/e07e7b736ef29368262ec4b17d9e1f54ef3ec390))
* rename components and variables in SettingBarContext ([8a4a099](https://github.com/antares-sql/antares/commit/8a4a099e37c9bbc1365f322f6276f32153e24379))
* spelling corrections ([93e16fd](https://github.com/antares-sql/antares/commit/93e16fdda29601f3e898b1a9470bd8546ea95df6))
* update source string to fix spelling ([001983c](https://github.com/antares-sql/antares/commit/001983c5a2ebe17c943a9be3a58cc587f5cd09e3))

### [0.7.11](https://github.com/antares-sql/antares/compare/v0.7.10...v0.7.11) (2023-06-04)


### Features

* context menu to close tabs, closes [#392](https://github.com/antares-sql/antares/issues/392) ([787014c](https://github.com/antares-sql/antares/commit/787014c38df743315c04962871a3801805a93c55))


### Bug Fixes

* disable filter during table content loading, fixes [#588](https://github.com/antares-sql/antares/issues/588) ([e60726c](https://github.com/antares-sql/antares/commit/e60726c741276b7da0d54c0986d2a45ed9979bc9))
* **MySQL:** unable to get users list with some db settings ([9046707](https://github.com/antares-sql/antares/commit/904670781d47b1ac0dcfd982215ba1786f8c8145))
* unique keys not recognized in table settings on some MariaDB versions ([4461998](https://github.com/antares-sql/antares/commit/446199827be4b07382453739f42d46fa0201d04c))
* weird behavior in some text editors ([22bdaac](https://github.com/antares-sql/antares/commit/22bdaac18b1c46a57802cbbd3ad339ee075ec70b))

### [0.7.10](https://github.com/antares-sql/antares/compare/v0.7.9...v0.7.10) (2023-05-28)


### Features

* copy rows as PHP array ([03638c0](https://github.com/antares-sql/antares/commit/03638c05534e9ce2e594ce5945485587ed99e609))
* DDL query in table settings for MySQL and PostgreSQL, closes [#581](https://github.com/antares-sql/antares/issues/581) ([f454b4b](https://github.com/antares-sql/antares/commit/f454b4bb1ca79eec285b3b4039a2ef66802ff82a))
* export table content or query results as PHP array, closes [#575](https://github.com/antares-sql/antares/issues/575) ([8968179](https://github.com/antares-sql/antares/commit/8968179c11f4fe3e624873aac4685a5a33521024))
* keepalive on mysql/postgre connections, should fix [#577](https://github.com/antares-sql/antares/issues/577) ([17eeb6d](https://github.com/antares-sql/antares/commit/17eeb6d38e45b553e35e004b748569971743ca18))


### Bug Fixes

* disable shorctut to show Ace editor settings, fixes [#585](https://github.com/antares-sql/antares/issues/585) ([2c0b4ff](https://github.com/antares-sql/antares/commit/2c0b4ffe1f2e418f5e9120a40787788d8e7fd27e))

### [0.7.9](https://github.com/antares-sql/antares/compare/v0.7.8...v0.7.9) (2023-05-01)


### Features

* no table results message ([19859f4](https://github.com/antares-sql/antares/commit/19859f45f4457292b6ecfe79bdcfbdcc7722be06))
* option to choose the target table of an SQL INSERT exportation, closes [#556](https://github.com/antares-sql/antares/issues/556) ([c48266c](https://github.com/antares-sql/antares/commit/c48266c336d7c61abe2b56b5702e5bca83bb57b3))
* **translation:** ko-KR translation, closes [#561](https://github.com/antares-sql/antares/issues/561) ([baef4ea](https://github.com/antares-sql/antares/commit/baef4ea4d1747233a86b90fe5b60a0d6cfba1f1c))


### Bug Fixes

* sidebar height out of visible area ([af91d96](https://github.com/antares-sql/antares/commit/af91d96db6e79222e5dbc9b880a904a40332c09b))
* unable to delete rows with null values and no primary key ([74c136f](https://github.com/antares-sql/antares/commit/74c136f8334b6972ae55dd8ee0ade09ef8ae3282))
* vertical scrollbar does not reset after performing a search, fixes [#567](https://github.com/antares-sql/antares/issues/567) ([0cd55fb](https://github.com/antares-sql/antares/commit/0cd55fbfe9ff09589ae5993f16b0dd56a2ea1a5a))


### Improvements

* **translation:** update italian translation ([96e1ceb](https://github.com/antares-sql/antares/commit/96e1ceb1d2488390216553cd3fce2eec261f04eb))

### [0.7.8](https://github.com/antares-sql/antares/compare/v0.7.7...v0.7.8) (2023-04-12)


### Features

* filter schemas in sidebar, closes [#555](https://github.com/antares-sql/antares/issues/555) ([8be9f93](https://github.com/antares-sql/antares/commit/8be9f932e7a44b2067d8b57950d8faafc577123f))
* **MySQL:** option to export from results SQL INSERTS in chunks, closes [#501](https://github.com/antares-sql/antares/issues/501) ([0f24c80](https://github.com/antares-sql/antares/commit/0f24c80e5a2dc45875df6b67d3c097cf1cca458e))


### Bug Fixes

* **MySQL:** missing scale for FLOAT type ([52108d7](https://github.com/antares-sql/antares/commit/52108d76133d5fdffb56faa995d7ab7ee3e7c4bc))
* triggers not exported if related table not included ([d802b32](https://github.com/antares-sql/antares/commit/d802b32597e42ee90a2d691fe74245b3bc2517ee))
* unable to export BLOB values from table content o query result ([afa61a9](https://github.com/antares-sql/antares/commit/afa61a9bc2d698894096a6b5413c49f05b2fd5aa))

### [0.7.7](https://github.com/antares-sql/antares/compare/v0.7.6...v0.7.7) (2023-03-10)


### Bug Fixes

* hide table size tooltip if disabled ([2c46269](https://github.com/antares-sql/antares/commit/2c46269cf262248d3f5644b7c5b89d5d317a89a4))
* **Linux:** remove app menu shown pressing ALT key ([63fece2](https://github.com/antares-sql/antares/commit/63fece2a1b6b09f61ae416f7c3a7b51ee0a53d0e))
* **Linux:** remove app menu shown pressing ALT key ([b925ff9](https://github.com/antares-sql/antares/commit/b925ff9c01afcc727e5d70bafb079d468ed1eede))
* **MySQL:** missing table information in table setting tab ([59846e6](https://github.com/antares-sql/antares/commit/59846e6ff47591ec8dc22403c3be0e70e0f3ccfd))
* unable to set string fields default values starting with 0 ([3546c57](https://github.com/antares-sql/antares/commit/3546c57e398be7b2e226bb8e93e8fc0fb8bab40a))

### [0.7.6](https://github.com/antares-sql/antares/compare/v0.7.5...v0.7.6) (2023-02-27)


### Bug Fixes

* error with import/export tools, fixes [#541](https://github.com/antares-sql/antares/issues/541) ([d1297a0](https://github.com/antares-sql/antares/commit/d1297a0085fd54967817816efaeed5770a887bbf))

### [0.7.5](https://github.com/antares-sql/antares/compare/v0.7.4...v0.7.5) (2023-02-26)


### Features

* **MySQL:** option, disabled by default, to enable table size indicators on sidebar ([313e740](https://github.com/antares-sql/antares/commit/313e7407eb1afe5d19ac49ee4b308950b48cafa8))


### Bug Fixes

* **MariaDB:** exception with event_scheduler DISABLED with MariaDB 10, fixes [#535](https://github.com/antares-sql/antares/issues/535) ([4458177](https://github.com/antares-sql/antares/commit/445817768863616ea7340c8bf62472197b73bd6e))
* single quotes not properly escaped for random generated content ([629ce63](https://github.com/antares-sql/antares/commit/629ce633294c862266db9e27ffa5c154e8fc416c))
* unable to import after a failed import, fixes [#515](https://github.com/antares-sql/antares/issues/515) ([b1fbc43](https://github.com/antares-sql/antares/commit/b1fbc43ab2f39827cb85ac7d21ac889ffc2f4c64))

### [0.7.4](https://github.com/antares-sql/antares/compare/v0.7.3...v0.7.4) (2023-02-10)


### Bug Fixes

* tables sort in sidebar ([ddb7ead](https://github.com/antares-sql/antares/commit/ddb7ead0832708713ba4bb2717661b8b93a47e3f))

### [0.7.3](https://github.com/antares-sql/antares/compare/v0.7.2...v0.7.3) (2023-02-09)


### Features

* **SQLite:** added support to INTEGER UNSIGNED ([e7e4913](https://github.com/antares-sql/antares/commit/e7e491340a037b64d6d8e538376415779d54332e))


### Bug Fixes

* longtext edit modal opens when it shouldn't, fixes [#524](https://github.com/antares-sql/antares/issues/524) ([6decba3](https://github.com/antares-sql/antares/commit/6decba316ca46106520cb4dba44409ceb4a4af75))
* select of table type stuck when editing an unknown type ([e8447e5](https://github.com/antares-sql/antares/commit/e8447e56551871a200517bdaa747ae215ad83cf4))
* **SQLite:** error with integer timestamp fields ([2b5e1e7](https://github.com/antares-sql/antares/commit/2b5e1e7b39c25f536b6139a4d01b9f7f17069ea8))
* **SQLite:** triggers disappear after editing related table, fixes [#523](https://github.com/antares-sql/antares/issues/523) ([d934ae1](https://github.com/antares-sql/antares/commit/d934ae1e6c0747698b4973d9cad217379076a6cf))

### [0.7.2](https://github.com/antares-sql/antares/compare/v0.7.1...v0.7.2) (2023-01-22)


### Features

* add copy shortcut and default copy type setting ([9aca894](https://github.com/antares-sql/antares/commit/9aca89477f1fd7b7f55f1e5c290d495c46f61d8e))
* connection info icons in footer ([ff4bc6c](https://github.com/antares-sql/antares/commit/ff4bc6c39b05a827cebde84466814cf246908208))


### Bug Fixes

* allow comments in queies, fixes [#519](https://github.com/antares-sql/antares/issues/519) ([c7ab3b7](https://github.com/antares-sql/antares/commit/c7ab3b77a22e85cee6fb93064eaad5a8e8ad9fd2))
* **SQLite:** exception saving tables without INT fields length ([0e80e82](https://github.com/antares-sql/antares/commit/0e80e823d059dfe24995b5848d88cc84235e6275))
* ssh connection closed after idle time, fixes [#425](https://github.com/antares-sql/antares/issues/425) ([6fa430a](https://github.com/antares-sql/antares/commit/6fa430adf68013a9d0a093031f56dd741bdc0299))

### [0.7.1](https://github.com/antares-sql/antares/compare/v0.7.0...v0.7.1) (2022-12-23)


### Features

* Copy rows as html table, so we can paste it to spreadsheet ([c32f463](https://github.com/antares-sql/antares/commit/c32f463ea5ac3f54cba32929f77442f1e0ba934a))
* option to disable selected query execution, closes [#477](https://github.com/antares-sql/antares/issues/477) ([1bd26ce](https://github.com/antares-sql/antares/commit/1bd26ceaa68fe66f26c76b3b60fa6eeccea91729))


### Bug Fixes

*  bahasa indonesia typos ([897795d](https://github.com/antares-sql/antares/commit/897795ddbb4ade2652b0471f18288b8b3aaf0eb9))
* connection default icon not change after client change ([a6bdf69](https://github.com/antares-sql/antares/commit/a6bdf69a281c8614c41274b6dc2f3563aa89c57e))
* context submenu outside view when near the edge, fixes [#506](https://github.com/antares-sql/antares/issues/506) ([c08946e](https://github.com/antares-sql/antares/commit/c08946e932884e5f0253df2545f98315ab7e5219))
* **i18n:** add missing keys for french translation ([fd129a2](https://github.com/antares-sql/antares/commit/fd129a2ad1c3401372c9172b38f4406254d134df))
* **MySQL:** not every connection gets read-only option ([843c15e](https://github.com/antares-sql/antares/commit/843c15e428c4a0412f19a93ab05d2fcbb60da09b))
* **UI:** white background dragging connections inside folder on Linux ([dd971d7](https://github.com/antares-sql/antares/commit/dd971d70e04faf0d5b239586b12e4a9a42407433))
* white background dragging connections or tabs on Linux, fixes [#486](https://github.com/antares-sql/antares/issues/486) ([669d7e8](https://github.com/antares-sql/antares/commit/669d7e8d4d062ed5bdafe1d5cde8ec51a2f68b26))

## [0.7.0](https://github.com/antares-sql/antares/compare/v0.6.0...v0.7.0) (2022-11-30)


### Features

* **UI:** connections customization ([212b2bd](https://github.com/antares-sql/antares/commit/212b2bdba933db1af22967a057d64f41c96b9930))
* **UI:** folders customization ([72accb7](https://github.com/antares-sql/antares/commit/72accb7b0e62977dde2c82312aee5b9d025e5182))
* **UI:** folders implementation ([ece6c64](https://github.com/antares-sql/antares/commit/ece6c6401def4a9b42280f23efaa038b9ad98de8))
* **UI:** footer color based on folder color ([4fe9dfc](https://github.com/antares-sql/antares/commit/4fe9dfc4d7ca19a798b8a8a74d979ab88aebeaac))
* **UI:** new settimgbar tooltips ([6728964](https://github.com/antares-sql/antares/commit/672896414e901635c83ca037663e355a31ce013b))


### Bug Fixes

* deletion of connections inside folder ([b06bafe](https://github.com/antares-sql/antares/commit/b06bafe06c060233ebe901979b9fc4455a25cb89))
* missing sidebar data after update ([0a1f50a](https://github.com/antares-sql/antares/commit/0a1f50a9b92c9705784b93f14be40a01a78cb0da))
* **UI:** folder to folder drag glitches ([0fca70e](https://github.com/antares-sql/antares/commit/0fca70ebec1af3d594db4e1ce159e52e12224850))
* **UI:** wrong copnnection icons color with light theme ([d010d5a](https://github.com/antares-sql/antares/commit/d010d5aa8f07a5def1183567ee767fd144696ed3))
* wrong position moving elements outside folder ([7af178a](https://github.com/antares-sql/antares/commit/7af178a1e400876e6c45dbe31a198a12d29227a8))

## [0.6.0](https://github.com/antares-sql/antares/compare/v0.5.19...v0.6.0) (2022-11-18)


### Features

* **Firebird SQL:** connections pool ([76df631](https://github.com/antares-sql/antares/commit/76df6319c242ea42f93d4e5d811d96ec2c282aa8))
* **Firebird SQL:** display table content and query results ([95bb41e](https://github.com/antares-sql/antares/commit/95bb41e9db255a780aae1ae32ce4a53ee3bab20e))
* **Firebird SQL:** manual commit mode ([27566c1](https://github.com/antares-sql/antares/commit/27566c1dfae55f72d3f870c50410e5ecda256037))
* **Firebird SQL:** procedure add/edit/delete support ([ae312ef](https://github.com/antares-sql/antares/commit/ae312efbbc3a9941380477b9849bdd8edc5b9fbf))
* **Firebird SQL:** support to blob fields ([0827a04](https://github.com/antares-sql/antares/commit/0827a04d61af75b4366394e5f0289df461d02c98))
* **Firebird SQL:** support to indexes and foreign keys ([2c8509f](https://github.com/antares-sql/antares/commit/2c8509ff4173fbebeff92ab472a37edd3d80a2ac))
* **Firebird SQL:** table add/edit/delete support ([1b5cc31](https://github.com/antares-sql/antares/commit/1b5cc315dddca6b753fb6fe6e196e29441ffed79))
* **Firebird SQL:** trigger add/edit/delete support ([8e422e3](https://github.com/antares-sql/antares/commit/8e422e3f07323f388523621a05f0403a87f19e47))
* **Firebird SQL:** view add/edit/delete support ([7d1967a](https://github.com/antares-sql/antares/commit/7d1967a60977b2ce1095a37b7135f429a83f163d))
* support to text blob fields ([e6f6a02](https://github.com/antares-sql/antares/commit/e6f6a022d1a5bbc3f5303f635a2115813601c61a))


### Bug Fixes

* **Firebird SQL:** connection pool issue ([7ff8e21](https://github.com/antares-sql/antares/commit/7ff8e2149ef911a235b4a1dcc329775af1d2a72b))
* incomplete list of collations, fixes [#478](https://github.com/antares-sql/antares/issues/478) ([1c1403f](https://github.com/antares-sql/antares/commit/1c1403f58641f7b5f8a7c29fc430673ffa88f969))
* loss of precision updating BIGINT values, fixes [#467](https://github.com/antares-sql/antares/issues/467) ([d190a2d](https://github.com/antares-sql/antares/commit/d190a2dd61040d1748dfb97403f9d56015d938fe))

### [0.5.19](https://github.com/antares-sql/antares/compare/v0.5.18...v0.5.19) (2022-10-22)


### Features

* context menu option to fill cell with random values ([0a2124f](https://github.com/antares-sql/antares/commit/0a2124f2c2bdadc7c753db11d1e29f8acb9ddcac))
* uuid fill for string cells ([24edc82](https://github.com/antares-sql/antares/commit/24edc82b1be7299a09df18611b2a0ba361a6b46f))


### Bug Fixes

* app stuck inserting a random value if field length high ([440f74d](https://github.com/antares-sql/antares/commit/440f74dfc1f4942ba585b9bdae7517fe6ab04a81))
* error joining tables with different schema ([88408da](https://github.com/antares-sql/antares/commit/88408da745e45c70de977bc4270e5f61825be65f))
* **SQLite:** save boolean as integer to improve compativility, fixes [#463](https://github.com/antares-sql/antares/issues/463) ([d52b7af](https://github.com/antares-sql/antares/commit/d52b7af2978bc8beafd2d22078c72abb62e9e532))
* unable to edit text fields if value is NULL, fixes [#466](https://github.com/antares-sql/antares/issues/466) ([8621ca5](https://github.com/antares-sql/antares/commit/8621ca5333b5c51dc7a2ea1fcc0c5ec7f752a00a))

### [0.5.18](https://github.com/antares-sql/antares/compare/v0.5.17...v0.5.18) (2022-10-14)


### Features

* **PostgreSQL:** UUID random generation option on UUID fields, closes [#424](https://github.com/antares-sql/antares/issues/424) ([a521274](https://github.com/antares-sql/antares/commit/a521274d01031c1411bbbb136369802d43368089))


### Bug Fixes

* auto-scroll on sidebar not working, fixes [#447](https://github.com/antares-sql/antares/issues/447) ([dd9c089](https://github.com/antares-sql/antares/commit/dd9c089d27c61ab76d49887c7de2849cbb6e88a6))
* trackpad horizontal scroll on tabs not working properly ([ba5a1b6](https://github.com/antares-sql/antares/commit/ba5a1b68ab2d56777a5c94eede26e9bded5819e6))

### [0.5.17](https://github.com/antares-sql/antares/compare/v0.5.16...v0.5.17) (2022-09-22)


### Features

* added more editor font sizes, closes [#440](https://github.com/antares-sql/antares/issues/440) ([d114f8a](https://github.com/antares-sql/antares/commit/d114f8a65164f702b23175095e6fc2b021e0e038))


### Bug Fixes

* "run or reload" shortcut triggers on all connections open ([01f607c](https://github.com/antares-sql/antares/commit/01f607cd40c18ab0f9761b2a05705a966aaae43a))
* cant run procedures with parameters from leftbar ([efe134a](https://github.com/antares-sql/antares/commit/efe134a059700ca87333dc6e66166d6ec8d289e8))
* editor font size doesn't change on new tabs, fixes [#442](https://github.com/antares-sql/antares/issues/442) ([84168d1](https://github.com/antares-sql/antares/commit/84168d1d75460acc2c844bfece7d85f0c977e74c))
* empty definer when editing a view, fixes [#437](https://github.com/antares-sql/antares/issues/437) ([498a9b4](https://github.com/antares-sql/antares/commit/498a9b48e25ee061960f5f649c953cdaf6ff1a58))
* **MacOS:** empty options on macos menubar ([a142d3c](https://github.com/antares-sql/antares/commit/a142d3c4d77e31375dfbea148eec54ce1f635192))

### [0.5.16](https://github.com/antares-sql/antares/compare/v0.5.15...v0.5.16) (2022-08-26)


### Bug Fixes

* CTRL+Right/Left not working on text editor, closes [#427](https://github.com/antares-sql/antares/issues/427) ([ffc645b](https://github.com/antares-sql/antares/commit/ffc645ba5efb1c52670096e4f8c7f992b7335dae))
* issue updating datetime cells with null value, closes [#423](https://github.com/antares-sql/antares/issues/423) ([ebc325a](https://github.com/antares-sql/antares/commit/ebc325ae0c656dca2eb8f7544ab271beaee9b47e))
* ts exceptions ([df68114](https://github.com/antares-sql/antares/commit/df681147aaf0bfca69f3ffdc474cc1846541b1d8))
* **UI:** editor themes group not visible in select element ([9dc700e](https://github.com/antares-sql/antares/commit/9dc700e13ea65bb8c6feac4ff4ffeadd32053614))
* **UI:** wrong position of fields resizable area ([c90ab0e](https://github.com/antares-sql/antares/commit/c90ab0e8807ff30a9ab58e9aa3515cf427dd6e86))
* unable to set null or delete rows without primary key ([39326eb](https://github.com/antares-sql/antares/commit/39326eb52e038728b5419d4a8de8024c7ead3002))

### [0.5.15](https://github.com/antares-sql/antares/compare/v0.5.14...v0.5.15) (2022-08-17)


### Features

* ability to add new shortcuts ([d044a02](https://github.com/antares-sql/antares/commit/d044a02cb79a9d06aadc34cdbf6e81da84360559))
* ability to edit shortcuts ([8eb127e](https://github.com/antares-sql/antares/commit/8eb127e45838bc01ba12f0740fec077fcd975532))
* added more events in shortcuts setting ([5043faf](https://github.com/antares-sql/antares/commit/5043fafa934844ebc2f59cabcec830c6a4d5ca8e))
* delete shortcuts and restore defaults ([c22413f](https://github.com/antares-sql/antares/commit/c22413fde9dfe5501a5f220070cfe552a318c70b))
* dynamic shortcut suggestions on empty query tabs ([4df14c3](https://github.com/antares-sql/antares/commit/4df14c3693955bd7801b4b99103fca85f00f3e8c))
* list of available shortcuts in settings window ([44bb75b](https://github.com/antares-sql/antares/commit/44bb75bc60d7d31bbd99a9ba57f30fd354f7581c))
* **UI:** connection name on left bar, closes [#382](https://github.com/antares-sql/antares/issues/382) [#414](https://github.com/antares-sql/antares/issues/414) ([4887753](https://github.com/antares-sql/antares/commit/48877534d1a41d351b267c0dab925046ca984179))
* **UI:** shortcuts setting UI improved ([49b63bc](https://github.com/antares-sql/antares/commit/49b63bc6f28fc6031e6a892d0a48cd35ae2f26cd))


### Bug Fixes

* startup exception ([c50d17e](https://github.com/antares-sql/antares/commit/c50d17e82b7fd337d4037ddf646cd1a8fc765bae))


### Improvements

* improved keypress detector ([0f219cf](https://github.com/antares-sql/antares/commit/0f219cf9b796b4369c609fb0e8e3b84346a30b07))
* **translation:** updated italian translation ([c05be83](https://github.com/antares-sql/antares/commit/c05be8304f3cf299cf338f67c00184305e022919))

### [0.5.14](https://github.com/antares-sql/antares/compare/v0.5.13...v0.5.14) (2022-08-09)


### Bug Fixes

* unable to open settingbar context menu ([44eb507](https://github.com/antares-sql/antares/commit/44eb507a12bad028a4fa8a8bb0f6442a3e8dde91))

### [0.5.13](https://github.com/antares-sql/antares/compare/v0.5.12...v0.5.13) (2022-08-09)


### Features

* copy row as CSV, closes [#394](https://github.com/antares-sql/antares/issues/394) ([1c3d7aa](https://github.com/antares-sql/antares/commit/1c3d7aa30bb9c2bd900a764ee6b97960729e9263))
* new macos icon ([0bfa14e](https://github.com/antares-sql/antares/commit/0bfa14e1c90320578597df030941530b670a4131))


### Bug Fixes

* **MySQL:** error with ANSI sql_mode ([f64a12a](https://github.com/antares-sql/antares/commit/f64a12a8e9c5f764c3a692f1a032736e008058b5))
* set legacy: false ([104b7c9](https://github.com/antares-sql/antares/commit/104b7c928b9c2abfc056880f16c606a0b1fa7c67))

### [0.5.12](https://github.com/antares-sql/antares/compare/v0.5.11...v0.5.12) (2022-07-26)


### Features

* ability to copy multiple selected rows ([9551afb](https://github.com/antares-sql/antares/commit/9551afbd2d7e525c81f28e98e788b92609ce9de4))
* context menu option to duplicate a table row ([985e5d3](https://github.com/antares-sql/antares/commit/985e5d352793d1b3e1981d004b6f494bfbb049bf))
* copy row as SQL INSERT ([d3da15a](https://github.com/antares-sql/antares/commit/d3da15aa1377dcba73927047563f1d0c2d1284ca))
* execute selected query ([7890263](https://github.com/antares-sql/antares/commit/78902639ebb29a8c53f8aa0d2045c74e0646febc))
* export table content as SQL INSERT ([f3b5de3](https://github.com/antares-sql/antares/commit/f3b5de38c4abfd2c1d738e179fc22e6c8b6f9080))


### Bug Fixes

* disable ctrl+alt+(left/right) shortcut on linux ([8ecaedb](https://github.com/antares-sql/antares/commit/8ecaedbf6c2fc0dc56ff2177a87dd6ede74bdd22))
* error on schema export ([1d151e9](https://github.com/antares-sql/antares/commit/1d151e9349fd97576ccd8ef7f88ca789a1f28b65))
* issue with logger on import/export ([cb038b3](https://github.com/antares-sql/antares/commit/cb038b374a4fe85ad569e42eee7af123c925e775))
* missing defaults on insert row window ([1ead76c](https://github.com/antares-sql/antares/commit/1ead76c02889f48bd91cae702820b082ca2ff54b))
* missing table on insert new records on session restored tabs ([8c83b3f](https://github.com/antares-sql/antares/commit/8c83b3f1447354ec63b2a308db05ad4d54659aa7))
* **MySQL:** missing quoted identifier for column names in table filter, closes [#380](https://github.com/antares-sql/antares/issues/380) ([eb60899](https://github.com/antares-sql/antares/commit/eb60899e6e17879c79a7ee7108061e9aca8596f7))
* prevent ctrl+a in console ([a00c19d](https://github.com/antares-sql/antares/commit/a00c19d3003cd43d3ee6e3132728122bb2b24c97))

### [0.5.11](https://github.com/antares-sql/antares/compare/v0.5.10...v0.5.11) (2022-07-19)


### Bug Fixes

* console events disabled in production ([0b1aa3d](https://github.com/antares-sql/antares/commit/0b1aa3dd299db641df3d4c56c7ee56a187fc3ab3))
* filter persists switching temporary table tabs ([bf768c3](https://github.com/antares-sql/antares/commit/bf768c380087b65604b5b571a9858a7f07bd681d))
* unable to edit table fields content on tables with datetime fields ([91e0630](https://github.com/antares-sql/antares/commit/91e06305133c97ea02dcfdc4e739a4b0a7e7049d))

### [0.5.10](https://github.com/antares-sql/antares/compare/v0.5.9...v0.5.10) (2022-07-18)


### Features

* context menu to copy queries from console ([c21bd60](https://github.com/antares-sql/antares/commit/c21bd6075c1203607c05e45b76233d57e3008190))
* Ctrl+PgUp & Ctrl+PgDn to navigate between tabs ([abf8298](https://github.com/antares-sql/antares/commit/abf829867e567354e534cff3e02a6d43f4c7a262))
* field names suggestion for tables in the query ([b71f04e](https://github.com/antares-sql/antares/commit/b71f04e5aa3c37eaa160dfbc76d1b84789e3543e))
* initial console implementation ([6a6f43a](https://github.com/antares-sql/antares/commit/6a6f43a718561e0abd2cb89048b7fe45d08736ae))
* ipc event channel to send logs to renderer ([f12a04b](https://github.com/antares-sql/antares/commit/f12a04b0524f1172334c89afeb27675c19ff68d2))
* open/close console on single connection ([44647f5](https://github.com/antares-sql/antares/commit/44647f5b5508965bf5a7264add89e175c725e877))


### Bug Fixes

* exception on QueryEditor with null modelValue ([9bc9adb](https://github.com/antares-sql/antares/commit/9bc9adb7cff19b86a99491d968485a4cd7b47b99))
* fields content language detection not working properly ([a91fa8f](https://github.com/antares-sql/antares/commit/a91fa8ff54bbf1f8475666efd3a268a3a4f07f0c))
* **Linux:** ctrl+space shortcut not working ([ed3d35f](https://github.com/antares-sql/antares/commit/ed3d35f1319a1e2edcb8104f2045a71b9e9754a2))
* unable to delete by select all in left bar search, closes [#368](https://github.com/antares-sql/antares/issues/368) ([7725faf](https://github.com/antares-sql/antares/commit/7725fafe852479720fa619ced0970f2fa0099191))
* unable to update data on tables missing primary or unique key ([e0946f0](https://github.com/antares-sql/antares/commit/e0946f04f792d25c187ea56d4714bdacc016ada3))


### Improvements

* improved resize of text editor resizing console height ([3f9e6d8](https://github.com/antares-sql/antares/commit/3f9e6d85ca445eea1028effa32418eee4980f87d))
* **UI:** improved visibility of explore bar tooltips ([f312cf5](https://github.com/antares-sql/antares/commit/f312cf5f855deddd562c26d1835f78d16499b93b))

### [0.5.9](https://github.com/antares-sql/antares/compare/v0.5.8...v0.5.9) (2022-07-06)


### Features

* ability to pin/unpin and delete connections from the "all connections" modal ([8e70570](https://github.com/antares-sql/antares/commit/8e705706aecc5c9790329e63e61a1c02fa5d0342))
* connections sorted by last usage by default and option to pin them ([36e98e0](https://github.com/antares-sql/antares/commit/36e98e0742657e25df7768aa5b3b7cb350df5509))
* ctrl/cmd+space to open all connections modal ([a9a4344](https://github.com/antares-sql/antares/commit/a9a4344a71cc0f8f156b839733f6ddc200a26268))
* modal with all connections ([a703dcc](https://github.com/antares-sql/antares/commit/a703dcc53eb920117bc346a3c21f0c729c0ad96d))
* option to disable scratchpad ([56b0a48](https://github.com/antares-sql/antares/commit/56b0a4815c6f54eef164d849f6ca25af1e142b16))
* search form in all connections modal ([ec5ab73](https://github.com/antares-sql/antares/commit/ec5ab73b19d99e9971ae87e5f0a8d1bd1c34ef00))


### Bug Fixes

* error on export schema ([cf9c7c6](https://github.com/antares-sql/antares/commit/cf9c7c600aa915cef1ec3777866badb7ab1312ee))
* missing option for untrusted ssl connection on connections edit panel ([71a5b5c](https://github.com/antares-sql/antares/commit/71a5b5c8285fb777c43e7f6516006bfe9f52591c))


### Improvements

* **UI:** improved focus visibility for buttons ([d2eb31a](https://github.com/antares-sql/antares/commit/d2eb31a63d612323f8738eded1e1ce7b23554001))

### [0.5.8](https://github.com/antares-sql/antares/compare/v0.5.7...v0.5.8) (2022-07-02)


### Features

* add max visible options prop ([067a6f3](https://github.com/antares-sql/antares/commit/067a6f350757c1e6b4df51f801ae832b47bd3484))
* context shortcut to disconnect from left bar ([e97da37](https://github.com/antares-sql/antares/commit/e97da3710385690b85391938e40145a1591bc2e8))
* **MySQL:** option to disable foreign key checks when empty a table ([902c29f](https://github.com/antares-sql/antares/commit/902c29ffa551bc3489fa1d9136ee926d135ea14f))


### Bug Fixes

* connection string field doesn't appear switching to postgre when editing a connection ([6573fe6](https://github.com/antares-sql/antares/commit/6573fe69aca2b99c7a700879fb0d0930e864cbe6))
* ctrl+a on results doesn't work properly ([5f57a9f](https://github.com/antares-sql/antares/commit/5f57a9f60d281e24e5bee4330c081fa5d8651b36))
* double context menu on table settings rows ([91d0735](https://github.com/antares-sql/antares/commit/91d0735a5f4861bc6ad13b9285ea7a9bd7be9538))
* editor gutter pin not working ([cfd82c8](https://github.com/antares-sql/antares/commit/cfd82c8f419952879b386187eb146847098263fe))
* error on modals missing focusable elements ([7702ca0](https://github.com/antares-sql/antares/commit/7702ca025fcae6209ae3851d0ccd25579f93e243))
* exception on new scheduler tab ([a45d76e](https://github.com/antares-sql/antares/commit/a45d76e8b4ecdecf53438fe174f61ea32f4e10ac))
* focus goes outside modals with tab key navigation ([e42c424](https://github.com/antares-sql/antares/commit/e42c424a13a6901414a1a1c4e2f68cb4ddef7d59))
* reactivity problem on BaseVirtualScroll component ([45b2eb2](https://github.com/antares-sql/antares/commit/45b2eb2934b9f7a08f379ad4d7a44b1c89585449))
* result table cells/rows not loses focus clicking outside ([0a3a482](https://github.com/antares-sql/antares/commit/0a3a4827dd75539666fa2c827415af3bfa224543))
* **UI:** wrong tables scrollable height after switching tabs ([8f01740](https://github.com/antares-sql/antares/commit/8f01740475ea6d5d9b5eefabdbf27099df76f2cf))
* **Windows:** white window buttons with dark theme ([a80d227](https://github.com/antares-sql/antares/commit/a80d22740045a61fd14fd5da401c0d123d54f4de))
* **Windows:** Windows 7 style window frame at startup ([93ce619](https://github.com/antares-sql/antares/commit/93ce619782d58cfb8fb1ecce2ca2137a61ec6181))

### [0.5.7](https://github.com/antares-sql/antares/compare/v0.5.4...v0.5.7) (2022-06-19)


### Features

* added dropdown animation ([5398964](https://github.com/antares-sql/antares/commit/539896419064db9127f6a72acdbb11af2c4aa60a))
* dynamic app window title ([0024269](https://github.com/antares-sql/antares/commit/00242697a102f82dd0c731a3529c984fbdf83b3e))
* hotkeys to navigate forward or backward between tabs ([d3b9e08](https://github.com/antares-sql/antares/commit/d3b9e08446708654b3c6fad565b734d93effe683))
* hotkeys to navigate inside a table resultset ([49abd1e](https://github.com/antares-sql/antares/commit/49abd1ea7f5ec368e9a9201f8fd5b6520c4bd0a8))
* **translation:** russian translation, closes [#266](https://github.com/antares-sql/antares/issues/266) ([9082960](https://github.com/antares-sql/antares/commit/9082960310573a6e4d14bfbe82ed2eb1489f308d))
* **UI:** BaseSelect disabled state ([2b436d8](https://github.com/antares-sql/antares/commit/2b436d8613a1e3dff55d73adbddf5d2cd2452f27))
* **UI:** BaseSelect in table filters ([a037d0c](https://github.com/antares-sql/antares/commit/a037d0cc0148444e8e6c5b87c79f6ba9c2a6f0fe))
* **UI:** BaseSelect option list scrolls automatically using up/down keys ([0043d07](https://github.com/antares-sql/antares/commit/0043d077081fc49724722a5d5a74986d990c539d))
* **UI:** BaseSelect small variant ([5582a12](https://github.com/antares-sql/antares/commit/5582a12bbfade75dbcc7f9d71ada7190ed08d3c2))
* **UI:** BaseSelect supports disabled options ([f7e04d6](https://github.com/antares-sql/antares/commit/f7e04d633340a53420ce1c434e906c9434620e6e))
* **UI:** BaseSelect supports option groups ([1869e6a](https://github.com/antares-sql/antares/commit/1869e6a1482daf9381d9ac2244bf0aeffa758edc))
* **UI:** ForeignKeySelect implements BaseSelect component ([302c664](https://github.com/antares-sql/antares/commit/302c66457deeb50facf4735291640fcf48b78f66))
* **UI:** initial BaseSelect integration ([22622df](https://github.com/antares-sql/antares/commit/22622df2cfcb71054c6f6110b7ad9d4f635553dc))
* **UI:** new BaseSelect component ([745d551](https://github.com/antares-sql/antares/commit/745d551cc9253eae4e39e5d3406ceee051a7d6c1))
* **UI:** select tab replace with BaseSelect component ([42bc919](https://github.com/antares-sql/antares/commit/42bc9196ffc2f64b77f9cb42136255fc74815034))


### Bug Fixes

* empty query tab schema select if no schema selected ([31b7999](https://github.com/antares-sql/antares/commit/31b7999bba5d115913d42087614b9888bc761068))
* exception on app start setting window title ([5b33419](https://github.com/antares-sql/antares/commit/5b33419b6421d7d198a978e79e22d0a76306cdb4))
* fields sorting in table setting tabs ([77d9cac](https://github.com/antares-sql/antares/commit/77d9cac092fbb806810c3463ca066395fcab5307))
* inline field update not working with tables missing primary key ([caf776b](https://github.com/antares-sql/antares/commit/caf776bd55606c793c9763c204aa9f05d1feb27f))
* **Linux:** setting bar tooltip position ([6bad032](https://github.com/antares-sql/antares/commit/6bad032f0d1094736f651b6c06a60d2a0df36c98))
* main process not closed after window close on some conditions ([23acf00](https://github.com/antares-sql/antares/commit/23acf00def77b5662e48b84591a31760737774a7))
* **PostgreSQL:** idle timeout disabled ([a082514](https://github.com/antares-sql/antares/commit/a082514f88040c7e0ffdf4e8357bab45370a4c39))
* query tab content disappears reordering or closing other tabs, closes [#261](https://github.com/antares-sql/antares/issues/261) ([c5baf2b](https://github.com/antares-sql/antares/commit/c5baf2b0d379fdd28ee8cb907628bbfca940e2f6))
* reload tab content on tab sort ([d214c1f](https://github.com/antares-sql/antares/commit/d214c1f35ba231a8a01dbe8c0faad07d4b337752))
* selected foreign key value not visible in the insert row modal ([cba2ce2](https://github.com/antares-sql/antares/commit/cba2ce2e37cedbf0b242cc474b37bf052009ae62))
* **SQLite:** unable to insert rows with TEXT fields ([a7d5e19](https://github.com/antares-sql/antares/commit/a7d5e1973cd59d7d0ef1e74bdcf44d87fba43559))
* SSH tunnel connection error with private key, closes [#260](https://github.com/antares-sql/antares/issues/260) ([c826888](https://github.com/antares-sql/antares/commit/c826888b0dd0908958a4f727ddfa642e846269cf))
* **UI:** BaseSelect keyboard navigation ([7c45203](https://github.com/antares-sql/antares/commit/7c452036368fa0db6b9cde7c35e60a8e57bfece7))
* **UI:** BaseSelect style ([71b0736](https://github.com/antares-sql/antares/commit/71b0736d0ddbd599ab41cde0a6b0823e2bb7da2f))
* **UI:** select closes clicking on scrollbar ([8870304](https://github.com/antares-sql/antares/commit/8870304c15346257a90193807b9ae07c1393e3e2))
* unable to add new table fields ([ee623b0](https://github.com/antares-sql/antares/commit/ee623b0a0f121df0ac53d49d8be437c76ddb8539))


### Improvements

* improved precision of MariaDB or MySQL auto detection ([26aad51](https://github.com/antares-sql/antares/commit/26aad519df6ea1bbc7dffbf540193a7b2ed9ae2a))
* **Linux:** title bar improvements ([85cec05](https://github.com/antares-sql/antares/commit/85cec05f7037a1339ee223554cf127693a527aa1))
* **UI:** max height for query text area increased ([5d5f1da](https://github.com/antares-sql/antares/commit/5d5f1da97b9adfa743197d8fa0bbb6addd565a7a))
* **Windows:** title bar improvements ([5fa8bf3](https://github.com/antares-sql/antares/commit/5fa8bf38e433ef2fb31bcb893cd9e75549bd6a49))

### [0.5.6](https://github.com/antares-sql/antares/compare/v0.5.4...v0.5.6) (2022-06-02)

### Bug Fixes

* empty query tab schema select if no schema selected ([31b7999](https://github.com/antares-sql/antares/commit/31b7999bba5d115913d42087614b9888bc761068))
* inline field update not working with tables missing primary key ([caf776b](https://github.com/antares-sql/antares/commit/caf776bd55606c793c9763c204aa9f05d1feb27f))
* **SQLite:** unable to insert rows with TEXT fields ([a7d5e19](https://github.com/antares-sql/antares/commit/a7d5e1973cd59d7d0ef1e74bdcf44d87fba43559))
* **UI:** select closes clicking on scrollbar ([8870304](https://github.com/antares-sql/antares/commit/8870304c15346257a90193807b9ae07c1393e3e2))


### Improvements

* improved precision of MariaDB or MySQL auto detection ([26aad51](https://github.com/antares-sql/antares/commit/26aad519df6ea1bbc7dffbf540193a7b2ed9ae2a))

### [0.5.5](https://github.com/antares-sql/antares/compare/v0.5.4...v0.5.5) (2022-05-24)


### Features

* added dropdown animation ([5398964](https://github.com/antares-sql/antares/commit/539896419064db9127f6a72acdbb11af2c4aa60a))
* **translation:** russian translation, closes [#266](https://github.com/antares-sql/antares/issues/266) ([9082960](https://github.com/antares-sql/antares/commit/9082960310573a6e4d14bfbe82ed2eb1489f308d))
* **UI:** BaseSelect disabled state ([2b436d8](https://github.com/antares-sql/antares/commit/2b436d8613a1e3dff55d73adbddf5d2cd2452f27))
* **UI:** BaseSelect in table filters ([a037d0c](https://github.com/antares-sql/antares/commit/a037d0cc0148444e8e6c5b87c79f6ba9c2a6f0fe))
* **UI:** BaseSelect option list scrolls automatically using up/down keys ([0043d07](https://github.com/antares-sql/antares/commit/0043d077081fc49724722a5d5a74986d990c539d))
* **UI:** BaseSelect small variant ([5582a12](https://github.com/antares-sql/antares/commit/5582a12bbfade75dbcc7f9d71ada7190ed08d3c2))
* **UI:** BaseSelect supports disabled options ([f7e04d6](https://github.com/antares-sql/antares/commit/f7e04d633340a53420ce1c434e906c9434620e6e))
* **UI:** BaseSelect supports option groups ([1869e6a](https://github.com/antares-sql/antares/commit/1869e6a1482daf9381d9ac2244bf0aeffa758edc))
* **UI:** ForeignKeySelect implements BaseSelect component ([302c664](https://github.com/antares-sql/antares/commit/302c66457deeb50facf4735291640fcf48b78f66))
* **UI:** initial BaseSelect integration ([22622df](https://github.com/antares-sql/antares/commit/22622df2cfcb71054c6f6110b7ad9d4f635553dc))
* **UI:** new BaseSelect component ([745d551](https://github.com/antares-sql/antares/commit/745d551cc9253eae4e39e5d3406ceee051a7d6c1))
* **UI:** select tab replace with BaseSelect component ([42bc919](https://github.com/antares-sql/antares/commit/42bc9196ffc2f64b77f9cb42136255fc74815034))


### Bug Fixes

* **PostgreSQL:** idle timeout disabled ([a082514](https://github.com/antares-sql/antares/commit/a082514f88040c7e0ffdf4e8357bab45370a4c39))
* query tab content disappears reordering or closing other tabs, closes [#261](https://github.com/antares-sql/antares/issues/261) ([c5baf2b](https://github.com/antares-sql/antares/commit/c5baf2b0d379fdd28ee8cb907628bbfca940e2f6))
* SSH tunnel connection error with private key, closes [#260](https://github.com/antares-sql/antares/issues/260) ([c826888](https://github.com/antares-sql/antares/commit/c826888b0dd0908958a4f727ddfa642e846269cf))
* **UI:** BaseSelect keyboard navigation ([7c45203](https://github.com/antares-sql/antares/commit/7c452036368fa0db6b9cde7c35e60a8e57bfece7))
* **UI:** BaseSelect style ([71b0736](https://github.com/antares-sql/antares/commit/71b0736d0ddbd599ab41cde0a6b0823e2bb7da2f))


### Improvements

* **UI:** max height for query text area increased ([5d5f1da](https://github.com/antares-sql/antares/commit/5d5f1da97b9adfa743197d8fa0bbb6addd565a7a))

### [0.5.4](https://github.com/antares-sql/antares/compare/v0.5.3...v0.5.4) (2022-05-10)


### Bug Fixes

* app blocked by BIT fields with no default, closes [#256](https://github.com/antares-sql/antares/issues/256) ([e62f280](https://github.com/antares-sql/antares/commit/e62f280528edb0ff4550ee75038ea216e81e4f10))
* file upload input not working ([58611bf](https://github.com/antares-sql/antares/commit/58611bf07f343e6899a7446bfcd1247b0c75fc7f))
* SSH tunnel not working ([6d61518](https://github.com/antares-sql/antares/commit/6d6151814e5006935d493b9b83dbda1aa5b35391))
* unable to insert auto-generated datetime fields ([ff27244](https://github.com/antares-sql/antares/commit/ff272440bdc2a7fe699e04f8809bd5af8f9529c0))


### Improvements

* **UI:** left alignment for numbers in result tables, closes [#249](https://github.com/antares-sql/antares/issues/249) ([e02565c](https://github.com/antares-sql/antares/commit/e02565c0d9bb63efa76a79f38e3ed3586a30ad1c))

### [0.5.3](https://github.com/antares-sql/antares/compare/v0.5.2...v0.5.3) (2022-05-08)


### Features

* default open schema if only one present ([0fa22fb](https://github.com/antares-sql/antares/commit/0fa22fbe72fd4e3b2cfff6fc1847347f69fafda6))


### Bug Fixes

* can not use vue teleport with props as root element ([88eb9f7](https://github.com/antares-sql/antares/commit/88eb9f7ab80c407ec6517206c27cce715c41eb24))
* importer webpack config ([f82db96](https://github.com/antares-sql/antares/commit/f82db96f34579c5f5f0c025ba82aff13047eb045))
* importer webpack config ([b4d9821](https://github.com/antares-sql/antares/commit/b4d9821300991bf000846ae38ed18d79564db67b))
* LIKE operator in table filter not properly working, closes [#242](https://github.com/antares-sql/antares/issues/242) ([eb1afed](https://github.com/antares-sql/antares/commit/eb1afed108d97e2acb7ea5279aabd582014c3c58))
* locale change ([6af0c33](https://github.com/antares-sql/antares/commit/6af0c33461dfab868bca757e55ae62e6c6094c6c))
* missing storeToRefs imports ([ff8bb45](https://github.com/antares-sql/antares/commit/ff8bb45d6d19303b2e7701639d22e52e4ae2976c))
* missing tabs uid ([18b66b5](https://github.com/antares-sql/antares/commit/18b66b50323e69ed9d0090a4cbbe0ada9e10838d))
* **MySQL:** creating temporary tables on export to overcome view dependency errors ([e4c5d9b](https://github.com/antares-sql/antares/commit/e4c5d9b404c2b20cf113607a80ee928b810e6f05))
* **MySQL:** support to ANSI_QUOTES mode not working, closes [#243](https://github.com/antares-sql/antares/issues/243) ([9fcc7d1](https://github.com/antares-sql/antares/commit/9fcc7d1cefc3c035a63e843616c3138c772037f1))
* prevents query tabs targets previous schema if not in explorebar, closes [#236](https://github.com/antares-sql/antares/issues/236) ([5e4abd3](https://github.com/antares-sql/antares/commit/5e4abd3e81d70bcb9b3a897d38d6f8ec3ff0706b))
* query editor table fields suggestion ([e9dedfa](https://github.com/antares-sql/antares/commit/e9dedfaf3203f5621e54fd707003a47e6e5a5c4d))
* **SQLite:** tables with sqlite in name not visible, closes [#239](https://github.com/antares-sql/antares/issues/239) ([690cdcb](https://github.com/antares-sql/antares/commit/690cdcb2eb1c7bf514271000c31211d1c0b33e54))
* unable to add parameters to new routines/functions ([350d536](https://github.com/antares-sql/antares/commit/350d53642e2491fd2dedbbf999579ba9c9bc59a0))
* unable to disconnect from database ([47e1f27](https://github.com/antares-sql/antares/commit/47e1f27bb83b99288157185ad8b62d190a9e7881))
* unable to set an empty string as field default ([bfdb463](https://github.com/antares-sql/antares/commit/bfdb463390453a55963af29ef0e7cd3aea26f4cf))
* undefined uid variable in the setting bar ([3cca3ed](https://github.com/antares-sql/antares/commit/3cca3ed2b31c5763794c52cce34ccba1e848efe2))
* various warnings and exceptions ([c50cbc5](https://github.com/antares-sql/antares/commit/c50cbc577f667c17ba676960cf2c840d24366c80))
* verbose devtool loggin with missing sourcemap ([1174bab](https://github.com/antares-sql/antares/commit/1174bab0cc895c4e294804d810b0789166602725))
* wrong path module importation ([472fa6f](https://github.com/antares-sql/antares/commit/472fa6f4300b7e3fbf8c8079a548ca34d941f5fb))
* wrong path module importation ([9a0f982](https://github.com/antares-sql/antares/commit/9a0f98272342d201e9bc979d5bc5768cfd20f3fb))

### [0.5.2](https://github.com/antares-sql/antares/compare/v0.5.1...v0.5.2) (2022-04-10)


### Features

* **core:** option to allow untrusted SSL connections ([6cc098c](https://github.com/antares-sql/antares/commit/6cc098c6f02fb52cc71c0141431ab75f12744a1c))
* french translation updated, closes [#222](https://github.com/antares-sql/antares/issues/222) ([796f61b](https://github.com/antares-sql/antares/commit/796f61bf2feab0da515901e2137dc7bf04371d7d))
* **PostgreSQL:** export functions and procedures ([a8ca8f2](https://github.com/antares-sql/antares/commit/a8ca8f2f76ab36c4afe84d602709386315f4b7d1))
* **PostgreSQL:** export tables ([a67071e](https://github.com/antares-sql/antares/commit/a67071e28470bcbd0ec26780bb86f3c65750ded8))
* **PostgreSQL:** export triggers ([42376b4](https://github.com/antares-sql/antares/commit/42376b4bc6dd8b630402d09b026d9fbc0b8646bb))
* **PostgreSQL:** export user-defined types before tables ([bb02479](https://github.com/antares-sql/antares/commit/bb02479b71bf75a6e69e28af57c5fe213d3f30bc))
* **PostgreSQL:** export views ([86f011f](https://github.com/antares-sql/antares/commit/86f011f34fec9d6829bce324493fea888a863ffc))
* **PostgreSQL:** sql dump importer ([6086ca4](https://github.com/antares-sql/antares/commit/6086ca4a80b9ad6a07086446253d781f052d3abc))


### Bug Fixes

* **PostgreSQL:** wrong values exporting table content ([0f9c991](https://github.com/antares-sql/antares/commit/0f9c991f539560913fa0e9361a16e6448a066a27))
* ssh tunnel not properly working, closes [#220](https://github.com/antares-sql/antares/issues/220) ([026d74c](https://github.com/antares-sql/antares/commit/026d74c8c88c605a3c8c963c211078f5b3dcfda1))


### Improvements

* **PostgreSQL:** improved dump file ([408dded](https://github.com/antares-sql/antares/commit/408ddeda5634ab6bf41eff760271669170b60eb6))
* **PostgreSQL:** improved views exportation ([638a88a](https://github.com/antares-sql/antares/commit/638a88a1fb35c048ff4c6d120aaaef831c846f58))

### [0.5.1](https://github.com/Fabio286/antares/compare/v0.5.0...v0.5.1) (2022-03-25)


### Features

* export database as zip sql file ([8f3efab](https://github.com/Fabio286/antares/commit/8f3efabb6962c55c23a43c8da1433185dbc3fb41))
* **UI:** option to disable blur effects, closes [#209](https://github.com/Fabio286/antares/issues/209) ([e9079ad](https://github.com/Fabio286/antares/commit/e9079adb25ec28e9546acd54bc2565b8d6e28120))


### Bug Fixes

* numeric scale displayed on non decimal fields ([db628f7](https://github.com/Fabio286/antares/commit/db628f77226b161c3df31b7450b92a6e58754ab7))
* **UI:** connection buttons out of screen on small displays, closes [#213](https://github.com/Fabio286/antares/issues/213) ([f12e6a9](https://github.com/Fabio286/antares/commit/f12e6a96dd66140b06c55eda775af48a666627dd))

## [0.5.0](https://github.com/Fabio286/antares/compare/v0.4.4...v0.5.0) (2022-03-12)


### Features

* delete dump file when the export is canceled ([d25c62b](https://github.com/Fabio286/antares/commit/d25c62b4da9480e040d0bfac8b76732a4c69a5f1))
* initial db export implementation ([0de2321](https://github.com/Fabio286/antares/commit/0de232192076d1de827424c593ac9dff63903531))
* initial mysql import support ([4e9f8d1](https://github.com/Fabio286/antares/commit/4e9f8d16ee3c204d5f0c2bed081206f8b38207a6))
* mysql export for trigger, views, schedulers, functions and routines ([b2a5b40](https://github.com/Fabio286/antares/commit/b2a5b40c03d56bced5a7968c3454f36060e56dd0))
* **MySQL:** enhance export characters escaping ([3be826d](https://github.com/Fabio286/antares/commit/3be826df4b02ff0df0aa922d96755b31b7155784))
* **MySQL:** support to multi spatial fields export ([4be55f3](https://github.com/Fabio286/antares/commit/4be55f3fe9bb48324b780734762f2ff6da2ccb61))
* **PostgreSQL:** :sparkles: Postgress connection string feature for local and server connection string ([6305752](https://github.com/Fabio286/antares/commit/6305752ad117cc29c04bce3ce3df321f743cdc44))
* **PostgreSQL:** :sparkles: Postgress connection string feature for local and server connection string ([f4a63ea](https://github.com/Fabio286/antares/commit/f4a63eae2aca2a84647a5027137614950aef1eac))
* **UI:** auto-refresh schema at the end of the import process ([abf2b92](https://github.com/Fabio286/antares/commit/abf2b92e6e66b6668e698c5addf4e3c00ae5157b))
* **UI:** better real-time import stats ([a6f5645](https://github.com/Fabio286/antares/commit/a6f5645a226454cc2c415311ac321ba3d4db4454))
* **UI:** toggle tables checkbox by column on export modal ([1c4d5b0](https://github.com/Fabio286/antares/commit/1c4d5b05b3f94b3e7bef930aa7f89bdaa596c0b9))


### Bug Fixes

* **MySQL:** exception exporting empty procedures/functions ([ee415da](https://github.com/Fabio286/antares/commit/ee415da127d6d0de95aac901a2a01af863736344))
* **MySQL:** export crash with large databases ([8cf738b](https://github.com/Fabio286/antares/commit/8cf738bac85698fddd0504eef7844279e8c11f44))
* **MySQL:** missing functions and procedures definer escapes on exporter ([f0351e5](https://github.com/Fabio286/antares/commit/f0351e5b94830f9f52256096c2601b0ca9cd811d))
* **MySQL:** missing initial delimiter for exported procedures ([1a9fc37](https://github.com/Fabio286/antares/commit/1a9fc3728580f789727256d7893ca4bb90c16a50))
* **MySQL:** procedures exportation ([4276586](https://github.com/Fabio286/antares/commit/4276586e1141500401ff1ab570b29e485f459987))
* sql parser hangs during import ([7a6bd8b](https://github.com/Fabio286/antares/commit/7a6bd8bdbd69e3b5fe265d0bb0be844699dd77c2))
* wrong schema and table size on explore bar ([4479a96](https://github.com/Fabio286/antares/commit/4479a9600b5e59ef1bcf9135d661b4d7900a4bde))
* wrong soft sort algorithm for numeric fields, closes [#199](https://github.com/Fabio286/antares/issues/199) ([763be85](https://github.com/Fabio286/antares/commit/763be8532d2b61d0b4d45e72343f6a2e5fee1db9))


### Improvements

* avoid to load schema elements if already loaded in export modal ([d9d3bf2](https://github.com/Fabio286/antares/commit/d9d3bf2bc9d39ce8eec5dffbecbf767fbcf47782))
* **MySQL:** import performance improvement ([f444746](https://github.com/Fabio286/antares/commit/f444746f465ed0e8bd2e4c007faf17e167814278))
* **MySQL:** import tasks managed with async queue ([bbe13f2](https://github.com/Fabio286/antares/commit/bbe13f27dc29f997898f8c13f36b5d582770b21d))
* **MySQL:** improved several field types support on exporter ([1990d9a](https://github.com/Fabio286/antares/commit/1990d9a3d441f0e2075ac7e893d5b166275c48c0))
* **MySQL:** prevent memory leak on large dump import ([f3759b6](https://github.com/Fabio286/antares/commit/f3759b65411a40d92b98208176cdf8e6dd8230ce))
* **PostgreSQL:** :zap: Postgres connection update, better error handling and connection string accommodation. ([330a80f](https://github.com/Fabio286/antares/commit/330a80fe70b81f466f5e883029f42087b4b5c411))
* split the export select query to avoid running out of memory ([409ed54](https://github.com/Fabio286/antares/commit/409ed54608ad402b63fcc26a6e724bc447ba89d2))
* use fork() for the export process ([748d449](https://github.com/Fabio286/antares/commit/748d44977e76c6c8d6344df52e8e3ccfab84f670))
* use fork() for the import process ([573ac6d](https://github.com/Fabio286/antares/commit/573ac6d42ef833f250d102e5b30ae6cf5877f330))

### [0.4.4](https://github.com/Fabio286/antares/compare/v0.4.3...v0.4.4) (2022-02-27)


### Features

* execution notification for ROLLBACK and COMMIT ([76743e8](https://github.com/Fabio286/antares/commit/76743e8f7c02b824cb21540bfbcbe66ba43de8fa))
* **MySQL:** manual commit mode ([4ed2f9a](https://github.com/Fabio286/antares/commit/4ed2f9a93937b4293436a64318b7d6ae3a0d93c2))
* **PostgreSQL:** manual commit mode ([d81e091](https://github.com/Fabio286/antares/commit/d81e0911ab82fb75745ab11e67e867a00d8ac273))
* reminder for uncommitted changes closing a tab ([5bfff64](https://github.com/Fabio286/antares/commit/5bfff649e92f6fe5aba4b16aa4c8d5a5a70b31b2))
* **SQLite:** manual commit mode ([7dcd444](https://github.com/Fabio286/antares/commit/7dcd4441c49fafc0f47e12c2129708fe1092e1a4))


### Bug Fixes

* bigint support, closes [#197](https://github.com/Fabio286/antares/issues/197) ([b703955](https://github.com/Fabio286/antares/commit/b7039553ccaac4fd59e521530c4a053922854130))
* **MySQL:** default value not displayed for DECIMAL fields ([fa3f3e1](https://github.com/Fabio286/antares/commit/fa3f3e1fd8101f19f18df71e90d60fd37cdddaee))
* zero-padded bit fields beyond length ([265f28b](https://github.com/Fabio286/antares/commit/265f28b4d94cde4608a1d6d3d306824134808ec2))

### [0.4.3](https://github.com/Fabio286/antares/compare/v0.4.2...v0.4.3) (2022-01-30)


### Features

* add Simplified Chinese translation ([6ef565c](https://github.com/Fabio286/antares/commit/6ef565cf078cb3f5b7bcdc226894cddeb6239db9))
* **MySQL:** spatial fields support ([#165](https://github.com/Fabio286/antares/issues/165)) ([48ebf23](https://github.com/Fabio286/antares/commit/48ebf23bd1574408f429f2e1200ce878352007f6))


### Bug Fixes

* cell copy returns "undefined" in some conditions, closes [#170](https://github.com/Fabio286/antares/issues/170) ([8fb1f08](https://github.com/Fabio286/antares/commit/8fb1f0803efd9df0b66521e73bb6e1a229cf9691))
* indexes and foreign keys not cleared after deletion of related field, closes [#182](https://github.com/Fabio286/antares/issues/182) ([9f033fb](https://github.com/Fabio286/antares/commit/9f033fb994916b4fb165e81e55e86127ca817791))
* **PostgreSQL:** schema different than public not automatically selected, closes [#172](https://github.com/Fabio286/antares/issues/172) ([46b45c8](https://github.com/Fabio286/antares/commit/46b45c8ab64fb6837a532c4f8342167e4fd794bb))
* scale on numeric fields that doesn't support it ([0cfd793](https://github.com/Fabio286/antares/commit/0cfd7938ee7d607dbad66ae452d0200223a6bab2))
* **Windows:** temporary fix to Windows 7 style frame on app startup, closes [#169](https://github.com/Fabio286/antares/issues/169) ([1356011](https://github.com/Fabio286/antares/commit/1356011ba3b7dd72e12cb252a8787ce48a364fd4))


### Improvements

* support of scale in field's length setting ([eef7c1d](https://github.com/Fabio286/antares/commit/eef7c1dcecc6593ab0e69ed678187a57fe0a4fb6))

### [0.4.2](https://github.com/Fabio286/antares/compare/v0.4.1...v0.4.2) (2022-01-10)


### Features

* **MySQL:** ability to cancel queries ([a59f77f](https://github.com/Fabio286/antares/commit/a59f77f618aea6156fc80fb832d3efcb9848411f))
* **PostgreSQL:** ability to cancel queries ([0c00291](https://github.com/Fabio286/antares/commit/0c002918eb0226f6b3f21ed62117495f86396fb1))
* save window state ([8f9385d](https://github.com/Fabio286/antares/commit/8f9385d50815635d091758ecd5d00884e3297ca0))
* **UI:** textarea autofocus selecting a query tab, closes [#166](https://github.com/Fabio286/antares/issues/166) ([b4545b1](https://github.com/Fabio286/antares/commit/b4545b178f795712c781a3f4fc35eec31b5ad902))


### Bug Fixes

* **SQLite:** exception with some fields ([e7a1858](https://github.com/Fabio286/antares/commit/e7a18580915e7739bfa97948c6a0c4fc90a7e78a))


### Improvements

* hash for foreign key default names ([48c3e6a](https://github.com/Fabio286/antares/commit/48c3e6afc43c51f70a16703f1a71194f43da7a3e))
* **MySQL:** support to ANSI_QUOTES sql_mode, closes [#158](https://github.com/Fabio286/antares/issues/158) ([d9a3eab](https://github.com/Fabio286/antares/commit/d9a3eab015302e9f23112f659658073ab3242191))

### [0.4.1](https://github.com/Fabio286/antares/compare/v0.4.0...v0.4.1) (2021-12-11)


### Features

* language format detection for text fields ([a5fdcc1](https://github.com/Fabio286/antares/commit/a5fdcc1a85aa188ff1b9a15b1a768aced026f360))


### Bug Fixes

* cell disappear on edit in one column tables ([aaa5549](https://github.com/Fabio286/antares/commit/aaa5549609664665bd4513632d621cb249b379c1))
* false positive with Windows Defender ([992a033](https://github.com/Fabio286/antares/commit/992a033cb2bede3d1eb52e19482d810f6692de1e))
* **MySQL:** wrong datetime fields default in table filler in some cases ([8da0224](https://github.com/Fabio286/antares/commit/8da022487650039b7f34a9c86a7bd9045eba65e2))
* **MySQL:** wrong value for fields "on update" in some conditions ([359e14a](https://github.com/Fabio286/antares/commit/359e14a9ebd48f86069ba7762fe00a7056f52d47))
* select all rows with ctrl+a when editing a cell ([35cb7e1](https://github.com/Fabio286/antares/commit/35cb7e1dc48d3a74e9d106cb1a37f454c1b4a4d1))
* **SQLite:** update rows with a text primary key ([d7f1aa9](https://github.com/Fabio286/antares/commit/d7f1aa97af32a4c51fc7022498bd47e15fa08430))


### Improvements

* **UI:** avoid columns size change when editing cells or scrolling results ([813aa32](https://github.com/Fabio286/antares/commit/813aa320d9ab799efea38a7110b7c0bdf7549123))
* **UI:** disable save button in table creation when no fields are added ([e8af2d2](https://github.com/Fabio286/antares/commit/e8af2d24a869f7667c069936648808952d2062ab))

## [0.4.0](https://github.com/Fabio286/antares/compare/v0.3.9...v0.4.0) (2021-11-24)


### Features

* **MySQL:** read-only mode ([4437d44](https://github.com/Fabio286/antares/commit/4437d44486c4f20b0bec4bf89d56016b08e36e79))
* **PostgreSQL:** read-only mode ([5d48fe0](https://github.com/Fabio286/antares/commit/5d48fe08c77755ed18b3f7a9ea834268e317e7ef))
* **SQLite:** cell update in data tabs ([604b371](https://github.com/Fabio286/antares/commit/604b3719204f7473ce4846624f08f8be9eec8b8f))
* **SQLite:** connection add/edit masks ([c54438d](https://github.com/Fabio286/antares/commit/c54438d6d3bad38bc76dfcd61f58929fe30279cb))
* **SQLite:** keys support ([fd321be](https://github.com/Fabio286/antares/commit/fd321beece075d3ad23fdd8541f9beb5727045a5))
* **SQLite:** readonly mode ([3fc227d](https://github.com/Fabio286/antares/commit/3fc227d2de53aae115226ad3c965bfb6e9f3eca6))
* **SQLite:** table data visualization ([f2fcc98](https://github.com/Fabio286/antares/commit/f2fcc9883972402eab4d51ef2a9796638dde2d3d))
* **SQLite:** tables management ([3efeb45](https://github.com/Fabio286/antares/commit/3efeb45c460f178b794de72367f8d542fd8ddd56))
* **SQLite:** triggers management ([f40e9c5](https://github.com/Fabio286/antares/commit/f40e9c592eeffd204aba21a0a0767a0c523fca49))
* **SQLite:** views management ([7671c58](https://github.com/Fabio286/antares/commit/7671c585f5f8049bd863db190d4fc60d8f0c6c66))


### Bug Fixes

* **SQLite:** hide schema creation ([98165ca](https://github.com/Fabio286/antares/commit/98165cacaa158c85ead0490d3caf579e2a17319f))
* **UI:** hide tools menu if no tools available ([da1947e](https://github.com/Fabio286/antares/commit/da1947e4efa7f0a26d6a231fadf750be055fbdd5))
* **UI:** notifications timeout anomalies ([cc99491](https://github.com/Fabio286/antares/commit/cc99491fe4a15812368f6c928b8c7801d7b255aa))


### Improvements

* **SQLite:** improvements in data visualization ([94c899e](https://github.com/Fabio286/antares/commit/94c899eb8288b41a5962ac3d24365227e1f9f485))
* **SQLite:** improvements in field length detection ([93b4a70](https://github.com/Fabio286/antares/commit/93b4a7063beeb5a7001cb06a74f05b23105212f5))
* update italian traslation ([9fe3680](https://github.com/Fabio286/antares/commit/9fe3680bbb17c192cffa85348e68794ab49beb81))

### [0.3.9](https://github.com/Fabio286/antares/compare/v0.3.8...v0.3.9) (2021-11-14)


### Features

* added macos basic shortcusts and menu ([430490a](https://github.com/Fabio286/antares/commit/430490ad93f3148962ced1f13a5330c79cd86b3b))
* **MySQL:** enable/disable schedulers from contextual menu ([5ca3a22](https://github.com/Fabio286/antares/commit/5ca3a22dc538b27a4bf6402f1288c4b9f5bc5a90))
* **MySQL:** scheduler status indicator in explore bar ([5c66824](https://github.com/Fabio286/antares/commit/5c668249cf102cd9d601f9f7b4943c7155775217))
* **PostgreSQL:** enable/disable triggers from contextual menu ([534659f](https://github.com/Fabio286/antares/commit/534659f9aee12eb5ac477f91bfe5d764387dc17e))
* schema size in explore bar ([fd25f88](https://github.com/Fabio286/antares/commit/fd25f881f95779709156cbad93a41d6b391f1a45))
* **UI:** double click on the title bar will toggle window fullscreen size ([a35566f](https://github.com/Fabio286/antares/commit/a35566f273322602abe434b8bd30817ba8885900))
* **UI:** improved topbar look&feel on MacOS ([7657d05](https://github.com/Fabio286/antares/commit/7657d05edfbeaed6a14eb337fc562da5126e6ba0))


### Bug Fixes

* copy&paste and basic usability on macOS ([1ddf8f0](https://github.com/Fabio286/antares/commit/1ddf8f0dbe22f94d6bffddf70636706d2d142ecf))
* **PostgreSQL:** bigint fetched as string instead of number, closes [#134](https://github.com/Fabio286/antares/issues/134) ([39b9a59](https://github.com/Fabio286/antares/commit/39b9a59143b457a96f0711a3b8588c92dd80e28d))
* row selection problems after a deletion fail, closes [#128](https://github.com/Fabio286/antares/issues/128) ([89fdd21](https://github.com/Fabio286/antares/commit/89fdd210ca48fc9ae399b195ea796c8523619627))
* temporary solution on MacOS for unsigned app updates ([c00fd13](https://github.com/Fabio286/antares/commit/c00fd1381f451ba7aace7047b28b904ddcaf18f0))


### Improvements

* **UI:** improved function and routine parameters modals ([d19f475](https://github.com/Fabio286/antares/commit/d19f475fc28c0367ada569cb634769fa618b48b4))

### [0.3.8](https://github.com/Fabio286/antares/compare/v0.3.7...v0.3.8) (2021-10-23)


### Features

* **UI:** CTRL+A to select all result rows ([4069ade](https://github.com/Fabio286/antares/commit/4069ade36df43e58f198dd1305778b5811824315))
* **UI:** ctrl|cmd+t, ctrl|cmd+w shortcut to open/close workspace tabs ([9046b85](https://github.com/Fabio286/antares/commit/9046b858b1e4608af4c01bc4d69e1a49d4009c07))
* **UI:** hide filter bar if there are no more rows in it ([9178805](https://github.com/Fabio286/antares/commit/91788054e6302e83cb4a7501ad6c3f72809cb3bb))
* **UI:** multi column table filters ([0e15c39](https://github.com/Fabio286/antares/commit/0e15c39797fe34f7a649f85ee62204682d45c98a))


### Bug Fixes

* **PostgreSQL:** issue with uppercase characters in table field names ([aef17be](https://github.com/Fabio286/antares/commit/aef17be36cfcf3a6325a954e80f973623e250405))
* query failure when a filter with a numeric value is used ([69cd083](https://github.com/Fabio286/antares/commit/69cd083054cae50d64475b9f1f5d7ebd39093e39))
* regression during resize results table on filters change ([7dc33c7](https://github.com/Fabio286/antares/commit/7dc33c78aa4152264cc6833437be9af9b8621867))


### Improvements

* **UI:** resize results table on filters change ([f9ee7d0](https://github.com/Fabio286/antares/commit/f9ee7d0450a1386800223d7b96849e06ae02aece))

### [0.3.7](https://github.com/Fabio286/antares/compare/v0.3.6...v0.3.7) (2021-10-08)


### Features

* support to SSH private keys with passphrase, closes [#118](https://github.com/Fabio286/antares/issues/118) ([9407a29](https://github.com/Fabio286/antares/commit/9407a29922812ab6aa3cf67569ba2f509433657c))
* **UI:** auto detect system theme as default app theme ([7a63608](https://github.com/Fabio286/antares/commit/7a63608f54e387d45e655855666041f5602b54b1))


### Bug Fixes

* closing ask credential modal during a connection doesn't stops loading, closes [#114](https://github.com/Fabio286/antares/issues/114) ([26446fb](https://github.com/Fabio286/antares/commit/26446fb7ed04216283736072d442786350252dbb))
* **PostgreSQL:** issue with uppercase characters in table and field names, closes [#116](https://github.com/Fabio286/antares/issues/116) ([2fcd080](https://github.com/Fabio286/antares/commit/2fcd080bd47367a21590ea5a754410a975959bdd))
* **UI:** window reload pressing enter in schema creation modal, closes [#113](https://github.com/Fabio286/antares/issues/113) ([db1641b](https://github.com/Fabio286/antares/commit/db1641b74fcd218f1f1d24163cba70b024cc6bd7))

### [0.3.6](https://github.com/Fabio286/antares/compare/v0.3.5...v0.3.6) (2021-09-26)


### Features

* copy cell/row or kill connections on context menu from processes list ([85f625d](https://github.com/Fabio286/antares/commit/85f625daf7026815dac6223a29c5a6479830edbb))
* processes list exportation ([13aa47c](https://github.com/Fabio286/antares/commit/13aa47cd4441aa47c93038dbd91d6a0e54f6a60c))
* workspace query history ([3959333](https://github.com/Fabio286/antares/commit/39593336626e6d9f3d3b65d2a4081388900e37d6))


### Bug Fixes

* adding a connection default values not change when switching clients, closes [#101](https://github.com/Fabio286/antares/issues/101) ([d4888ad](https://github.com/Fabio286/antares/commit/d4888ad8fba3c8e8ec2d6b6d9a78bb212d83eeed))


### Improvements

* **core:** better communication of internal exceptions ([abd46aa](https://github.com/Fabio286/antares/commit/abd46aa32256f822e52eaac2fc698da378b8163f))

### [0.3.5](https://github.com/Fabio286/antares/compare/v0.3.4...v0.3.5) (2021-09-13)


### Bug Fixes

* **MySQL:** connections stuck at startup if 5 or more tabs are restored ([95b60df](https://github.com/Fabio286/antares/commit/95b60df8fc634b96a4c2c5c48dc6b10848888978))

### [0.3.4](https://github.com/Fabio286/antares/compare/v0.3.3...v0.3.4) (2021-09-12)


### Features

* new create function tabs ([0203f69](https://github.com/Fabio286/antares/commit/0203f69e95093d25a7ef3e66df1c70f76edcedf2))
* new create routine tabs ([3fd26a0](https://github.com/Fabio286/antares/commit/3fd26a05238368ae375197c79d42162a5910bb07))
* new create scheduler tabs ([3c5a69a](https://github.com/Fabio286/antares/commit/3c5a69adc9cecdc4b8f46097676005f2a60f06cf))
* new create trigger function tabs ([09c07ac](https://github.com/Fabio286/antares/commit/09c07acd5c2a6ed2b75640dbb83e782ed432bc30))
* new create trigger tabs ([e217d51](https://github.com/Fabio286/antares/commit/e217d5181b37ec6304151120b4a2aba9455c6a84))
* start search when typing with focus on the left bar ([265ed66](https://github.com/Fabio286/antares/commit/265ed66d25d35be99ed0a6b1668dab9f246ed71e))


### Bug Fixes

* **UI:** context menu of tables cut if close to bottom edge ([21e3e79](https://github.com/Fabio286/antares/commit/21e3e79ddf9e292bcfc5881b8fa76a1dc58b207c))

### [0.3.3](https://github.com/Fabio286/antares/compare/v0.3.2...v0.3.3) (2021-08-22)


### Features

* new create table tabs ([c9fa941](https://github.com/Fabio286/antares/commit/c9fa9415787c3953043db5876a99b3664c69c071))
* new create view tabs ([8b93c49](https://github.com/Fabio286/antares/commit/8b93c497784ea431f9747c5afb53f6ef075ea9d6))
* new table empty state ([0842e00](https://github.com/Fabio286/antares/commit/0842e00098ba420412937aa52276ee33bda53693))


### Bug Fixes

* **MySQL:** editing a view causes error for missing database in some conditions ([4048df3](https://github.com/Fabio286/antares/commit/4048df3c7bc2d42a60f7a57c9a4b8b5b445fcd43))
* table options not loaded on restored setting tabs at startup ([622b519](https://github.com/Fabio286/antares/commit/622b519cbb5fbe4e38a4baffb8eab169b21eed21))
* **UI:** multiple temp tabs opened switching to tables from other elements ([b35fc5b](https://github.com/Fabio286/antares/commit/b35fc5b78bdbeff1422ef088441b17c8b0df663c))
* **UI:** no round borders on left of file upload inputs ([d5b2bde](https://github.com/Fabio286/antares/commit/d5b2bde2eaf8ff3e14f49cc26acdcb201b4cb15c))


### Improvements

* **UI:** element options in setting tabs accessible directly ([71e2c91](https://github.com/Fabio286/antares/commit/71e2c911ae23e86543b2af1fa885981ff271777d))
* **UI:** improved view setting tab ([1983686](https://github.com/Fabio286/antares/commit/198368605b084bd58fd6f7ca0b19895ba23a45e6))
* **UI:** primary app color on selected text backgrouns ([756d49b](https://github.com/Fabio286/antares/commit/756d49b2596dea58376c6afa8e0bad0cd62b146c))
* **UI:** visual improvements of tables ([bc82289](https://github.com/Fabio286/antares/commit/bc82289d54550a93300fe66d7a660aa70db2fd23))

### [0.3.2](https://github.com/Fabio286/antares/compare/v0.3.1...v0.3.2) (2021-08-06)


### Features

* contextual menu option to duplicate table fields ([3abff36](https://github.com/Fabio286/antares/commit/3abff3613618ddc86e1d6c898f83bcb360e8e5d9))
* **UI:** automatic scroll on selected tab ([e834fe3](https://github.com/Fabio286/antares/commit/e834fe31ac8b73f249e3ad8654e97da834b28cfe))
* **UI:** automatic scroll to selected tab element in left bar ([04fc1bb](https://github.com/Fabio286/antares/commit/04fc1bbee0cdc3b02288ff5d3b2c402633cae1f1))
* **UI:** button to clear sidebar search input ([1573de5](https://github.com/Fabio286/antares/commit/1573de5b1f545328523aaaaac541f5a8046617be))
* **UI:** query tab name based on content ([065de3a](https://github.com/Fabio286/antares/commit/065de3a0a28a9e6667df4e41ac1c5fa5561d2171))
* **UI:** shortcuts info on empty query tab ([70354aa](https://github.com/Fabio286/antares/commit/70354aa828121004f70e91d65cb9f0a4811dce57))


### Bug Fixes

* tab selected when clicking closing cross ([07ee1ae](https://github.com/Fabio286/antares/commit/07ee1ae828bb5f9971a263f2e39e73c760fed50a))


### Improvements

* approximate table total updated on table refresh ([dea3780](https://github.com/Fabio286/antares/commit/dea378014dd45bf90f51a599b4a801e0bc22059f))
* **UI:** loading animation on tables and table context menu improvements ([372049a](https://github.com/Fabio286/antares/commit/372049ae64232e8e61a974edc8be5b319c5c0811))
* update italian translation ([cbe0e29](https://github.com/Fabio286/antares/commit/cbe0e2980a9d4562941aec37a57cc936a46f41d8))

### [0.3.1](https://github.com/Fabio286/antares/compare/v0.3.0...v0.3.1) (2021-07-27)


### Bug Fixes

* **UI:** tabs or explorebar elements selected with mouse wheel or right button ([a8a47ed](https://github.com/Fabio286/antares/commit/a8a47ed5f7d5d8cbbdd6c33ef8307d9dce5b193b))

## [0.3.0](https://github.com/Fabio286/antares/compare/v0.2.1...v0.3.0) (2021-07-23)


### Features

* close tabs if element deleted ([320aa8b](https://github.com/Fabio286/antares/commit/320aa8ba04d464f628b938b812165cd1ec786492))
* new data tabs ([ab382df](https://github.com/Fabio286/antares/commit/ab382dfbcd89f8ab38a8cbdb4d87e1705618fd0d))
* new function, procedure and scheduler tabs ([0a9983d](https://github.com/Fabio286/antares/commit/0a9983d30d6aeb9aee1c68b31a31f8c605deea45))
* new trigger function tabs ([58b91eb](https://github.com/Fabio286/antares/commit/58b91ebfe0ab200d76d4cfd442b9f2970ae97384))
* new trigger setting tabs ([f6faad9](https://github.com/Fabio286/antares/commit/f6faad98f88222500dfb7265b74c1be914b894cd))
* new unsaved change reminder ([f7a74df](https://github.com/Fabio286/antares/commit/f7a74df0097867a82a2a2d8b3c278a81897d7898))
* new view setting tabs ([003c02b](https://github.com/Fabio286/antares/commit/003c02b1fbe5aba7f53f3faa5610b0c2f7706793))
* option to restore session on startup ([adc5477](https://github.com/Fabio286/antares/commit/adc5477673603cd63fabf77a53db5397e3774e0e))
* option to select schema in query tabs ([a73a2f4](https://github.com/Fabio286/antares/commit/a73a2f483ef6927def4ba635e306277c34ae4b53))
* **UI:** empty workspace view ([e1855a2](https://github.com/Fabio286/antares/commit/e1855a262dc24363fc143a38a70154938308bd71))
* rename tabs if element is renamed ([ef21ea7](https://github.com/Fabio286/antares/commit/ef21ea74481839ba67ca79d40d5f47e1c12aebc0))
* **MySQL:** improved schema detection for queries ([5bb4e49](https://github.com/Fabio286/antares/commit/5bb4e496f289f3ae8a46f24d1a2fbb896d9da86e))
* **UI:** close temp data tabs ([88c4cdc](https://github.com/Fabio286/antares/commit/88c4cdc8e2a60ffbe26b0f831184c3a6dd9a1637))
* **UI:** display schema in data tabs ([0105733](https://github.com/Fabio286/antares/commit/01057332b090997c107bf395bb1fc3b9195e8218))
* **UI:** new table settings tabs ([7845e3e](https://github.com/Fabio286/antares/commit/7845e3e501bb7f890d07b42d4f3eb5f9f4bc8586))
* **UI:** sortable tabs ([d38097d](https://github.com/Fabio286/antares/commit/d38097d0567020b5265b5a0b347f5e1f38e0b1d4))
* **UI:** temporary table data tabs ([a87079c](https://github.com/Fabio286/antares/commit/a87079cd179033cebb6fd228ad7f1b991f3b6c46))


### Bug Fixes

* clear empty indexes and foreign keys on confirm respective modals ([04fa320](https://github.com/Fabio286/antares/commit/04fa320820df1f70a4ef05e4a6e4cbcd4081d047))
* enabled copy context on non editable rows ([525c964](https://github.com/Fabio286/antares/commit/525c964c623e7574f6abe732a2b315b8805d5eee))
* issues with trigger temp tabs ([6b725b1](https://github.com/Fabio286/antares/commit/6b725b1d40753ad89bfad6f1df57c6fb737e5262))
* manual page input not disabled when only one page is available ([62f7e57](https://github.com/Fabio286/antares/commit/62f7e57d0ccf6041b5469bec6a1864aa5b045609))
* new field default value unknown instead 'noval' ([77c5d28](https://github.com/Fabio286/antares/commit/77c5d280325792e20befc845f3a6834837131e39))
* reload twice after element rename ([1e543aa](https://github.com/Fabio286/antares/commit/1e543aa6b0b63e9134bf544682a26bd98573b794))
* solved a vulnerability in table names ([5c855a5](https://github.com/Fabio286/antares/commit/5c855a520a6bc66cc00b0b8afc6d2c03c75c0fab))
* sort order of tables is lost switching pages ([14577d1](https://github.com/Fabio286/antares/commit/14577d14bb337898a1fd0fdee1c3760812b9d21f))
* wrong editor height with some conditions ([d7fdf53](https://github.com/Fabio286/antares/commit/d7fdf53932a4d0609a88641c40d451c71b12c242))
* **UI:** multiple trigger tabs open on single click on explore bar ([e78ca24](https://github.com/Fabio286/antares/commit/e78ca2417e8f996fa0507c5a5586a75393dfe8ee))
* **UI:** not disabled buttons during save table setting tabs ([a0105cf](https://github.com/Fabio286/antares/commit/a0105cf1c37144ea27b212029d39275918f4f95e))
* tab won't open after table or view creation ([f7c3aa8](https://github.com/Fabio286/antares/commit/f7c3aa883dfcad0a28222c53cf22ab49d381559c))
* wrong loaded schema change ([c41e059](https://github.com/Fabio286/antares/commit/c41e059b0ba6d8c6d545c3b86a21a9a2abb6f537))
* **UI:** table icon in view data tabs ([f0fa7c8](https://github.com/Fabio286/antares/commit/f0fa7c81b7aa2a05833ce0b243afed39db98d66b))


### Improvements

* **UI:** improvements in setting bar connections sort ([0c29e0d](https://github.com/Fabio286/antares/commit/0c29e0d566c792ffd1b2b7045124e170b9c51985))

### [0.2.1](https://github.com/Fabio286/antares/compare/v0.2.0...v0.2.1) (2021-07-09)


### Features

* **UI:** contextual menu shortcuts to create new elements on folders ([0252a06](https://github.com/Fabio286/antares/commit/0252a064d99df09b01c020c7d10c76dd43d4ede8))
* context menu option to duplicate connections ([439356a](https://github.com/Fabio286/antares/commit/439356a01993a6a248f5a7d7df305ac5e0e63775))
* **MySQL:** possibility to set a default schema in connection parameters ([c6897af](https://github.com/Fabio286/antares/commit/c6897af22d04ed930289a55124b3e8d080fbae3a))
* **UI:** new connection add panel ([8cd76e7](https://github.com/Fabio286/antares/commit/8cd76e711c9328254d498b4f9afa221311f5a487))
* **UI:** new connection edit panel ([9af71a6](https://github.com/Fabio286/antares/commit/9af71a6e343deda1bf79d8410511cf861af3c304))
* SSH Tunnel functionality ([#81](https://github.com/Fabio286/antares/issues/81)) ([1801bef](https://github.com/Fabio286/antares/commit/1801bef019cee77a99df7e3822145ad952465abb))


### Bug Fixes

* clear corrupted configurations to avoid exceptions ([56fcc26](https://github.com/Fabio286/antares/commit/56fcc2650b93ece398118f39f027dc9520dd8a6a))
* **UI:** connection tab indicator when scrolling ([a0ab63b](https://github.com/Fabio286/antares/commit/a0ab63bdb533aac9b2bdc2ee07a3b1f2b70ea227))
* avoid to trigger schema loading multiple times ([7570b0a](https://github.com/Fabio286/antares/commit/7570b0add8cb9130f15cf8cb807a96dbfd2837d0))

## [0.2.0](https://github.com/Fabio286/antares/compare/v0.1.13...v0.2.0) (2021-07-03)


### Features

* contextual option to duplicate tables ([08d5b1b](https://github.com/Fabio286/antares/commit/08d5b1b3299adc5c53419f50892aee3b58e6fe72))
* **PostgreSQL:** trigger functions support ([75bbd5f](https://github.com/Fabio286/antares/commit/75bbd5f66e38a971482acff9dde636cf89858c8e))
* **PostgreSQL:** triggers creation ([7df0cf8](https://github.com/Fabio286/antares/commit/7df0cf83895ba784e30efa7814433cf329175364))
* **UI:** active tab animation ([978a7c5](https://github.com/Fabio286/antares/commit/978a7c5f5b314f2ba4067c86471755fdcc341b3f))
* **UI:** context option to copy cell or row value ([d868c77](https://github.com/Fabio286/antares/commit/d868c772b9e7c70e173d1f80ad8de51aa40991ef))
* **UI:** resizer border mouse hover animation ([a69bdeb](https://github.com/Fabio286/antares/commit/a69bdeb20db7d67613dace554ae37a0c5e112ec2))


### Bug Fixes

* **PostgreSQL:** error opening setting tab for some stored routines ([d96907c](https://github.com/Fabio286/antares/commit/d96907ca2de344114e3edae52843f6258468934b))
* **UI:** contextual sub-menu alignment when close to the lower edge of the window ([61a42d5](https://github.com/Fabio286/antares/commit/61a42d51f55ec3010c4ee67bad2f699ff14c9f7c))
* fields default not correctly set in table filler ([faa07a0](https://github.com/Fabio286/antares/commit/faa07a077c899af5c71124e0c20869876e57fd9a))
* rows loses internal id after export ([2d278aa](https://github.com/Fabio286/antares/commit/2d278aa14e0e5080725196538b7265ec00a7aebb))
* **UI:** editor blinking on first connection with a dark theme ([0110756](https://github.com/Fabio286/antares/commit/0110756204b79388535a74017b303e1ba41e8fd8))
* unhandled exception in connection test ([a975df3](https://github.com/Fabio286/antares/commit/a975df38dd471ab0ac8645a1021470a4600e6598))
* vulnerability in server error toast messages ([3aef7e9](https://github.com/Fabio286/antares/commit/3aef7e953ea82a9105d470cc62c68aacfc97f9d9))


### Improvements

* improved contextual menu appearance ([f74bca7](https://github.com/Fabio286/antares/commit/f74bca7bb4fc6802143446a44663fbf12319bf29))
* **UI:** increased application border-radius ([a0a025e](https://github.com/Fabio286/antares/commit/a0a025e4502141e95394ca9717b1ec65df2728c1))

### [0.1.13](https://github.com/Fabio286/antares/compare/v0.1.12...v0.1.13) (2021-06-19)


### Features

* **PostgreSQL:** alter trigger support ([5c8ee66](https://github.com/Fabio286/antares/commit/5c8ee66f432585db7bd72103fa814558bf406bcc))
* **UI:** ability to manually insert page number in DATA tabs, closes [#65](https://github.com/Fabio286/antares/issues/65) ([e2ebb04](https://github.com/Fabio286/antares/commit/e2ebb04a9047d25187889644aa625fe675de808b))
* **UI:** option to change query editors font size, closes [#77](https://github.com/Fabio286/antares/issues/77) ([e579f37](https://github.com/Fabio286/antares/commit/e579f374381b329422b646b8f7ab5acf298db981))


### Bug Fixes

* **MySQL:** pool connections not released after MySQL errors, causing endless load animation ([4133fc4](https://github.com/Fabio286/antares/commit/4133fc452fc2e961eb587590e010f4968675db7e))
* **UI:** various fixes in displaying content with small window size ([8a20bef](https://github.com/Fabio286/antares/commit/8a20befd0941cb2e6d5e29552606454bd871b092))


### Improvements

* remove comments from queries before execution ([690a454](https://github.com/Fabio286/antares/commit/690a4541f96eaf831dea07b777a421729173b654))

### [0.1.12](https://github.com/Fabio286/antares/compare/v0.1.11...v0.1.12) (2021-06-09)


### Features

* **PostgreSQL:** trigger rename and delete ([cce5adb](https://github.com/Fabio286/antares/commit/cce5adbac75170186956211b54f4db5be25aba07))


### Bug Fixes

* internal exceptions ([8742fa1](https://github.com/Fabio286/antares/commit/8742fa10f08c92a98325df50be9a7df8e36b0f2c))
* page offset not reset when selected table changes ([5562e73](https://github.com/Fabio286/antares/commit/5562e73e75c659051a49d61041d1eee9d66ff6e2))
* **MySQL:** view's data tab doesn't work with some views, closes [#71](https://github.com/Fabio286/antares/issues/71) ([9ca059d](https://github.com/Fabio286/antares/commit/9ca059d979161c0132f64db372b4ed7ecc844b2d))
* **UI:** unable to browse view's result pages ([8a7cc2a](https://github.com/Fabio286/antares/commit/8a7cc2a14fa289c2f3d9e9eb1a5435ffbbaab006))

### [0.1.11](https://github.com/Fabio286/antares/compare/v0.1.10...v0.1.11) (2021-06-02)


### Bug Fixes

* **UI:** prevent canc key to trigger delete modal when editing a row ([5e9c88a](https://github.com/Fabio286/antares/commit/5e9c88a7fd656dd69b92ba4384ca81f4e8cdd422))
* table row loses internal id after cell update ([6622756](https://github.com/Fabio286/antares/commit/66227569f4c032298e20d44c253d30109ffde0b2))
* **MySQL:** missing schema altering tables in some conditions ([faa799c](https://github.com/Fabio286/antares/commit/faa799c8ea2329e7ca1b54c9414a060bc8a2a840))
* empty offset in cell update queries ([acc1eeb](https://github.com/Fabio286/antares/commit/acc1eeb0948db35f2c9a4d85d70fb654b41b15e5))

### [0.1.10](https://github.com/Fabio286/antares/compare/v0.1.9...v0.1.10) (2021-05-29)


### Features

* key shortcuts to change DATA tab page ([f61d7ee](https://github.com/Fabio286/antares/commit/f61d7eeaf42406eb88b3285ac4606794f56e88d3))
* option to set DATA tab page size ([e71c756](https://github.com/Fabio286/antares/commit/e71c7568c09bf8ad184753d3d0f14046f1e386d0))
* prev/next buttons to browse the results pages of data tab ([79f033e](https://github.com/Fabio286/antares/commit/79f033e5245e0e744c35540d25a30b1eadc4d603))


### Bug Fixes

* **MySQL:** wrong schema in view data tab select, closes [#71](https://github.com/Fabio286/antares/issues/71) ([310cfaa](https://github.com/Fabio286/antares/commit/310cfaa3c2324b1159a46be566b6af2555dc9732))
* wrong detection of field default expressions in some cases ([04bdd08](https://github.com/Fabio286/antares/commit/04bdd085a56240273133586d23196e52341d5f27))

### [0.1.9](https://github.com/Fabio286/antares/compare/v0.1.8...v0.1.9) (2021-05-23)


### Bug Fixes

* **MySQL:** can't access tables having UNIQUE KEY, closes [#69](https://github.com/Fabio286/antares/issues/69) ([f1636f1](https://github.com/Fabio286/antares/commit/f1636f1528b5765423535f84027fdc853c58ce80))

### [0.1.8](https://github.com/Fabio286/antares/compare/v0.1.7...v0.1.8) (2021-05-22)


### Bug Fixes

* internal id not removed before row update ([0f10c9e](https://github.com/Fabio286/antares/commit/0f10c9e824b679cfebd8a31085236da3d38a7953))
* unable to add new ENUM fields ([1e37f2a](https://github.com/Fabio286/antares/commit/1e37f2a96f660a36f2739fea57ca298059e9c31a))
* unable to delete table rows ([0d61371](https://github.com/Fabio286/antares/commit/0d6137195da9e0e9afe68f6d3ebcd50e913a888e))


### Improvements

* improved the way how field default value are handled ([7a766f0](https://github.com/Fabio286/antares/commit/7a766f04e668868e8844aac1d7d445bc2da21558))

### [0.1.7](https://github.com/Fabio286/antares/compare/v0.1.6...v0.1.7) (2021-05-16)


### Bug Fixes

* row loses internal id after cell update ([854472c](https://github.com/Fabio286/antares/commit/854472c7a3d8442b1eede12f978cad5aa684094e))
* **MySQL:** connection loses schema in some conditions ([6b0b8b1](https://github.com/Fabio286/antares/commit/6b0b8b19d7176ef8647d6f401a33315f8732fdf3))
* issue with ENUM and SET fields on table filler modal ([475397c](https://github.com/Fabio286/antares/commit/475397ca34c5b7d8925e2d97d32216d5b80d8211))
* issue with ENUM and SET length when creating a new field ([7a62131](https://github.com/Fabio286/antares/commit/7a62131cc707aa1c98bb12513de76229472b7c38))
* multiple row select on sorted tables not work properly ([c7663be](https://github.com/Fabio286/antares/commit/c7663be338ccb5ff31e241e824593531ad95bd32))


### Improvements

* **core:** increased connection pool size to improve performance ([ae103e5](https://github.com/Fabio286/antares/commit/ae103e5477ad190c541d0f29e277c41de6947063))
* **MySQL:** improved connections pool handling ([434711a](https://github.com/Fabio286/antares/commit/434711a360bd7539d2ec3adec92e7ccc96fa828e))

### [0.1.6](https://github.com/Fabio286/antares/compare/v0.1.5...v0.1.6) (2021-05-08)


### Features

* **MySQL:** ENUM and SET fields support, closes [#61](https://github.com/Fabio286/antares/issues/61) ([bebba64](https://github.com/Fabio286/antares/commit/bebba64d06532990405763284e27cb768dc050f7))


### Bug Fixes

* better detection and handling of field default type ([3baf6fa](https://github.com/Fabio286/antares/commit/3baf6fa1736a405c95fb02d17c11514861ca9e04))
* no quotes around strings in field default custom value ([29e2d92](https://github.com/Fabio286/antares/commit/29e2d92b5bf66ff9e80bb1fee1274967c4418601))
* **UI:** data type figure twice on type select ([9dfe7cc](https://github.com/Fabio286/antares/commit/9dfe7cca2234ce6de512bb4c21205c2217e7f765))
* support to mDNS/zeroconf in snap build, closes [#58](https://github.com/Fabio286/antares/issues/58) ([35ef070](https://github.com/Fabio286/antares/commit/35ef070725f5779923bf3ad428b44accddf22dbe))


### Improvements

* italian translation updated ([5dc0b0b](https://github.com/Fabio286/antares/commit/5dc0b0bea40f9d5a5944af2f1c5dc6ff3e60c396))

### [0.1.5](https://github.com/Fabio286/antares/compare/v0.1.4...v0.1.5) (2021-04-30)


### Bug Fixes

* **MySQL:** multiple queries non properly split in some cases ([5208ec1](https://github.com/Fabio286/antares/commit/5208ec171b44da0e6bfa93f15bfedd03ef2aa868))
* % character not properly escaped, closes [#60](https://github.com/Fabio286/antares/issues/60) ([ecfb732](https://github.com/Fabio286/antares/commit/ecfb732c265a5485e131e75f3d20ff07d9409753))
* semicolon inside strings breaks queries, closes [#59](https://github.com/Fabio286/antares/issues/59) ([1b09909](https://github.com/Fabio286/antares/commit/1b0990912627a3a4a4e8d62b4593f8a7aa3a7fe5))


### Improvements

* **UI:** new application icon ([5822b3d](https://github.com/Fabio286/antares/commit/5822b3df432e0a2b305d0ff37a20dc466c3a3992))

### [0.1.4](https://github.com/Fabio286/antares/compare/v0.1.3...v0.1.4) (2021-04-22)


### Features

* query results export ([1d363f7](https://github.com/Fabio286/antares/commit/1d363f755e025d0fc6fec61cbd47ff87a8f25728))
* **UI:** canc press to delete selected rows ([20cba6e](https://github.com/Fabio286/antares/commit/20cba6ee9bc1daa902b04d6e2ddcb31d04fbf805))
* **UI:** ctrl+s shortcut to save changes ([16e17b3](https://github.com/Fabio286/antares/commit/16e17b39b6c8b561cc018d02afee2276190ce304))
* **UI:** format and clear queries ([9ffd443](https://github.com/Fabio286/antares/commit/9ffd443a66303f88fc4529896f6d1d7917454f7a))


### Bug Fixes

* launch from shortcut of procedures or functions with parameters without name dont works ([f82dbd2](https://github.com/Fabio286/antares/commit/f82dbd24dcef7b4d8d127a604e256b3f79a6c617))
* wrong changelog in some cases ([a41cf1a](https://github.com/Fabio286/antares/commit/a41cf1ab5662f5f5fdedff4a9e1c626c23071377))
* **UI:** data type not listed in selection if not present in global types ([6eb2977](https://github.com/Fabio286/antares/commit/6eb2977568987b9440b62ae7dbd7183338bfcc9b))


### Improvements

* **UI:** improved connection status indicator ([5ceddb8](https://github.com/Fabio286/antares/commit/5ceddb8e00f3bc1984b8e47de270dc39b367903f))

### [0.1.3](https://github.com/Fabio286/antares/compare/v0.1.2...v0.1.3) (2021-04-17)


### Features

* **PostgreSQL:** functions management ([cd31413](https://github.com/Fabio286/antares/commit/cd3141325681ea572c06b8998dd7bd334ceb3236))
* **PostgreSQL:** procedure language select ([b33199e](https://github.com/Fabio286/antares/commit/b33199ea59c60b467601f333857494aa40adf4e8))


### Bug Fixes

* **MySQL:** invalid JavaScript datetime values not shown ([dcccb54](https://github.com/Fabio286/antares/commit/dcccb544f9ec24ad693c9e81fb4bcfbdbb7cc4e1))
* approximate row count shown for results less than 1000 ([a6b75ad](https://github.com/Fabio286/antares/commit/a6b75ad0dc0d884332464c277e8542b2698630b9))
* field apparently loses index or foreign key on rename in table editor ([7d2ace9](https://github.com/Fabio286/antares/commit/7d2ace94562f8da307b15b83c89d919727d800c8))


### Improvements

* **MySQL:** improved the way to get routine and functions parameters ([90fd9db](https://github.com/Fabio286/antares/commit/90fd9db917c40262f2bc2501ab86f5feba3d8db4))
* **UI:** improved table fields suggestion in query editor ([c22187c](https://github.com/Fabio286/antares/commit/c22187c3053aef368a351cc35e2f1d407ecde209))

### [0.1.2](https://github.com/Fabio286/antares/compare/v0.1.1...v0.1.2) (2021-04-11)


### Features

* in-app last release changelog ([1e938ad](https://github.com/Fabio286/antares/commit/1e938adc5d8eb5ad16ab16342375eecd88f68d20))
* **PostgreSQL:** edit timezone in cell editor ([8735a0c](https://github.com/Fabio286/antares/commit/8735a0c5f9e5b6b3bcaadf37ce158aa7beae2c48))
* **PostgreSQL:** procedures management ([3dde1c1](https://github.com/Fabio286/antares/commit/3dde1c109e23342d94362626ef7350dc123ea859))
* **PostgreSQL:** support of arrays in table settings ([d0b3e1b](https://github.com/Fabio286/antares/commit/d0b3e1b1b8be9d2c038d70e16d4478671315de8f))


### Bug Fixes

* cell edit doesn't properly use primary or unique index to update if both present, closes [#51](https://github.com/Fabio286/antares/issues/51) ([55932fe](https://github.com/Fabio286/antares/commit/55932fe11583bd5ff48f82b8408965adba4f5071))
* deletion of rows from query results ([c20bff7](https://github.com/Fabio286/antares/commit/c20bff7bcbe340ac99ebcacaba3359edd61c068a))
* no foreign key select when cell value is NULL, closes [#50](https://github.com/Fabio286/antares/issues/50) ([9f5ec02](https://github.com/Fabio286/antares/commit/9f5ec0276c92904975fdaea34b4c845c92bfe8d4))
* wrong datetime conversion when updating a row without an unique key ([d374372](https://github.com/Fabio286/antares/commit/d374372e208318d7e50b258a8041145bdf7992c5))
* **PostgreSQL:** issue with selected schema different than public ([49a4e1c](https://github.com/Fabio286/antares/commit/49a4e1cb7b24642641265d5830d3fee370cceeb4))
* **UI:** white readonly inputs with dark theme ([bb5f446](https://github.com/Fabio286/antares/commit/bb5f44681f87aacf2cd2f60a6d958c5732289790))


### Improvements

* **UI:** improved setting modal rendering ([be816e8](https://github.com/Fabio286/antares/commit/be816e85888b4f3d26cbb9caac0adbc4dde0ea94))

### [0.1.1](https://github.com/Fabio286/antares/compare/v0.1.0...v0.1.1) (2021-04-03)


### Features

* scratchpad to save persistent notes ([e349dd5](https://github.com/Fabio286/antares/commit/e349dd5eaba608591257f2799b830805e4936c27))
* **PostgreSQL:** foreign keys management ([fe4c8e1](https://github.com/Fabio286/antares/commit/fe4c8e12b39dd3cdfc233f07e3fe2ff0676252b0))
* **PostgreSQL:** indexes management ([9ca03f4](https://github.com/Fabio286/antares/commit/9ca03f462560b634970a19d3d97b878d60509acc))
* **PostgreSQL:** table fields edit ([e3f259c](https://github.com/Fabio286/antares/commit/e3f259c6e8327d71bd7dd0a9c33d957dc6ca1fb8))
* **PostgreSQL:** tables addition ([feef5e3](https://github.com/Fabio286/antares/commit/feef5e30eec915cbb219223cc428bd4e98d2e9c5))
* **PostgreSQL:** unique keys management ([614e0d3](https://github.com/Fabio286/antares/commit/614e0d32758c13b59139d349d4682a5bafc3ca88))
* **PostgreSQL:** views management ([99f7511](https://github.com/Fabio286/antares/commit/99f7511c4d5fab4030b30d5134cd03248167faea))
* **UI:** light theme ([2806976](https://github.com/Fabio286/antares/commit/280697698ea5fae6d54326970c823878888c196c))


### Bug Fixes

* **UI:** editor theme preview not properly loaded in some cases ([c981244](https://github.com/Fabio286/antares/commit/c981244d7aa93ca18ca2de44bf8df06f253b9d20))
* fields of ref. table not automatically loaded in foreign keys modal ([e7401cc](https://github.com/Fabio286/antares/commit/e7401cc96e76e00100a88eea9f40541fd8027adb))
* hide update tab for Windows Store distributions ([dcb135d](https://github.com/Fabio286/antares/commit/dcb135dd015b8f8c6cfb44021211bb8cf3089192))

## [0.1.0](https://github.com/Fabio286/antares/compare/v0.0.20...v0.1.0) (2021-03-21)


### Features

* **PostgreSQL:** database in connection parameters ([9645702](https://github.com/Fabio286/antares/commit/964570247ff5b7b8317419730eec5bed4f0f0580))
* **PostgreSQL:** edit array and text search fields ([fc65114](https://github.com/Fabio286/antares/commit/fc651149b95399c52d2d63e946731e9c1b0303a9))
* **PostgreSQL:** insert and edit blob fields ([1f80a64](https://github.com/Fabio286/antares/commit/1f80a64fe1400baacca26f1a762c5aeb4ef6350d))
* **PostgreSQL:** partial postgre implementation ([d892fa6](https://github.com/Fabio286/antares/commit/d892fa6fb3e86fbb96887d8eb67319ae855260a1))
* **PostgreSQL:** support to microseconds ([d465e18](https://github.com/Fabio286/antares/commit/d465e18dba8ea3aa00726e33f9b1f70ca4c0683c))
* **UI:** support to boolean fields ([ffb1712](https://github.com/Fabio286/antares/commit/ffb1712a593d1421793011e48a17369b884ea3c0))


### Bug Fixes

* update or delete rows with more than one primary key ([22a8c25](https://github.com/Fabio286/antares/commit/22a8c25717a4d4b285855426098a3a2846ce7448))
* **MySQL:** handle NEWDECIMAL data type ([a1c6be3](https://github.com/Fabio286/antares/commit/a1c6be372b570cf13e89ef7ecf9b7a7c033a9293))
* **PostgreSQL:** issue getting foreign keys informations ([db47b40](https://github.com/Fabio286/antares/commit/db47b4040a5282a6ac0711b1926c4c2ac867999e))
* remove last char from datetime and time if is a dot ([e89911b](https://github.com/Fabio286/antares/commit/e89911b1851c19813d4acf2c79adfbc2ac7c1112))
* **PostgreSQL:** single quote escape ([9f6a183](https://github.com/Fabio286/antares/commit/9f6a183d9b293dfe9ad9f3759f2375f05f37db8e))
* **PostgreSQL:** various issues in query results ([fccfe92](https://github.com/Fabio286/antares/commit/fccfe92453325cd54c0331cc5670af0a56822c5b))
* schema content not loaded if selected with right click ([8a6c59f](https://github.com/Fabio286/antares/commit/8a6c59f7ce7d051315b04cea38a96e4739b5b9d3))

### [0.0.20](https://github.com/Fabio286/antares/compare/v0.0.19...v0.0.20) (2021-03-13)


### Features

* **UI:** loader layers on query and data tabs ([b232a3b](https://github.com/Fabio286/antares/commit/b232a3bb5ff7e38c83aa33e8b96ec7202bc4881e))
* **UI:** row markers in sql editors ([ddfb713](https://github.com/Fabio286/antares/commit/ddfb7131248a47fa2055ccfb72e223986a17f986))


### Bug Fixes

* **UI:** avoid unnecessary updates when cell content not change ([e9a26c1](https://github.com/Fabio286/antares/commit/e9a26c1bc0641b7087d8143cc948405850d7552f))
* **UI:** row mark not applied on first click ([25d72e3](https://github.com/Fabio286/antares/commit/25d72e39529884c09cf1286ff64ba00c8a5c7b24))
* **UI:** table rows lose internal id after an update ([76c5c0c](https://github.com/Fabio286/antares/commit/76c5c0c680521b4a20de1f12bab25314ac084d5c))

### [0.0.19](https://github.com/Fabio286/antares/compare/v0.0.18...v0.0.19) (2021-03-05)


### Features

* **UI:** modal that shows process query ([07f60c3](https://github.com/Fabio286/antares/commit/07f60c39173e9db452909d74573c3aecf4b6466b))
* processes list tool ([049143d](https://github.com/Fabio286/antares/commit/049143d143d8187bfcb6377f2bf374c471c28046))
* **MySQL:** support to new mysql8 authentication, closes [#45](https://github.com/Fabio286/antares/issues/45) ([db44306](https://github.com/Fabio286/antares/commit/db4430609e22816f4a3a8ecdbf61e9b51cde2579))
* context menu shortcut to set NULL a table cell ([71b4310](https://github.com/Fabio286/antares/commit/71b43101172c27d810d533c936534bcf089dbca2))
* **UI:** esc key to cancel cell edit ([45351fa](https://github.com/Fabio286/antares/commit/45351faeaea6ad4af8280da6c0ec1b4ded0f86fe))
* setting to enable beta updates (future use) ([b1ea32b](https://github.com/Fabio286/antares/commit/b1ea32b68024593481120e2ef67642e127554888))
* **UI:** query duration calc ([777b73f](https://github.com/Fabio286/antares/commit/777b73fa6f9d6f7806e0d3d07589dfaee0c40786))


### Bug Fixes

* **MySQL:** wrong TIMESTAMP fields length ([201fad9](https://github.com/Fabio286/antares/commit/201fad9265e01e19ae4c8dc16bff84ee9dc9c894))
* **UI:** modal processes list does not regain size on window resize ([5d7efa7](https://github.com/Fabio286/antares/commit/5d7efa75b76f59b85654603b4df8035a36af0576))
* **UI:** wrong height in scrolling tables in some cases ([4862d51](https://github.com/Fabio286/antares/commit/4862d51fba863e055ca6735586b0abe4894037eb))


### Improvements

* **UI:** big performance improvement in tables rendering ([39ca197](https://github.com/Fabio286/antares/commit/39ca1974bcea84c9047779893ed3f458300474e3))
* **UI:** improvements of date time inputs ([b4ead69](https://github.com/Fabio286/antares/commit/b4ead6992c8ddc172380a97e7aa125e0dd078f1e))

### [0.0.18](https://github.com/Fabio286/antares/compare/v0.0.17...v0.0.18) (2021-02-25)


### Features

* **UI:** context menu for input and textarea tags ([b54fefb](https://github.com/Fabio286/antares/commit/b54fefbf255c91f3cdd0c52b917b239ea40dae16))
* **UI:** html, xml, json, svg and yaml editor modes in long text fields edit ([9a1bf32](https://github.com/Fabio286/antares/commit/9a1bf3212850d3783ac6382f8a980eb25c4f4226))
* **UI:** run procedures/functions from sidebar context menu ([219da0a](https://github.com/Fabio286/antares/commit/219da0aba46839295807a01056199d42584e0af9))
* **UI:** run routines/functions from settings tab ([7e81671](https://github.com/Fabio286/antares/commit/7e8167154ffd64e46d78a50cd13cf90cee61370c))
* **UI:** search filter in explore bar ([2f58007](https://github.com/Fabio286/antares/commit/2f58007af4f32207fe4be9fc15bb43916e8e0abc))
* **UI:** sticky schema names in explore bar ([110b0b4](https://github.com/Fabio286/antares/commit/110b0b414cef25395ae28493032c2048307e4783))


### Bug Fixes

* **MySQL:** issue obtaining routine/function parameters ([3aa2159](https://github.com/Fabio286/antares/commit/3aa2159a1ae3b6785646fc7ac1e866cb0277d087))
* issue managing function/routine parameters ([76d92cd](https://github.com/Fabio286/antares/commit/76d92cd106b0409e8752c43d7d587d09dd3e1e32))
* **UI:** data tab opened when non-table element is selected ([dbab06f](https://github.com/Fabio286/antares/commit/dbab06fcb80ccdae85215ceae9ba24af3e7ff263))
* **UI:** elements from previous selected schemas in query suggestions ([c8545a2](https://github.com/Fabio286/antares/commit/c8545a250bc696c339e418a69a2942d5bac10cbf))
* disabled sort for fields without a name property ([3b37b74](https://github.com/Fabio286/antares/commit/3b37b7432e969e6315ebd6ed74905ec3980a049c))
* prevents F5 shortcut to run in non-selected workspaces ([7c4ca99](https://github.com/Fabio286/antares/commit/7c4ca999ce64af8077d29e419f430d5beaaead93))
* support of bit fields in table filler ([94c4952](https://github.com/Fabio286/antares/commit/94c49523197284510361ebbb6984816a3bb1b243))

### [0.0.17](https://github.com/Fabio286/antares/compare/v0.0.16...v0.0.17) (2021-02-17)


### Features

* Added french language ([18a93ef](https://github.com/Fabio286/antares/commit/18a93ef1aae530e69c9062bbeb08a3beec206eda))
* fake table data generator ([a176174](https://github.com/Fabio286/antares/commit/a176174b8d7dc232920f4cd7c5e3f8e4c58d51a0))
* min and max option for random floats and numbers ([6c62052](https://github.com/Fabio286/antares/commit/6c62052b4764731c774fef90784342447b36deb7))
* support to fake data locales ([970de49](https://github.com/Fabio286/antares/commit/970de4962b3bffec271bfa6d4747e6fb9d408ba6))


### Bug Fixes

* **UI:** file uploader in table filler ([b5a8283](https://github.com/Fabio286/antares/commit/b5a828309f067636eae2120032f07e01233706e2))
* **UI:** no foreign key select editing query results ([5b21d17](https://github.com/Fabio286/antares/commit/5b21d17f3a8f2482c3aafe85f26c34cd3c0a1fcf))
* cut faker text based on field length ([288ff4c](https://github.com/Fabio286/antares/commit/288ff4c1a1c77f4b8b86b24649d805836366fdd3))
* wrong date or time detection in field default ([9d5ebef](https://github.com/Fabio286/antares/commit/9d5ebefdced999af595f3d8dc2fac2b18fa8258b))
* **UI:** better text on ssl file selectors ([9a19085](https://github.com/Fabio286/antares/commit/9a190854fe3c73ed4e7f89545ff259e15ee9f947))
* **UI:** wrong length for char fields on table header ([0f69d1d](https://github.com/Fabio286/antares/commit/0f69d1dbb7958e45059b6b738c845abea1ad3225))


### Improvements

* **core:** bulk inserts support ([b0576ac](https://github.com/Fabio286/antares/commit/b0576acdf65d41c1c8e0b0bca6cf6522dcb372be))

### [0.0.16](https://github.com/Fabio286/antares/compare/v0.0.15...v0.0.16) (2021-02-06)


### Features

* MySQL and MariaDB auto detection ([02c03e3](https://github.com/Fabio286/antares/commit/02c03e3d266052872ac8edeb159ec8182f41c6a5))
* **UI:** enanched file upload input ([a0d8552](https://github.com/Fabio286/antares/commit/a0d85520fb0669d5eec4475f5e255adb1e2a0159))
* support to ssl connections ([4e72bb1](https://github.com/Fabio286/antares/commit/4e72bb15874324214aa0f5b89057cdd565744468))
* **UI:** database version in app footer ([15417e8](https://github.com/Fabio286/antares/commit/15417e8a776c6aa9f90762d198d70b26163bb2df))
* **UI:** resize query editor area ([88ab7c5](https://github.com/Fabio286/antares/commit/88ab7c5a62654c6a6026b63464224226d33b1950))
* delete rows from tables without a primary key ([574d493](https://github.com/Fabio286/antares/commit/574d4939083577ffcb8e7c65f572c364eb8415fb))
* edit rows from tables without a primary key ([5940b0b](https://github.com/Fabio286/antares/commit/5940b0b84207093da141b5c617c41e0a18fcb1d7))


### Bug Fixes

* compatibility with electron-store 7 ([bacf458](https://github.com/Fabio286/antares/commit/bacf45893676cb0744907703f6534ffd472bd1dd))
* edit bit fields ([ede6fe8](https://github.com/Fabio286/antares/commit/ede6fe81cefc91cdce2bbb0cd7cd6f85bbca99b8))

### [0.0.15](https://github.com/Fabio286/antares/compare/v0.0.14...v0.0.15) (2021-01-23)


### Features

* functions and schedulers in query suggestions ([8ff6e70](https://github.com/Fabio286/antares/commit/8ff6e70145ed2a207ae8b23a2c688258382a5d74))
* loading animation in properties tabs ([1cf6485](https://github.com/Fabio286/antares/commit/1cf64858964f4894913db42f7c268013bb06e40b))


### Bug Fixes

* error retriving dato of some schedulers ([b9ed8dd](https://github.com/Fabio286/antares/commit/b9ed8dd610e3be1489e01cf53f7d632cb1bd6ac5))
* unable to call stored routines from query tabs ([4923128](https://github.com/Fabio286/antares/commit/4923128236131482ca948ae8052c294bd9269ed0))


### Improvements

* better fields type detection ([4bc9bbf](https://github.com/Fabio286/antares/commit/4bc9bbfb34ebdc51061f718cdf9cbca8507fa0f4))
* big performance improvement in database structure loading ([a11bac5](https://github.com/Fabio286/antares/commit/a11bac504cd4ee865ea6c614a15ee809dc38202e))

### [0.0.14](https://github.com/Fabio286/antares/compare/v0.0.13...v0.0.14) (2021-01-16)


### Features

* export data tables to json or csv file ([0cbea9d](https://github.com/Fabio286/antares/commit/0cbea9d1007304a5b9cf893d165b4b4104266651))
* functions creation ([49d7172](https://github.com/Fabio286/antares/commit/49d71722e26172232f7b54c6568e1e588ce0d049))
* functions delete ([59a50bc](https://github.com/Fabio286/antares/commit/59a50bc014facc9643f9153cff61dc9d5a8605a9))
* functions edit ([41d75b1](https://github.com/Fabio286/antares/commit/41d75b127cbcf1481fd259a14e6e7688638e18a4))
* scheduler edit ([ceab4ef](https://github.com/Fabio286/antares/commit/ceab4ef243881ba64517fb95320844a21fce4849))
* schedulers creation ([dbe7b9d](https://github.com/Fabio286/antares/commit/dbe7b9dd239248e806377ae6236b477456f175a3))
* schedulers delete ([1e7d4ca](https://github.com/Fabio286/antares/commit/1e7d4ca347f4b9337ff266ec78bb4bbc6dd20d4d))
* triggers and stored routines in sql suggestions ([e351c90](https://github.com/Fabio286/antares/commit/e351c903a8a8d7e908d6a7d54c0491438ac6f024))


### Bug Fixes

* error with empty functions/procedures ([f150508](https://github.com/Fabio286/antares/commit/f1505085477a760a768a7d245c9517a858c1379c))
* removed internal row _id from exported files ([c0a32c0](https://github.com/Fabio286/antares/commit/c0a32c040e653729ef80d580d6dd1796d1b2adcd))

### [0.0.13](https://github.com/Fabio286/antares/compare/v0.0.12...v0.0.13) (2021-01-06)


### Features

* option to toggle line wrap mode ([d94b49f](https://github.com/Fabio286/antares/commit/d94b49febf54b0200127859f2a8ed7ef591e56ab))
* select definer in view creation/edit ([ab307f8](https://github.com/Fabio286/antares/commit/ab307f82b1d78c5f9571233090b6678a964bd674))
* stored routines creation ([3bcd02f](https://github.com/Fabio286/antares/commit/3bcd02fc4ea9a4b780305212f906d6d78c7a8dae))
* stored routines delete ([aa33850](https://github.com/Fabio286/antares/commit/aa3385028685417860b3ce985cc7a74f9da377ad))
* stored routines edit ([82fdc0b](https://github.com/Fabio286/antares/commit/82fdc0bcd7514b321c1c9852a773adacf81baf87))
* triggers creation ([d695c9f](https://github.com/Fabio286/antares/commit/d695c9f8d2418a6a4523a7a242fa1a8cba80e035))
* triggers delete ([b32132a](https://github.com/Fabio286/antares/commit/b32132ad84d5798555b80eec3c624b681c37c339))
* triggers edit ([3126625](https://github.com/Fabio286/antares/commit/3126625461f4b6d68d641b6b0eda8fcd390bb636))
* views creation ([8c4aaec](https://github.com/Fabio286/antares/commit/8c4aaec167f58333a343b52927205b68137ad408))
* views deletion ([dcf469e](https://github.com/Fabio286/antares/commit/dcf469ebed6252b4a496800206e0c34cd83b1f5e))
* views edit ([56f2a27](https://github.com/Fabio286/antares/commit/56f2a27f0059cc10316204210db078a97408973c))


### Bug Fixes

* breadcrumb not change after table rename ([b6b7be0](https://github.com/Fabio286/antares/commit/b6b7be098ad5ab4d55bfe05a7f862f045c1f54da))
* unable to rename views ([b7053bd](https://github.com/Fabio286/antares/commit/b7053bdf8036d027e1685d6b5080d6b927a80e08))
* wrong new stored routine modal icon ([0ec2710](https://github.com/Fabio286/antares/commit/0ec2710872c692b3feac076a3250d3b760af4009))
* wrong or duplicate fields in some queries ([0df2b83](https://github.com/Fabio286/antares/commit/0df2b836b15436a2397d6a2202bd049b5cd53de4))

### [0.0.12](https://github.com/Fabio286/antares/compare/v0.0.11...v0.0.12) (2020-12-24)


### Features

* better security connections credentials storage ([fc35f27](https://github.com/Fabio286/antares/commit/fc35f271d7fe384cd786ce33547c0ef17135ddd8))
* option to change editor theme ([a95b8d1](https://github.com/Fabio286/antares/commit/a95b8d188cfcc8f563ad73b4f0b676d068775d36))
* option to toggle editor auto completion ([155154b](https://github.com/Fabio286/antares/commit/155154b43d0cd02ae875ded3ce865a37a999da5c))
* query editor auto-completer for tables and columns ([cb1fce6](https://github.com/Fabio286/antares/commit/cb1fce6f998ea7332886820910e245ab19416a9d))

### [0.0.11](https://github.com/Fabio286/antares/compare/v0.0.10...v0.0.11) (2020-12-15)


### Features

* auto focus on first input in modals ([1476e89](https://github.com/Fabio286/antares/commit/1476e899d164562f12342ced8c76903b9bdcfa55))
* foreign keys management ([206597e](https://github.com/Fabio286/antares/commit/206597e5b891e13e6f7635075bd11599355ab778))
* improved data table sorts ([5712b80](https://github.com/Fabio286/antares/commit/5712b8002203b32027f0e820f98a61e2ec965e79))
* query tabs auto focus ([f81312a](https://github.com/Fabio286/antares/commit/f81312aeb02ef55affd2ae9e81a9b4cb4c2e6da2))


### Bug Fixes

* data tab sort not maintained at refresh ([15b08d7](https://github.com/Fabio286/antares/commit/15b08d7ea858cb28111c7b548af9a13b1bf0da91))
* deletion of rows with non-numeric ID ([d385832](https://github.com/Fabio286/antares/commit/d38583262e672a2b47c5ad0aca0f13c129830a7b))
* file field editor not show ([9291a7a](https://github.com/Fabio286/antares/commit/9291a7a7b41e7aeb9b65c7f32e496f523e482272))
* improved changes dedection in props tab ([acebe43](https://github.com/Fabio286/antares/commit/acebe435ff6fa1581692fbf7ee1bc23b334e3947))
* some properties do not reset after fields changes ([3ed5ea0](https://github.com/Fabio286/antares/commit/3ed5ea023e1852d724b2b59ab156f8722876f85b))
* unable to switch tabs when no table selected ([c545815](https://github.com/Fabio286/antares/commit/c5458159d1e30cecf6615086c074d98b4b599637))
* wrong field type detection ([5cfdc9b](https://github.com/Fabio286/antares/commit/5cfdc9b92d4b778a7863b02fd64e6445236c89bc))

### [0.0.10](https://github.com/Fabio286/antares/compare/v0.0.9...v0.0.10) (2020-12-04)


### Features

* approximate totals in table tata tab ([e95d29c](https://github.com/Fabio286/antares/commit/e95d29c7c37e24e7cc14b466f9b539fa667042c2))
* create new tables ([e6602d1](https://github.com/Fabio286/antares/commit/e6602d1bfa9ca10c6bb078ee80ddc94fb338763d))
* display all keys in properties tab ([27769f2](https://github.com/Fabio286/antares/commit/27769f204f731d20c7ba2f838c02b7c2f28fa0c3))
* drop and truncate tables ([a4122b4](https://github.com/Fabio286/antares/commit/a4122b4eaaa5b30d97ba5a93df8c9d21c30bc40b))
* index management ([41505bd](https://github.com/Fabio286/antares/commit/41505bde6547c0af3c3413248ad8a0d182838bb1))
* tables options edit ([0805b96](https://github.com/Fabio286/antares/commit/0805b96a75e439a7d65e8341ecc86fa938679a9f))
* unsaved changes reminder ([33d1fa2](https://github.com/Fabio286/antares/commit/33d1fa22905f477924292135b0dcfefe168ee641))


### Bug Fixes

* index deletion issue ([f8cf90a](https://github.com/Fabio286/antares/commit/f8cf90a89e7367c95e164b7dc669506df392b700))
* some problems with properties and data tabs when changing database from sidebar ([0fe7157](https://github.com/Fabio286/antares/commit/0fe71572a5e74c17a5c66237351bb0b02c33e824))
* sqlEscaper function wrong quotes conversion ([dfb24c6](https://github.com/Fabio286/antares/commit/dfb24c65f3c395d78d27a2f29e9aa8eeb427cff7))

### [0.0.9](https://github.com/EStarium/antares/compare/v0.0.8...v0.0.9) (2020-11-13)


### Features

* ability to edit table fields ([249926b](https://github.com/EStarium/antares/commit/249926b8e040d62d50244362b7f999f26337b93c))
* support to aliased tables ([1658432](https://github.com/EStarium/antares/commit/1658432fd30073ba3bffb39b5c4ca69194ae1330))
* table fields addition ([0765403](https://github.com/EStarium/antares/commit/07654039b6a99f3115c378b53d659593e5c81f35))
* table fields deletion ([242ddec](https://github.com/EStarium/antares/commit/242ddec744814d15657db1ca88b2d865045ea219))
* **ui:** display table properties tab ([2dc16e8](https://github.com/EStarium/antares/commit/2dc16e8ea8d6d9b79288335888e155ff180eebf5))


### Bug Fixes

* duplicate header fields on join result tables ([ea9b489](https://github.com/EStarium/antares/commit/ea9b489f5f45cffa4a7ac87873fff070205e88c4))
* F9 key shortcut refresh all query tabs instead of just selected one ([c9ba2e5](https://github.com/EStarium/antares/commit/c9ba2e5962eae1afc46daf35e55fb0ea5c3af5a4))
* issue with tabs horizontal scroll with wheel ([c393f86](https://github.com/EStarium/antares/commit/c393f86947d1f65f896cadaa39d53f13e0a1f4eb))
* zero fill field option was not saved ([3e5770f](https://github.com/EStarium/antares/commit/3e5770f7de51bdf2bc0f1f38c7ceb9ef0f4dcd00))
* **mysql:** error getting foreign key list ([ee18388](https://github.com/EStarium/antares/commit/ee183886f64947305cc4f0d38dbdf7919953ec01))
* wrong result fields type and order with some queries ([a8cd177](https://github.com/EStarium/antares/commit/a8cd17748f4ac7d75092f65ae7ca5f96a8a9e8c5))

### [0.0.8](https://github.com/EStarium/antares/compare/v0.0.7...v0.0.8) (2020-10-18)


### Features

* **render:** field type and length on table header mouse hover ([04804b0](https://github.com/EStarium/antares/commit/04804b07c71cec271c31ace13bd41b2c7415e892))
* close modals pressing ESC ([d563cec](https://github.com/EStarium/antares/commit/d563cec70d996f66c4f724bba7de618fc8678e66))
* data table autorefresh, closes [#36](https://github.com/EStarium/antares/issues/36) ([9ecd888](https://github.com/EStarium/antares/commit/9ecd88870d1fcf32bb2c970a1506206c477810a0))
* pie chart with table size in database explore bar ([426628f](https://github.com/EStarium/antares/commit/426628f268c77496a13b3498f03fd7b11fee299a))
* query and data tabs keyboard shortcuts (F5, F9) ([0bf2c8d](https://github.com/EStarium/antares/commit/0bf2c8dc9dd9bdf7a8f48bed61eed7f1f1aacf71))


### Bug Fixes

* context menu outside window when near bottom or right edge ([d4ecaf6](https://github.com/EStarium/antares/commit/d4ecaf65e56044170139bac61c3ee69efc35a8f0))
* disable cell editor for not editable results ([b7c779e](https://github.com/EStarium/antares/commit/b7c779eef63c257c166e7128ea643bdd6142aa88))
* missing connection name when "ask for crendential" selected ([c70e5b4](https://github.com/EStarium/antares/commit/c70e5b422c3534e92a64a0b534eb58663621489c))
* missing header for some query results ([d560c38](https://github.com/EStarium/antares/commit/d560c384f5aed58ea975935975843c3b9061dd85))
* no connection passed to connection's edit modal ([ce25cd0](https://github.com/EStarium/antares/commit/ce25cd0a3130db486ea4da24dd393d45c2ef9e0d))

### [0.0.7](https://github.com/EStarium/antares/compare/v0.0.6...v0.0.7) (2020-10-03)


### Features

* Database creation ([3d0a83f](https://github.com/EStarium/antares/commit/3d0a83f2cf68c4dd412fd7679c39d63f081b7c19))
* Database deletion ([4288a1f](https://github.com/EStarium/antares/commit/4288a1fd331f4a28de2e756f898d208a6a6599c4))
* Edit database collation ([54717e1](https://github.com/EStarium/antares/commit/54717e1f6a36ec0b3dd096d0e1e747512f6dda09))
* Field comment on mouse over a table field name ([2554444](https://github.com/EStarium/antares/commit/2554444322b59a6b1ab3ff05ccf8604bf6f8c8b8))
* Support to multiple queries in the same tab ([48f77ba](https://github.com/EStarium/antares/commit/48f77bae01efbff40bd0f5ce8c66e2619f44bf3a))
* Update italian translation ([89c3dc9](https://github.com/EStarium/antares/commit/89c3dc9fede63c77eb22b48df1a375ea44830306))
* **Spanish translation** thanks to 
[hongkfui](https://github.com/hongkfui) ([#32](https://github.com/EStarium/antares/pull/32))

### Bug Fixes

* Cell update soft reload doesn't apply changes ([1b04b21](https://github.com/EStarium/antares/commit/1b04b216b21b697e47062a9366bc1b6a040a1a72))
* Empty databases not shown in explore bar ([3e737cb](https://github.com/EStarium/antares/commit/3e737cba62f795f225e944939c6bff04b27fa3d4))
* Glitch on table data tab ([10b426b](https://github.com/EStarium/antares/commit/10b426b90b6b9461cfffce3026c982463f6e0599))
* Lack of loading progressbar when an update is available ([86aec4f](https://github.com/EStarium/antares/commit/86aec4f5e41c059e88066a01f0d85155de99a5ee))
* Missing schema when queryng INFORMATION_SCHEMA ([530d1bd](https://github.com/EStarium/antares/commit/530d1bd43fa95de05f594b9b5cae2f4b397f96e0))
* Prevent multiple app instances ([12fbe8c](https://github.com/EStarium/antares/commit/12fbe8c1a03259648554f2a5c69b5abbedc18a48))
* Several fix on data and query tabs ([530907d](https://github.com/EStarium/antares/commit/530907d097ac4d995e1bfcb02e6c890fd6007e21))
* Unable to obtain fields informations for some queries ([43c7072](https://github.com/EStarium/antares/commit/43c7072c1c83a2455ae48a37be69b444b3eb6560))
* Unable to obtain keyUsage informations when adding new row ([023c6a6](https://github.com/EStarium/antares/commit/023c6a633a7f268b1a97b748ad08d2416cc30ffe))
* Value overridden when join tables with fields with same name ([78965d2](https://github.com/EStarium/antares/commit/78965d23e3efb7d8d6d110d79142966e57200757))
* Wrong field names when join tables ([ad0bad8](https://github.com/EStarium/antares/commit/ad0bad8486c3d67ec14ec1aed3d8aff6cce9df87))
* Wrong italian translation ([b29e07c](https://github.com/EStarium/antares/commit/b29e07c3b722aec7e78f3cef2e357a53cbcac474))
* Wrong schema fetching table fields and key usage ([8e71f42](https://github.com/EStarium/antares/commit/8e71f42a28060fdfeeb81502b0759d0d11f5bcfd))
* Wrong table and schema when more than one query in a tab ([4684b41](https://github.com/EStarium/antares/commit/4684b4114b9c9c253120292d7d164d7676011f86))

### [0.0.6](https://github.com/EStarium/antares/compare/v0.0.5...v0.0.6) (2020-09-03)


### Features

* Aliases support ([264de9c](https://github.com/EStarium/antares/commit/264de9c5686fb3a2ef22d96171f45b915ba1b34b))
* Middle click to close tabs ([256ec76](https://github.com/EStarium/antares/commit/256ec765883fcf247355190827e943c76e95f13b))
* Monaco-editor as query editor ([196a3e0](https://github.com/EStarium/antares/commit/196a3e0185a3d68b7c4ade8dbf187d2b216cc00b))
* Sql suggestions in query editor ([8dc74ef](https://github.com/EStarium/antares/commit/8dc74ef2c335e8ae4a69f5d2651df65939139b1b))
* Support to multiple query tabs ([d7ed00f](https://github.com/EStarium/antares/commit/d7ed00f4a3613da9015c9fc48c4d8062d292e416))
* Tabs horizontal scroll with mouse wheel ([3a6ea76](https://github.com/EStarium/antares/commit/3a6ea76b93682ebd50908df7368c62c2c1e27958))
* **Arabic translation** thanks to [Mohd-PH](https://github.com/Mohd-PH) ([#29](https://github.com/EStarium/antares/pull/29))

### Bug Fixes

* Error when launching queries without a result from query tabs ([a1a6f51](https://github.com/EStarium/antares/commit/a1a6f51f2fba5140f5e3bd9cd6557c8a13dfaa2c))
* Field name displayed instead of alias ([801a0de](https://github.com/EStarium/antares/commit/801a0de1865dea2a59ff057b7c2cc988cc9c87ed))
* Wrong table height calc in some cases ([fd6d517](https://github.com/EStarium/antares/commit/fd6d5177efb6161aab01f9e108eda60df6c7d8c4))

### [0.0.5](https://github.com/EStarium/antares/compare/v0.0.4...v0.0.5) (2020-08-17)

### Features

* Badge on setting icon and update tab when update is available ([e8141b6](https://github.com/EStarium/antares/commit/e8141b632154f765ca73fa50b9b7120dc592ead0))
* Foreign key support in add/edit row ([0b6a188](https://github.com/EStarium/antares/commit/0b6a188d1959b80b4a66946cc79d2dd3853a428b))
* Option to insert table rows ([2f1dfdc](https://github.com/EStarium/antares/commit/2f1dfdc6543b4a6c1d595f0daa00c0832be49c77))

### Bug Fixes

* Insert files via add row option ([3c6e818](https://github.com/EStarium/antares/commit/3c6e818ba06f1b8b5db0ecf80c3b7498d6d2a841))
* Newline replaced with undefined inside queries ([59e4a79](https://github.com/EStarium/antares/commit/59e4a79f42076b3fce98a764e9ad6a01c674555b))
* Query result header didn't show just selected fields ([7bc1009](https://github.com/EStarium/antares/commit/7bc10092fe4823e03133e69e0a7bf86e44fde43b))
* Table header not fixed on top when fast scrolling ([13b0816](https://github.com/EStarium/antares/commit/13b0816837461119eaab79fdb7e92223e0950630))
* Time and datetime precision ([771f8a2](https://github.com/EStarium/antares/commit/771f8a2d682c64105231e3fef199f05150596298))
* Update a row with a string key value ([eb348b3](https://github.com/EStarium/antares/commit/eb348b3095b6905321b62eed6cea228374ebc3d1))
* Window title not perfectly centered ([7651d05](https://github.com/EStarium/antares/commit/7651d05b37970574d6ae4bdf75c20c69d59c1e6d))
* Wrong schema passed in query tab when a different database was selected ([6d0724d](https://github.com/EStarium/antares/commit/6d0724dc90cdebb10e0342d2c472bdd07aa345f8))

### [0.0.4](https://github.com/EStarium/antares/compare/v0.0.3-alpha...v0.0.4) (2020-08-06)

### Features

* Blob fields edit/view/download ([712fe9f](https://github.com/EStarium/antares/commit/712fe9f00d210db0f2317eca61e7fb648383e3fe))
* Window title in app title bar ([0089c0c](https://github.com/EStarium/antares/commit/0089c0cbac6caf0a6fd195849099f18713580228))
