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
                  <a class="tab-link">{{ t('application.general') }}</a>
               </li>
               <li
                  v-if="clientCustomizations.sslConnection"
                  class="tab-item c-hand"
                  :class="{'active': selectedTab === 'ssl'}"
                  @click="selectTab('ssl')"
               >
                  <a class="tab-link">{{ t('connection.ssl') }}</a>
               </li>
               <li
                  v-if="clientCustomizations.sshConnection"
                  class="tab-item c-hand"
                  :class="{'active': selectedTab === 'ssh'}"
                  @click="selectTab('ssh')"
               >
                  <a class="tab-link">{{ t('connection.sshTunnel') }}</a>
               </li>
            </ul>
         </div>
         <div v-if="selectedTab === 'general'" class="panel-body py-0">
            <div>
               <form class="form-horizontal">
                  <fieldset class="m-0" :disabled="isBusy">
                     <div class="form-group columns">
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('connection.connectionName') }}</label>
                        </div>
                        <div class="column col-7 col-sm-12">
                           <input
                              ref="firstInput"
                              v-model="localConnection.name"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('connection.client') }}</label>
                        </div>
                        <div class="column col-7 col-sm-12">
                           <BaseSelect
                              v-model="localConnection.client"
                              :options="clients"
                              option-track-by="slug"
                              option-label="name"
                              class="form-select"
                              dropdown-container=".workspace .connection-panel-wrapper"
                              :dropdown-offsets="{top: 10}"
                           />
                        </div>
                     </div>
                     <div v-if="localConnection.client === 'pg'" class="form-group columns">
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('connection.connectionString') }}</label>
                        </div>
                        <div class="column col-7 col-sm-12">
                           <input
                              ref="pgString"
                              v-model="localConnection.pgConnString"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div v-if="!clientCustomizations.fileConnection" class="form-group columns">
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('connection.hostName') }}/IP</label>
                        </div>
                        <div class="column col-7 col-sm-12">
                           <input
                              v-model="localConnection.host"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div v-if="clientCustomizations.fileConnection" class="form-group columns">
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('database.database') }}</label>
                        </div>
                        <div class="column col-7 col-sm-12">
                           <BaseUploadInput
                              :model-value="localConnection.databasePath"
                              :message="t('general.browse')"
                              @clear="pathClear('databasePath')"
                              @change="pathSelection($event, 'databasePath')"
                           />
                        </div>
                     </div>
                     <div v-if="!clientCustomizations.fileConnection" class="form-group columns">
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('connection.port') }}</label>
                        </div>
                        <div class="column col-7 col-sm-12">
                           <input
                              v-model="localConnection.port"
                              class="form-input"
                              type="number"
                              min="1"
                              max="65535"
                           >
                        </div>
                     </div>
                     <div v-if="clientCustomizations.database" class="form-group columns">
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('database.database') }}</label>
                        </div>
                        <div class="column col-7 col-sm-12">
                           <input
                              v-model="localConnection.database"
                              class="form-input"
                              type="text"
                              :placeholder="clientCustomizations.defaultDatabase"
                           >
                        </div>
                     </div>
                     <div v-if="!clientCustomizations.fileConnection" class="form-group columns">
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('connection.user') }}</label>
                        </div>
                        <div class="column col-7 col-sm-12">
                           <input
                              v-model="localConnection.user"
                              class="form-input"
                              type="text"
                              :disabled="localConnection.ask"
                           >
                        </div>
                     </div>
                     <div v-if="!clientCustomizations.fileConnection" class="form-group columns">
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('connection.password') }}</label>
                        </div>
                        <div class="column col-7 col-sm-12">
                           <input
                              v-model="localConnection.password"
                              class="form-input"
                              type="password"
                              :disabled="localConnection.ask"
                           >
                        </div>
                     </div>
                     <div v-if="clientCustomizations.connectionSchema" class="form-group columns">
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('database.schema') }}</label>
                        </div>
                        <div class="column col-7 col-sm-12">
                           <input
                              v-model="localConnection.schema"
                              class="form-input"
                              type="text"
                              :placeholder="t('general.all')"
                           >
                        </div>
                     </div>
                     <div v-if="clientCustomizations.readOnlyMode" class="form-group columns">
                        <div class="column col-5 col-sm-12" />
                        <div class="column col-7 col-sm-12">
                           <label class="form-checkbox form-inline">
                              <input v-model="localConnection.readonly" type="checkbox"><i class="form-icon" /> {{ t('connection.readOnlyMode') }}
                           </label>
                        </div>
                     </div>
                     <div v-if="!clientCustomizations.fileConnection" class="form-group columns">
                        <div class="column col-5 col-sm-12" />
                        <div class="column col-7 col-sm-12">
                           <label class="form-checkbox form-inline">
                              <input v-model="localConnection.ask" type="checkbox"><i class="form-icon" /> {{ t('connection.askCredentials') }}
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
                     <div class="column col-5 col-sm-12">
                        <label class="form-label cut-text">
                           {{ t('connection.enableSsl') }}
                        </label>
                     </div>
                     <div class="column col-7 col-sm-12">
                        <label class="form-switch d-inline-block" @click.prevent="toggleSsl">
                           <input type="checkbox" :checked="localConnection.ssl">
                           <i class="form-icon" />
                        </label>
                     </div>
                  </div>
                  <fieldset class="m-0" :disabled="isBusy || !localConnection.ssl">
                     <div class="form-group columns">
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('connection.privateKey') }}</label>
                        </div>
                        <div class="column col-7 col-sm-12">
                           <BaseUploadInput
                              :model-value="localConnection.key"
                              :message="t('general.browse')"
                              @clear="pathClear('key')"
                              @change="pathSelection($event, 'key')"
                           />
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('connection.certificate') }}</label>
                        </div>
                        <div class="column col-7 col-sm-12">
                           <BaseUploadInput
                              :model-value="localConnection.cert"
                              :message="t('general.browse')"
                              @clear="pathClear('cert')"
                              @change="pathSelection($event, 'cert')"
                           />
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('connection.caCertificate') }}</label>
                        </div>
                        <div class="column col-7 col-sm-12">
                           <BaseUploadInput
                              :model-value="localConnection.ca"
                              :message="t('general.browse')"
                              @clear="pathClear('ca')"
                              @change="pathSelection($event, 'ca')"
                           />
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('connection.ciphers') }}</label>
                        </div>
                        <div class="column col-7 col-sm-12">
                           <input
                              ref="firstInput"
                              v-model="localConnection.ciphers"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-5 col-sm-12" />
                        <div class="column col-7 col-sm-12">
                           <label class="form-checkbox form-inline">
                              <input v-model="localConnection.untrustedConnection" type="checkbox"><i class="form-icon" /> {{ t('connection.untrustedConnection') }}
                           </label>
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
                     <div class="column col-5 col-sm-12">
                        <label class="form-label cut-text">
                           {{ t('connection.enableSsh') }}
                        </label>
                     </div>
                     <div class="column col-7 col-sm-12">
                        <label class="form-switch d-inline-block" @click.prevent="toggleSsh">
                           <input type="checkbox" :checked="localConnection.ssh">
                           <i class="form-icon" />
                        </label>
                     </div>
                  </div>
                  <fieldset class="m-0" :disabled="isBusy || !localConnection.ssh">
                     <div class="form-group columns">
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('connection.hostName') }}/IP</label>
                        </div>
                        <div class="column col-7 col-sm-12">
                           <input
                              v-model="localConnection.sshHost"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('connection.user') }}</label>
                        </div>
                        <div class="column col-7 col-sm-12">
                           <input
                              v-model="localConnection.sshUser"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('connection.password') }}</label>
                        </div>
                        <div class="column col-7 col-sm-12">
                           <input
                              v-model="localConnection.sshPass"
                              class="form-input"
                              type="password"
                           >
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('connection.port') }}</label>
                        </div>
                        <div class="column col-7 col-sm-12">
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
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('connection.privateKey') }}</label>
                        </div>
                        <div class="column col-7 col-sm-12">
                           <BaseUploadInput
                              :model-value="localConnection.sshKey"
                              :message="t('general.browse')"
                              @clear="pathClear('sshKey')"
                              @change="pathSelection($event, 'sshKey')"
                           />
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('connection.passphrase') }}</label>
                        </div>
                        <div class="column col-7 col-sm-12">
                           <input
                              v-model="localConnection.sshPassphrase"
                              class="form-input"
                              type="password"
                           >
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-5 col-sm-12">
                           <label class="form-label cut-text">{{ t('connection.keepAliveInterval') }}</label>
                        </div>
                        <div class="column col-7 col-sm-12">
                           <div class="input-group">
                              <input
                                 v-model="localConnection.sshKeepAliveInterval"
                                 class="form-input"
                                 type="number"
                                 min="1"
                              >
                              <span class="input-group-addon">{{ t('general.seconds') }}</span>
                           </div>
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
               {{ t('connection.testConnection') }}
            </button>
            <button
               id="connection-save"
               class="btn btn-primary mr-2 d-flex"
               :disabled="isBusy || !hasChanges"
               @click="saveConnection"
            >
               <i class="mdi mdi-24px mdi-content-save mr-1" />
               {{ t('general.save') }}
            </button>
            <button
               id="connection-connect"
               class="btn btn-success d-flex"
               :class="{'loading': isConnecting}"
               :disabled="isBusy"
               @click="startConnection"
            >
               <i class="mdi mdi-24px mdi-connection mr-1" />
               {{ t('connection.connect') }}
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

