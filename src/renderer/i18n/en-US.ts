/**
 * [TRANSLATION UPDATE HELPER]
 * - Open a terminal in antares folder and run `npm run translation:check short-code` replacing short-code with the one you are updating.
 * - The command will output which terms are missing or not translated from english.
 * - Open antares folder with your editor of choice.
 * - Go to antares/src/renderer/i18n/ and open the locale file you want to translate.
 * - Add and translate missing terms and consider whether to translate untranslated terms.
 */

export const enUS = {
   general: { // General purpose terms
      edit: 'Edit',
      save: 'Save',
      close: 'Close',
      delete: 'Delete',
      confirm: 'Confirm',
      cancel: 'Cancel',
      send: 'Send',
      refresh: 'Refresh',
      autoRefresh: 'Auto-refresh',
      version: 'Version',
      donate: 'Donate',
      run: 'Run',
      results: 'Results',
      size: 'Size',
      mimeType: 'Mime-Type',
      download: 'Download',
      add: 'Add',
      data: 'Data',
      properties: 'Properties',
      name: 'Name',
      clear: 'Clear',
      options: 'Options',
      insert: 'Insert',
      discard: 'Discard',
      stay: 'Stay',
      author: 'Author',
      upload: 'Upload',
      browse: 'Browse',
      content: 'Content',
      cut: 'Cut',
      copy: 'Copy',
      paste: 'Paste',
      duplicate: 'Duplicate',
      tools: 'Tools',
      seconds: 'Seconds',
      all: 'All',
      new: 'New',
      select: 'Select',
      change: 'Change',
      include: 'Include',
      includes: 'Includes',
      completed: 'Completed',
      aborted: 'Aborted',
      disabled: 'Disabled',
      enable: 'Enable',
      disable: 'Disable',
      contributors: 'Contributors',
      pin: 'Pin',
      unpin: 'Unpin',
      folder: 'Folder | Folders',
      none: 'None',
      singleQuote: 'Single quote',
      doubleQuote: 'Double quote',
      deleteConfirm: 'Do you confirm the cancellation of',
      uploadFile: 'Upload file',
      format: 'Format', // Format code
      history: 'History',
      filter: 'Filter',
      manualValue: 'Manual value',
      selectAll: 'Select all',
      pageNumber: 'Page number',
      directoryPath: 'Directory path',
      actionSuccessful: '{action} successful',
      outputFormat: 'Output format',
      singleFile: 'Single {ext} file',
      zipCompressedFile: 'ZIP compressed {ext} file',
      copyName: 'Copy name',
      search: 'Search',
      title: 'Title',
      archive: 'Archive', // verb
      undo: 'Undo',
      moveTo: 'Move to'
   },
   connection: { // Database connection
      connection: 'Connection',
      connectionName: 'Connection name',
      hostName: 'Host name',
      client: 'Client',
      port: 'Port',
      user: 'User',
      password: 'Password',
      credentials: 'Credentials',
      connect: 'Connect',
      connected: 'Connected',
      disconnect: 'Disconnect',
      disconnected: 'Disconnected',
      ssl: 'SSL',
      enableSsl: 'Enable SSL',
      privateKey: 'Private key',
      certificate: 'Certificate',
      caCertificate: 'CA certificate',
      ciphers: 'Ciphers',
      untrustedConnection: 'Untrusted connection',
      passphrase: 'Passphrase',
      sshTunnel: 'SSH tunnel',
      enableSsh: 'Enable SSH',
      connectionString: 'Connection string',
      addConnection: 'Add connection',
      createConnection: 'Create connection',
      createNewConnection: 'Create new connection',
      askCredentials: 'Ask for credentials',
      testConnection: 'Test connection',
      editConnection: 'Edit connection',
      deleteConnection: 'Delete connection',
      connectionSuccessfullyMade: 'Connection successfully made!',
      readOnlyMode: 'Read-only mode',
      allConnections: 'All connections',
      searchForConnections: 'Search for connections',
      keepAliveInterval: 'Keep alive interval',
      singleConnection: 'Single connection'
   },
   database: { // Database related terms
      schema: 'Schema',
      type: 'Type',
      insert: 'Insert',
      indexes: 'Indexes',
      foreignKeys: 'Foreign keys',
      tableChecks: 'Table checks',
      length: 'Length',
      unsigned: 'Unsigned',
      default: 'Default',
      comment: 'Comment',
      key: 'Key | Keys',
      order: 'Order',
      expression: 'Expression',
      autoIncrement: 'Auto Increment',
      engine: 'Engine',
      field: 'Field | Fields',
      approximately: 'Approximately',
      total: 'Total',
      table: 'Table | Tables',
      view: 'View | Views',
      materializedView: 'Materialized view | Materialized views',
      definer: 'Definer',
      algorithm: 'Algorithm',
      trigger: 'Trigger | Triggers',
      storedRoutine: 'Stored routine | Stored routines',
      scheduler: 'Scheduler | Schedulers',
      event: 'Event',
      parameters: 'Parameters',
      function: 'Function | Functions',
      deterministic: 'Deterministic',
      context: 'Context',
      export: 'Export',
      import: 'Import',
      returns: 'Returns',
      timing: 'Timing',
      state: 'State',
      execution: 'Execution',
      starts: 'Starts',
      ends: 'Ends',
      variables: 'Variables',
      processes: 'Processes',
      database: 'Database',
      array: 'Array',
      structure: 'Structure',
      row: 'Row | Rows',
      cell: 'Cell | Cells',
      triggerFunction: 'Trigger function | Trigger functions',
      routine: 'Routine | Routines',
      drop: 'Drop',
      commit: 'Commit',
      rollback: 'Rollback',
      ddl: 'DDL',
      collation: 'Collation',
      resultsTable: 'Results table',
      unableEditFieldWithoutPrimary: 'Unable to edit a field without a primary key in resultset',
      editCell: 'Edit cell',
      deleteRows: 'Delete row | Delete {count} rows',
      confirmToDeleteRows: 'Do you confirm to delete one row? | Do you confirm to delete {count} rows?',
      addNewRow: 'Add new row',
      numberOfInserts: 'Number of inserts',
      affectedRows: 'Affected rows',
      createNewDatabase: 'Create new Database',
      databaseName: 'Database name',
      serverDefault: 'Server default',
      deleteDatabase: 'Delete database',
      editDatabase: 'Edit database',
      clearChanges: 'Clear changes',
      addNewField: 'Add new field',
      manageIndexes: 'Manage indexes',
      manageForeignKeys: 'Manage foreign keys',
      manageTableChecks: 'Manage table checks',
      allowNull: 'Allow NULL',
      zeroFill: 'Zero fill',
      customValue: 'Custom value',
      onUpdate: 'On update',
      deleteField: 'Delete field',
      createNewIndex: 'Create new index',
      createNewCheck: 'Create new check',
      checkClause: 'Check clause',
      addToIndex: 'Add to index',
      createNewTable: 'Create new table',
      emptyTable: 'Empty table',
      duplicateTable: 'Duplicate table',
      deleteTable: 'Delete table',
      exportTable: 'Export table',
      emptyConfirm: 'Do you confirm to empty',
      thereAreNoIndexes: 'There are no indexes',
      thereAreNoForeign: 'There are no foreign keys',
      thereAreNoTableChecks: 'There are no table checks',
      createNewForeign: 'Create new foreign key',
      referenceTable: 'Ref. table',
      referenceField: 'Ref. field',
      foreignFields: 'Foreign fields',
      invalidDefault: 'Invalid default',
      onDelete: 'On delete',
      selectStatement: 'Select statement',
      triggerStatement: 'Trigger statement',
      sqlSecurity: 'SQL security',
      updateOption: 'Update option',
      deleteView: 'Delete view',
      createNewView: 'Create new view',
      createNewMaterializedView: 'Create new materialized view',
      deleteTrigger: 'Delete trigger',
      createNewTrigger: 'Create new trigger',
      currentUser: 'Current user',
      routineBody: 'Routine body',
      dataAccess: 'Data access',
      thereAreNoParameters: 'There are no parameters',
      createNewParameter: 'Create new parameter',
      createNewRoutine: 'Create new stored routine',
      deleteRoutine: 'Delete stored routine',
      functionBody: 'Function body',
      createNewFunction: 'Create new function',
      deleteFunction: 'Delete function',
      schedulerBody: 'Scheduler body',
      createNewScheduler: 'Create new scheduler',
      deleteScheduler: 'Delete scheduler',
      preserveOnCompletion: 'Preserve on completion',
      tableFiller: 'Table Filler',
      fakeDataLanguage: 'Fake data language',
      queryDuration: 'Query duration',
      setNull: 'Set NULL',
      processesList: 'Processes list',
      processInfo: 'Process info',
      manageUsers: 'Manage users',
      createNewSchema: 'Create new schema',
      schemaName: 'Schema name',
      editSchema: 'Edit schema',
      deleteSchema: 'Delete schema',
      noSchema: 'No schema',
      runQuery: 'Run query',
      thereAreNoTableFields: 'There are no table fields',
      newTable: 'New table',
      newView: 'New view',
      newMaterializedView: 'New materialized view',
      newTrigger: 'New trigger',
      newRoutine: 'New routine',
      newFunction: 'New function',
      newScheduler: 'New scheduler',
      newTriggerFunction: 'New trigger function',
      thereAreNoQueriesYet: 'There are no queries yet',
      searchForQueries: 'Search for queries',
      killProcess: 'Kill process',
      exportSchema: 'Export schema',
      importSchema: 'Import schema',
      newInsertStmtEvery: 'New INSERT statement every',
      processingTableExport: 'Processing {table}',
      fetchingTableExport: 'Fetching {table} data',
      writingTableExport: 'Writing {table} data',
      checkAllTables: 'Check all tables',
      uncheckAllTables: 'Uncheck all tables',
      killQuery: 'Kill query',
      insertRow: 'Insert row | Insert rows',
      commitMode: 'Commit mode',
      autoCommit: 'Auto commit',
      manualCommit: 'Manual commit',
      importQueryErrors: 'Warning: {n} error has occurred | Warning: {n} errors occurred',
      executedQueries: '{n} query executed | {n} queries executed',
      disableFKChecks: 'Disable foreign key checks',
      formatQuery: 'Format query',
      queryHistory: 'Query history',
      clearQuery: 'Clear query',
      fillCell: 'Fill cell',
      executeSelectedQuery: 'Execute selected query',
      noResultsPresent: 'No results present',
      sqlExportOptions: 'SQL export options',
      targetTable: 'Target table',
      switchDatabase: 'Switch the database',
      searchForElements: 'Search for elements',
      searchForSchemas: 'Search for schemas',
      savedQueries: 'Saved queries'
   },
   application: { // Application related terms
      settings: 'Settings',
      console: 'Console',
      general: 'General',
      themes: 'Themes',
      update: 'Update',
      about: 'About',
      language: 'Language',
      shortcuts: 'Shortcuts',
      key: 'Key | Keys', // Keyboard key
      event: 'Event',
      light: 'Light',
      dark: 'Dark',
      autoCompletion: 'Auto Completion',
      application: 'Application',
      editor: 'Editor',
      changelog: 'Changelog',
      small: 'Small',
      medium: 'Medium',
      large: 'Large',
      appearance: 'Appearance',
      color: 'Color',
      label: 'Label',
      icon: 'Icon',
      customIcon: 'Custom icon',
      fileName: 'File name',
      choseFile: 'Choose file',
      data: 'Data',
      password: 'Password',
      required: 'Required',
      madeWithJS: 'Made with 💛 and JavaScript!',
      checkForUpdates: 'Check for updates',
      noUpdatesAvailable: 'No updates available',
      checkingForUpdate: 'Checking for updates',
      checkFailure: 'Check failed, please try later',
      updateAvailable: 'Update available',
      downloadingUpdate: 'Downloading update',
      updateDownloaded: 'Update downloaded',
      restartToInstall: 'Restart Antares to install',
      includeBetaUpdates: 'Include beta updates',
      notificationsTimeout: 'Notifications timeout',
      openNewTab: 'Open a new tab',
      unsavedChanges: 'Unsaved changes',
      discardUnsavedChanges: 'You have some unsaved changes. Closing this tab these changes will be discarded.',
      applicationTheme: 'Application Theme',
      editorTheme: 'Editor Theme',
      wrapLongLines: 'Wrap long lines',
      markdownSupported: 'Markdown supported',
      plantATree: 'Plant a Tree',
      dataTabPageSize: 'Results per page',
      noOpenTabs: 'There are no open tabs, navigate on the left bar or:',
      restorePreviousSession: 'Restore previous session',
      closeTab: 'Close tab',
      goToDownloadPage: 'Go to download page',
      disableBlur: 'Disable blur',
      missingOrIncompleteTranslation: 'Missing or incomplete translation?',
      findOutHowToContribute: 'Find out how to contribute',
      reportABug: 'Report a bug',
      nextTab: 'Next tab',
      previousTab: 'Previous tab',
      selectTabNumber: 'Select tab number {param}',
      toggleConsole: 'Toggle console',
      addShortcut: 'Add shortcut',
      editShortcut: 'Edit shortcut',
      deleteShortcut: 'Delete shortcut',
      restoreDefaults: 'Restore defaults',
      restoreDefaultsQuestion: 'Do you confirm to restore default values?',
      registerAShortcut: 'Register a shortcut',
      invalidShortcutMessage: 'Invalid combination, continue to type',
      shortcutAlreadyExists: 'Shortcut already exists',
      saveContent: 'Save content',
      openAllConnections: 'Open all connections',
      openSettings: 'Open settings',
      runOrReload: 'Run or reload',
      openFilter: 'Open filter',
      nextResultsPage: 'Next results page',
      previousResultsPage: 'Previous results page',
      editFolder: 'Edit folder',
      folderName: 'Folder name',
      deleteFolder: 'Delete folder',
      newFolder: 'New folder',
      outOfFolder: 'Out of folder',
      editConnectionAppearance: 'Edit connection appearance',
      defaultCopyType: 'Default copy type',
      showTableSize: 'Show table size in sidebar',
      showTableSizeDescription: 'MySQL/MariaDB only. Enable this option may affects performance on schema with many tables.',
      switchSearchMethod: 'Switch search method',
      phpArray: 'PHP array',
      closeAllTabs: 'Close all tabs',
      closeOtherTabs: 'Close other tabs',
      closeTabsToLeft: 'Close tabs to the left',
      closeTabsToRight: 'Close tabs to the right',
      csvFieldDelimiter: 'Field delimiter',
      csvLinesTerminator: 'Line terminator',
      csvStringDelimiter: 'String delimiter',
      csvIncludeHeader: 'Include header',
      csvExportOptions: 'CSV export options',
      exportData: 'Export data',
      exportDataExplanation: 'Export saved connections to Antares. You will be asked for a password to encrypt the exported file.',
      importData: 'Import data',
      importDataExplanation: 'Imports an .antares file containing connections. You will need to enter the password defined during export.',
      includeConnectionPasswords: 'Include connection passwords',
      includeFolders: 'Include folders',
      encryptionPassword: 'Encryption password',
      encryptionPasswordError: 'The encryption password must be at least 8 characters long.',
      ignoreDuplicates: 'Ignore duplicates',
      wrongImportPassword: 'Wrong import password',
      wrongFileFormat: 'Wrong file format',
      invalidFile: 'Invalid file',
      dataImportSuccess: 'Data successfully imported',
      note: 'Note | Notes',
      thereAreNoNotesYet: 'There are no notes yet',
      addNote: 'Add note',
      editNote: 'Edit note',
      saveAsNote: 'Save as note',
      showArchivedNotes: 'Show archived notes',
      hideArchivedNotes: 'Hide archived notes',
      tag: 'Tag', // Note tag,
      saveFile: 'Save file',
      saveFileAs: 'Save file as',
      openFile: 'Open file',
      openNotes: 'Open notes',
      debugConsole: 'Debug console', // <- console tab name
      executedQueries: 'Executed queries', // <- console tab name
      sizeLimitError: 'Maximum size of {size} exceeded',
      fullScreen: 'Full screen',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      zoomReset: 'Reset zoom'
   },
   faker: { // Faker.js methods, used in random generated content
      address: 'Address',
      commerce: 'Commerce',
      company: 'Company',
      database: 'Database',
      date: 'Date',
      finance: 'Finance',
      git: 'Git',
      hacker: 'Hacker',
      internet: 'Internet',
      lorem: 'Lorem',
      name: 'Name',
      music: 'Music',
      phone: 'Phone',
      random: 'Random',
      system: 'System',
      time: 'Time',
      vehicle: 'Vehicle',
      zipCode: 'Zip code',
      zipCodeByState: 'Zip code by state',
      city: 'City',
      cityPrefix: 'City prefix',
      citySuffix: 'City suffix',
      streetName: 'Street name',
      streetAddress: 'Street address',
      streetSuffix: 'Street suffix',
      streetPrefix: 'Street prefix',
      secondaryAddress: 'Secondary address',
      county: 'County',
      country: 'Country',
      countryCode: 'Country code',
      state: 'State',
      stateAbbr: 'State abbreviation',
      latitude: 'Latitude',
      longitude: 'Longitude',
      direction: 'Direction',
      cardinalDirection: 'Cardinal direction',
      ordinalDirection: 'Ordinal direction',
      nearbyGPSCoordinate: 'Nearby GPS coordinate',
      timeZone: 'Time zone',
      color: 'Color',
      department: 'Department',
      productName: 'Product name',
      price: 'Price',
      productAdjective: 'Product adjective',
      productMaterial: 'Product material',
      product: 'Product',
      productDescription: 'Product description',
      suffixes: 'Suffixes',
      companyName: 'Company name',
      companySuffix: 'Company suffix',
      catchPhrase: 'Catch phrase',
      bs: 'BS',
      catchPhraseAdjective: 'Catch phrase adjective',
      catchPhraseDescriptor: 'Catch phrase descriptor',
      catchPhraseNoun: 'Catch phrase noun',
      bsAdjective: 'BS adjective',
      bsBuzz: 'BS buzz',
      bsNoun: 'BS noun',
      column: 'Column',
      type: 'Type',
      collation: 'Collation',
      engine: 'Engine',
      past: 'Past',
      now: 'Now',
      future: 'Future',
      between: 'Between',
      recent: 'Recent',
      soon: 'Soon',
      month: 'Month',
      weekday: 'Weekday',
      account: 'Account',
      accountName: 'Account name',
      routingNumber: 'Routing number',
      mask: 'Mask',
      amount: 'Amount',
      transactionType: 'Transaction type',
      currencyCode: 'Currency code',
      currencyName: 'Currency name',
      currencySymbol: 'Currency symbol',
      bitcoinAddress: 'Bitcoin address',
      litecoinAddress: 'Litecoin address',
      creditCardNumber: 'Credit card number',
      creditCardCVV: 'Credit card CVV',
      ethereumAddress: 'Ethereum address',
      iban: 'Iban',
      bic: 'Bic',
      transactionDescription: 'Transaction description',
      branch: 'Branch',
      commitEntry: 'Commit entry',
      commitMessage: 'Commit message',
      commitSha: 'Commit SHA',
      shortSha: 'Short SHA',
      abbreviation: 'Abbreviation',
      adjective: 'Adjective',
      noun: 'Noun',
      verb: 'Verb',
      ingverb: 'Ingverb',
      phrase: 'Phrase',
      avatar: 'Avatar',
      email: 'Email',
      exampleEmail: 'Example email',
      userName: 'Username',
      protocol: 'Protocol',
      url: 'Url',
      domainName: 'Domin name',
      domainSuffix: 'Domain suffix',
      domainWord: 'Domain word',
      ip: 'Ip',
      ipv6: 'Ipv6',
      userAgent: 'User agent',
      mac: 'Mac',
      password: 'Password',
      word: 'Word',
      words: 'Words',
      sentence: 'Sentence',
      slug: 'Slug',
      sentences: 'Sentences',
      paragraph: 'Paragraph',
      paragraphs: 'Paragraphs',
      text: 'Text',
      lines: 'Lines',
      genre: 'Genre',
      firstName: 'First name',
      lastName: 'Last name',
      middleName: 'Middle name',
      findName: 'Full name',
      jobTitle: 'Job title',
      gender: 'Gender',
      prefix: 'Prefix',
      suffix: 'Suffix',
      title: 'Title',
      jobDescriptor: 'Job descriptor',
      jobArea: 'Job area',
      jobType: 'Job type',
      phoneNumber: 'Phone number',
      phoneNumberFormat: 'Phone number format',
      phoneFormats: 'Phone formats',
      number: 'Number',
      float: 'Float',
      arrayElement: 'Array element',
      arrayElements: 'Array elements',
      objectElement: 'Object element',
      uuid: 'Uuid',
      boolean: 'Boolean',
      image: 'Image',
      locale: 'Locale',
      alpha: 'Alpha',
      alphaNumeric: 'Alphanumeric',
      hexaDecimal: 'Hexadecimal',
      fileName: 'File name',
      commonFileName: 'Common file name',
      mimeType: 'Mime type',
      commonFileType: 'Common file type',
      commonFileExt: 'Common file extension',
      fileType: 'File type',
      fileExt: 'File extension',
      directoryPath: 'Directory path',
      filePath: 'File path',
      semver: 'Semver',
      manufacturer: 'Manufacturer',
      model: 'Model',
      fuel: 'Fuel',
      vin: 'Vin'
   }
};
