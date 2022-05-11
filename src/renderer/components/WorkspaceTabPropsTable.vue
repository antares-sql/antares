<template>
   <div v-show="isSelected" class="workspace-query-tab column col-12 columns col-gapless">
      <div class="workspace-query-runner column col-12">
         <div class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <button
                  class="btn btn-primary btn-sm"
                  :disabled="!isChanged"
                  :class="{'loading':isSaving}"
                  title="CTRL+S"
                  @click="saveChanges"
               >
                  <i class="mdi mdi-24px mdi-content-save mr-1" />
                  <span>{{ $t('word.save') }}</span>
               </button>
               <button
                  :disabled="!isChanged || isSaving"
                  class="btn btn-link btn-sm mr-0"
                  :title="$t('message.clearChanges')"
                  @click="clearChanges"
               >
                  <i class="mdi mdi-24px mdi-delete-sweep mr-1" />
                  <span>{{ $t('word.clear') }}</span>
               </button>

               <div class="divider-vert py-3" />

               <button
                  :disabled="isSaving"
                  class="btn btn-dark btn-sm"
                  :title="$t('message.addNewField')"
                  @click="addField"
               >
                  <i class="mdi mdi-24px mdi-playlist-plus mr-1" />
                  <span>{{ $t('word.add') }}</span>
               </button>
               <button
                  :disabled="isSaving"
                  class="btn btn-dark btn-sm"
                  :title="$t('message.manageIndexes')"
                  @click="showIntdexesModal"
               >
                  <i class="mdi mdi-24px mdi-key mdi-rotate-45 mr-1" />
                  <span>{{ $t('word.indexes') }}</span>
               </button>
               <button
                  class="btn btn-dark btn-sm"
                  :disabled="isSaving"
                  @click="showForeignModal"
               >
                  <i class="mdi mdi-24px mdi-key-link mr-1" />
                  <span>{{ $t('word.foreignKeys') }}</span>
               </button>
            </div>
            <div class="workspace-query-info">
               <div class="d-flex" :title="$t('word.schema')">
                  <i class="mdi mdi-18px mdi-database mr-1" /><b>{{ schema }}</b>
               </div>
            </div>
         </div>
      </div>
      <div class="container">
         <div class="columns mb-4">
            <div class="column col-auto">
               <div class="form-group">
                  <label class="form-label">{{ $t('word.name') }}</label>
                  <input
                     v-model="localOptions.name"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div v-if="workspace.customizations.comment" class="column">
               <div class="form-group">
                  <label class="form-label">{{ $t('word.comment') }}</label>
                  <input
                     v-model="localOptions.comment"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>

            <div v-if="workspace.customizations.autoIncrement" class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ $t('word.autoIncrement') }}
                  </label>
                  <input
                     ref="firstInput"
                     v-model="localOptions.autoIncrement"
                     class="form-input"
                     type="number"
                     :disabled="localOptions.autoIncrement === null"
                  >
               </div>
            </div>
            <div v-if="workspace.customizations.collations" class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ $t('word.collation') }}
                  </label>
                  <BaseSelect
                     v-model="localOptions.collation"
                     :options="workspace.collations"
                     option-label="collation"
                     option-track-by="collation"
                     class="form-select"
                  />
               </div>
            </div>
            <div v-if="workspace.customizations.engines" class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ $t('word.engine') }}
                  </label>
                  <BaseSelect
                     v-model="localOptions.engine"
                     class="form-select"
                     :options="workspace.engines"
                     option-label="name"
                     option-track-by="name"
                  />
               </div>
            </div>
         </div>
      </div>
      <div class="workspace-query-results column col-12 p-relative">
         <BaseLoader v-if="isLoading" />
         <WorkspaceTabPropsTableFields
            v-if="localFields"
            ref="indexTable"
            :fields="localFields"
            :indexes="localIndexes"
            :foreigns="localKeyUsage"
            :tab-uid="tabUid"
            :conn-uid="connection.uid"
            :index-types="workspace.indexTypes"
            :table="table"
            :schema="schema"
            mode="table"
            @duplicate-field="duplicateField"
            @remove-field="removeField"
            @add-new-index="addNewIndex"
            @add-to-index="addToIndex"
            @rename-field="renameField"
         />
      </div>
      <WorkspaceTabPropsTableIndexesModal
         v-if="isIndexesModal"
         :local-indexes="localIndexes"
         :table="table"
         :fields="localFields"
         :index-types="workspace.indexTypes"
         :workspace="workspace"
         @hide="hideIndexesModal"
         @indexes-update="indexesUpdate"
      />
      <WorkspaceTabPropsTableForeignModal
         v-if="isForeignModal"
         :local-key-usage="localKeyUsage"
         :connection="connection"
         :table="table"
         :schema="schema"
         :schema-tables="schemaTables"
         :fields="localFields"
         :workspace="workspace"
         @hide="hideForeignModal"
         @foreigns-update="foreignsUpdate"
      />
   </div>
