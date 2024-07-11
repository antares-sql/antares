<template>
   <Teleport to="#window-content">
      <div class="modal modal-sm active">
         <a class="modal-overlay" @click.stop="closeModal" />
         <div ref="trapRef" class="modal-container p-0">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <BaseIcon
                        icon-name="mdiTrayArrowDown"
                        class="mr-1"
                        :size="24"
                     /> {{ t('application.importData') }}
                  </div>
               </div>
               <a class="btn btn-clear c-hand" @click.stop="closeModal" />
            </div>
            <div class="modal-body pb-0">
               <div class="mb-2">
                  <div class="h6 mb-2">
                     {{ t('application.choseFile') }}
                  </div>
                  <BaseUploadInput
                     :model-value="filePath"
                     :message="t('general.browse')"
                     accept=".antares"
                     @clear="clearPath"
                     @change="filesChange($event)"
                  />
               </div>
               <div class="mb-2">
                  <div class="h6 mb-2">
                     {{ t('application.password') }}
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
               <div class="mb-2">
                  <label class="form-checkbox">
                     <input v-model="options.ignoreDuplicates" type="checkbox">
                     <i class="form-icon" />
                     {{ t(`application.ignoreDuplicates`) }}
                  </label>
               </div>
            </div>
            <div class="modal-footer">
               <button
                  class="btn btn-link mr-2"
                  @click.stop="closeModal"
               >
                  {{ t('general.close') }}
               </button>
               <button
                  class="btn btn-primary mr-2"
                  :disabled="!filePath"
                  @click.prevent="importData()"
               >
                  {{ t('database.import') }}
               </button>
            </div>
         </div>
      </div>
   </Teleport>
</template>

<script setup lang="ts">
import { ConnectionParams } from 'common/interfaces/antares';
import { decrypt } from 'common/libs/encrypter';
import { storeToRefs } from 'pinia';
import { onBeforeUnmount, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import BaseUploadInput from '@/components/BaseUploadInput.vue';
import { unproxify } from '@/libs/unproxify';
import { CustomIcon, SidebarElement, useConnectionsStore } from '@/stores/connections';
import { useNotificationsStore } from '@/stores/notifications';

const { t } = useI18n();
const emit = defineEmits(['close']);

const { addNotification } = useNotificationsStore();

const connectionsStore = useConnectionsStore();
const { importConnections } = connectionsStore;
const { connections } = storeToRefs(connectionsStore);

const filePath = ref('');
const fileContent = ref(null);
const isPasswordVisible = ref(false);
const isPasswordError = ref(false);
const options = ref({
   passkey: '',
   ignoreDuplicates: true
});

const closeModal = () => {
   emit('close');
};

const filesChange = ({ target } : {target: HTMLInputElement }) => {
   const { files } = target;
   if (!files.length) return;

   const reader = new FileReader();
   reader.readAsText(files[0]);
   reader.onload = () => {
      fileContent.value = reader.result;
      filePath.value = files[0].path;
   };
};

const clearPath = () => {
   filePath.value = '';
   fileContent.value = null;
};

const importData = () => {
   if (options.value.passkey.length < 8)
      isPasswordError.value = true;
   else {
      try {
         const hash = JSON.parse(Buffer.from(fileContent.value, 'hex').toString('utf-8'));

         try {
            const importObj: {
               connections: ConnectionParams[];
               connectionsOrder: SidebarElement[];
               customIcons: CustomIcon[];
            } = JSON.parse(decrypt(hash, options.value.passkey));

            if (options.value.ignoreDuplicates) {
               const actualConnections = unproxify(connections.value).map(c => {
                  delete c.uid;

                  delete c.name;
                  delete c.password;
                  delete c.ask;

                  delete c.key;
                  delete c.cert;
                  delete c.ca;

                  delete c.sshKey;

                  return JSON.stringify(c);
               });

               const incomingConnections = unproxify<ConnectionParams[]>(importObj.connections).map(c => {
                  const uid = c.uid;
                  delete c.uid;

                  delete c.name;
                  delete c.password;
                  delete c.ask;

                  delete c.key;
                  delete c.cert;
                  delete c.ca;

                  delete c.sshKey;

                  return { uid, jsonString: JSON.stringify(c) };
               });

               const newConnectionsUid = incomingConnections
                  .filter(c => !actualConnections.includes(c.jsonString))
                  .reduce((acc, cur) => {
                     acc.push(cur.uid);
                     return acc;
                  }, [] as string[]);

               importObj.connections = importObj.connections.filter(c => newConnectionsUid.includes(c.uid));
               importObj.connectionsOrder = importObj.connectionsOrder
                  .filter(c => newConnectionsUid
                     .includes(c.uid) ||
                     (c.isFolder && c.connections.every(c => newConnectionsUid.includes(c))));
            }

            importConnections(importObj);

            addNotification({
               status: 'success',
               message: t('application.dataImportSuccess')
            });
            closeModal();
         }
         catch (error) {
            addNotification({
               status: 'error',
               message: t('application.wrongImportPassword')
            });
         }
      }
      catch (error) {
         addNotification({
            status: 'error',
            message: t('application.wrongFileFormat')
         });
      }
   }
};

const onKey = (e: KeyboardEvent) => {
   e.stopPropagation();
   if (e.key === 'Escape')
      closeModal();
};

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
  .modal-body {
    max-height: 60vh;
    display: flex;
    flex-direction: column;
  }
}

</style>
