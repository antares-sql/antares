<template>
   <div class="modal active">
      <a class="modal-overlay c-hand" @click="closeModal" />
      <div class="modal-container">
         <div class="modal-header text-light">
            <div class="modal-title h6">
               Create a new connection
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
                           <select v-model="connection.client" class="form-select">
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
                              v-model="connection.host"
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
                              v-model="connection.port"
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
                              v-model="connection.user"
                              class="form-input"
                              type="text"
                              :disabled="connection.ask"
                           >
                        </div>
                     </div>
                     <div class="form-group">
                        <div class="col-3 col-sm-12">
                           <label class="form-label">Password:</label>
                        </div>
                        <div class="col-9 col-sm-12">
                           <input
                              v-model="connection.password"
                              class="form-input"
                              type="password"
                              :disabled="connection.ask"
                           >
                        </div>
                     </div>
                     <div class="form-group">
                        <div class="col-3 col-sm-12" />
                        <div class="col-9 col-sm-12">
                           <label class="form-checkbox form-inline">
                              <input v-model="connection.ask" type="checkbox"><i class="form-icon" /> Ask for credentials
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
            <button class="btn btn-primary mr-2" @click="saveNewConnection">
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
import { mapActions } from 'vuex';
import { ipcRenderer } from 'electron';
import ModalAskCredentials from '@/components/ModalAskCredentials';
import BaseToast from '@/components/BaseToast';

export default {
   name: 'ModalNewConnection',
   components: {
      ModalAskCredentials,
      BaseToast
   },
   props: {
      isOpened: {
         type: Boolean,
         default: false
      }
   },
   data () {
      return {
         connection: {
            client: 'mysql',
            host: '127.0.0.1',
            port: '3306',
            user: 'root',
            password: '',
            ask: false,
            uid: Math.random().toString(36).substr(2, 9).toUpperCase()
         },
         toast: {
            status: '',
            message: ''
         },
         isTesting: false,
         isAsking: false
      };
   },
   methods: {
      ...mapActions({
         closeModal: 'connections/hideNewConnModal',
         addConnection: 'connections/addConnection'
      }),
      async startTest () {
         this.isTesting = true;
         this.toast = {
            status: '',
            message: ''
         };

         if (this.connection.ask)
            this.isAsking = true;
         else
            await this.invokeTest(this.connection);
      },
      async continueTest (credentials) { // if "Ask for credentials" is true
         this.isAsking = false;
         const params = Object.assign({}, this.connection, credentials);
         await this.invokeTest(params);
      },
      invokeTest (params) {
         return new Promise((resolve, reject) => {
            ipcRenderer.invoke('testConnection', params).then(res => {
               if (res.status === 'error') {
                  this.toast = {
                     status: 'error',
                     message: res.response.message
                  };
               }
               else {
                  this.toast = {
                     status: 'success',
                     message: 'Connection successifully made!'
                  };
               }

               this.isTesting = false;
               resolve();
            });
         });
      },
      saveNewConnection () {
         this.addConnection(this.connection);
         this.closeModal();
      },
      closeAsking () {
         this.isAsking = false;
         this.isTesting = false;
      }
   }
};
</script>

<style scoped>
   .modal-container{
      max-width: 450px;
   }
</style>
