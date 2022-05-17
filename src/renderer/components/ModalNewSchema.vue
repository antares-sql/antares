<template>
   <Teleport to="#window-content">
      <div class="modal active">
         <a class="modal-overlay" @click.stop="closeModal" />
         <div class="modal-container p-0">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <i class="mdi mdi-24px mdi-database-plus mr-1" />
                     <span class="cut-text">{{ $t('message.createNewSchema') }}</span>
                  </div>
               </div>
               <a class="btn btn-clear c-hand" @click.stop="closeModal" />
            </div>
            <div class="modal-body pb-0">
               <div class="content">
                  <form class="form-horizontal" @submit.prevent="createSchema">
                     <div class="form-group">
                        <div class="col-3">
                           <label class="form-label">{{ $t('word.name') }}</label>
                        </div>
                        <div class="col-9">
                           <input
                              ref="firstInput"
                              v-model="database.name"
                              class="form-input"
                              type="text"
                              required
                              :placeholder="$t('message.schemaName')"
                           >
                        </div>
                     </div>
                     <div v-if="customizations.collations" class="form-group">
                        <div class="col-3">
                           <label class="form-label">{{ $t('word.collation') }}</label>
                        </div>
                        <div class="col-9">
                           <select v-model="database.collation" class="form-select">
                              <option
                                 v-for="collation in collations"
                                 :key="collation.id"
                                 :value="collation.collation"
                              >
                                 {{ collation.collation }}
                              </option>
                           </select>
                           <small>{{ $t('message.serverDefault') }}: {{ defaultCollation }}</small>
                        </div>
                     </div>
                  </form>
               </div>
            </div>
            <div class="modal-footer">
               <button
                  class="btn btn-primary mr-2"
                  :class="{'loading': isLoading}"
                  @click.stop="createSchema"
               >
                  {{ $t('word.add') }}
               </button>
               <button class="btn btn-link" @click.stop="closeModal">
                  {{ $t('word.close') }}
               </button>
            </div>
         </div>
      </div>
   </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, Ref, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import Schema from '@/ipc-api/Schema';

const { addNotification } = useNotificationsStore();
const workspacesStore = useWorkspacesStore();

const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

const { getWorkspace, getDatabaseVariable } = workspacesStore;

const emit = defineEmits(['reload', 'close']);

const firstInput: Ref<HTMLInputElement> = ref(null);
const isLoading = ref(false);
const database = ref({
   name: '',
   collation: ''
});

const collations = computed(() => getWorkspace(selectedWorkspace.value).collations);
const customizations = computed(() => getWorkspace(selectedWorkspace.value).customizations);
const defaultCollation = computed(() => getDatabaseVariable(selectedWorkspace.value, 'collation_server') ? getDatabaseVariable(selectedWorkspace.value, 'collation_server').value : '');

database.value = { ...database.value, collation: defaultCollation.value };

const createSchema = async () => {
   isLoading.value = true;
   try {
      const { status, response } = await Schema.createSchema({
         uid: selectedWorkspace.value,
         ...database.value
      });

      if (status === 'success') {
         closeModal();
         emit('reload');
      }
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }
   isLoading.value = false;
};

const closeModal = () => {
   emit('close');
};

const onKey = (e: KeyboardEvent) => {
   e.stopPropagation();
   if (e.key === 'Escape')
      closeModal();
};

window.addEventListener('keydown', onKey);
setTimeout(() => {
   firstInput.value.focus();
}, 20);

onBeforeUnmount(() => {
   window.removeEventListener('keydown', onKey);
});
</script>

<style scoped>
  .modal-container {
    max-width: 360px;
  }
</style>
