<template>
   <div v-show="isSelected" class="workspace-query-tab column col-12 columns col-gapless">
      <div class="workspace-query-runner column col-12">
         <div class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <button
                  class="btn btn-primary btn-sm"
                  :disabled="!isChanged"
                  :class="{'loading':isSaving}"
                  @click="saveChanges"
               >
                  <i class="mdi mdi-24px mdi-content-save mr-1" />
                  <span>{{ t('general.save') }}</span>
               </button>
               <button
                  :disabled="!isChanged || isSaving"
                  class="btn btn-link btn-sm mr-0"
                  :title="t('database.clearChanges')"
                  @click="clearChanges"
               >
                  <i class="mdi mdi-24px mdi-delete-sweep mr-1" />
                  <span>{{ t('general.clear') }}</span>
               </button>

               <div class="divider-vert py-3" />

               <button
                  :disabled="isSaving"
                  class="btn btn-dark btn-sm"
                  :title="t('database.addNewField')"
                  @click="addField"
               >
                  <i class="mdi mdi-24px mdi-playlist-plus mr-1" />
                  <span>{{ t('general.add') }}</span>
               </button>
               <button
                  :disabled="isSaving"
                  class="btn btn-dark btn-sm"
                  :title="t('database.manageIndexes')"
                  @click="showIntdexesModal"
               >
                  <i class="mdi mdi-24px mdi-key mdi-rotate-45 mr-1" />
                  <span>{{ t('database.indexes') }}</span>
               </button>
               <button
                  class="btn btn-dark btn-sm mr-0"
                  :disabled="isSaving"
                  :title="t('database.manageIndexes')"
                  @click="showForeignModal"
               >
                  <i class="mdi mdi-24px mdi-key-link mr-1" />
                  <span>{{ t('database.foreignKeys') }}</span>
               </button>

               <div class="divider-vert py-3" />

               <button
                  v-if="workspace.customizations.tableDdl"
                  class="btn btn-dark btn-sm"
                  :disabled="isSaving"
                  @click="showDdlModal"
               >
                  <i class="mdi mdi-24px mdi-code-tags mr-1" />
                  <span>{{ t('database.ddl') }}</span>
               </button>
            </div>
            <div class="workspace-query-info">
               <div class="d-flex" :title="t('database.schema')">
                  <i class="mdi mdi-18px mdi-database mr-1" /><b>{{ schema }}</b>
               </div>
            </div>
         </div>
      </div>
      <div class="container">
         <div class="columns mb-4">
            <div class="column col-auto">
               <div class="form-group">
                  <label class="form-label">{{ t('general.name') }}</label>
                  <input
                     v-model="localOptions.name"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div v-if="workspace.customizations.comment" class="column">
               <div class="form-group">
                  <label class="form-label">{{ t('database.comment') }}</label>
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
                     {{ t('database.autoIncrement') }}
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
                     {{ t('database.collation') }}
                  </label>
                  <BaseSelect
                     v-model="localOptions.collation"
                     :options="workspace.collations"
                     :max-visible-options="1000"
                     option-label="collation"
                     option-track-by="collation"
                     class="form-select"
                  />
               </div>
            </div>
            <div v-if="workspace.customizations.engines" class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ t('database.engine') }}
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
      <WorkspaceTabPropsTableDdlModal
         v-if="isDdlModal"
         :table="table"
         :schema="schema"
         :workspace="workspace"
         @hide="hideDdlModal"
      />
   </div>
</template>

