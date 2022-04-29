<template>
   <div v-show="isSelected" class="workspace-query-tab column col-12 columns col-gapless">
      <div class="workspace-query-runner column col-12">
         <div class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <button
                  class="btn btn-primary btn-sm"
                  :disabled="!isChanged || !isValid"
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
                  :disabled="isSaving || !localFields.length"
                  class="btn btn-dark btn-sm"
                  :title="$t('message.manageIndexes')"
                  @click="showIntdexesModal"
               >
                  <i class="mdi mdi-24px mdi-key mdi-rotate-45 mr-1" />
                  <span>{{ $t('word.indexes') }}</span>
               </button>
               <button
                  class="btn btn-dark btn-sm"
                  :disabled="isSaving || !localFields.length"
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
                     ref="firstInput"
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

            <div v-if="workspace.customizations.collations" class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ $t('word.collation') }}
                  </label>
                  <select v-model="localOptions.collation" class="form-select">
                     <option
                        v-for="collation in workspace.collations"
                        :key="collation.id"
                        :value="collation.collation"
                     >
                        {{ collation.collation }}
                     </option>
                  </select>
               </div>
            </div>
            <div v-if="workspace.customizations.engines" class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ $t('word.engine') }}
                  </label>
                  <select v-model="localOptions.engine" class="form-select">
                     <option
                        v-for="engine in workspace.engines"
                        :key="engine.name"
                        :value="engine.name"
                     >
                        {{ engine.name }}
                     </option>
                  </select>
               </div>
            </div>
         </div>
      </div>
      <div class="workspace-query-results column col-12 p-relative">
         <BaseLoader v-if="isLoading" />
         <WorkspaceTabNewTableEmptyState v-if="!localFields.length" @new-field="addField" />
         <WorkspaceTabPropsTableFields
            v-if="localFields.length"
            ref="indexTable"
            :fields="localFields"
            :indexes="localIndexes"
            :foreigns="localKeyUsage"
            :tab-uid="tabUid"
            :conn-uid="connection.uid"
            :index-types="workspace.indexTypes"
            table="new"
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
         table="new"
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
         table="new"
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
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import { uidGen } from 'common/libs/uidGen';
import Tables from '@/ipc-api/Tables';
import BaseLoader from '@/components/BaseLoader';
import WorkspaceTabPropsTableFields from '@/components/WorkspaceTabPropsTableFields';
import WorkspaceTabPropsTableIndexesModal from '@/components/WorkspaceTabPropsTableIndexesModal';
import WorkspaceTabPropsTableForeignModal from '@/components/WorkspaceTabPropsTableForeignModal';
import WorkspaceTabNewTableEmptyState from '@/components/WorkspaceTabNewTableEmptyState';
import { storeToRefs } from 'pinia';

export default {
   name: 'WorkspaceTabNewTable',
   components: {
      BaseLoader,
      WorkspaceTabPropsTableFields,
      WorkspaceTabPropsTableIndexesModal,
      WorkspaceTabPropsTableForeignModal,
      WorkspaceTabNewTableEmptyState
   },
   props: {
      connection: Object,
      tab: Object,
      isSelected: Boolean,
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
         setUnsavedChanges,
         newTab,
         renameTabs,
         removeTab,
         changeBreadcrumbs
      } = workspacesStore;

      return {
         addNotification,
         getWorkspace,
         getDatabaseVariable,
         refreshStructure,
         setUnsavedChanges,
         newTab,
         renameTabs,
         removeTab,
         changeBreadcrumbs,
         selectedWorkspace
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
      tabUid () {
         return this.$vnode?.key;
      },
      defaultCollation () {
         if (this.workspace.customizations.collations)
            return this.getDatabaseVariable(this.selectedWorkspace, 'collation_server').value || '';
         return '';
      },
      defaultEngine () {
         if (this.workspace.customizations.engines)
            return this.workspace.engines.find(engine => engine.isDefault).name;
         return '';
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
      },
      isValid () {
         return !!this.localFields.length && !!this.localOptions.name.trim().length;
      }
   },
   watch: {
      isSelected (val) {
         if (val)
            this.changeBreadcrumbs({ schema: this.schema });
      },
      isChanged (val) {
         this.setUnsavedChanges({ uid: this.connection.uid, tUid: this.tabUid, isChanged: val });
      }
   },
   created () {
      this.tableOptions = {
         name: '',
         type: 'table',
         engine: this.defaultEngine,
         comment: '',
         collation: this.defaultCollation
      };

      this.localOptions = JSON.parse(JSON.stringify(this.tableOptions));
      window.addEventListener('keydown', this.onKey);
   },
   mounted () {
      if (this.isSelected)
         this.changeBreadcrumbs({ schema: this.schema });

      setTimeout(() => {
         this.$refs.firstInput.focus();
      }, 100);
   },
   beforeUnmount () {
      window.removeEventListener('keydown', this.onKey);
   },
   methods: {
      async saveChanges () {
         if (this.isSaving || !this.isValid) return;
         this.isSaving = true;

         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            fields: this.localFields,
            foreigns: this.localKeyUsage,
            indexes: this.localIndexes,
            options: this.localOptions
         };

         try {
            const { status, response } = await Tables.createTable(params);

            if (status === 'success') {
               await this.refreshStructure(this.connection.uid);

               this.newTab({
                  uid: this.connection.uid,
                  schema: this.schema,
                  elementName: this.localOptions.name,
                  elementType: 'table',
                  type: 'table-props'
               });

               this.removeTab({ uid: this.connection.uid, tab: this.tab.uid });
               this.changeBreadcrumbs({ schema: this.schema, table: this.localOptions.name });
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

         this.tableOptions = {
            name: '',
            type: 'table',
            engine: this.defaultEngine,
            comment: '',
            collation: this.defaultCollation
         };

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
