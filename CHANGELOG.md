# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
