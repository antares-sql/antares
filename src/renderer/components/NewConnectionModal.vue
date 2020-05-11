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
               @click="testConnection"
            >
               Test connection
            </button>
            <button class="btn btn-primary mr-2">
               Save
            </button>
            <button class="btn btn-link" @click="closeModal">
               Close
            </button>
         </div>
      </div>
   </div>
</template>

<script>
import { mapActions } from 'vuex';
import { ipcRenderer } from 'electron';
import BaseToast from '@/components/BaseToast';

export default {
   name: 'NewConnectionModal',
   components: {
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
            ask: false
         },
         toast: {
            status: '',
            message: ''
         },
         isTesting: false
      };
   },
   methods: {
      ...mapActions({
         closeModal: 'connections/hideNewConnModal'
      }),
      testConnection () {
         this.isTesting = true;
         this.toast = {
            status: '',
            message: ''
         };

         ipcRenderer.invoke('testConnection', this.connection).then(res => {
            this.isTesting = false;
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
         });
      }
   }
};
</script>

<style scoped>
   .modal-container{
      max-width: 450px;
   }
</style>
