<template>
   <Teleport to="#window-content">
      <div class="modal active modal-sm">
         <a class="modal-overlay" />
         <div ref="trapRef" class="modal-container p-0">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <BaseIcon
                        icon-name="mdiKeyVariant"
                        class="mr-1"
                        :size="24"
                     /> {{ t('connection.credentials') }}
                  </div>
               </div>
               <a class="btn btn-clear c-hand" @click.stop="closeModal" />
            </div>
            <div class="modal-body pb-0">
               <div class="content">
                  <form class="form-horizontal">
                     <div class="form-group">
                        <div class="col-3">
                           <label class="form-label">{{ t('connection.user') }}</label>
                        </div>
                        <div class="col-9">
                           <input
                              ref="firstInput"
                              v-model="credentials.user"
                              class="form-input"
                              type="text"
                           >
                        </div>
                     </div>
                     <div class="form-group">
                        <div class="col-3">
                           <label class="form-label">{{ t('connection.password') }}</label>
                        </div>
                        <div class="col-9">
                           <input
                              v-model="credentials.password"
                              class="form-input"
                              type="password"
                           >
                        </div>
                     </div>
                  </form>
               </div>
            </div>
            <div class="modal-footer">
               <button class="btn btn-primary mr-2" @click.stop="sendCredentials">
                  {{ t('general.send') }}
               </button>
               <button class="btn btn-link" @click.stop="closeModal">
                  {{ t('general.close') }}
               </button>
            </div>
         </div>
      </div>
   </Teleport>
</template>

<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import { useFocusTrap } from '@/composables/useFocusTrap';

const { t } = useI18n();

const { trapRef } = useFocusTrap();

const credentials = ref({
   user: '',
   password: ''
});
const firstInput: Ref<HTMLInputElement> = ref(null);
const emit = defineEmits(['close-asking', 'credentials']);

const closeModal = () => {
   emit('close-asking');
};

const sendCredentials = () => {
   emit('credentials', credentials.value);
};

setTimeout(() => {
   firstInput.value.focus();
}, 20);
</script>
