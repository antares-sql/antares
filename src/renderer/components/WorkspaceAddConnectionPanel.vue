<template>
   <div class="connection-panel-wrapper p-relative">
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
                                 v-model="connection.name"
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
                                 v-model="connection.client"
                                 :options="clients"
                                 option-track-by="slug"
                                 option-label="name"
                                 class="form-select"
                              />
                           </div>
                        </div>
                        <div v-if="connection.client === 'pg'" class="form-group columns">
                           <div class="column col-5 col-sm-12">
                              <label class="form-label cut-text">{{ t('connection.connectionString') }}</label>
                           </div>
                           <div class="column col-7 col-sm-12">
                              <input
                                 ref="pgString"
                                 v-model="connection.connString"
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
                                 v-model="connection.host"
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
                                 :model-value="connection.databasePath"
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
                                 v-model="connection.port"
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
                                 v-model="connection.database"
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
                                 v-model="connection.user"
                                 class="form-input"
                                 type="text"
                                 :disabled="connection.ask"
                              >
                           </div>
                        </div>
                        <div v-if="!clientCustomizations.fileConnection" class="form-group columns">
                           <div class="column col-5 col-sm-12">
                              <label class="form-label cut-text">{{ t('connection.password') }}</label>
                           </div>
                           <div class="column col-7 col-sm-12">
                              <input
                                 v-model="connection.password"
                                 class="form-input"
                                 type="password"
                                 :disabled="connection.ask"
                              >
                           </div>
                        </div>
                        <div v-if="clientCustomizations.connectionSchema" class="form-group columns">
                           <div class="column col-5 col-sm-12">
                              <label class="form-label cut-text">{{ t('database.schema') }}</label>
                           </div>
                           <div class="column col-7 col-sm-12">
                              <input
                                 v-model="connection.schema"
                                 class="form-input"
                                 type="text"
                                 :placeholder="t('general.all')"
                              >
                           </div>
                        </div>
                        <div v-if="clientCustomizations.readOnlyMode" class="form-group columns mb-0">
                           <div class="column col-5 col-sm-12" />
                           <div class="column col-7 col-sm-12">
                              <label class="form-checkbox form-inline my-0">
                                 <input v-model="connection.readonly" type="checkbox"><i class="form-icon" /> {{ t('connection.readOnlyMode') }}
                              </label>
                           </div>
                        </div>
                        <div v-if="!clientCustomizations.fileConnection" class="form-group columns mb-0">
                           <div class="column col-5 col-sm-12" />
                           <div class="column col-7 col-sm-12">
                              <label class="form-checkbox form-inline my-0">
                                 <input v-model="connection.ask" type="checkbox"><i class="form-icon" /> {{ t('connection.askCredentials') }}
                              </label>
                           </div>
                        </div>
                        <div v-if="clientCustomizations.singleConnectionMode" class="form-group columns mb-0">
                           <div class="column col-5 col-sm-12" />
                           <div class="column col-7 col-sm-12">
                              <label class="form-checkbox form-inline my-0">
                                 <input v-model="connection.singleConnectionMode" type="checkbox"><i class="form-icon" /> {{ t('connection.singleConnection') }}
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
                              <input type="checkbox" :checked="connection.ssl">
                              <i class="form-icon" />
                           </label>
                        </div>
                     </div>
                     <fieldset class="m-0" :disabled="isBusy || !connection.ssl">
                        <div class="form-group columns">
                           <div class="column col-5 col-sm-12">
                              <label class="form-label cut-text">{{ t('connection.privateKey') }}</label>
                           </div>
                           <div class="column col-7 col-sm-12">
                              <BaseUploadInput
                                 :model-value="connection.key"
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
                                 :model-value="connection.cert"
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
                                 :model-value="connection.ca"
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
                                 v-model="connection.ciphers"
                                 class="form-input"
                                 type="text"
                              >
                           </div>
                        </div>
                        <div class="form-group columns">
                           <div class="column col-5 col-sm-12" />
                           <div class="column col-7 col-sm-12">
                              <label class="form-checkbox form-inline">
                                 <input v-model="connection.untrustedConnection" type="checkbox"><i class="form-icon" /> {{ t('connection.untrustedConnection') }}
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
                              <input type="checkbox" :checked="connection.ssh">
                              <i class="form-icon" />
                           </label>
                        </div>
                     </div>
                     <fieldset class="m-0" :disabled="isBusy || !connection.ssh">
                        <div class="form-group columns">
                           <div class="column col-5 col-sm-12">
                              <label class="form-label cut-text">{{ t('connection.hostName') }}/IP</label>
                           </div>
                           <div class="column col-7 col-sm-12">
                              <input
                                 v-model="connection.sshHost"
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
                                 v-model="connection.sshUser"
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
                                 v-model="connection.sshPass"
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
                                 v-model="connection.sshPort"
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
                                 :model-value="connection.sshKey"
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
                                 v-model="connection.sshPassphrase"
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
                                    v-model="connection.sshKeepAliveInterval"
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
               <div
                  @mouseenter="setCancelTestButtonVisibility(true)"
                  @mouseleave="setCancelTestButtonVisibility(false)"
               >
                  <button
                     v-if="showTestCancel && isTesting"
                     class="btn btn-gray mr-2 cancellable"
                     :title="t('general.cancel')"
                     @click="abortConnection()"
                  >
                     <BaseIcon icon-name="mdiWindowClose" :size="24" />
                     <span class="d-invisible pr-1">{{ t('connection.testConnection') }}</span>
                  </button>
                  <button
                     v-else
                     id="connection-test"
                     class="btn btn-gray mr-2 d-flex"
                     :class="{'loading': isTesting}"
                     :disabled="isBusy"
                     @click="startTest"
                  >
                     <BaseIcon
                        icon-name="mdiLightningBolt"
                        :size="24"
                        class="mr-1"
                     />
                     {{ t('connection.testConnection') }}
                  </button>
               </div>
               <button
                  id="connection-save"
                  class="btn btn-primary mr-2 d-flex"
                  :disabled="isBusy"
                  @click="saveConnection"
               >
                  <BaseIcon
                     icon-name="mdiContentSave"
                     :size="24"
                     class="mr-1"
                  />
                  {{ t('general.save') }}
               </button>
            </div>
         </div>
         <ModalAskCredentials
            v-if="isAsking"
            @close-asking="closeAsking"
            @credentials="continueTest"
         />
      </div>
   </div>
   <DebugConsole v-if="isConsoleOpen" />
