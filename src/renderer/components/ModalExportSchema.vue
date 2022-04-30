<template>
   <Teleport to="#window-content">
      <div class="modal active">
         <a class="modal-overlay" @click.stop="closeModal" />
         <div class="modal-container p-0">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <i class="mdi mdi-24px mdi-database-arrow-down mr-1" />
                     <span class="cut-text">{{ $t('message.exportSchema') }}</span>
                  </div>
               </div>
               <a class="btn btn-clear c-hand" @click.stop="closeModal" />
            </div>
            <div class="modal-body pb-0">
               <div class="container">
                  <div class="columns">
                     <div class="col-3">
                        <label class="form-label">{{ $t('message.directoryPath') }}</label>
                     </div>
                     <div class="col-9">
                        <fieldset class="input-group">
                           <input
                              v-model="basePath"
                              class="form-input"
                              type="text"
                              required
                              readonly
                              :placeholder="$t('message.schemaName')"
                           >
                           <button
                              type="button"
                              class="btn btn-primary input-group-btn"
                              @click.prevent="openPathDialog"
                           >
                              {{ $t('word.change') }}
                           </button>
                        </fieldset>
                     </div>
                  </div>
               </div>

               <div class="columns export-options">
                  <div class="column col-8 left">
                     <div class="columns mb-2">
                        <div class="column col-auto d-flex text-italic ">
                           <i class="mdi mdi-file-document-outline mr-2" />
                           {{ filename }}
                        </div>

                        <div class="column col-auto col-ml-auto ">
                           <button
                              class="btn btn-dark btn-sm"
                              :title="$t('word.refresh')"
                              @click="refresh"
                           >
                              <i class="mdi mdi-database-refresh" />
                           </button>
                           <button
                              class="btn btn-dark btn-sm mx-1"
                              :title="$t('message.uncheckAllTables')"
                              :disabled="isRefreshing"
                              @click="uncheckAllTables"
                           >
                              <i class="mdi mdi-file-tree-outline" />
                           </button>
                           <button
                              class="btn btn-dark btn-sm"
                              :title="$t('message.checkAllTables')"
                              :disabled="isRefreshing"
                              @click="checkAllTables"
                           >
                              <i class="mdi mdi-file-tree" />
                           </button>
                        </div>
                     </div>
                     <div class="workspace-query-results">
                        <div ref="table" class="table table-hover">
                           <div class="thead">
                              <div class="tr text-center">
                                 <div class="th no-border" style="width: 50%;" />
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
                                 <div class="th" style="width: 50%;">
                                    <div class="table-column-title">
                                       <span>{{ $t('word.table') }}</span>
                                    </div>
                                 </div>
                                 <div class="th text-center">
                                    <div class="table-column-title">
                                       <span>{{ $t('word.structure') }}</span>
                                    </div>
                                 </div>
                                 <div class="th text-center">
                                    <div class="table-column-title">
                                       <span>{{ $t('word.content') }}</span>
                                    </div>
                                 </div>
                                 <div class="th text-center">
                                    <div class="table-column-title">
                                       <span>{{ $t('word.drop') }}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div class="tbody">
                              <div
                                 v-for="item in tables"
                                 :key="item.name"
                                 class="tr"
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
                        {{ $t('word.options') }}
                     </h5>
                     <span class="h6">{{ $t('word.includes') }}:</span>
                     <label
                        v-for="(_, key) in options.includes"
                        :key="key"
                        class="form-checkbox"
                     >
                        <input v-model="options.includes[key]" type="checkbox"><i class="form-icon" /> {{ $tc(`word.${key}`, 2) }}
                     </label>
                     <div v-if="customizations.exportByChunks">
                        <div class="h6 mt-4 mb-2">
                           {{ $t('message.newInserStmtEvery') }}:
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
                              <select v-model="options.sqlInsertDivider" class="form-select">
                                 <option value="bytes">
                                    KiB
                                 </option>
                                 <option value="rows">
                                    {{ $tc('word.row', 2) }}
                                 </option>
                              </select>
                           </div>
                        </div>
                     </div>

                     <div class="h6 mb-2 mt-4">
                        {{ $t('message.ourputFormat') }}:
                     </div>
                     <div class="columns">
                        <div class="column h5 mb-4">
                           <select v-model="options.outputFormat" class="form-select">
                              <option value="sql">
                                 {{ $t('message.singleFile', {ext: '.sql'}) }}
                              </option>
                              <option value="sql.zip">
                                 {{ $t('message.zipCompressedFile', {ext: '.sql'}) }}
                              </option>
                           </select>
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
                  <button class="btn btn-link" @click.stop="closeModal">
                     {{ $t('word.close') }}
                  </button>
                  <button
                     class="btn btn-primary mr-2"
                     :class="{'loading': isExporting}"
                     :disabled="isExporting || isRefreshing"
                     autofocus
                     @click.prevent="startExport"
                  >
                     {{ $t('word.export') }}
                  </button>
               </div>
            </div>
         </div>
      </div>
   </Teleport>
</template>

<script>
import moment from 'moment';
import { ipcRenderer } from 'electron';
import { storeToRefs } from 'pinia';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import customizations from 'common/customizations';
import Application from '@/ipc-api/Application';
import Schema from '@/ipc-api/Schema';