<script setup lang="ts">
import { AlterTableParams, TableField, TableForeign, TableIndex, TableInfos, TableOptions } from 'common/interfaces/antares';
import { uidGen } from 'common/libs/uidGen';
import { ipcRenderer } from 'electron';
import { storeToRefs } from 'pinia';
import { Component, computed, onBeforeUnmount, onMounted, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseLoader from '@/components/BaseLoader.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import WorkspaceTabPropsTableDdlModal from '@/components/WorkspaceTabPropsTableDdlModal.vue';
import WorkspaceTabPropsTableFields from '@/components/WorkspaceTabPropsTableFields.vue';
import WorkspaceTabPropsTableForeignModal from '@/components/WorkspaceTabPropsTableForeignModal.vue';
import WorkspaceTabPropsTableIndexesModal from '@/components/WorkspaceTabPropsTableIndexesModal.vue';
import Tables from '@/ipc-api/Tables';
import { useNotificationsStore } from '@/stores/notifications';
import { useSettingsStore } from '@/stores/settings';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

const props = defineProps({
   tabUid: String,
   connection: Object,
   isSelected: Boolean,
   table: String,
   schema: String
});

const { addNotification } = useNotificationsStore();
const workspacesStore = useWorkspacesStore();
const settingsStore = useSettingsStore();

const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);
const { showTableSize } = settingsStore;

const {
   getWorkspace,
   getDatabaseVariable,
   refreshStructure,
   renameTabs,
   changeBreadcrumbs,
   setUnsavedChanges
} = workspacesStore;

const indexTable: Ref<Component & {tableWrapper: HTMLDivElement }> = ref(null);
const firstInput: Ref<HTMLInputElement> = ref(null);
const isLoading = ref(false);
const isSaving = ref(false);
const isIndexesModal = ref(false);
const isForeignModal = ref(false);
const isDdlModal = ref(false);
const originalFields: Ref<TableField[]> = ref([]);
const localFields: Ref<TableField[]> = ref([]);
const originalKeyUsage: Ref<TableForeign[]> = ref([]);
const localKeyUsage: Ref<TableForeign[]> = ref([]);
const originalIndexes: Ref<TableIndex[]> = ref([]);
const localIndexes: Ref<TableIndex[]> = ref([]);
const tableOptions: Ref<TableOptions> = ref(null);
const localOptions: Ref<TableOptions> = ref({} as TableOptions);
const lastTable = ref(null);
const newFieldsCounter = ref(0);

const workspace = computed(() => {
   return getWorkspace(props.connection.uid);
});

const defaultCollation = computed(() => {
   if (workspace.value.customizations.collations)
      return getDatabaseVariable(selectedWorkspace.value, 'collation_server')?.value || '';
   return '';
});

const schemaTables = computed(() => {
   const schemaTables = workspace.value.structure
      .filter(schema => schema.name === props.schema)
      .map(schema => schema.tables);

   return schemaTables.length ? schemaTables[0].filter(table => table.type === 'table') : [];
});

const isChanged = computed(() => {
   return JSON.stringify(originalFields.value) !== JSON.stringify(localFields.value) ||
      JSON.stringify(originalKeyUsage.value) !== JSON.stringify(localKeyUsage.value) ||
      JSON.stringify(originalIndexes.value) !== JSON.stringify(localIndexes.value) ||
      JSON.stringify(tableOptions.value) !== JSON.stringify(localOptions.value);
});

const getTableOptions = async (params: {uid: string; schema: string; table: string}) => {
   const db = workspace.value.structure.find(db => db.name === props.schema);

   if (db && db.tables.length && props.table && showTableSize)
      tableOptions.value = db.tables.find(table => table.name === props.table);
   else {
      const { status, response } = await Tables.getTableOptions(params);

      if (status === 'success')
         tableOptions.value = response;
      else
         addNotification({ status: 'error', message: response });
   }
};

