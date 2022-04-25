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
                  v-if="customizations.sslConnection"
                  class="tab-item c-hand"
                  :class="{'active': selectedTab === 'ssl'}"
                  @click="selectTab('ssl')"
               >
                  <a class="tab-link">{{ $t('word.ssl') }}</a>
               </li>
               <li
                  v-if="customizations.sshConnection"
                  class="tab-item c-hand"
                  :class="{'active': selectedTab === 'ssh'}"
                  @click="selectTab('ssh')"
               >
                  <a class="tab-link">{{ $t('word.sshTunnel') }}</a>
               </li>
            </ul>
         </div>
         <div v-if="selectedTab === 'general'" class="panel-body py-0">
            <div>
               <form class="form-horizontal">
                  <fieldset class="m-0" :disabled="isBusy">
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ $t('word.connectionName') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              ref="firstInput"
                              v-model="localConnection.name"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ $t('word.client') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <select v-model="localConnection.client" class="form-select">
                              <option
                                 v-for="client in clients"
                                 :key="client.slug"
                                 :value="client.slug"
                              >
                                 {{ client.name }}
                              </option>
                           </select>
                        </div>
                     </div>
                     <div v-if="connection.client === 'pg'" class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ $t('word.connectionString') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              ref="pgString"
                              v-model="localConnection.pgConnString"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div v-if="!customizations.fileConnection" class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ $t('word.hostName') }}/IP</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="localConnection.host"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div v-if="customizations.fileConnection" class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ $t('word.database') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <BaseUploadInput
                              :value="localConnection.databasePath"
                              :message="$t('word.browse')"
                              @clear="pathClear('databasePath')"
                              @change="pathSelection($event, 'databasePath')"
                           />
                        </div>
                     </div>
                     <div v-if="!customizations.fileConnection" class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ $t('word.port') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="localConnection.port"
                              class="form-input"
                              type="number"
                              min="1"
                              max="65535"
                           >
                        </div>
                     </div>
                     <div v-if="customizations.database" class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ $t('word.database') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="localConnection.database"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div v-if="!customizations.fileConnection" class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ $t('word.user') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="localConnection.user"
                              class="form-input"
                              type="text"
                              :disabled="localConnection.ask"
                           >
                        </div>
                     </div>
                     <div v-if="!customizations.fileConnection" class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ $t('word.password') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="localConnection.password"
                              class="form-input"
                              type="password"
                              :disabled="localConnection.ask"
                           >
                        </div>
                     </div>
                     <div v-if="customizations.connectionSchema" class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ $t('word.schema') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="localConnection.schema"
                              class="form-input"
                              type="text"
                              :placeholder="$t('word.all')"
                           >
                        </div>
                     </div>
                     <div v-if="customizations.readOnlyMode" class="form-group columns">
                        <div class="column col-4 col-sm-12" />
                        <div class="column col-8 col-sm-12">
                           <label class="form-checkbox form-inline">
                              <input v-model="localConnection.readonly" type="checkbox"><i class="form-icon" /> {{ $t('message.readOnlyMode') }}
                           </label>
                        </div>
                     </div>
                     <div v-if="!customizations.fileConnection" class="form-group columns">
                        <div class="column col-4 col-sm-12" />
                        <div class="column col-8 col-sm-12">
                           <label class="form-checkbox form-inline">
                              <input v-model="localConnection.ask" type="checkbox"><i class="form-icon" /> {{ $t('message.askCredentials') }}
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
                        <label class="form-label cut-text">
                           {{ $t('message.enableSsl') }}
                        </label>
                     </div>
                     <div class="column col-8 col-sm-12">
                        <label class="form-switch d-inline-block" @click.prevent="toggleSsl">
                           <input type="checkbox" :checked="localConnection.ssl">
                           <i class="form-icon" />
                        </label>
                     </div>
                  </div>
                  <fieldset class="m-0" :disabled="isBusy || !localConnection.ssl">
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ $t('word.privateKey') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <BaseUploadInput
                              :value="localConnection.key"
                              :message="$t('word.browse')"
                              @clear="pathClear('key')"
                              @change="pathSelection($event, 'key')"
                           />
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ $t('word.certificate') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <BaseUploadInput
                              :value="localConnection.cert"
                              :message="$t('word.browse')"
                              @clear="pathClear('cert')"
                              @change="pathSelection($event, 'cert')"
                           />
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ $t('word.caCertificate') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <BaseUploadInput
                              :value="localConnection.ca"
                              :message="$t('word.browse')"
                              @clear="pathClear('ca')"
                              @change="pathSelection($event, 'ca')"
                           />
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ $t('word.ciphers') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              ref="firstInput"
                              v-model="localConnection.ciphers"
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
                        <label class="form-label cut-text">
                           {{ $t('message.enableSsh') }}
                        </label>
                     </div>
                     <div class="column col-8 col-sm-12">
                        <label class="form-switch d-inline-block" @click.prevent="toggleSsh">
                           <input type="checkbox" :checked="localConnection.ssh">
                           <i class="form-icon" />
                        </label>
                     </div>
                  </div>
                  <fieldset class="m-0" :disabled="isBusy || !localConnection.ssh">
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ $t('word.hostName') }}/IP</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="localConnection.sshHost"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ $t('word.user') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="localConnection.sshUser"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ $t('word.password') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="localConnection.sshPass"
                              class="form-input"
                              type="password"
                           >
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ $t('word.port') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="localConnection.sshPort"
                              class="form-input"
                              type="number"
                              min="1"
                              max="65535"
                           >
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ $t('word.privateKey') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <BaseUploadInput
                              :value="localConnection.sshKey"
                              :message="$t('word.browse')"
                              @clear="pathClear('sshKey')"
                              @change="pathSelection($event, 'sshKey')"
                           />
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ $t('word.passphrase') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="localConnection.sshPassphrase"
                              class="form-input"
                              type="password"
                           >
                        </div>
                     </div>
                  </fieldset>
               </form>
            </div>
         </div>
         <div class="panel-footer">
            <button
               id="connection-test"
               class="btn btn-gray mr-2 d-flex"
               :class="{'loading': isTesting}"
               :disabled="isBusy"
               @click="startTest"
            >
               <i class="mdi mdi-24px mdi-lightning-bolt mr-1" />
               {{ $t('message.testConnection') }}
            </button>
            <button
               id="connection-save"
               class="btn btn-primary mr-2 d-flex"
               :disabled="isBusy || !hasChanges"
               @click="saveConnection"
            >
               <i class="mdi mdi-24px mdi-content-save mr-1" />
               {{ $t('word.save') }}
            </button>
            <button
               id="connection-connect"
               class="btn btn-success d-flex"
               :class="{'loading': isConnecting}"
               :disabled="isBusy"
               @click="startConnection"
            >
               <i class="mdi mdi-24px mdi-connection mr-1" />
               {{ $t('word.connect') }}
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
import customizations from 'common/customizations';
import Connection from '@/ipc-api/Connection';
import ModalAskCredentials from '@/components/ModalAskCredentials';
import BaseUploadInput from '@/components/BaseUploadInput';