</template>

<script setup lang="ts">
import customizations from 'common/customizations';
import { ConnectionParams } from 'common/interfaces/antares';
import { uidGen } from 'common/libs/uidGen';
import { storeToRefs } from 'pinia';
import { computed, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import BaseUploadInput from '@/components/BaseUploadInput.vue';
import DebugConsole from '@/components/DebugConsole.vue';
import ModalAskCredentials from '@/components/ModalAskCredentials.vue';
import Connection from '@/ipc-api/Connection';
import { useConnectionsStore } from '@/stores/connections';
import { useConsoleStore } from '@/stores/console';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

const { addConnection } = useConnectionsStore();
const { addNotification } = useNotificationsStore();
const workspacesStore = useWorkspacesStore();
const { isConsoleOpen } = storeToRefs(useConsoleStore());

const { connectWorkspace, selectWorkspace } = workspacesStore;

const clients = [
   { name: 'MySQL', slug: 'mysql' },
   { name: 'MariaDB', slug: 'maria' },
   { name: 'PostgreSQL', slug: 'pg' },
   { name: 'SQLite', slug: 'sqlite' },
   { name: 'Firebird SQL', slug: 'firebird' }
];

const connection = ref({
   name: '',
   client: 'mysql',
   host: '127.0.0.1',
   database: null,
   databasePath: '',
   port: null,
   user: null,
   password: '',
   ask: false,
   readonly: false,
   uid: uidGen('C'),
   ssl: false,
   cert: '',
   key: '',
   ca: '',
   ciphers: '',
   untrustedConnection: false,
   ssh: false,
   sshHost: '',
   sshUser: '',
   sshPass: '',
   sshPassphrase: null,
   sshKey: '',
   sshPort: 22,
   sshKeepAliveInterval: 1800,
   connString: ''
}) as Ref<ConnectionParams & { connString: string }>;

const firstInput: Ref<HTMLInputElement> = ref(null);
const isConnecting = ref(false);
const isTesting = ref(false);
const isAsking = ref(false);
const showTestCancel = ref(false);
const abortController: Ref<AbortController> = ref(new AbortController());
const selectedTab = ref('general');

const clientCustomizations = computed(() => {
   return customizations[connection.value.client];
});

const isBusy = computed(() => {
   return isConnecting.value || isTesting.value;
});

watch(() => connection.value.client, () => {
   connection.value.user = clientCustomizations.value.defaultUser;
   connection.value.port = clientCustomizations.value.defaultPort;
   connection.value.database = clientCustomizations.value.defaultDatabase;
});

const setDefaults = () => {
   connection.value.user = clientCustomizations.value.defaultUser;
   connection.value.port = clientCustomizations.value.defaultPort;
   connection.value.database = clientCustomizations.value.defaultDatabase;
};

const setCancelTestButtonVisibility = (val: boolean) => {
   showTestCancel.value = val;
};

const startTest = async () => {
   isTesting.value = true;

   if (connection.value.ask)
      isAsking.value = true;
   else {
      try {
         const res = await Connection.makeTest(connection.value);
         if (res.status === 'error')
            addNotification({ status: 'error', message: res.response.message || res.response.toString() });
         else if (res.status === 'success')
            addNotification({ status: 'success', message: t('connection.connectionSuccessfullyMade') });
      }
      catch (err) {
         addNotification({ status: 'error', message: err.stack });
      }

      isTesting.value = false;
   }
};

const abortConnection = (): void => {
   abortController.value.abort();
   Connection.abortConnection(connection.value.uid);
   isTesting.value = false;
   isConnecting.value = false;
   abortController.value = new AbortController();
};

const continueTest = async (credentials: { user: string; password: string }) => { // if "Ask for credentials" is true
   isAsking.value = false;
   const params = Object.assign({}, connection.value, credentials);

   try {
      if (isConnecting.value) {
         await connectWorkspace(params, { signal: abortController.value.signal }).catch(() => undefined);
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

const saveConnection = async () => {
   await addConnection(connection.value);
   selectWorkspace(connection.value.uid);
};

const closeAsking = () => {
   isTesting.value = false;
   isAsking.value = false;
};

const selectTab = (tab: string) => {
   selectedTab.value = tab;
};

const toggleSsl = () => {
   connection.value.ssl = !connection.value.ssl;
};

const toggleSsh = () => {
   connection.value.ssh = !connection.value.ssh;
};

const pathSelection = (event: Event & {target: {files: {path: string}[]}}, name: keyof ConnectionParams) => {
   const { files } = event.target;
   if (!files.length) return;

   (connection.value as unknown as Record<string, string>)[name] = files[0].path as string;
};

const pathClear = (name: keyof ConnectionParams) => {
   (connection.value as unknown as Record<string, string>)[name] = '';
};

setDefaults();

setTimeout(() => {
   if (firstInput.value) firstInput.value.focus();
}, 200);
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
