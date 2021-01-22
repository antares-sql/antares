<template>
   <div class="workspace-query-tab column col-12 columns col-gapless">
      <div class="workspace-query-runner column col-12">
         <div class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <button
                  class="btn btn-primary btn-sm"
                  :disabled="!isChanged"
                  :class="{'loading':isSaving}"
                  @click="saveChanges"
               >
                  <span>{{ $t('word.save') }}</span>
                  <i class="mdi mdi-24px mdi-content-save ml-1" />
               </button>
               <button
                  :disabled="!isChanged"
                  class="btn btn-link btn-sm mr-0"
                  :title="$t('message.clearChanges')"
                  @click="clearChanges"
               >
                  <span>{{ $t('word.clear') }}</span>
                  <i class="mdi mdi-24px mdi-delete-sweep ml-1" />
               </button>

               <div class="divider-vert py-3" />

               <button
                  class="btn btn-dark btn-sm"
                  :title="$t('message.addNewField')"
                  @click="addField"
               >
                  <span>{{ $t('word.add') }}</span>
                  <i class="mdi mdi-24px mdi-playlist-plus ml-1" />
               </button>
               <button
                  class="btn btn-dark btn-sm"
                  :title="$t('message.manageIndexes')"
                  @click="showIntdexesModal"
               >
                  <span>{{ $t('word.indexes') }}</span>
                  <i class="mdi mdi-24px mdi-key mdi-rotate-45 ml-1" />
               </button>
               <button class="btn btn-dark btn-sm" @click="showForeignModal">
                  <span>{{ $t('word.foreignKeys') }}</span>
                  <i class="mdi mdi-24px mdi-key-link ml-1" />
               </button>
               <button class="btn btn-dark btn-sm" @click="showOptionsModal">
                  <span>{{ $t('word.options') }}</span>
                  <i class="mdi mdi-24px mdi-cogs ml-1" />
               </button>
            </div>
         </div>
      </div>
      <div class="workspace-query-results column col-12 p-relative">
         <BaseLoader v-if="isLoading" />
         <WorkspacePropsTable
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
            @remove-field="removeField"
            @add-new-index="addNewIndex"
            @add-to-index="addToIndex"
         />
      </div>
      <WorkspacePropsOptionsModal
         v-if="isOptionsModal"
         :local-options="localOptions"
         :table="table"
         :workspace="workspace"
         @hide="hideOptionsModal"
         @options-update="optionsUpdate"
      />
      <WorkspacePropsIndexesModal
         v-if="isIndexesModal"
         :local-indexes="localIndexes"
         :table="table"
         :fields="localFields"
         :index-types="workspace.indexTypes"
         :workspace="workspace"
         @hide="hideIndexesModal"
         @indexes-update="indexesUpdate"
      />
      <WorkspacePropsForeignModal
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
import { mapGetters, mapActions } from 'vuex';
import { uidGen } from 'common/libs/uidGen';
import Tables from '@/ipc-api/Tables';
import BaseLoader from '@/components/BaseLoader';
import WorkspacePropsTable from '@/components/WorkspacePropsTable';
import WorkspacePropsOptionsModal from '@/components/WorkspacePropsOptionsModal';
import WorkspacePropsIndexesModal from '@/components/WorkspacePropsIndexesModal';
import WorkspacePropsForeignModal from '@/components/WorkspacePropsForeignModal';

