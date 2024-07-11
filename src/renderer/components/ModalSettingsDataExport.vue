<template>
   <Teleport to="#window-content">
      <div class="modal active">
         <a class="modal-overlay" @click.stop="closeModal" />
         <div ref="trapRef" class="modal-container p-0">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <BaseIcon
                        icon-name="mdiTrayArrowUp"
                        class="mr-1"
                        :size="24"
                     /> {{ t('application.exportData') }}
                  </div>
               </div>
               <a class="btn btn-clear c-hand" @click.stop="closeModal" />
            </div>
            <div class="modal-body pb-0">
               <div class="columns export-options">
                  <div class="column col-8 left">
                     <div class="workspace-query-results" :style="'min-height: 300px;'">
                        <div ref="table" class="table table-hover">
                           <div class="thead">
                              <div class="tr text-center">
                                 <div class="th no-border" :style="'width:50%'" />
                                 <div class="th no-border" />
                                 <div class="th no-border">
                                    <label
                                       class="form-checkbox m-0 px-2 form-inline"
                                       @click.prevent="toggleAllConnections()"
                                    >
                                       <input
                                          type="checkbox"
                                          :indeterminate="includeConnectionStatus === 2"
                                          :checked="!!includeConnectionStatus"
                                       >
                                       <i class="form-icon" />
                                    </label>
                                 </div>
                              </div>
                              <div class="tr">
                                 <div class="th">
                                    <div class="table-column-title">
                                       <span>{{ t('connection.connectionName') }}</span>
                                    </div>
                                 </div>
                                 <div class="th">
                                    <div class="table-column-title">
                                       <span>{{ t('connection.client') }}</span>
                                    </div>
                                 </div>
                                 <div class="th text-center">
                                    <div class="table-column-title">
                                       <span>{{ t('general.include') }}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div class="tbody">
                              <div
                                 v-for="(item, i) in connections"
                                 :key="i"
                                 class="tr"
                              >
                                 <div class="td">
                                    {{ getConnectionName(item.uid) }}
                                 </div>
                                 <div class="td">
                                    {{ item.client }}
                                 </div>
                                 <div class="td text-center">
                                    <label class="form-checkbox m-0 px-2 form-inline">
                                       <input v-model="connectionToggles[item.uid]" type="checkbox">
                                       <i class="form-icon" />
                                    </label>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                  <div class="column col-4">
                     <h5 class="h5">
                        {{ t('general.options') }}
                     </h5>
                     <label class="form-checkbox">
                        <input v-model="options.includes.passwords" type="checkbox">
                        <i class="form-icon" />
                        {{ t(`application.includeConnectionPasswords`) }}
                     </label>
                     <label class="form-checkbox">
                        <input v-model="options.includes.folders" type="checkbox">
                        <i class="form-icon" />
                        {{ t(`application.includeFolders`) }}
                     </label>
                     <div class="h6 mt-4 mb-2">
                        {{ t('application.encryptionPassword') }}
                     </div>
                     <fieldset class="form-group" :class="{'has-error': isPasswordError}">
                        <div class="input-group">
                           <input
                              ref="passkey"
                              v-model="options.passkey"
                              :type="isPasswordVisible ? 'text' : 'password'"
                              class="form-input"
                              :placeholder="t('application.required')"
                           >
                           <button
                              type="button"
                              class="btn btn-link input-group-addon"
                              @click="isPasswordVisible = !isPasswordVisible"
                           >
                              <BaseIcon
                                 v-if="isPasswordVisible"
                                 icon-name="mdiEye"
                                 class="mt-1 mx-1"
                                 :size="16"
                              />
                              <BaseIcon
                                 v-else
                                 icon-name="mdiEyeOff"
                                 class="mt-1 mx-1"
                                 :size="16"
                              />
                           </button>
                        </div>
                        <span v-if="isPasswordError" class="form-input-hint">
                           {{ t('application.encryptionPasswordError') }}
                        </span>
                     </fieldset>
                  </div>
               </div>
            </div>
            <div class="modal-footer">
               <button class="btn btn-link mr-2" @click.stop="closeModal">
                  {{ t('general.close') }}
               </button>
               <button
                  class="btn btn-primary mr-2"
                  autofocus
                  @click.prevent="exportData()"
               >
                  {{ t('database.export') }}
               </button>
            </div>
         </div>
      </div>
   </Teleport>
</template>