const getFieldsData = async () => {
   if (!props.table) return;

   localFields.value = [];
   lastTable.value = props.table;
   newFieldsCounter.value = 0;
   isLoading.value = true;

   const params = {
      uid: props.connection.uid,
      schema: props.schema,
      table: props.table
   };

   try {
      await getTableOptions(params);
      localOptions.value = JSON.parse(JSON.stringify(tableOptions.value));
   }
   catch (err) {
      console.error(err);
   }

   try { // Columns data
      const { status, response } = await Tables.getTableColumns(params);
      if (status === 'success') {
         originalFields.value = response.map((field: TableField) => {
            if (field.autoIncrement)
               field.defaultType = 'autoincrement';
            else if (field.default === null)
               field.defaultType = 'noval';
            else if (field.default === 'NULL')
               field.defaultType = 'null';
            else if (typeof field.default === 'string' && isNaN(+field.default) && field.default.charAt(0) !== '\'')
               field.defaultType = 'expression';
            else {
               field.defaultType = 'custom';
               if (isNaN(+field.default) && !field.default.includes('\''))
                  field.default = `'${field.default}'`;
            }

            return { ...field, _antares_id: uidGen() };
         });
         localFields.value = JSON.parse(JSON.stringify(originalFields.value));
      }
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   try { // Indexes
      const { status, response } = await Tables.getTableIndexes(params);

      if (status === 'success') {
         const indexesObj = response
            .filter((index: TableIndex) => index.type !== 'FOREIGN KEY')
            .reduce((acc: {[key: string]: TableIndex[]}, curr: TableIndex) => {
               acc[curr.name] = acc[curr.name] || [];
               acc[curr.name].push(curr);
               return acc;
            }, {});

         originalIndexes.value = Object.keys(indexesObj).map(index => {
            return {
               _antares_id: uidGen(),
               name: index,
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               fields: indexesObj[index].map((field: any) => field.column),
               type: indexesObj[index][0].type,
               comment: indexesObj[index][0].comment,
               indexType: indexesObj[index][0].indexType,
               indexComment: indexesObj[index][0].indexComment,
               cardinality: indexesObj[index][0].cardinality
            };
         });

         localIndexes.value = JSON.parse(JSON.stringify(originalIndexes.value));
      }
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   try { // Key usage (foreign keys)
      const { status, response } = await Tables.getKeyUsage(params);

      if (status === 'success') {
         originalKeyUsage.value = response.map((foreign: TableForeign) => {
            return {
               _antares_id: uidGen(),
               ...foreign
            };
         });
         localKeyUsage.value = JSON.parse(JSON.stringify(originalKeyUsage.value));
      }
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   isLoading.value = false;
};

const saveChanges = async () => {
   if (isSaving.value) return;
   isSaving.value = true;

   // FIELDS
   const originalIDs = originalFields.value.reduce((acc, curr) => [...acc, curr._antares_id], []);
   const localIDs = localFields.value.reduce((acc, curr) => [...acc, curr._antares_id], []);

   // Fields Additions
   const additions = localFields.value.filter(field => !originalIDs.includes(field._antares_id)).map(field => {
      const lI = localFields.value.findIndex(localField => localField._antares_id === field._antares_id);
      const after = lI > 0 ? localFields.value[lI - 1].name : false;
      return { ...field, after };
   });

   // Fields Deletions
   const deletions = originalFields.value.filter(field => !localIDs.includes(field._antares_id));

   // Fields Changes
   const changes: TableField[] & {after: string | boolean; orgName: string}[] = [];
   localFields.value.forEach((field, i) => {
      const originalField = originalFields.value.find(oField => oField._antares_id === field._antares_id);
      if (!originalField) return;
      const after = i > 0 ? localFields.value[i - 1].name : false;
      const orgName = originalField.name;

      changes.push({ ...field, after, orgName });
   });

   // OPTIONS
   const options = Object.keys(localOptions.value).reduce((acc: {[key:string]: TableInfos}, option: keyof TableInfos) => {
      if (localOptions.value[option] !== tableOptions.value[option])
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         acc[option] = localOptions.value[option] as any;
      return acc;
   }, {});

   // INDEXES
   const indexChanges = {
      additions: [] as TableIndex[],
      changes: [] as TableIndex[],
      deletions: [] as TableIndex[]
   };
   const originalIndexIDs = originalIndexes.value.reduce((acc, curr) => [...acc, curr._antares_id], []);
   const localIndexIDs = localIndexes.value.reduce((acc, curr) => [...acc, curr._antares_id], []);

   // Index Additions
   indexChanges.additions = localIndexes.value.filter(index => !originalIndexIDs.includes(index._antares_id));

   // Index Changes
   originalIndexes.value.forEach(originalIndex => {
      const lI = localIndexes.value.findIndex(localIndex => localIndex._antares_id === originalIndex._antares_id);
      if (JSON.stringify(originalIndex) !== JSON.stringify(localIndexes.value[lI])) {
         if (localIndexes.value[lI]) {
            indexChanges.changes.push({
               ...localIndexes.value[lI],
               oldName: originalIndex.name,
               oldType: originalIndex.type
            });
         }
      }
   });

   // Index Deletions
   indexChanges.deletions = originalIndexes.value.filter(index => !localIndexIDs.includes(index._antares_id));

   // FOREIGN KEYS
   const foreignChanges = {
      additions: [] as TableForeign[],
      changes: [] as TableForeign[],
      deletions: [] as TableForeign[]
   };
   const originalForeignIDs = originalKeyUsage.value.reduce((acc, curr) => [...acc, curr._antares_id], []);
   const localForeignIDs = localKeyUsage.value.reduce((acc, curr) => [...acc, curr._antares_id], []);

   // Foreigns Additions
   foreignChanges.additions = localKeyUsage.value.filter(foreign => !originalForeignIDs.includes(foreign._antares_id));

   // Foreigns Changes
   originalKeyUsage.value.forEach(originalForeign => {
      const lI = localKeyUsage.value.findIndex(localForeign => localForeign._antares_id === originalForeign._antares_id);
      if (JSON.stringify(originalForeign) !== JSON.stringify(localKeyUsage.value[lI])) {
         if (localKeyUsage.value[lI]) {
            foreignChanges.changes.push({
               ...localKeyUsage.value[lI],
               oldName: originalForeign.constraintName
            });
         }
      }
   });

   // Foreigns Deletions
   foreignChanges.deletions = originalKeyUsage.value.filter(foreign => !localForeignIDs.includes(foreign._antares_id));

   // ALTER
   const params = {
      uid: props.connection.uid,
      schema: props.schema,
      table: props.table,
      tableStructure: {
         name: localOptions.value.name,
         fields: localFields.value,
         foreigns: localKeyUsage.value,
         indexes: localIndexes.value
      },
      additions,
      changes,
      deletions,
      indexChanges,
      foreignChanges,
      options
   } as unknown as AlterTableParams;

   try {
      const { status, response } = await Tables.alterTable(params);

      if (status === 'success') {
         const oldName = tableOptions.value.name;

         await refreshStructure(props.connection.uid);

         if (oldName !== localOptions.value.name) {
            renameTabs({
               uid: props.connection.uid,
               schema: props.schema,
               elementName: oldName,
               elementNewName: localOptions.value.name,
               elementType: 'table'
            });

            changeBreadcrumbs({ schema: props.schema, table: localOptions.value.name });
         }
         else
            getFieldsData();
      }
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   isSaving.value = false;
   newFieldsCounter.value = 0;
};

const clearChanges = () => {
   localFields.value = JSON.parse(JSON.stringify(originalFields.value));
   localIndexes.value = JSON.parse(JSON.stringify(originalIndexes.value));
   localKeyUsage.value = JSON.parse(JSON.stringify(originalKeyUsage.value));
   localOptions.value = JSON.parse(JSON.stringify(tableOptions.value));
   newFieldsCounter.value = 0;
};

const addField = () => {
   const uid = uidGen();
   localFields.value.push({
      _antares_id: uid,
      name: `${t('database.field', 1)}_${uid.substring(0, 4)}`,
      key: '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: (workspace.value.dataTypes[0] as any).types[0].name,
      schema: props.schema,
      numPrecision: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      numLength: (workspace.value.dataTypes[0] as any).types[0].length,
      datePrecision: null,
      charLength: null,
      nullable: false,
      unsigned: false,
      zerofill: false,
      order: localFields.value.length + 1,
      default: null,
      charset: null,
      collation: defaultCollation.value,
      autoIncrement: false,
      onUpdate: '',
      comment: '',
      alias: '',
      tableAlias: '',
      orgTable: ''
   });

   setTimeout(() => {
      const scrollable = indexTable.value.tableWrapper;
      scrollable.scrollTop = scrollable.scrollHeight + 30;
   }, 20);
};

const renameField = (payload: {index: string; new: string; old: string}) => {
   localIndexes.value = localIndexes.value.map(index => {
      const fi = index.fields.findIndex(field => field === payload.old);
      if (fi !== -1)
         index.fields[fi] = payload.new;
      return index;
   });

   localKeyUsage.value = localKeyUsage.value.map(key => {
      if (key.field === payload.old)
         key.field = payload.new;
      return key;
   });
};

const duplicateField = (uid: string) => {
   const fieldToClone = Object.assign({}, localFields.value.find(field => field._antares_id === uid));
   fieldToClone._antares_id = uidGen();
   fieldToClone.name = `${fieldToClone.name}_copy`;
   fieldToClone.order = localFields.value.length + 1;
   localFields.value = [...localFields.value, fieldToClone];

   setTimeout(() => {
      const scrollable = indexTable.value.tableWrapper;
      scrollable.scrollTop = scrollable.scrollHeight + 30;
   }, 20);
};

const removeField = (uid: string) => {
   localFields.value = localFields.value.filter(field => field._antares_id !== uid);
   localKeyUsage.value = localKeyUsage.value.filter(fk =>// Clear foreign keys
      localFields.value.some(field => field.name === fk.field)
   );
   localIndexes.value = localIndexes.value.filter(index =>// Clear indexes
      localFields.value.some(field =>
         index.fields.includes(field.name)
      )
   );
};

const addNewIndex = (payload: { index: string; field: string }) => {
   localIndexes.value = [...localIndexes.value, {
      _antares_id: uidGen(),
      name: payload.index === 'PRIMARY' ? 'PRIMARY' : payload.field,
      fields: [payload.field],
      type: payload.index,
      comment: '',
      indexType: 'BTREE',
      indexComment: '',
      cardinality: 0
   }];
};

const addToIndex = (payload: { index: string; field: string }) => {
   localIndexes.value = localIndexes.value.map(index => {
      if (index._antares_id === payload.index) index.fields.push(payload.field);
      return index;
   });
};

const showIntdexesModal = () => {
   isIndexesModal.value = true;
};

const hideIndexesModal = () => {
   isIndexesModal.value = false;
};

const indexesUpdate = (indexes: TableIndex[]) => {
   localIndexes.value = indexes;
};

const showForeignModal = () => {
   isForeignModal.value = true;
};

const hideForeignModal = () => {
   isForeignModal.value = false;
};

const showDdlModal = () => {
   isDdlModal.value = true;
};

const hideDdlModal = () => {
   isDdlModal.value = false;
};

const foreignsUpdate = (foreigns: TableForeign[]) => {
   localKeyUsage.value = foreigns;
};

const saveContentListener = () => {
   const hasModalOpen = !!document.querySelectorAll('.modal.active').length;
   if (props.isSelected && !hasModalOpen && isChanged.value)
      saveChanges();
};

watch(() => props.schema, () => {
   if (props.isSelected) {
      getFieldsData();
      lastTable.value = props.table;
   }
});

watch(() => props.table, () => {
   if (props.isSelected) {
      getFieldsData();
      lastTable.value = props.table;
   }
});

watch(() => props.isSelected, (val) => {
   if (val) {
      changeBreadcrumbs({ schema: props.schema, table: props.table });

      if (lastTable.value !== props.table)
         getFieldsData();
   }
});

watch(isChanged, (val) => {
   setUnsavedChanges({ uid: props.connection.uid, tUid: props.tabUid, isChanged: val });
});

getFieldsData();

onMounted(() => {
   ipcRenderer.on('save-content', saveContentListener);
});

onBeforeUnmount(() => {
   ipcRenderer.removeListener('save-content', saveContentListener);
});
</script>
