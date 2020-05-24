<template>
   <div class="modal active">
      <a class="modal-overlay c-hand" @click="closeModal" />
      <div class="modal-container">
         <div class="modal-header text-light">
            <div class="modal-title h6">
               Edit connection
            </div>
            <a class="btn btn-clear c-hand" @click="closeModal" />
         </div>
         <div class="modal-body">
            <div class="content">
               <form class="form-horizontal">
                  <fieldset class="m-0" :disabled="isTesting">
                     <div class="form-group">
                        <div class="col-3 col-sm-12">
                           <label class="form-label">Client:</label>
                        </div>
                        <div class="col-9 col-sm-12">
                           <select v-model="localConnection.client" class="form-select">
                              <option value="mysql">
                                 MySQL/MariaDB
                              </option>
                              <option value="mssql">
                                 Microsoft SQL
                              </option>
                              <option value="pg">
                                 PostgreSQL
                              </option>
                              <option value="oracledb">
                                 Oracle DB
                              </option>
                           </select>
                        </div>
                     </div>
                     <div class="form-group">
                        <div class="col-3 col-sm-12">
                           <label class="form-label">Host name/IP:</label>
                        </div>
                        <div class="col-9 col-sm-12">
                           <input
                              v-model="localConnection.host"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div class="form-group">
                        <div class="col-3 col-sm-12">
                           <label class="form-label">Port:</label>
                        </div>
                        <div class="col-9 col-sm-12">
                           <input
                              v-model="localConnection.port"
                              class="form-input"
                              type="number"
                              min="1"
                              max="65535"
                           >
                        </div>
                     </div>
                     <div class="form-group">
                        <div class="col-3 col-sm-12">
                           <label class="form-label">User:</label>
                        </div>
                        <div class="col-9 col-sm-12">
                           <input
                              v-model="localConnection.user"
                              class="form-input"
                              type="text"
                              :disabled="localConnection.ask"
                           >
                        </div>
                     </div>
                     <div class="form-group">
                        <div class="col-3 col-sm-12">
                           <label class="form-label">Password:</label>
                        </div>
                        <div class="col-9 col-sm-12">
                           <input
                              v-model="localConnection.password"
                              class="form-input"
                              type="password"
                              :disabled="localConnection.ask"
                           >
                        </div>
                     </div>
                     <div class="form-group">
                        <div class="col-3 col-sm-12" />
                        <div class="col-9 col-sm-12">
                           <label class="form-checkbox form-inline">
                              <input v-model="localConnection.ask" type="checkbox"><i class="form-icon" /> Ask for credentials
                           </label>
                        </div>
                     </div>
                  </fieldset>
               </form>
            </div>
         </div>
         <div class="modal-footer text-light">
            <BaseToast
               class="mb-2"
               :message="toast.message"
               :status="toast.status"
            />
            <button
               class="btn btn-gray mr-2"
               :class="{'loading': isTesting}"
               @click="startTest"
            >
               Test connection
            </button>
            <button class="btn btn-primary mr-2" @click="saveEditConnection">
               Save
            </button>
            <button class="btn btn-link" @click="closeModal">
               Close
            </button>
         </div>
      </div>
      <ModalAskCredentials
         v-if="isAsking"
         @closeAsking="closeAsking"
         @credentials="continueTest"
      />
   </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import Connection from '@/ipc-api/Connection';
import ModalAskCredentials from '@/components/ModalAskCredentials';
import BaseToast from '@/components/BaseToast';

export default {
   name: 'ModalEditConnection',
   components: {
      ModalAskCredentials,
      BaseToast
   },
   data () {
      return {
         toast: {
            status: '',
            message: ''
         },
         isTesting: false,
         isAsking: false,
         localConnection: null
      };
   },
   computed: {
      ...mapGetters({
         connection: 'connections/getSelectedConnection'
      })
   },
   created () {
      this.localConnection = Object.assign({}, this.connection);
   },
   methods: {
      ...mapActions({
         closeModal: 'connections/hideEditConnModal',
         editConnection: 'connections/editConnection'
      }),
      async startTest () {
         this.isTesting = true;
         this.toast = {
            status: '',
            message: ''
         };

         if (this.localConnection.ask)
            this.isAsking = true;
         else {
            try {
               const res = await Connection.makeTest(this.localConnection);
               if (res.status === 'error')
                  this.toast = { status: 'error', message: res.response.message };
               else
                  this.toast = { status: 'success', message: 'Connection successifully made!' };
            }
            catch (err) {
               this.toast = { status: 'error', message: err.stack };
            }

            this.isTesting = false;
         }
      },
      async continueTest (credentials) { // if "Ask for credentials" is true
         this.isAsking = false;
         const params = Object.assign({}, this.localConnection, credentials);
         try {
            const res = await Connection.makeTest(params);
            if (res.status === 'error')
               this.toast = { status: 'error', message: res.response.message };
            else
               this.toast = { status: 'success', message: 'Connection successifully made!' };
         }
         catch (err) {
            this.toast = { status: 'error', message: err.stack };
         }

         this.isTesting = false;
      },
      saveEditConnection () {
         this.editConnection(this.localConnection);
         this.closeModal();
      },
      closeAsking () {
         this.isTesting = false;
         this.isAsking = false;
      }
   }
};
</script>

<style scoped>
   .modal-container{
      max-width: 450px;
   }
</style>
