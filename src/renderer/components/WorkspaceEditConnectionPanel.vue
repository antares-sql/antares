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
                  <a class="tab-link">{{ t('word.general') }}</a>
               </li>
               <li
                  v-if="clientCustomizations.sslConnection"
                  class="tab-item c-hand"
                  :class="{'active': selectedTab === 'ssl'}"
                  @click="selectTab('ssl')"
               >
                  <a class="tab-link">{{ t('word.ssl') }}</a>
               </li>
               <li
                  v-if="clientCustomizations.sshConnection"
                  class="tab-item c-hand"
                  :class="{'active': selectedTab === 'ssh'}"
                  @click="selectTab('ssh')"
               >
                  <a class="tab-link">{{ t('word.sshTunnel') }}</a>
               </li>
            </ul>
         </div>
         <div v-if="selectedTab === 'general'" class="panel-body py-0">
            <div>
               <form class="form-horizontal">
                  <fieldset class="m-0" :disabled="isBusy">
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ t('word.connectionName') }}</label>
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
                           <label class="form-label cut-text">{{ t('word.client') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
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
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ t('word.connectionString') }}</label>
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
                     <div v-if="!clientCustomizations.fileConnection" class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ t('word.hostName') }}/IP</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="localConnection.host"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div v-if="clientCustomizations.fileConnection" class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ t('word.database') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <BaseUploadInput
                              :model-value="localConnection.databasePath"
                              :message="t('word.browse')"
                              @clear="pathClear('databasePath')"
                              @change="pathSelection($event, 'databasePath')"
                           />
                        </div>
                     </div>
                     <div v-if="!clientCustomizations.fileConnection" class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ t('word.port') }}</label>
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
                     <div v-if="clientCustomizations.database" class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ t('word.database') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="localConnection.database"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div v-if="!clientCustomizations.fileConnection" class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ t('word.user') }}</label>
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
                     <div v-if="!clientCustomizations.fileConnection" class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ t('word.password') }}</label>
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
                     <div v-if="clientCustomizations.connectionSchema" class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ t('word.schema') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <input
                              v-model="localConnection.schema"
                              class="form-input"
                              type="text"
                              :placeholder="t('word.all')"
                           >
                        </div>
                     </div>
                     <div v-if="clientCustomizations.readOnlyMode" class="form-group columns">
                        <div class="column col-4 col-sm-12" />
                        <div class="column col-8 col-sm-12">
                           <label class="form-checkbox form-inline">
                              <input v-model="localConnection.readonly" type="checkbox"><i class="form-icon" /> {{ t('message.readOnlyMode') }}
                           </label>
                        </div>
                     </div>
                     <div v-if="!clientCustomizations.fileConnection" class="form-group columns">
                        <div class="column col-4 col-sm-12" />
                        <div class="column col-8 col-sm-12">
                           <label class="form-checkbox form-inline">
                              <input v-model="localConnection.ask" type="checkbox"><i class="form-icon" /> {{ t('message.askCredentials') }}
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
                           {{ t('message.enableSsl') }}
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
                           <label class="form-label cut-text">{{ t('word.privateKey') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <BaseUploadInput
                              :model-value="localConnection.key"
                              :message="t('word.browse')"
                              @clear="pathClear('key')"
                              @change="pathSelection($event, 'key')"
                           />
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ t('word.certificate') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <BaseUploadInput
                              :model-value="localConnection.cert"
                              :message="t('word.browse')"
                              @clear="pathClear('cert')"
                              @change="pathSelection($event, 'cert')"
                           />
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ t('word.caCertificate') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <BaseUploadInput
                              :model-value="localConnection.ca"
                              :message="t('word.browse')"
                              @clear="pathClear('ca')"
                              @change="pathSelection($event, 'ca')"
                           />
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ t('word.ciphers') }}</label>
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
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12" />
                        <div class="column col-8 col-sm-12">
                           <label class="form-checkbox form-inline">
                              <input v-model="localConnection.untrustedConnection" type="checkbox"><i class="form-icon" /> {{ t('message.untrustedConnection') }}
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
                     <div class="column col-4 col-sm-12">
                        <label class="form-label cut-text">
                           {{ t('message.enableSsh') }}
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
                           <label class="form-label cut-text">{{ t('word.hostName') }}/IP</label>
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
                           <label class="form-label cut-text">{{ t('word.user') }}</label>
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
                           <label class="form-label cut-text">{{ t('word.password') }}</label>
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
                           <label class="form-label cut-text">{{ t('word.port') }}</label>
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
                           <label class="form-label cut-text">{{ t('word.privateKey') }}</label>
                        </div>
                        <div class="column col-8 col-sm-12">
                           <BaseUploadInput
                              :model-value="localConnection.sshKey"
                              :message="t('word.browse')"
                              @clear="pathClear('sshKey')"
                              @change="pathSelection($event, 'sshKey')"
                           />
                        </div>
                     </div>
                     <div class="form-group columns">
                        <div class="column col-4 col-sm-12">
                           <label class="form-label cut-text">{{ t('word.passphrase') }}</label>
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
               {{ t('message.testConnection') }}
            </button>
            <button
               id="connection-save"
               class="btn btn-primary mr-2 d-flex"
               :disabled="isBusy || !hasChanges"
               @click="saveConnection"
            >
               <i class="mdi mdi-24px mdi-content-save mr-1" />
               {{ t('word.save') }}
            </button>
            <button
               id="connection-connect"
               class="btn btn-success d-flex"
               :class="{'loading': isConnecting}"
               :disabled="isBusy"
               @click="startConnection"
            >
               <i class="mdi mdi-24px mdi-connection mr-1" />
               {{ t('word.connect') }}
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
import { computed, Prop, Ref, ref, watch } from 'vue';
import customizations from 'common/customizations';
import { useConnectionsStore } from '@/stores/connections';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import Connection from '@/ipc-api/Connection';
import ModalAskCredentials from '@/components/ModalAskCredentials.vue';
import BaseUploadInput from '@/components/BaseUploadInput.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import { ConnectionParams } from 'common/interfaces/antares';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
   connection: Object as Prop<ConnectionParams>
});

const { editConnection } = useConnectionsStore();
const { addNotification } = useNotificationsStore();
const { connectWorkspace } = useWorkspacesStore();

const clients = ref([
   { name: 'MySQL', slug: 'mysql' },
   { name: 'MariaDB', slug: 'maria' },
   { name: 'PostgreSQL', slug: 'pg' },
   { name: 'SQLite', slug: 'sqlite' }
]);

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
            addNotification({ status: 'success', message: t('message.connectionSuccessfullyMade') });
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
            addNotification({ status: 'success', message: t('message.connectionSuccessfullyMade') });
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