export default {
   name: 'ModalExportSchema',
   props: {
      selectedSchema: String
   },
   emits: ['close'],
   setup () {
      const { addNotification } = useNotificationsStore();
      const workspacesStore = useWorkspacesStore();

      const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

      const {
         getWorkspace,
         getDatabaseVariable,
         refreshSchema
      } = workspacesStore;

      return {
         addNotification,
         selectedWorkspace,
         getWorkspace,
         getDatabaseVariable,
         refreshSchema
      };
   },
   data () {
      return {
         isExporting: false,
         isRefreshing: false,
         progressPercentage: 0,
         progressStatus: '',
         tables: [],
         options: {
            includes: {},
            outputFormat: 'sql',
            sqlInsertAfter: 250,
            sqlInsertDivider: 'bytes'
         },
         basePath: ''
      };
   },
   computed: {
      currentWorkspace () {
         return this.getWorkspace(this.selectedWorkspace);
      },
      customizations () {
         return this.currentWorkspace.customizations;
      },
      schemaItems () {
         const db = this.currentWorkspace.structure.find(db => db.name === this.selectedSchema);
         if (db)
            return db.tables.filter(table => table.type === 'table');

         return [];
      },
      filename () {
         const date = moment().format('YYYY-MM-DD');
         return `${this.selectedSchema}_${date}.${this.options.outputFormat}`;
      },
      dumpFilePath () {
         return `${this.basePath}/${this.filename}`;
      },
      includeStructureStatus () {
         if (this.tables.every(item => item.includeStructure)) return 1;
         else if (this.tables.some(item => item.includeStructure)) return 2;
         else return 0;
      },
      includeContentStatus () {
         if (this.tables.every(item => item.includeContent)) return 1;
         else if (this.tables.some(item => item.includeContent)) return 2;
         else return 0;
      },
      includeDropStatementStatus () {
         if (this.tables.every(item => item.includeDropStatement)) return 1;
         else if (this.tables.some(item => item.includeDropStatement)) return 2;
         else return 0;
      }
   },
   async created () {
      if (!this.schemaItems.length) await this.refresh();

      window.addEventListener('keydown', this.onKey);

      this.basePath = await Application.getDownloadPathDirectory();
      this.tables = this.schemaItems.map(item => ({
         table: item.name,
         includeStructure: true,
         includeContent: true,
         includeDropStatement: true
      }));

      const structure = ['functions', 'views', 'triggers', 'routines', 'schedulers'];

      structure.forEach(feat => {
         const val = customizations[this.currentWorkspace.client][feat];
         if (val)
            this.options.includes[feat] = true;
      });

      ipcRenderer.on('export-progress', this.updateProgress);
   },
   beforeUnmount () {
      window.removeEventListener('keydown', this.onKey);
      ipcRenderer.off('export-progress', this.updateProgress);
   },
   methods: {
      async startExport () {
         this.isExporting = true;
         const { uid, client } = this.currentWorkspace;
         const params = {
            uid,
            type: client,
            schema: this.selectedSchema,
            outputFile: this.dumpFilePath,
            tables: [...this.tables],
            ...this.options
         };

         try {
            const { status, response } = await Schema.export(params);
            if (status === 'success')
               this.progressStatus = response.cancelled ? this.$t('word.aborted') : this.$t('word.completed');
            else {
               this.progressStatus = response;
               this.addNotification({ status: 'error', message: response });
            }
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.isExporting = false;
      },
      updateProgress (event, state) {
         this.progressPercentage = Number((state.currentItemIndex / state.totalItems * 100).toFixed(1));
         switch (state.op) {
            case 'PROCESSING':
               this.progressStatus = this.$t('message.processingTableExport', { table: state.currentItem });
               break;
            case 'FETCH':
               this.progressStatus = this.$t('message.fechingTableExport', { table: state.currentItem });
               break;
            case 'WRITE':
               this.progressStatus = this.$t('message.writingTableExport', { table: state.currentItem });
               break;
         }
      },
      async closeModal () {
         let willClose = true;
         if (this.isExporting) {
            willClose = false;
            const { response } = await Schema.abortExport();
            willClose = response.willAbort;
         }

         if (willClose)
            this.$emit('close');
      },
      onKey (e) {
         e.stopPropagation();
         if (e.key === 'Escape')
            this.closeModal();
      },
      checkAllTables () {
         this.tables = this.tables.map(item => ({ ...item, includeStructure: true, includeContent: true, includeDropStatement: true }));
      },
      uncheckAllTables () {
         this.tables = this.tables.map(item => ({ ...item, includeStructure: false, includeContent: false, includeDropStatement: false }));
      },
      toggleAllTablesOption (option) {
         const options = ['includeStructure', 'includeContent', 'includeDropStatement'];
         if (!options.includes(option)) return;

         if (this[`${option}Status`] !== 1)
            this.tables = this.tables.map(item => ({ ...item, [option]: true }));
         else
            this.tables = this.tables.map(item => ({ ...item, [option]: false }));
      },
      async refresh () {
         this.isRefreshing = true;
         await this.refreshSchema({ uid: this.currentWorkspace.uid, schema: this.selectedSchema });
         this.isRefreshing = false;
      },
      async openPathDialog () {
         const result = await Application.showOpenDialog({ properties: ['openDirectory'] });
         if (result && !result.canceled)
            this.basePath = result.filePaths[0];
      }
   }
};
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
