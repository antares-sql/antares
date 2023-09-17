<template>
   <Teleport to="#window-content">
      <div class="modal active">
         <a class="modal-overlay" @click.stop="closeModal" />
         <div ref="trapRef" class="modal-container p-0">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <BaseIcon
                        icon-name="mdiDatabaseExport"
                        class="mr-1"
                        :size="24"
                     />
                     <span class="cut-text">{{ t('database.exportSchema') }}</span>
                  </div>
               </div>
               <a class="btn btn-clear c-hand" @click.stop="closeModal" />
            </div>
            <div class="modal-body pb-0">
               <div class="container">
                  <div class="columns">
                     <div class="col-3">
                        <label class="form-label">{{ t('general.directoryPath') }}</label>
                     </div>
                     <div class="col-9">
                        <fieldset class="input-group">
                           <input
                              v-model="basePath"
                              class="form-input"
                              type="text"
                              required
                              readonly
                              @click.prevent="openPathDialog"
                           >
                           <button
                              type="button"
                              class="btn btn-primary input-group-btn"
                              @click.prevent="openPathDialog"
                           >
                              {{ t('general.change') }}
                           </button>
                        </fieldset>
                     </div>
                  </div>
               </div>

               <div class="columns export-options">
                  <div class="column col-8 left">
                     <div class="columns mb-2 mt-1 p-vcentered">
                        <div class="column col-auto input-group d-flex text-italic" :style="'flex-grow: 1'">
                           <BaseIcon
                              icon-name="mdiFileDocumentOutline"
                              class="input-group-addon"
                              :size="36"
                           />
                           <input
                              v-model="chosenFilename"
                              class="form-input"
                              type="text"
                              :placeholder="filename"
                              :title="t('application.fileName')"
                           >
                        </div>

                        <div class="column col-auto col-ml-auto ">
                           <button
                              class="btn btn-dark btn-sm pt-1"
                              :title="t('general.refresh')"
                              @click="refresh"
                           >
                              <BaseIcon icon-name="mdiRefresh" :size="15" />
                           </button>
                           <button
                              class="btn btn-dark btn-sm mx-1 pt-1"
                              :title="t('database.uncheckAllTables')"
                              :disabled="isRefreshing"
                              @click="uncheckAllTables"
                           >
                              <BaseIcon icon-name="mdiCheckboxBlankOutline" :size="15" />
                           </button>
                           <button
                              class="btn btn-dark btn-sm pt-1"
                              :title="t('database.checkAllTables')"
                              :disabled="isRefreshing"
                              @click="checkAllTables"
                           >
                              <BaseIcon icon-name="mdiCheckboxMarkedOutline" :size="15" />
                           </button>
                        </div>
                     </div>
                     <div class="workspace-query-results">
                        <div ref="table" class="table table-hover">
                           <div class="thead">
                              <div class="tr text-center">
                                 <div class="th no-border" :style="'width: 50%;'" />
                                 <div class="th no-border">
                                    <label
                                       class="form-checkbox m-0 px-2 form-inline"
                                       @click.prevent="toggleAllTablesOption('includeStructure')"
                                    >
                                       <input
                                          type="checkbox"
                                          :indeterminate="includeStructureStatus === 2"
                                          :checked="!!includeStructureStatus"
                                       >
                                       <i class="form-icon" />
                                    </label>
                                 </div>
                                 <div class="th no-border">
                                    <label
                                       class="form-checkbox m-0 px-2 form-inline"
                                       @click.prevent="toggleAllTablesOption('includeContent')"
                                    >
                                       <input
                                          type="checkbox"
                                          :indeterminate="includeContentStatus === 2"
                                          :checked="!!includeContentStatus"
                                       >
                                       <i class="form-icon" />
                                    </label>
                                 </div>
                                 <div class="th no-border">
                                    <label
                                       class="form-checkbox m-0 px-2 form-inline"
                                       @click.prevent="toggleAllTablesOption('includeDropStatement')"
                                    >
                                       <input
                                          type="checkbox"
                                          :indeterminate="includeDropStatementStatus === 2"
                                          :checked="!!includeDropStatementStatus"
                                       >
                                       <i class="form-icon" />
                                    </label>
                                 </div>
                              </div>
                              <div class="tr">
                                 <div class="th" :style="'width: 50%;'">
                                    <div class="table-column-title">
                                       <span>{{ t('database.table') }}</span>
                                    </div>
                                 </div>
                                 <div class="th text-center">
                                    <div class="table-column-title">
                                       <span>{{ t('database.structure') }}</span>
                                    </div>
                                 </div>
                                 <div class="th text-center">
                                    <div class="table-column-title">
                                       <span>{{ t('general.content') }}</span>
                                    </div>
                                 </div>
                                 <div class="th text-center">
                                    <div class="table-column-title">
                                       <span>{{ t('database.drop') }}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div class="tbody">
                              <div
                                 v-for="item in tables"
                                 :key="item.table"
                                 class="tr"
                                 :class="{'selected': item.table === selectedTable}"
                              >
                                 <div class="td">
                                    {{ item.table }}
                                 </div>
                                 <div class="td text-center">
                                    <label class="form-checkbox m-0 px-2 form-inline">
                                       <input
                                          v-model="item.includeStructure"
                                          type="checkbox"
                                       ><i class="form-icon" />
                                    </label>
                                 </div>
                                 <div class="td text-center">
                                    <label class="form-checkbox m-0 px-2 form-inline">
                                       <input
                                          v-model="item.includeContent"
                                          type="checkbox"
                                       ><i class="form-icon" />
                                    </label>
                                 </div>
                                 <div class="td text-center">
                                    <label class="form-checkbox m-0 px-2 form-inline">
                                       <input
                                          v-model="item.includeDropStatement"
                                          type="checkbox"
                                       ><i class="form-icon" />
                                    </label>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                  <div class="column col-4">
                     <h5 class="h5">
                        {{ t('general.options') }}
                     </h5>
                     <span class="h6">{{ t('general.includes') }}:</span>
                     <label
                        v-for="(_, key) in options.includes"
                        :key="key"
                        class="form-checkbox"
                     >
                        <input v-model="options.includes[key]" type="checkbox"><i class="form-icon" /> {{ t(`database.${String(key).slice(0, -1)}`, 2) }}
                     </label>
                     <div v-if="clientCustoms.exportByChunks">
                        <div class="h6 mt-4 mb-2">
                           {{ t('database.newInsertStmtEvery') }}:
                        </div>
                        <div class="columns">
                           <div class="column col-6">
                              <input
                                 v-model.number="options.sqlInsertAfter"
                                 type="number"
                                 class="form-input"
                              >
                           </div>
                           <div class="column col-6">
                              <BaseSelect
                                 v-model="options.sqlInsertDivider"
                                 class="form-select"
                                 :options="[{value: 'bytes', label: 'KiB'}, {value: 'rows', label: t('database.row', 2)}]"
                              />
                           </div>
                        </div>
                     </div>

                     <div class="h6 mb-2 mt-4">
                        {{ t('general.outputFormat') }}:
                     </div>
                     <div class="columns">
                        <div class="column h5 mb-4">
                           <BaseSelect
                              v-model="options.outputFormat"
                              class="form-select"
                              :options="[{value: 'sql', label: t('general.singleFile', {ext: '.sql'})}, {value: 'sql.zip', label: t('general.zipCompressedFile', {ext: '.sql'})}]"
                           />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
            <div class="modal-footer columns">
               <div class="column col modal-progress-wrapper text-left">
                  <div v-if="progressPercentage > 0" class="export-progress">
                     <span class="progress-status">
                        {{ progressPercentage }}% - {{ progressStatus }}
                     </span>
                     <progress
                        class="progress d-block"
                        :value="progressPercentage"
                        max="100"
                     />
                  </div>
               </div>
               <div class="column col-auto px-0">
                  <button class="btn btn-link mr-2" @click.stop="closeModal">
                     {{ t('general.close') }}
                  </button>
                  <button
                     class="btn btn-primary mr-2"
                     :class="{'loading': isExporting}"
                     :disabled="isExporting || isRefreshing"
                     autofocus
                     @click.prevent="startExport"
                  >
                     {{ t('database.export') }}
                  </button>
               </div>
            </div>
         </div>
      </div>
   </Teleport>
