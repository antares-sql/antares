<template>
   <Teleport to="#window-content">
      <div class="modal active">
         <a class="modal-overlay" @click.stop="closeModal" />
         <div ref="trapRef" class="modal-container p-0">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <i class="mdi mdi-24px mdi-database-edit mr-1" />
                     <span class="cut-text">{{ t('database.editSchema') }}</span>
                  </div>
               </div>
               <a class="btn btn-clear c-hand" @click.stop="closeModal" />
            </div>
            <div class="modal-body pb-0">
               <div class="content">
                  <form class="form-horizontal">
                     <div class="form-group">
                        <div class="col-3">
                           <label class="form-label">{{ t('general.name') }}</label>
                        </div>
                        <div class="col-9">
                           <input
                              ref="firstInput"
                              v-model="database.name"
                              class="form-input"
                              type="text"
                              required
                              :placeholder="t('database.schemaName')"
                              readonly
                           >
                        </div>
                     </div>
                     <div class="form-group">
                        <div class="col-3">
                           <label class="form-label">{{ t('database.collation') }}</label>
                        </div>
                        <div class="col-9">
                           <BaseSelect
                              v-model="database.collation"
                              class="form-select"
                              :options="collations"
                              :max-visible-options="1000"
                              option-label="collation"
                              option-track-by="collation"
                           />
                           <small>{{ t('database.serverDefault') }}: {{ defaultCollation }}</small>
                        </div>
                     </div>
                  </form>
               </div>
            </div>
            <div class="modal-footer">
               <button class="btn btn-primary mr-2" @click.stop="updateSchema">
                  {{ t('application.update') }}
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
import { storeToRefs } from 'pinia';
import { computed, onBeforeUnmount, Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseSelect from '@/components/BaseSelect.vue';
import { useFocusTrap } from '@/composables/useFocusTrap';
import Schema from '@/ipc-api/Schema';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

const props = defineProps({
   selectedSchema: String
});

const emit = defineEmits(['close']);

const { addNotification } = useNotificationsStore();
const workspacesStore = useWorkspacesStore();

const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

const { getWorkspace, getDatabaseVariable } = workspacesStore;

const { trapRef } = useFocusTrap();

const firstInput: Ref<HTMLInputElement> = ref(null);
const database = ref({
   name: '',
   prevName: '',
   collation: '',
   prevCollation: null
});

const collations = computed(() => getWorkspace(selectedWorkspace.value).collations);
const defaultCollation = computed(() => (getDatabaseVariable(selectedWorkspace.value, 'collation_server').value || ''));

const updateSchema = async () => {
   if (database.value.collation !== database.value.prevCollation) {
      try {
         const { status, response } = await Schema.updateSchema({
            uid: selectedWorkspace.value,
            ...database.value
         });

         if (status === 'success')
            closeModal();
         else
            addNotification({ status: 'error', message: response });
      }
      catch (err) {
         addNotification({ status: 'error', message: err.stack });
      }
   }
   else closeModal();
};

const closeModal = () => emit('close');

const onKey =(e: KeyboardEvent) => {
   e.stopPropagation();
   if (e.key === 'Escape')
      closeModal();
};

(async () => {
   let actualCollation;
   try {
      const { status, response } = await Schema.getDatabaseCollation({ uid: selectedWorkspace.value, database: props.selectedSchema });

      if (status === 'success')
         actualCollation = response;

      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   database.value = {
      name: props.selectedSchema,
      prevName: props.selectedSchema,
      collation: actualCollation || defaultCollation.value,
      prevCollation: actualCollation || defaultCollation.value
   };

   window.addEventListener('keydown', onKey);

   setTimeout(() => {
      firstInput.value.focus();
   }, 20);
})();

onBeforeUnmount(() => {
   window.removeEventListener('keydown', onKey);
});

</script>

<style scoped lang="scss">
  .modal-container {
    max-width: 360px;
  }
</style>