export default {
   name: 'WorkspaceEditConnectionPanel',
   components: {
      ModalAskCredentials,
      BaseUploadInput
   },
   props: {
      connection: Object
   },
   data () {
      return {
         clients: [
            { name: 'MySQL', slug: 'mysql' },
            { name: 'MariaDB', slug: 'maria' },
            { name: 'PostgreSQL', slug: 'pg' },
            { name: 'SQLite', slug: 'sqlite' }
         ],
         isConnecting: false,
         isTesting: false,
         isAsking: false,
         localConnection: null,
         selectedTab: 'general'
      };
   },
   computed: {
      customizations () {
         return customizations[this.localConnection.client];
      },
      isBusy () {
         return this.isConnecting || this.isTesting;
      },
      hasChanges () {
         return JSON.stringify(this.connection) !== JSON.stringify(this.localConnection);
      }
   },
   watch: {
      connection () {
         this.localConnection = JSON.parse(JSON.stringify(this.connection));
      }
   },
   created () {
      this.localConnection = JSON.parse(JSON.stringify(this.connection));
   },
   methods: {
      ...mapActions({
         editConnection: 'connections/editConnection',
         connectWorkspace: 'workspaces/connectWorkspace',
         addNotification: 'notifications/addNotification'
      }),
      async startConnection () {
         await this.saveConnection();
         this.isConnecting = true;

         if (this.localConnection.ask)
            this.isAsking = true;
         else {
            await this.connectWorkspace(this.localConnection);
            this.isConnecting = false;
         }
      },
      async startTest () {
         this.isTesting = true;

         if (this.localConnection.ask)
            this.isAsking = true;
         else {
            try {
               const res = await Connection.makeTest(this.localConnection);
               if (res.status === 'error')
                  this.addNotification({ status: 'error', message: res.response.message || res.response.toString() });
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
         const params = Object.assign({}, this.localConnection, credentials);
         try {
            if (this.isConnecting) {
               const params = Object.assign({}, this.connection, credentials);
               await this.connectWorkspace(params);
               this.isConnecting = false;
            }
            else {
               const res = await Connection.makeTest(params);
               if (res.status === 'error')
                  this.addNotification({ status: 'error', message: res.response.message || res.response.toString() });
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
         return this.editConnection(this.localConnection);
      },
      closeAsking () {
         this.isTesting = false;
         this.isAsking = false;
         this.isConnecting = false;
      },
      selectTab (tab) {
         this.selectedTab = tab;
      },
      toggleSsl () {
         this.localConnection.ssl = !this.localConnection.ssl;
      },
      toggleSsh () {
         this.localConnection.ssh = !this.localConnection.ssh;
      },
      pathSelection (event, name) {
         const { files } = event.target;
         if (!files.length) return;

         this.localConnection[name] = files[0].path;
      },
      pathClear (name) {
         this.localConnection[name] = '';
      }
   }
};
</script>

<style lang="scss" scoped>
.connection-panel {
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 1rem;

  .panel {
    min-width: 450px;
    border-radius: $border-radius;

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