<script setup lang="ts">
import customizations from 'common/customizations';
import { ConnectionParams } from 'common/interfaces/antares';
import { computed, Prop, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseSelect from '@/components/BaseSelect.vue';
import BaseUploadInput from '@/components/BaseUploadInput.vue';
import ModalAskCredentials from '@/components/ModalAskCredentials.vue';
import Connection from '@/ipc-api/Connection';
import { useConnectionsStore } from '@/stores/connections';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

const props = defineProps({
   connection: Object as Prop<ConnectionParams>
});

const { editConnection } = useConnectionsStore();
const { addNotification } = useNotificationsStore();
const { connectWorkspace } = useWorkspacesStore();

const clients = [
   { name: 'MySQL', slug: 'mysql' },
   { name: 'MariaDB', slug: 'maria' },
   { name: 'PostgreSQL', slug: 'pg' },
   { name: 'SQLite', slug: 'sqlite' },
   { name: 'Firebird SQL', slug: 'firebird' }
];

const firstInput: Ref<HTMLInputElement> = ref(null);
const localConnection: Ref<ConnectionParams & { pgConnString: string }> = ref(null);
const isConnecting = ref(false);
const isTesting = ref(false);
const isAsking = ref(false);
const selectedTab = ref('general');

const clientCustomizations = computed(() => {
   return customizations[localConnection.value.client];
});

const isBusy = computed(() => {
   return isConnecting.value || isTesting.value;
});

const hasChanges = computed(() => {
   return JSON.stringify(props.connection) !== JSON.stringify(localConnection.value);
});

watch(() => props.connection, () => {
   localConnection.value = JSON.parse(JSON.stringify(props.connection));
});

const startConnection = async () => {
   await saveConnection();
   isConnecting.value = true;

   if (localConnection.value.ask)
      isAsking.value = true;
   else {
      await connectWorkspace(localConnection.value);
      isConnecting.value = false;
   }
};

const startTest = async () => {
   isTesting.value = true;

   if (localConnection.value.ask)
      isAsking.value = true;
   else {
      try {
         const res = await Connection.makeTest(localConnection.value);
         if (res.status === 'error')
            addNotification({ status: 'error', message: res.response.message || res.response.toString() });
         else
            addNotification({ status: 'success', message: t('connection.connectionSuccessfullyMade') });
      }
      catch (err) {
         addNotification({ status: 'error', message: err.stack });
      }

      isTesting.value = false;
   }
};

const continueTest = async (credentials: {user: string; password: string }) => { // if "Ask for credentials" is true
   isAsking.value = false;
   const params = Object.assign({}, localConnection.value, credentials);
   try {
      if (isConnecting.value) {
         const params = Object.assign({}, props.connection, credentials);
         await connectWorkspace(params);
         isConnecting.value = false;
      }
      else {
         const res = await Connection.makeTest(params);
         if (res.status === 'error')
            addNotification({ status: 'error', message: res.response.message || res.response.toString() });
         else
            addNotification({ status: 'success', message: t('connection.connectionSuccessfullyMade') });
      }
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   isTesting.value = false;
};

const saveConnection = () => {
   return editConnection(localConnection.value);
};

const closeAsking = () => {
   isTesting.value = false;
   isAsking.value = false;
   isConnecting.value = false;
};

const selectTab = (tab: string) => {
   selectedTab.value = tab;
};

const toggleSsl = () => {
   localConnection.value.ssl = !localConnection.value.ssl;
};

const toggleSsh = () => {
   localConnection.value.ssh = !localConnection.value.ssh;
};

const pathSelection = (event: Event & {target: {files: {path: string}[]}}, name: keyof ConnectionParams) => {
   const { files } = event.target;
   if (!files.length) return;

   (localConnection.value as unknown as {[key: string]: string})[name] = files[0].path;
};

const pathClear = (name: keyof ConnectionParams) => {
   (localConnection.value as unknown as {[key: string]: string})[name] = '';
};

localConnection.value = JSON.parse(JSON.stringify(props.connection));
</script>

<style lang="scss" scoped>
.connection-panel {
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 0.5rem;
  margin-top: 1.5rem;

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
