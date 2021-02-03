<template>
   <div class="modal active">
      <a class="modal-overlay c-hand" @click="closeModal" />
      <div class="modal-container">
         <div class="modal-header pl-2">
            <div class="modal-title h6">
               <div class="d-flex">
                  <i class="mdi mdi-24px mdi-server-plus mr-1" /> {{ $t('message.createNewConnection') }}
               </div>
            </div>
            <a class="btn btn-clear c-hand" @click="closeModal" />
         </div>
         <div class="modal-body p-0">
            <div class="panel">
               <div class="panel-nav">
                  <ul class="tab tab-block">
                     <li
                        class="tab-item"
                        :class="{'active': selectedTab === 'general'}"
                        @click="selectTab('general')"
                     >
                        <a class="c-hand">{{ $t('word.general') }}</a>
                     </li>
                     <li
                        class="tab-item"
                        :class="{'active': selectedTab === 'ssl'}"
                        @click="selectTab('ssl')"
                     >
                        <a class="c-hand">{{ $t('word.ssl') }}</a>
                     </li>
                  </ul>
               </div>
               <div v-if="selectedTab === 'general'" class="panel-body py-0">
                  <div class="container">
                     <form class="form-horizontal">
                        <fieldset class="m-0" :disabled="isTesting">
                           <div class="form-group">
                              <div class="col-4 col-sm-12">
                                 <label class="form-label">{{ $t('word.connectionName') }}</label>
                              </div>
                              <div class="col-8 col-sm-12">
                                 <input
                                    ref="firstInput"
                                    v-model="connection.name"
                                    class="form-input"
                                    type="text"
                                 >
                              </div>
                           </div>
                           <div class="form-group">
                              <div class="col-4 col-sm-12">
                                 <label class="form-label">{{ $t('word.client') }}</label>
                              </div>
                              <div class="col-8 col-sm-12">
                                 <select
                                    v-model="connection.client"
                                    class="form-select"
                                    @change="setDefaults"
                                 >
                                    <option value="mysql">
                                       MySQL
                                    </option>
                                    <option value="maria">
                                       MariaDB
                                    </option>
                                 <!-- <option value="mssql">
                                    Microsoft SQL
                                 </option>
                                 <option value="pg">
                                    PostgreSQL
                                 </option>
                                 <option value="oracledb">
                                    Oracle DB
                                 </option> -->
                                 </select>
                              </div>
                           </div>
                           <div class="form-group">
                              <div class="col-4 col-sm-12">
                                 <label class="form-label">{{ $t('word.hostName') }}/IP</label>
                              </div>
                              <div class="col-8 col-sm-12">
                                 <input
                                    v-model="connection.host"
                                    class="form-input"
                                    type="text"
                                 >
                              </div>
                           </div>
                           <div class="form-group">
                              <div class="col-4 col-sm-12">
                                 <label class="form-label">{{ $t('word.port') }}</label>
                              </div>
                              <div class="col-8 col-sm-12">
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
                              <div class="col-4 col-sm-12">
                                 <label class="form-label">{{ $t('word.user') }}</label>
                              </div>
                              <div class="col-8 col-sm-12">
                                 <input
                                    v-model="connection.user"
                                    class="form-input"
                                    type="text"
                                    :disabled="connection.ask"
                                 >
                              </div>
                           </div>
                           <div class="form-group">
                              <div class="col-4 col-sm-12">
                                 <label class="form-label">{{ $t('word.password') }}</label>
                              </div>
                              <div class="col-8 col-sm-12">
                                 <input
                                    v-model="connection.password"
                                    class="form-input"
                                    type="password"
                                    :disabled="connection.ask"
                                 >
                              </div>
                           </div>
                           <div class="form-group">
                              <div class="col-4 col-sm-12" />
                              <div class="col-8 col-sm-12">
                                 <label class="form-checkbox form-inline">
                                    <input v-model="connection.ask" type="checkbox"><i class="form-icon" /> {{ $t('message.askCredentials') }}
                                 </label>
                              </div>
                           </div>
                        </fieldset>
                     </form>
                  </div>
                  <BaseToast
                     class="mb-2"
                     :message="toast.message"
                     :status="toast.status"
                  />
               </div>
               <div v-if="selectedTab === 'ssl'" class="panel-body py-0">
                  <div class="container">
                     <form class="form-horizontal">
                        <div class="form-group">
                           <div class="col-4 col-sm-12">
                              <label class="form-label">
                                 {{ $t('message.enableSsl') }}
                              </label>
                           </div>
                           <div class="col-8 col-sm-12">
                              <label class="form-switch d-inline-block" @click.prevent="toggleSsl">
                                 <input type="checkbox" :checked="connection.ssl">
                                 <i class="form-icon" />
                              </label>
                           </div>
                        </div>
                        <fieldset class="m-0" :disabled="isTesting || !connection.ssl">
                           <div class="form-group">
                              <div class="col-4 col-sm-12">
                                 <label class="form-label">{{ $t('word.privateKey') }}</label>
                              </div>
                              <div class="col-8 col-sm-12">
                                 <input
                                    class="form-input"
                                    type="file"
                                    @change="pathSelection($event, 'key')"
                                 >
                              </div>
                           </div>
                           <div class="form-group">
                              <div class="col-4 col-sm-12">
                                 <label class="form-label">{{ $t('word.certificate') }}</label>
                              </div>
                              <div class="col-8 col-sm-12">
                                 <input
                                    class="form-input"
                                    type="file"
                                    @change="pathSelection($event, 'cert')"
                                 >
                              </div>
                           </div>
                           <div class="form-group">
                              <div class="col-4 col-sm-12">
                                 <label class="form-label">{{ $t('word.caCertificate') }}</label>
                              </div>
                              <div class="col-8 col-sm-12">
                                 <input
                                    class="form-input"
                                    type="file"
                                    @change="pathSelection($event, 'ca')"
                                 >
                              </div>
                           </div>

                           <div class="form-group">
                              <div class="col-4 col-sm-12">
                                 <label class="form-label">{{ $t('word.ciphers') }}</label>
                              </div>
                              <div class="col-8 col-sm-12">
                                 <input
                                    ref="firstInput"
                                    v-model="connection.ciphers"
                                    class="form-input"
                                    type="text"
                                 >
                              </div>
                           </div>
                        </fieldset>
                     </form>
                  </div>
                  <BaseToast
                     class="mb-2"
                     :message="toast.message"
                     :status="toast.status"
                  />
               </div>
            </div>
         </div>
         <div class="modal-footer text-light">
            <button
               class="btn btn-gray mr-2"
               :class="{'loading': isTesting}"
               @click="startTest"
            >
               {{ $t('message.testConnection') }}
            </button>
            <button class="btn btn-primary mr-2" @click="saveNewConnection">
               {{ $t('word.save') }}
            </button>
            <button class="btn btn-link" @click="closeModal">
               {{ $t('word.close') }}
            </button>
         </div>
      </div>
      <ModalAskCredentials
         v-if="isAsking"
         @close-asking="closeAsking"
         @credentials="continueTest"
      />
   </div>
