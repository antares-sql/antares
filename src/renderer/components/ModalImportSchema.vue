<template>
   <Teleport to="#window-content">
      <div class="modal active">
         <a class="modal-overlay" @click.stop="closeModal" />
         <div class="modal-container p-0">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <i class="mdi mdi-24px mdi-database-arrow-up mr-1" />
                     <span class="cut-text">{{ $t('message.importSchema') }}</span>
                  </div>
               </div>
               <a class="btn btn-clear c-hand" @click.stop="closeModal" />
            </div>
            <div class="modal-body pb-0">
               {{ sqlFile }}
               <div v-if="queryErrors.length > 0" class="mt-2">
                  <label>{{ $tc('message.importQueryErrors', queryErrors.length) }}</label>
                  <textarea
                     v-model="formattedQueryErrors"
                     class="form-input"
                     rows="5"
                     readonly
                  />
               </div>
            </div>
            <div class="modal-footer columns">
               <div class="column col modal-progress-wrapper text-left">
                  <div class="import-progress">
                     <span class="progress-status">
                        {{ progressPercentage }}% - {{ progressStatus }} - {{ $tc('message.executedQueries', queryCount) }}
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
                     {{ completed ? $t('word.close') : $t('word.cancel') }}
                  </button>
               </div>
            </div>
         </div>
      </div>
      <Teleport to="#window-content" />
   </teleport>
</template>

<script>
import { ipcRenderer } from 'electron';
import { mapActions, mapGetters } from 'vuex';
import moment from 'moment';
import Schema from '@/ipc-api/Schema';

export default {
   name: 'ModalImportSchema',

   props: {
      selectedSchema: String
   },
   emits: ['close'],
   data () {
      return {
         sqlFile: '',
         isImporting: false,
         progressPercentage: 0,
         queryCount: 0,
         completed: false,
         progressStatus: 'Reading',
         queryErrors: []
      };
   },
   computed: {
      ...mapGetters({
         selectedWorkspace: 'workspaces/getSelected',
         getWorkspace: 'workspaces/getWorkspace'
      }),
      currentWorkspace () {
         return this.getWorkspace(this.selectedWorkspace);
      },
      formattedQueryErrors () {
         return this.queryErrors.map(err =>
            `Time: ${moment(err.time).format('HH:mm:ss.S')} (${err.time})\nError: ${err.message}`
         ).join('\n\n');
      }
   },
   async created () {
      window.addEventListener('keydown', this.onKey);

      ipcRenderer.on('import-progress', this.updateProgress);
      ipcRenderer.on('query-error', this.handleQueryError);
   },
   beforeUnmount () {
      window.removeEventListener('keydown', this.onKey);
      ipcRenderer.off('import-progress', this.updateProgress);
      ipcRenderer.off('query-error', this.handleQueryError);
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification',
         refreshSchema: 'workspaces/refreshSchema'
      }),
      async startImport (sqlFile) {
         this.isImporting = true;
         this.sqlFile = sqlFile;

         const { uid, client } = this.currentWorkspace;
         const params = {
            uid,
            type: client,
            schema: this.selectedSchema,
            file: sqlFile
         };

         try {
            this.completed = false;
            const { status, response } = await Schema.import(params);
            if (status === 'success')
               this.progressStatus = response.cancelled ? this.$t('word.aborted') : this.$t('word.completed');
            else {
               this.progressStatus = response;
               this.addNotification({ status: 'error', message: response });
            }
            this.refreshSchema({ uid, schema: this.selectedSchema });
            this.completed = true;
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.isImporting = false;
      },
      updateProgress (event, state) {
         this.progressPercentage = Number(state.percentage).toFixed(1);
         this.queryCount = Number(state.queryCount);
      },
      handleQueryError (event, err) {
         this.queryErrors.push(err);
      },
      async closeModal () {
         let willClose = true;
         if (this.isImporting) {
            willClose = false;
            const { response } = await Schema.abortImport();
            willClose = response.willAbort;
         }

         if (willClose)
            this.$emit('close');
      },
      onKey (e) {
         e.stopPropagation();
         if (e.key === 'Escape')
            this.closeModal();
      }
   }
};
</script>

<style lang="scss" scoped>
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
