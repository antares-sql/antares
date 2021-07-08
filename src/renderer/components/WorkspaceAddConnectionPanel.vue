<template>
   <div class="connection-panel">
      <div class="panel">
         <div class="panel-nav">
            <ul class="tab tab-block">
               <li
                  class="tab-item c-hand"
                  :class="{'active': selectedTab === 'general'}"
                  @click="selectTab('general')"
               >
                  <a class="tab-link">{{ $t('word.general') }}</a>
               </li>
               <li
                  class="tab-item c-hand"
                  :class="{'active': selectedTab === 'ssl'}"
                  @click="selectTab('ssl')"
               >
                  <a class="tab-link">{{ $t('word.ssl') }}</a>
               </li>
               <li
                  class="tab-item"
                  :class="{'active': selectedTab === 'ssh'}"
                  @click="selectTab('ssh')"
               >
                  <a class="c-hand">{{ $t('word.sshTunnel') }}</a>
               </li>
            </ul>
         </div>
         <div v-if="selectedTab === 'general'" class="panel-body py-0">
            <div>
               <form class="form-horizontal">
                  <fieldset class="m-0" :disabled="isBusy">
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label">{{ $t('word.connectionName') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              ref="firstInput"
                              v-model="connection.name"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label">{{ $t('word.client') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <select v-model="connection.client" class="form-select">
                              <option value="mysql">
                                 MySQL
                              </option>
                              <option value="maria">
                                 MariaDB
                              </option>
                              <option value="pg">
                                 PostgreSQL
                              </option>
                              <!-- <option value="mssql">
                                       Microsoft SQL
                                    </option>
                                    <option value="oracledb">
                                       Oracle DB
                                    </option> -->
                           </select>
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label">{{ $t('word.hostName') }}/IP</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="connection.host"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label">{{ $t('word.port') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="connection.port"
                              class="form-input"
                              type="number"
                              min="1"
                              max="65535"
                           >
                        </div>
                     </div>
                     <div v-if="customizations.database" class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label">{{ $t('word.database') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="connection.database"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label">{{ $t('word.user') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="connection.user"
                              class="form-input"
                              type="text"
                              :disabled="connection.ask"
                           >
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label">{{ $t('word.password') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="connection.password"
                              class="form-input"
                              type="password"
                              :disabled="connection.ask"
                           >
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12" />
                        <div class="column col-8 col-sm-12">
                           <label class="form-checkbox form-inline">
                              <input v-model="connection.ask" type="checkbox"><i class="form-icon" /> {{ $t('message.askCredentials') }}
                           </label>
                        </div>
                     </div>
                  </fieldset>
               </form>
            </div>
         </div>
         <div v-if="selectedTab === 'ssl'" class="panel-body py-0">
            <div>
               <form class="form-horizontal">
                  <div class="form-group columns">
                     <div class="column col-4 col-sm-12">
                        <label class="form-label">
                           {{ $t('message.enableSsl') }}
                        </label>
                     </div>
                     <div class="column col-8 col-sm-12">
                        <label class="form-switch d-inline-block" @click.prevent="toggleSsl">
                           <input type="checkbox" :checked="connection.ssl">
                           <i class="form-icon" />
                        </label>
                     </div>
                  </div>
                  <fieldset class="m-0" :disabled="isBusy || !connection.ssl">
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label">{{ $t('word.privateKey') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <BaseUploadInput
                              :value="connection.key"
                              :message="$t('word.browse')"
                              @clear="pathClear('key')"
                              @change="pathSelection($event, 'key')"
                           />
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label">{{ $t('word.certificate') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <BaseUploadInput
                              :value="connection.cert"
                              :message="$t('word.browse')"
                              @clear="pathClear('cert')"
                              @change="pathSelection($event, 'cert')"
                           />
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label">{{ $t('word.caCertificate') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <BaseUploadInput
                              :value="connection.ca"
                              :message="$t('word.browse')"
                              @clear="pathClear('ca')"
                              @change="pathSelection($event, 'ca')"
                           />
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label">{{ $t('word.ciphers') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
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
         </div>
         <div v-if="selectedTab === 'ssh'" class="panel-body py-0">
            <div>
               <form class="form-horizontal">
                  <div class="form-group columns">
                     <div class="column col-4 col-sm-12">
                        <label class="form-label">
                           {{ $t('message.enableSsh') }}
                        </label>
                     </div>
                     <div class="column col-8 col-sm-12">
                        <label class="form-switch d-inline-block" @click.prevent="toggleSsh">
                           <input type="checkbox" :checked="connection.ssh">
                           <i class="form-icon" />
                        </label>
                     </div>
                  </div>
                  <fieldset class="m-0" :disabled="isBusy || !connection.ssh">
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label">{{ $t('word.hostName') }}/IP</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="connection.sshHost"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label">{{ $t('word.user') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="connection.sshUser"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label">{{ $t('word.password') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="connection.sshPass"
                              class="form-input"
                              type="password"
                           >
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label">{{ $t('word.port') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="connection.sshPort"
                              class="form-input"
                              type="number"
                              min="1"
                              max="65535"
                           >
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label">{{ $t('word.privateKey') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <BaseUploadInput
                              :value="connection.sshKey"
                              :message="$t('word.browse')"
                              @clear="pathClear('sshKey')"
                              @change="pathSelection($event, 'sshKey')"
                           />
                        </div>
                     </div>
                  </fieldset>
               </form>
            </div>
         </div>
         <div class="panel-footer">
            <button
               class="btn btn-gray mr-2"
               :class="{'loading': isTesting}"
               :disabled="isBusy"
               @click="startTest"
            >
               {{ $t('message.testConnection') }}
            </button>
            <button
               class="btn btn-primary mr-2"
               :disabled="isBusy"
               @click="saveConnection"
            >
               {{ $t('word.save') }}
            </button>
            <!-- <button
               class="btn btn-success"
               :class="{'loading': isConnecting}"
               :disabled="isBusy"
               @click="startConnection"
            >
               {{ $t('word.connect') }}
            </button> -->
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
import customizations from 'common/customizations';
import Connection from '@/ipc-api/Connection';
import { uidGen } from 'common/libs/uidGen';
import ModalAskCredentials from '@/components/ModalAskCredentials';
import BaseUploadInput from '@/components/BaseUploadInput';

export default {
   name: 'WorkspaceAddConnectionPanel',
   components: {
      ModalAskCredentials,
      BaseUploadInput
   },
   data () {
      return {
         connection: {
            name: '',
            client: 'mysql',
            host: '127.0.0.1',
            database: null,
            port: null,
            user: null,
            password: '',
            ask: false,
            uid: uidGen('C'),
            ssl: false,
            cert: '',
            key: '',
            ca: '',
            ciphers: '',
            ssh: false,
            sshHost: '',
            sshUser: '',
            sshPass: '',
            sshKey: '',
            sshPort: 22
         },
         isConnecting: false,
         isTesting: false,
         isAsking: false,
         selectedTab: 'general'
      };
   },
   computed: {
      customizations () {
         return customizations[this.connection.client];
      },
      isBusy () {
         return this.isConnecting || this.isTesting;
      }
   },
   created () {
      this.setDefaults();
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
         addConnection: 'connections/addConnection',
         connectWorkspace: 'workspaces/connectWorkspace',
         addNotification: 'notifications/addNotification',
         selectWorkspace: 'workspaces/selectWorkspace'
      }),
      setDefaults () {
         this.connection.user = this.customizations.defaultUser;
         this.connection.port = this.customizations.defaultPort;
         this.connection.database = this.customizations.defaultDatabase;
      },
      async startConnection () {
         await this.saveConnection();
         this.isConnecting = true;

         if (this.connection.ask)
            this.isAsking = true;
         else {
            await this.connectWorkspace(this.connection);
            this.isConnecting = false;
         }
      },
      async startTest () {
         this.isTesting = true;

         if (this.connection.ask)
            this.isAsking = true;
         else {
            try {
               const res = await Connection.makeTest(this.connection);
               if (res.status === 'error')
                  this.addNotification({ status: 'error', message: res.response.message });
               else
                  this.addNotification({ status: 'success', message: this.$t('message.connectionSuccessfullyMade') });
            }
            catch (err) {
               this.addNotification({ status: 'error', message: err.stack });
            }

            this.isTesting = false;
         }
      },
      async continueTest (credentials) { // if "Ask for credentials" is true
         this.isAsking = false;
         const params = Object.assign({}, this.connection, credentials);
         try {
            if (this.isConnecting) {
               const params = Object.assign({}, this.connection, credentials);
               await this.connectWorkspace(params);
               this.isConnecting = false;
            }
            else {
               const res = await Connection.makeTest(params);
               if (res.status === 'error')
                  this.addNotification({ status: 'error', message: res.response.message });
               else
                  this.addNotification({ status: 'success', message: this.$t('message.connectionSuccessfullyMade') });
            }
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.isTesting = false;
      },
      saveConnection () {
         this.selectWorkspace(this.connection.uid);
         return this.addConnection(this.connection);
      },
      closeAsking () {
         this.isTesting = false;
         this.isAsking = false;
      },
      selectTab (tab) {
         this.selectedTab = tab;
      },
      toggleSsl () {
         this.connection.ssl = !this.connection.ssl;
      },
      toggleSsh () {
         this.connection.ssh = !this.connection.ssh;
      },
      pathSelection (event, name) {
         const { files } = event.target;
         if (!files.length) return;

         this.connection[name] = files[0].path;
      },
      pathClear (name) {
         this.connection[name] = '';
      }
   }
};
</script>

<style lang="scss" scoped>
.connection-panel {
  display: flex;
  margin-top: 15vh;
  justify-content: space-between;
  margin-left: auto;
  margin-right: auto;

  .panel {
    width: 450px;

    .panel-body {
      flex: initial;
    }

    .panel-footer {
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
