# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