<script setup lang="ts">
import { ConnectionParams } from 'common/interfaces/antares';
import { encrypt } from 'common/libs/encrypter';
import { uidGen } from 'common/libs/uidGen';
import * as moment from 'moment';
import { storeToRefs } from 'pinia';
import { computed, onBeforeUnmount, Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import { useFocusTrap } from '@/composables/useFocusTrap';
import { unproxify } from '@/libs/unproxify';
import { SidebarElement, useConnectionsStore } from '@/stores/connections';

const { t } = useI18n();
const emit = defineEmits(['close']);

const { trapRef } = useFocusTrap();

const { getConnectionName } = useConnectionsStore();
const { connectionsOrder, connections, customIcons } = storeToRefs(useConnectionsStore());
const localConnections = unproxify<ConnectionParams[]>(connections.value);
const localConnectionsOrder = unproxify<SidebarElement[]>(connectionsOrder.value);

const isPasswordVisible = ref(false);
const isPasswordError = ref(false);
const connectionToggles: Ref<{[k:string]: boolean}> = ref({});
const options = ref({
   passkey: '',
   includes: {
      passwords: true,
      folders: true
   }
});
const filename = computed(() => {
   const date = moment().format('YYYY-MM-DD');
   return `backup_${date}`;
});
const includeConnectionStatus = computed(() => {
   if (Object.values(connectionToggles.value).every(item => item)) return 1;
   else if (Object.values(connectionToggles.value).some(item => item)) return 2;
   else return 0;
});

const exportData = () => {
   if (options.value.passkey.length < 8)
      isPasswordError.value = true;
   else {
      isPasswordError.value = false;
      const connectionsToInclude: string[] = [];
      const connectionsUidMap = new Map<string, string>();
      for (const cUid in connectionToggles.value)
         if (connectionToggles.value[cUid]) connectionsToInclude.push(cUid);

      let filteredConnections = unproxify<typeof localConnections>(localConnections.filter(conn => connectionsToInclude.includes(conn.uid)));
      filteredConnections = filteredConnections.map(c => {
         const newUid = uidGen('C');
         connectionsUidMap.set(c.uid, newUid);
         c.uid = newUid;
         return c;
      });

      if (!options.value.includes.passwords) { // Remove passwords and set ask:true
         filteredConnections.map(c => {
            if (c.password) {
               c.password = '';
               c.ask = true;
            }
            return c;
         });
      }

      let filteredOrders = [];
      for (const [oldVal, newVal] of connectionsUidMap) {
         const connOrder = unproxify(localConnectionsOrder.find(c => c.uid === oldVal));
         connOrder.uid = newVal;
         filteredOrders.push(connOrder);
      }

      if (options.value.includes.folders) { // Includes folders
         const oldConnUids = Array.from(connectionsUidMap.keys());
         const newConnUids = Array.from(connectionsUidMap.values());
         const foldersToInclude = unproxify(localConnectionsOrder).filter(f => (
            f.isFolder && oldConnUids.some(uid => f.connections.includes(uid))
         )).map(f => {
            f.uid = uidGen('F');
            f.connections = f.connections
               .map(fc => connectionsUidMap.get(fc))
               .filter(fc => newConnUids.includes(fc));
            return f;
         });

         filteredOrders = [...filteredOrders, ...foldersToInclude];
      }

      const exportObj = encrypt(JSON.stringify({
         connections: filteredConnections,
         connectionsOrder: filteredOrders,
         customIcons
      }), options.value.passkey);

      // console.log(exportObj, JSON.parse(decrypt(exportObj, options.value.passkey)));

      const blobContent = Buffer.from(JSON.stringify(exportObj), 'utf-8').toString('hex');
      const file = new Blob([blobContent], { type: 'application/octet-stream' });
      const downloadLink = document.createElement('a');
      downloadLink.download = `${filename.value}.antares`;
      downloadLink.href = window.URL.createObjectURL(file);
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      closeModal();
   }
};

const closeModal = () => {
   emit('close');
};

const onKey = (e: KeyboardEvent) => {
   e.stopPropagation();
   if (e.key === 'Escape')
      closeModal();
};

const toggleAllConnections = () => {
   if (includeConnectionStatus.value !== 1) {
      connectionToggles.value = localConnections.reduce((acc, curr) => {
         acc[curr.uid] = true;
         return acc;
      }, {} as {[k:string]: boolean});
   }
   else {
      connectionToggles.value = localConnections.reduce((acc, curr) => {
         acc[curr.uid] = false;
         return acc;
      }, {} as {[k:string]: boolean});
   }
};

connectionToggles.value = localConnections.reduce((acc, curr) => {
   acc[curr.uid] = true;
   return acc;
}, {} as {[k:string]: boolean});

window.addEventListener('keydown', onKey);

onBeforeUnmount(() => {
   window.removeEventListener('keydown', onKey);
});

</script>

<style lang="scss" scoped>
.export-options {
  flex: 1;
  overflow: hidden;

  .left {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
}

.workspace-query-results {
  flex: 1 0 1px;

  .table {
    width: 100% !important;
  }

  .form-checkbox {
    min-height: 0.8rem;
    padding: 0;

    .form-icon {
      top: 0.1rem;
    }
  }
}

.modal {
  .modal-container {
    max-width: 800px;
  }

  .modal-body {
    max-height: 60vh;
    display: flex;
    flex-direction: column;
  }
}

</style>