</template>

<script>
import { mapActions } from 'vuex';
import Connection from '@/ipc-api/Connection';
import { uidGen } from 'common/libs/uidGen';
import ModalAskCredentials from '@/components/ModalAskCredentials';
import BaseToast from '@/components/BaseToast';

export default {
   name: 'ModalNewConnection',
   components: {
      ModalAskCredentials,
      BaseToast
   },
   data () {
      return {
         connection: {
            name: '',
            client: 'mysql',
            host: '127.0.0.1',
            port: '3306',
            user: 'root',
            password: '',
            ask: false,
            uid: uidGen('C'),
            ssl: false,
            cert: '',
            key: '',
            ca: '',
            ciphers: ''

         },
         toast: {
            status: '',
            message: ''
         },
         isTesting: false,
         isAsking: false,
         selectedTab: 'general'
      };
   },
   created () {
      window.addEventListener('keydown', this.onKey);

      setTimeout(() => {
         this.$refs.firstInput.focus();
      }, 20);
   },
   beforeDestroy () {
      window.removeEventListener('keydown', this.onKey);
   },
   methods: {
      ...mapActions({
         closeModal: 'application/hideNewConnModal',
         addConnection: 'connections/addConnection'
      }),
      setDefaults () {
         switch (this.connection.client) {
            case 'mysql':
               this.connection.port = '3306';
               break;
            case 'mssql':
               this.connection.port = '1433';
               break;
            case 'pg':
               this.connection.port = '5432';
               break;
            case 'oracledb':
               this.connection.port = '1521';
               break;
         }
      },
      async startTest () {
         this.isTesting = true;
         this.toast = {
            status: '',
            message: ''
         };

         if (this.connection.ask)
            this.isAsking = true;
         else {
            try {
               const res = await Connection.makeTest(this.connection);
               if (res.status === 'error')
                  this.toast = { status: 'error', message: res.response.message };
               else
                  this.toast = { status: 'success', message: this.$t('message.connectionSuccessfullyMade') };
            }
            catch (err) {
               this.toast = { status: 'error', message: err.stack };
            }

            this.isTesting = false;
         }
      },
      async continueTest (credentials) { // if "Ask for credentials" is true
         this.isAsking = false;
         const params = Object.assign({}, this.connection, credentials);

         try {
            const res = await Connection.makeTest(params);
            if (res.status === 'error')
               this.toast = { status: 'error', message: res.response.message };
            else
               this.toast = { status: 'success', message: this.$t('message.connectionSuccessfullyMade') };
         }
         catch (err) {
            this.toast = { status: 'error', message: err.stack };
         }

         this.isTesting = false;
      },
      saveNewConnection () {
         this.addConnection(this.connection);
         this.closeModal();
      },
      closeAsking () {
         this.isAsking = false;
         this.isTesting = false;
      },
      onKey (e) {
         e.stopPropagation();
         if (e.key === 'Escape')
            this.closeModal();
      },
      selectTab (tab) {
         this.selectedTab = tab;
      },
      toggleSsl () {
         this.connection.ssl = !this.connection.ssl;
      },
      pathSelection (event, name) {
         const { files } = event.target;
         if (!files.length) return;

         this.connection[name] = files[0].path;
      }
   }
};
</script>

<style scoped>
  .modal-container {
    position: absolute;
    max-width: 450px;
    top: 17.5vh;
  }
</style>