</template>

<script>
import { storeToRefs } from 'pinia';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import { uidGen } from 'common/libs/uidGen';
import Tables from '@/ipc-api/Tables';
import BaseLoader from '@/components/BaseLoader';
import WorkspaceTabPropsTableFields from '@/components/WorkspaceTabPropsTableFields';
import WorkspaceTabPropsTableIndexesModal from '@/components/WorkspaceTabPropsTableIndexesModal';
import WorkspaceTabPropsTableForeignModal from '@/components/WorkspaceTabPropsTableForeignModal';
import BaseSelect from '@/components/BaseSelect.vue';

export default {
   name: 'WorkspaceTabPropsTable',
   components: {
      BaseLoader,
      WorkspaceTabPropsTableFields,
      WorkspaceTabPropsTableIndexesModal,
      WorkspaceTabPropsTableForeignModal,
      BaseSelect
   },
   props: {
      tabUid: String,
      connection: Object,
      isSelected: Boolean,
      table: String,
      schema: String
   },
   setup () {
      const { addNotification } = useNotificationsStore();
      const workspacesStore = useWorkspacesStore();

      const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

      const {
         getWorkspace,
         getDatabaseVariable,
         refreshStructure,
         renameTabs,
         changeBreadcrumbs,
         setUnsavedChanges
      } = workspacesStore;

      return {
         addNotification,
         getDatabaseVariable,
         getWorkspace,
         selectedWorkspace,
         refreshStructure,
         setUnsavedChanges,
         renameTabs,
         changeBreadcrumbs
      };
   },
   data () {
      return {
         isLoading: false,
         isSaving: false,
         isIndexesModal: false,
         isForeignModal: false,
         isOptionsChanging: false,
         originalFields: [],
         localFields: [],
         originalKeyUsage: [],
         localKeyUsage: [],
         originalIndexes: [],
         localIndexes: [],
         tableOptions: {},
         localOptions: {},
         lastTable: null,
         newFieldsCounter: 0
      };
   },
   computed: {
      workspace () {
         return this.getWorkspace(this.connection.uid);
      },
      defaultEngine () {
         const engine = this.getDatabaseVariable(this.connection.uid, 'default_storage_engine');
         return engine ? engine.value : '';
      },
      schemaTables () {
         const schemaTables = this.workspace.structure
            .filter(schema => schema.name === this.schema)
            .map(schema => schema.tables);

         return schemaTables.length ? schemaTables[0].filter(table => table.type === 'table') : [];
      },
      isChanged () {
         return JSON.stringify(this.originalFields) !== JSON.stringify(this.localFields) ||
            JSON.stringify(this.originalKeyUsage) !== JSON.stringify(this.localKeyUsage) ||
            JSON.stringify(this.originalIndexes) !== JSON.stringify(this.localIndexes) ||
            JSON.stringify(this.tableOptions) !== JSON.stringify(this.localOptions);
      }
   },
   watch: {
      schema () {
         if (this.isSelected) {
            this.getFieldsData();
            this.lastTable = this.table;
         }
      },
      table () {
         if (this.isSelected) {
            this.getFieldsData();
            this.lastTable = this.table;
         }
      },
      isSelected (val) {
         if (val) {
            this.changeBreadcrumbs({ schema: this.schema, table: this.table });

            if (this.lastTable !== this.table)
               this.getFieldsData();
         }
      },
      isChanged (val) {
         this.setUnsavedChanges({ uid: this.connection.uid, tUid: this.tabUid, isChanged: val });
      }
   },
   created () {
      this.getFieldsData();
      window.addEventListener('keydown', this.onKey);
   },
   beforeUnmount () {
      window.removeEventListener('keydown', this.onKey);
   },
   methods: {
      async getTableOptions (params) {
         const db = this.workspace.structure.find(db => db.name === this.schema);

         if (db && db.tables.length && this.table)
            this.tableOptions = db.tables.find(table => table.name === this.table);
         else {
            const { status, response } = await Tables.getTableOptions(params);

            if (status === 'success')
               this.tableOptions = response;
            else
               this.addNotification({ status: 'error', message: response });
         }
      },
      async getFieldsData () {
         if (!this.table) return;

         this.localFields = [];
         this.lastTable = this.table;
         this.newFieldsCounter = 0;
         this.isLoading = true;

         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            table: this.table
         };

         try {
            await this.getTableOptions(params);
            this.localOptions = JSON.parse(JSON.stringify(this.tableOptions));
         }
         catch (err) {
            console.error(err);
         }

         try { // Columns data
            const { status, response } = await Tables.getTableColumns(params);
            if (status === 'success') {
               this.originalFields = response.map(field => {
                  if (field.autoIncrement)
                     field.defaultType = 'autoincrement';
                  else if (field.default === null)
                     field.defaultType = 'noval';
                  else if (field.default === 'NULL')
                     field.defaultType = 'null';
                  else if (isNaN(+field.default) && field.default.charAt(0) !== '\'')
                     field.defaultType = 'expression';
                  else {
                     field.defaultType = 'custom';
                     if (isNaN(+field.default) && !field.default.includes('\''))
                        field.default = `'${field.default}'`;
                  }

                  return { ...field, _antares_id: uidGen() };
               });
               this.localFields = JSON.parse(JSON.stringify(this.originalFields));
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         try { // Indexes
            const { status, response } = await Tables.getTableIndexes(params);

            if (status === 'success') {
               const indexesObj = response.reduce((acc, curr) => {
                  acc[curr.name] = acc[curr.name] || [];
                  acc[curr.name].push(curr);
                  return acc;
               }, {});

               this.originalIndexes = Object.keys(indexesObj).map(index => {
                  return {
                     _antares_id: uidGen(),
                     name: index,
                     fields: indexesObj[index].map(field => field.column),
                     type: indexesObj[index][0].type,
                     comment: indexesObj[index][0].comment,
                     indexType: indexesObj[index][0].indexType,
                     indexComment: indexesObj[index][0].indexComment,
                     cardinality: indexesObj[index][0].cardinality
                  };
               });

               this.localIndexes = JSON.parse(JSON.stringify(this.originalIndexes));
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         try { // Key usage (foreign keys)
            const { status, response } = await Tables.getKeyUsage(params);

            if (status === 'success') {
               this.originalKeyUsage = response.map(foreign => {
                  return {
                     _antares_id: uidGen(),
                     ...foreign
                  };
               });
               this.localKeyUsage = JSON.parse(JSON.stringify(this.originalKeyUsage));
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.isLoading = false;
      },
      async saveChanges () {
         if (this.isSaving) return;
         this.isSaving = true;

         // FIELDS
         const originalIDs = this.originalFields.reduce((acc, curr) => [...acc, curr._antares_id], []);
         const localIDs = this.localFields.reduce((acc, curr) => [...acc, curr._antares_id], []);

         // Fields Additions
         const additions = this.localFields.filter(field => !originalIDs.includes(field._antares_id)).map(field => {
            const lI = this.localFields.findIndex(localField => localField._antares_id === field._antares_id);
            const after = lI > 0 ? this.localFields[lI - 1].name : false;
            return { ...field, after };
         });

         // Fields Deletions
         const deletions = this.originalFields.filter(field => !localIDs.includes(field._antares_id));

         // Fields Changes
         const changes = [];
         this.originalFields.forEach((originalField, oI) => {
            const lI = this.localFields.findIndex(localField => localField._antares_id === originalField._antares_id);
            const originalSibling = oI > 0 ? this.originalFields[oI - 1]._antares_id : false;
            const localSibling = lI > 0 ? this.localFields[lI - 1]._antares_id : false;
            const after = lI > 0 ? this.localFields[lI - 1].name : false;
            const orgName = originalField.name;

            if (JSON.stringify(originalField) !== JSON.stringify(this.localFields[lI]) || originalSibling !== localSibling)
               if (this.localFields[lI]) changes.push({ ...this.localFields[lI], after, orgName });
         });

         // OPTIONS
         const options = Object.keys(this.localOptions).reduce((acc, option) => {
            if (this.localOptions[option] !== this.tableOptions[option])
               acc[option] = this.localOptions[option];
            return acc;
         }, {});

         // INDEXES
         const indexChanges = {
            additions: [],
            changes: [],
            deletions: []
         };
         const originalIndexIDs = this.originalIndexes.reduce((acc, curr) => [...acc, curr._antares_id], []);
         const localIndexIDs = this.localIndexes.reduce((acc, curr) => [...acc, curr._antares_id], []);

         // Index Additions
         indexChanges.additions = this.localIndexes.filter(index => !originalIndexIDs.includes(index._antares_id));

         // Index Changes
         this.originalIndexes.forEach(originalIndex => {
            const lI = this.localIndexes.findIndex(localIndex => localIndex._antares_id === originalIndex._antares_id);
            if (JSON.stringify(originalIndex) !== JSON.stringify(this.localIndexes[lI])) {
               if (this.localIndexes[lI]) {
                  indexChanges.changes.push({
                     ...this.localIndexes[lI],
                     oldName: originalIndex.name,
                     oldType: originalIndex.type
                  });
               }
            }
         });

         // Index Deletions
         indexChanges.deletions = this.originalIndexes.filter(index => !localIndexIDs.includes(index._antares_id));

         // FOREIGN KEYS
         const foreignChanges = {
            additions: [],
            changes: [],
            deletions: []
         };
         const originalForeignIDs = this.originalKeyUsage.reduce((acc, curr) => [...acc, curr._antares_id], []);
         const localForeignIDs = this.localKeyUsage.reduce((acc, curr) => [...acc, curr._antares_id], []);

         // Foreigns Additions
         foreignChanges.additions = this.localKeyUsage.filter(foreign => !originalForeignIDs.includes(foreign._antares_id));

         // Foreigns Changes
         this.originalKeyUsage.forEach(originalForeign => {
            const lI = this.localKeyUsage.findIndex(localForeign => localForeign._antares_id === originalForeign._antares_id);
            if (JSON.stringify(originalForeign) !== JSON.stringify(this.localKeyUsage[lI])) {
               if (this.localKeyUsage[lI]) {
                  foreignChanges.changes.push({
                     ...this.localKeyUsage[lI],
                     oldName: originalForeign.constraintName
                  });
               }
            }
         });

         // Foreigns Deletions
         foreignChanges.deletions = this.originalKeyUsage.filter(foreign => !localForeignIDs.includes(foreign._antares_id));

         // ALTER
         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            table: this.table,
            tableStructure: {
               name: this.localOptions.name,
               fields: this.localFields,
               foreigns: this.localKeyUsage,
               indexes: this.localIndexes
            },
            additions,
            changes,
            deletions,
            indexChanges,
            foreignChanges,
            options
         };

         try {
            const { status, response } = await Tables.alterTable(params);

            if (status === 'success') {
               const oldName = this.tableOptions.name;

               await this.refreshStructure(this.connection.uid);

               if (oldName !== this.localOptions.name) {
                  this.renameTabs({
                     uid: this.connection.uid,
                     schema: this.schema,
                     elementName: oldName,
                     elementNewName: this.localOptions.name,
                     elementType: 'table'
                  });

                  this.changeBreadcrumbs({ schema: this.schema, table: this.localOptions.name });
               }
               else
                  this.getFieldsData();
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.isSaving = false;
         this.newFieldsCounter = 0;
      },
      clearChanges () {
         this.localFields = JSON.parse(JSON.stringify(this.originalFields));
         this.localIndexes = JSON.parse(JSON.stringify(this.originalIndexes));
         this.localKeyUsage = JSON.parse(JSON.stringify(this.originalKeyUsage));
         this.localOptions = JSON.parse(JSON.stringify(this.tableOptions));
         this.newFieldsCounter = 0;
      },
      addField () {
         this.localFields.push({
            _antares_id: uidGen(),
            name: `${this.$tc('word.field', 1)}_${++this.newFieldsCounter}`,
            key: '',
            type: this.workspace.dataTypes[0].types[0].name,
            schema: this.schema,
            table: this.table,
            numPrecision: null,
            numLength: this.workspace.dataTypes[0].types[0].length,
            datePrecision: null,
            charLength: null,
            nullable: false,
            unsigned: false,
            zerofill: false,
            order: this.localFields.length + 1,
            default: null,
            charset: null,
            collation: null,
            autoIncrement: false,
            onUpdate: '',
            comment: ''
         });

         setTimeout(() => {
            const scrollable = this.$refs.indexTable.$refs.tableWrapper;
            scrollable.scrollTop = scrollable.scrollHeight + 30;
         }, 20);
      },
      renameField (payload) {
         this.localIndexes = this.localIndexes.map(index => {
            const fi = index.fields.findIndex(field => field === payload.old);
            if (fi !== -1)
               index.fields[fi] = payload.new;
            return index;
         });

         this.localKeyUsage = this.localKeyUsage.map(key => {
            if (key.field === payload.old)
               key.field = payload.new;
            return key;
         });
      },
      duplicateField (uid) {
         const fieldToClone = Object.assign({}, this.localFields.find(field => field._antares_id === uid));
         fieldToClone._antares_id = uidGen();
         fieldToClone.name = `${fieldToClone.name}_copy`;
         fieldToClone.order = this.localFields.length + 1;
         this.localFields = [...this.localFields, fieldToClone];

         setTimeout(() => {
            const scrollable = this.$refs.indexTable.$refs.tableWrapper;
            scrollable.scrollTop = scrollable.scrollHeight + 30;
         }, 20);
      },
      removeField (uid) {
         this.localFields = this.localFields.filter(field => field._antares_id !== uid);
         this.localKeyUsage = this.localKeyUsage.filter(fk =>// Clear foreign keys
            this.localFields.some(field => field.name === fk.field)
         );
         this.localIndexes = this.localIndexes.filter(index =>// Clear indexes
            this.localFields.some(field =>
               index.fields.includes(field.name)
            )
         );
      },
      addNewIndex (payload) {
         this.localIndexes = [...this.localIndexes, {
            _antares_id: uidGen(),
            name: payload.index === 'PRIMARY' ? 'PRIMARY' : payload.field,
            fields: [payload.field],
            type: payload.index,
            comment: '',
            indexType: 'BTREE',
            indexComment: '',
            cardinality: 0
         }];
      },
      addToIndex (payload) {
         this.localIndexes = this.localIndexes.map(index => {
            if (index._antares_id === payload.index) index.fields.push(payload.field);
            return index;
         });
      },
      optionsUpdate (options) {
         this.localOptions = options;
      },
      showIntdexesModal () {
         this.isIndexesModal = true;
      },
      hideIndexesModal () {
         this.isIndexesModal = false;
      },
      indexesUpdate (indexes) {
         this.localIndexes = indexes;
      },
      showForeignModal () {
         this.isForeignModal = true;
      },
      hideForeignModal () {
         this.isForeignModal = false;
      },
      foreignsUpdate (foreigns) {
         this.localKeyUsage = foreigns;
      },
      onKey (e) {
         if (this.isSelected) {
            e.stopPropagation();
            if (e.ctrlKey && e.keyCode === 83) { // CTRL + S
               if (this.isChanged)
                  this.saveChanges();
            }
         }
      }
   }
};
</script>