export default {
   name: 'WorkspacePropsTab',
   components: {
      BaseLoader,
      WorkspacePropsTable,
      WorkspacePropsOptionsModal,
      WorkspacePropsIndexesModal,
      WorkspacePropsForeignModal
   },
   props: {
      connection: Object,
      table: String
   },
   data () {
      return {
         tabUid: 'prop',
         isLoading: false,
         isSaving: false,
         isOptionsModal: false,
         isIndexesModal: false,
         isForeignModal: false,
         isOptionsChanging: false,
         originalFields: [],
         localFields: [],
         originalKeyUsage: [],
         localKeyUsage: [],
         originalIndexes: [],
         localIndexes: [],
         localOptions: {},
         lastTable: null,
         newFieldsCounter: 0
      };
   },
   computed: {
      ...mapGetters({
         getWorkspace: 'workspaces/getWorkspace',
         getDatabaseVariable: 'workspaces/getDatabaseVariable'
      }),
      workspace () {
         return this.getWorkspace(this.connection.uid);
      },
      tableOptions () {
         const db = this.workspace.structure.find(db => db.name === this.schema);
         return db && this.table ? db.tables.find(table => table.name === this.table) : {};
      },
      defaultEngine () {
         return this.getDatabaseVariable(this.connection.uid, 'default_storage_engine').value || '';
      },
      isSelected () {
         return this.workspace.selected_tab === 'prop';
      },
      schema () {
         return this.workspace.breadcrumbs.schema;
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
      table () {
         if (this.isSelected) {
            this.getFieldsData();
            this.lastTable = this.table;
         }
      },
      isSelected (val) {
         if (val && this.lastTable !== this.table) {
            this.getFieldsData();
            this.lastTable = this.table;
         }
      },
      isChanged (val) {
         if (this.isSelected && this.lastTable === this.table && this.table !== null)
            this.setUnsavedChanges(val);
      }
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification',
         refreshStructure: 'workspaces/refreshStructure',
         setUnsavedChanges: 'workspaces/setUnsavedChanges',
         changeBreadcrumbs: 'workspaces/changeBreadcrumbs'
      }),
      async getFieldsData () {
         if (!this.table) return;

         this.localFields = [];
         this.newFieldsCounter = 0;
         this.isLoading = true;
         this.localOptions = JSON.parse(JSON.stringify(this.tableOptions));

         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            table: this.workspace.breadcrumbs.table
         };

         try { // Columns data
            const { status, response } = await Tables.getTableColumns(params);
            if (status === 'success') {
               this.originalFields = response.map(field => {
                  return { ...field, _id: uidGen() };
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
                     _id: uidGen(),
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
                     _id: uidGen(),
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
         const originalIDs = this.originalFields.reduce((acc, curr) => [...acc, curr._id], []);
         const localIDs = this.localFields.reduce((acc, curr) => [...acc, curr._id], []);

         // Fields Additions
         const additions = this.localFields.filter((field, i) => !originalIDs.includes(field._id)).map(field => {
            const lI = this.localFields.findIndex(localField => localField._id === field._id);
            const after = lI > 0 ? this.localFields[lI - 1].name : false;
            return { ...field, after };
         });

         // Fields Deletions
         const deletions = this.originalFields.filter(field => !localIDs.includes(field._id));

         // Fields Changes
         const changes = [];
         this.originalFields.forEach((originalField, oI) => {
            const lI = this.localFields.findIndex(localField => localField._id === originalField._id);
            const originalSibling = oI > 0 ? this.originalFields[oI - 1]._id : false;
            const localSibling = lI > 0 ? this.localFields[lI - 1]._id : false;
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
         const originalIndexIDs = this.originalIndexes.reduce((acc, curr) => [...acc, curr._id], []);
         const localIndexIDs = this.localIndexes.reduce((acc, curr) => [...acc, curr._id], []);

         // Index Additions
         indexChanges.additions = this.localIndexes.filter(index => !originalIndexIDs.includes(index._id));

         // Index Changes
         this.originalIndexes.forEach(originalIndex => {
            const lI = this.localIndexes.findIndex(localIndex => localIndex._id === originalIndex._id);
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
         indexChanges.deletions = this.originalIndexes.filter(index => !localIndexIDs.includes(index._id));

         // FOREIGN KEYS
         const foreignChanges = {
            additions: [],
            changes: [],
            deletions: []
         };
         const originalForeignIDs = this.originalKeyUsage.reduce((acc, curr) => [...acc, curr._id], []);
         const localForeignIDs = this.localKeyUsage.reduce((acc, curr) => [...acc, curr._id], []);

         // Foreigns Additions
         foreignChanges.additions = this.localKeyUsage.filter(foreign => !originalForeignIDs.includes(foreign._id));

         // Foreigns Changes
         this.originalKeyUsage.forEach(originalForeign => {
            const lI = this.localKeyUsage.findIndex(localForeign => localForeign._id === originalForeign._id);
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
         foreignChanges.deletions = this.originalKeyUsage.filter(foreign => !localForeignIDs.includes(foreign._id));

         // ALTER
         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            table: this.workspace.breadcrumbs.table,
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
                  this.setUnsavedChanges(false);
                  this.changeBreadcrumbs({ schema: this.schema, table: this.localOptions.name });
               }

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
            _id: uidGen(),
            name: `${this.$tc('word.field', 1)}_${++this.newFieldsCounter}`,
            key: '',
            type: 'int',
            schema: this.schema,
            table: this.table,
            numPrecision: null,
            numLength: null,
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
      removeField (uid) {
         this.localFields = this.localFields.filter(field => field._id !== uid);
      },
      addNewIndex (payload) {
         this.localIndexes = [...this.localIndexes, {
            _id: uidGen(),
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
            if (index._id === payload.index) index.fields.push(payload.field);
            return index;
         });
      },
      showOptionsModal () {
         this.isOptionsModal = true;
      },
      hideOptionsModal () {
         this.isOptionsModal = false;
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
      }
   }
};
</script>