</template>

<script setup lang="ts">
import { ClientCode, SchemaInfos } from 'common/interfaces/antares';
import { Customizations } from 'common/interfaces/customizations';
import { ExportOptions, ExportState } from 'common/interfaces/exporter';
import { ipcRenderer } from 'electron';
import * as moment from 'moment';
import { storeToRefs } from 'pinia';
import { computed, onBeforeUnmount, Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import { useFocusTrap } from '@/composables/useFocusTrap';
import Application from '@/ipc-api/Application';
import Schema from '@/ipc-api/Schema';
import { useNotificationsStore } from '@/stores/notifications';
import { useSchemaExportStore } from '@/stores/schemaExport';
import { useWorkspacesStore } from '@/stores/workspaces';

const emit = defineEmits(['close']);
const { t } = useI18n();

const { addNotification } = useNotificationsStore();
const workspacesStore = useWorkspacesStore();
const schemaExportStore = useSchemaExportStore();

const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

const { trapRef } = useFocusTrap();

const {
   getWorkspace,
   refreshSchema
} = workspacesStore;

const { selectedTable, selectedSchema } = storeToRefs(schemaExportStore);

const isExporting = ref(false);
const isRefreshing = ref(false);
const progressPercentage = ref(0);
const progressStatus = ref('');
const tables: Ref<{
   table: string;
   includeStructure: boolean;
   includeContent: boolean;
   includeDropStatement: boolean;
}[]> = ref([]);
const options: Ref<Partial<ExportOptions>> = ref({
   schema: selectedSchema.value,
   includes: {} as {[key: string]: boolean},
   outputFormat: 'sql' as 'sql' | 'sql.zip',
   sqlInsertAfter: 250,
   sqlInsertDivider: 'bytes' as 'bytes' | 'rows'
});
const basePath = ref('');
const chosenFilename = ref('');

const currentWorkspace = computed(() => getWorkspace(selectedWorkspace.value));
const clientCustoms: Ref<Customizations> = computed(() => currentWorkspace.value.customizations);
const schemaItems = computed(() => {
   const db: SchemaInfos = currentWorkspace.value.structure.find((db: SchemaInfos) => db.name === selectedSchema.value);
   if (db)
      return db.tables.filter(table => table.type === 'table');

   return [];
});
const filename = computed(() => {
   const date = moment().format('YYYY-MM-DD_HH-mm-ss');
   return `${selectedTable.value || selectedSchema.value}_${date}`;
});
const dumpFilePath = computed(() => `${basePath.value}/${chosenFilename.value || filename.value}.${options.value.outputFormat}`);
const includeStructureStatus = computed(() => {
   if (tables.value.every(item => item.includeStructure)) return 1;
   else if (tables.value.some(item => item.includeStructure)) return 2;
   else return 0;
});
const includeContentStatus = computed(() => {
   if (tables.value.every(item => item.includeContent)) return 1;
   else if (tables.value.some(item => item.includeContent)) return 2;
   else return 0;
});
const includeDropStatementStatus = computed(() => {
   if (tables.value.every(item => item.includeDropStatement)) return 1;
   else if (tables.value.some(item => item.includeDropStatement)) return 2;
   else return 0;
});

const startExport = async () => {
   isExporting.value = true;
   const { uid, client } = currentWorkspace.value;
   const params = {
      uid,
      type: client,
      schema: selectedSchema.value,
      outputFile: dumpFilePath.value,
      tables: [...tables.value],
      ...options.value
   } as ExportOptions & { uid: string; type: ClientCode };

   try {
      const { status, response } = await Schema.export(params);
      if (status === 'success')
         progressStatus.value = response.cancelled ? t('general.aborted') : t('general.completed');
      else {
         progressStatus.value = response;
         addNotification({ status: 'error', message: response });
      }
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   isExporting.value = false;
};

const updateProgress = (event: Event, state: ExportState) => {
   progressPercentage.value = Number((state.currentItemIndex / state.totalItems * 100).toFixed(1));
   switch (state.op) {
      case 'PROCESSING':
         progressStatus.value = t('database.processingTableExport', { table: state.currentItem });
         break;
      case 'FETCH':
         progressStatus.value = t('database.fetchingTableExport', { table: state.currentItem });
         break;
      case 'WRITE':
         progressStatus.value = t('database.writingTableExport', { table: state.currentItem });
         break;
   }
};

const closeModal = async () => {
   let willClose = true;
   if (isExporting.value) {
      willClose = false;
      const { response } = await Schema.abortExport();
      willClose = response.willAbort;
   }

   if (willClose)
      emit('close');
};

const onKey = (e: KeyboardEvent) => {
   e.stopPropagation();
   if (e.key === 'Escape')
      closeModal();
};

const checkAllTables = () => {
   tables.value = tables.value.map(item => ({ ...item, includeStructure: true, includeContent: true, includeDropStatement: true }));
};

const uncheckAllTables = () => {
   tables.value = tables.value.map(item => ({ ...item, includeStructure: false, includeContent: false, includeDropStatement: false }));
};

const toggleAllTablesOption = (option: 'includeStructure' | 'includeContent' |'includeDropStatement') => {
   const options = {
      includeStructure: includeStructureStatus.value,
      includeContent: includeContentStatus.value,
      includeDropStatement: includeDropStatementStatus.value
   };

   if (options[option] !== 1)
      tables.value = tables.value.map(item => ({ ...item, [option]: true }));
   else
      tables.value = tables.value.map(item => ({ ...item, [option]: false }));
};

const refresh = async () => {
   isRefreshing.value = true;
   await refreshSchema({ uid: currentWorkspace.value.uid, schema: selectedSchema.value });
   isRefreshing.value = false;
};

const openPathDialog = async () => {
   const result = await Application.showOpenDialog({ properties: ['openDirectory'] });
   if (result && !result.canceled)
      basePath.value = result.filePaths[0];
};

(async () => {
   if (!schemaItems.value.length) await refresh();

   window.addEventListener('keydown', onKey);

   if (selectedTable.value) {
      setTimeout(() => {
         const element = document.querySelector<HTMLElement>('.modal.active .selected');

         if (element) {
            const rect = element.getBoundingClientRect();
            const elemTop = rect.top;
            const elemBottom = rect.bottom;
            const isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);

            if (!isVisible) {
               element.setAttribute('tabindex', '-1');
               element.focus();
               element.removeAttribute('tabindex');
            }
         }
      }, 100);
   }

   basePath.value = await Application.getDownloadPathDirectory();
   tables.value = schemaItems.value.map(item => ({
      table: item.name,
      includeStructure: !selectedTable.value ? true : selectedTable.value === item.name,
      includeContent: !selectedTable.value ? true : selectedTable.value === item.name,
      includeDropStatement: !selectedTable.value ? true : selectedTable.value === item.name
   }));

   const structure = ['functions', 'views', 'triggers', 'routines', 'schedulers'];

   structure.forEach((feat: keyof Customizations) => {
      const val = clientCustoms.value[feat];
      if (val)
         options.value.includes[feat] = !selectedTable.value;
   });

   ipcRenderer.on('export-progress', updateProgress);
})();

onBeforeUnmount(() => {
   window.removeEventListener('keydown', onKey);
   ipcRenderer.off('export-progress', updateProgress);
});

</script>

<style lang="scss" scoped>
.export-options {
  flex: 1;
  overflow: hidden;

  .left {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
}

.workspace-query-results {
  flex: 1 0 1px;

  .table {
    width: 100% !important;
  }

  .form-checkbox {
    min-height: 0.8rem;
    padding: 0;

    .form-icon {
      top: 0.1rem;
    }
  }
}

.modal {
  .modal-container {
    max-width: 800px;
  }

  .modal-body {
    max-height: 60vh;
    display: flex;
    flex-direction: column;
  }

  .modal-footer {
    display: flex;
  }
}

.progress-status {
  font-style: italic;
  font-size: 80%;
}

</style>
