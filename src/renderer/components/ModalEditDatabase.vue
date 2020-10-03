<template>
   <div class="modal active">
      <a class="modal-overlay" @click.stop="closeModal" />
      <div class="modal-container p-0">
         <div class="modal-header pl-2">
            <div class="modal-title h6">
               <div class="d-flex">
                  <i class="mdi mdi-24px mdi-database-edit mr-1" /> {{ $t('message.editDatabase') }}
               </div>
            </div>
            <a class="btn btn-clear c-hand" @click.stop="closeModal" />
         </div>
         <div class="modal-body pb-0">
            <div class="content">
               <form class="form-horizontal">
                  <div class="form-group">
                     <div class="col-3">
                        <label class="form-label">{{ $t('word.name') }}:</label>
                     </div>
                     <div class="col-9">
                        <input
                           v-model="database.name"
                           class="form-input"
                           type="text"
                           required
                           :placeholder="$t('message.databaseName')"
                           readonly
                        >
                     </div>
                  </div>
                  <div class="form-group">
                     <div class="col-3">
                        <label class="form-label">{{ $t('word.collation') }}:</label>
                     </div>
                     <div class="col-9">
                        <select v-model="database.collation" class="form-select">
                           <option
                              v-for="collation in collations"
                              :key="collation.id"
                              :value="collation.collation"
                           >
                              {{ collation.collation }}
                           </option>
                        </select>
                        <small>{{ $t('message.serverDefault') }}: {{ defaultCollation }}</small>
                     </div>
                  </div>
               </form>
            </div>
         </div>
         <div class="modal-footer text-light">
            <button class="btn btn-primary mr-2" @click.stop="updateDatabase">
               {{ $t('word.update') }}
            </button>
            <button class="btn btn-link" @click.stop="closeModal">
               {{ $t('word.close') }}
            </button>
         </div>
      </div>
   </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import Database from '@/ipc-api/Database';

export default {
   name: 'ModalEditDatabase',
   props: {
      selectedDatabase: String
   },
   data () {
      return {
         database: {
            name: '',
            prevName: '',
            collation: ''
         }
      };
   },
   computed: {
      ...mapGetters({
         selectedWorkspace: 'workspaces/getSelected',
         getWorkspace: 'workspaces/getWorkspace',
         getDatabaseVariable: 'workspaces/getDatabaseVariable'
      }),
      collations () {
         return this.getWorkspace(this.selectedWorkspace).collations;
      },
      defaultCollation () {
         return this.getDatabaseVariable(this.selectedWorkspace, 'collation_server').value || '';
      }
   },
   async created () {
      let actualCollation;
      try {
         const { status, response } = await Database.getDatabaseCollation({ uid: this.selectedWorkspace, database: this.selectedDatabase });

         if (status === 'success')
            actualCollation = response;

         else
            this.addNotification({ status: 'error', message: response });
      }
      catch (err) {
         this.addNotification({ status: 'error', message: err.stack });
      }

      this.database = {
         name: this.selectedDatabase,
         prevName: this.selectedDatabase,
         collation: actualCollation || this.defaultCollation,
         prevCollation: actualCollation || this.defaultCollation
      };
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification'
      }),
      async updateDatabase () {
         if (this.database.collation !== this.database.prevCollation) {
            try {
               const { status, response } = await Database.updateDatabase({
                  uid: this.selectedWorkspace,
                  ...this.database
               });

               if (status === 'success')
                  this.closeModal();
               else
                  this.addNotification({ status: 'error', message: response });
            }
            catch (err) {
               this.addNotification({ status: 'error', message: err.stack });
            }
         }
         else
            this.closeModal();
      },
      closeModal () {
         this.$emit('close');
      }
   }
};
</script>

<style scoped>
  .modal-container {
    max-width: 360px;
  }
</style>
