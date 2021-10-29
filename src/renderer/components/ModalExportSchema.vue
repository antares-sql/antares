<template>
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

               <div class="columns mb-2">
                  <div class="column col-auto d-flex p-0 text-italic ">
                     <i class="mdi mdi-file-document-outline mr-2" />
                     {{ filename }}
                  </div>

                  <div class="column col-auto col-ml-auto p-0">
                     <button class="btn btn-dark btn-sm" @click="uncheckAllTables">
                        <i class="mdi mdi-file-tree-outline" />
                     </button>
                     <button class="btn btn-dark btn-sm" @click="checkAllTables">
                        <i class="mdi mdi-file-tree" />
                     </button>
                  </div>
               </div>
            </div>

            <div class="workspace-query-results">
               <div ref="table" class="table table-hover">
                  <div class="thead">
                     <div class="tr">
                        <div class="th c-hand" style="width: 50%;">
                           <div class="table-column-title">
                              <span>Table</span>
                           </div>
                        </div>
                        <div class="th c-hand">
                           <div class="table-column-title">
                              <span>Structure</span>
                           </div>
                        </div>
                        <div class="th c-hand">
                           <div class="table-column-title">
                              <span>Content</span>
                           </div>
                        </div>
                        <div class="th c-hand">
                           <div class="table-column-title">
                              <span>Drop</span>
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
                        <div class="td">
                           <label class="form-checkbox m-0 px-2">
                              <input
                                 v-model="item.includeStructure"
                                 type="checkbox"
                              ><i class="form-icon" />
                           </label>
                        </div>
                        <div class="td">
                           <label class="form-checkbox m-0 px-2">
                              <input
                                 v-model="item.includeContent"
                                 type="checkbox"
                              ><i class="form-icon" />
                           </label>
                        </div>
                        <div class="td">
                           <label class="form-checkbox m-0 px-2">
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
            <div v-if="progressPercentage > 0">
               <progress
                  class="progress"
                  :value="progressPercentage"
                  max="100"
               />
               <p class="empty-subtitle">
                  {{ progressPercentage }}% - {{ progressStatus }}
               </p>
            </div>
         </div>
         <div class="modal-footer">
            <button
               class="btn btn-primary mr-2"
               :class="{'loading': isExporting}"
               :disabled="isExporting"
               @click.stop="startExport"
            >
               {{ $t('word.export') }}
            </button>
            <button class="btn btn-link" @click.stop="closeModal">
               {{ $t('word.close') }}
            </button>
         </div>
      </div>
   </div>
</template>

<script>
import { ipcRenderer } from 'electron';
import { mapActions, mapGetters } from 'vuex';
import moment from 'moment';
import Application from '@/ipc-api/Application';
import Schema from '@/ipc-api/Schema';

export default {
   name: 'ModalExportSchema',

   props: {
      selectedSchema: String
   },
   data () {
      return {
         isExporting: false,
         progressPercentage: 0,
         progressStatus: '',
         tables: [],
         basePath: ''
      };
   },
   computed: {
      ...mapGetters({
         selectedWorkspace: 'workspaces/getSelected',
         getWorkspace: 'workspaces/getWorkspace',
         getDatabaseVariable: 'workspaces/getDatabaseVariable'
      }),
      currentWorkspace () {
         return this.getWorkspace(this.selectedWorkspace);
      },
      schemaItems () {
         const db = this.currentWorkspace.structure.find(db => db.name === this.selectedSchema);
         if (db)
            return db.tables.filter(table => table.type === 'table');

         return [];
      },
      filename () {
         const date = moment().format('YYYY-MM-DD');
         return `${this.selectedSchema}_${date}.sql`;
      },
      dumpFilePath () {
         return `${this.basePath}/${this.filename}`;
      }
   },
   async created () {
      await this.refreshSchema({ uid: this.currentWorkspace.uid, schema: this.selectedSchema });
      window.addEventListener('keydown', this.onKey);
      this.basePath = await Application.getDownloadPathDirectory();
      this.tables = this.schemaItems.map(item => ({
         table: item.name,
         includeStructure: true,
         includeContent: true,
         includeDropStatement: true
      }));

      ipcRenderer.on('export-progress', this.updateProgress);
   },
   beforeDestroy () {
      window.removeEventListener('keydown', this.onKey);
      ipcRenderer.off('export-progress', this.updateProgress);
   },
   methods: {
      ...mapActions({
         refreshSchema: 'workspaces/refreshSchema'
      }),
      async startExport () {
         this.isExporting = true;
         const { uid } = this.currentWorkspace;
         const params = {
            uid,
            schema: this.selectedSchema,
            outputFile: this.dumpFilePath,
            items: [...this.tables]
         };

         const result = await Schema.export(params);
         if (result) {
            if (result.status === 'success')
               this.progressStatus = result.response.cancelled ? 'Aborted' : 'Completed!';

            else
               this.progressStatus = result.response;
         }

         this.isExporting = false;
      },
      updateProgress (event, state) {
         this.progressPercentage = Number((state.currentItemIndex / state.totalItems * 100).toFixed(1));
         this.progressStatus = state.op + ' ' + state.currentItem;
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
         this.tables = this.tables.map(item => ({ table: item.table, includeStructure: true, includeContent: true, includeDropStatement: true }));
      },
      uncheckAllTables () {
         this.tables = this.tables.map(item => ({ table: item.table, includeStructure: false, includeContent: false, includeDropStatement: false }));
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
.workspace-query-results {
  flex: 1 1 auto;

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

    .modal-body {
      height: 60vh;
      display: flex;
      flex-direction: column;
    }
  }
}

</style>
