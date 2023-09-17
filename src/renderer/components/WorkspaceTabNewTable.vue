<template>
   <div v-show="isSelected" class="workspace-query-tab column col-12 columns col-gapless">
      <div class="workspace-query-runner column col-12">
         <div class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <button
                  class="btn btn-primary btn-sm"
                  :disabled="!isChanged || !isValid"
                  :class="{'loading':isSaving}"
                  @click="saveChanges"
               >
                  <BaseIcon
                     class="mr-1"
                     icon-name="mdiContentSave"
                     :size="24"
                  />
                  <span>{{ t('general.save') }}</span>
               </button>
               <button
                  :disabled="!isChanged || isSaving"
                  class="btn btn-link btn-sm mr-0"
                  :title="t('database.clearChanges')"
                  @click="clearChanges"
               >
                  <BaseIcon
                     class="mr-1"
                     icon-name="mdiDeleteSweep"
                     :size="24"
                  />
                  <span>{{ t('general.clear') }}</span>
               </button>

               <div class="divider-vert py-3" />

               <button
                  :disabled="isSaving"
                  class="btn btn-dark btn-sm"
                  :title="t('database.addNewField')"
                  @click="addField"
               >
                  <BaseIcon
                     class="mr-1"
                     icon-name="mdiPlaylistPlus"
                     :size="24"
                  />
                  <span>{{ t('general.add') }}</span>
               </button>
               <button
                  :disabled="isSaving || !localFields.length"
                  class="btn btn-dark btn-sm"
                  :title="t('database.manageIndexes')"
                  @click="showIntdexesModal"
               >
                  <BaseIcon
                     class="mr-1"
                     icon-name="mdiKey"
                     rotate="45deg"
                     :size="24"
                  />
                  <span>{{ t('database.indexes') }}</span>
               </button>
               <button
                  class="btn btn-dark btn-sm"
                  :disabled="isSaving || !localFields.length"
                  :title="t('database.manageForeignKeys')"
                  @click="showForeignModal"
               >
                  <BaseIcon
                     class="mr-1"
                     icon-name="mdiKeyLink"
                     :size="24"
                  />
                  <span>{{ t('database.foreignKeys') }}</span>
               </button>
            </div>
            <div class="workspace-query-info">
               <div class="d-flex" :title="t('database.schema')">
                  <BaseIcon
                     class="mt-1 mr-1"
                     icon-name="mdiDatabase"
                     :size="18"
                  /><b>{{ schema }}</b>
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
                     ref="firstInput"
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

<script setup lang="ts">
import { ConnectionParams, TableField, TableForeign, TableIndex, TableOptions } from 'common/interfaces/antares';
import { uidGen } from 'common/libs/uidGen';
import { ipcRenderer } from 'electron';
import { storeToRefs } from 'pinia';
import { Component, computed, onBeforeUnmount, onMounted, Prop, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import BaseLoader from '@/components/BaseLoader.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import WorkspaceTabNewTableEmptyState from '@/components/WorkspaceTabNewTableEmptyState.vue';
import WorkspaceTabPropsTableFields from '@/components/WorkspaceTabPropsTableFields.vue';
import WorkspaceTabPropsTableForeignModal from '@/components/WorkspaceTabPropsTableForeignModal.vue';
import WorkspaceTabPropsTableIndexesModal from '@/components/WorkspaceTabPropsTableIndexesModal.vue';
import Tables from '@/ipc-api/Tables';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

const props = defineProps({
   tabUid: String,
   connection: Object as Prop<ConnectionParams>,
   tab: Object,
   isSelected: Boolean,
   schema: String
});

const { addNotification } = useNotificationsStore();
const workspacesStore = useWorkspacesStore();

const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

const {
   getWorkspace,
   getDatabaseVariable,
   refreshStructure,
   setUnsavedChanges,
   newTab,
   removeTab,
   changeBreadcrumbs
} = workspacesStore;

const indexTable: Ref<Component & { tableWrapper: HTMLDivElement }> = ref(null);
const firstInput: Ref<HTMLInputElement> = ref(null);
const isLoading = ref(false);
const isSaving = ref(false);
const isIndexesModal = ref(false);
const isForeignModal = ref(false);
const originalFields: Ref<TableField[]> = ref([]);
const localFields: Ref<TableField[]> = ref([]);
const originalKeyUsage: Ref<TableForeign[]> = ref([]);
const localKeyUsage: Ref<TableForeign[]> = ref([]);
const originalIndexes: Ref<TableIndex[]> = ref([]);
const localIndexes: Ref<TableIndex[]> = ref([]);
const tableOptions: Ref<TableOptions> = ref(null);
const localOptions: Ref<TableOptions> = ref(null);
const newFieldsCounter = ref(0);

const workspace = computed(() => {
   return getWorkspace(props.connection.uid);
});

const defaultCollation = computed(() => {
   if (workspace.value.customizations.collations)
      return getDatabaseVariable(selectedWorkspace.value, 'collation_server')?.value || '';
   return '';
});

const defaultEngine = computed(() => {
   if (workspace.value.customizations.engines)
      return workspace.value.engines?.find(engine => engine.isDefault)?.name as string || '';
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

const isValid = computed(() => {
   return !!localFields.value.length && !!localOptions.value.name.trim().length;
});

const saveChanges = async () => {
   if (isSaving.value || !isValid.value) return;
   isSaving.value = true;

   const params = {
      uid: props.connection.uid,
      schema: props.schema,
      fields: localFields.value,
      foreigns: localKeyUsage.value,
      indexes: localIndexes.value,
      options: localOptions.value
   };

   try {
      const { status, response } = await Tables.createTable(params);

      if (status === 'success') {
         await refreshStructure(props.connection.uid);

         newTab({
            uid: props.connection.uid,
            schema: props.schema,
            elementName: localOptions.value.name,
            elementType: 'table',
            type: 'table-props'
         });

         removeTab({ uid: props.connection.uid, tab: props.tab.uid });
         changeBreadcrumbs({ schema: props.schema, table: localOptions.value.name });
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

   tableOptions.value = {
      name: '',
      type: 'table',
      engine: defaultEngine.value,
      comment: '',
      collation: defaultCollation.value
   };

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

const foreignsUpdate = (foreigns: TableForeign[]) => {
   localKeyUsage.value = foreigns;
};

const saveContentListener = () => {
   const hasModalOpen = !!document.querySelectorAll('.modal.active').length;
   if (props.isSelected && !hasModalOpen && isChanged.value)
      saveChanges();
};

watch(() => props.isSelected, (val) => {
   if (val) changeBreadcrumbs({ schema: props.schema });
});

watch(isChanged, (val) => {
   setUnsavedChanges({ uid: props.connection.uid, tUid: props.tabUid, isChanged: val });
});

tableOptions.value = {
   name: '',
   type: 'table',
   engine: defaultEngine.value,
   comment: '',
   collation: defaultCollation.value
};

localOptions.value = JSON.parse(JSON.stringify(tableOptions.value));

onMounted(() => {
   if (props.isSelected)
      changeBreadcrumbs({ schema: props.schema });

   ipcRenderer.on('save-content', saveContentListener);

   setTimeout(() => {
      firstInput.value.focus();
   }, 100);
});

onBeforeUnmount(() => {
   ipcRenderer.removeListener('save-content', saveContentListener);
});
</script>
