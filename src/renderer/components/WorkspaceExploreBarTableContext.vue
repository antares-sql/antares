<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="closeContext"
   >
      <div
         v-if="selectedTable && selectedTable.type === 'table' && customizations.tableSettings"
         class="context-element"
         @click="openTableSettingTab"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-tune-vertical-variant text-light pr-1" /> {{ t('word.settings') }}</span>
      </div>
      <div
         v-if="selectedTable && selectedTable.type === 'view' && customizations.viewSettings"
         class="context-element"
         @click="openViewSettingTab"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-tune-vertical-variant text-light pr-1" /> {{ t('word.settings') }}</span>
      </div>
      <div
         v-if="selectedTable && selectedTable.type === 'table' && customizations.tableDuplicate"
         class="context-element"
         @click="duplicateTable"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-table-multiple text-light pr-1" /> {{ t('message.duplicateTable') }}</span>
      </div>
      <div
         v-if="selectedTable && selectedTable.type === 'table'"
         class="context-element"
         @click="showEmptyModal"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-table-off text-light pr-1" /> {{ t('message.emptyTable') }}</span>
      </div>
      <div class="context-element" @click="showDeleteModal">
         <span class="d-flex"><i class="mdi mdi-18px mdi-table-remove text-light pr-1" /> {{ t('word.delete') }}</span>
      </div>

      <ConfirmModal
         v-if="isEmptyModal"
         @confirm="emptyTable"
         @hide="hideEmptyModal"
      >
         <template #header>
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-table-off mr-1" /> <span class="cut-text">{{ t('message.emptyTable') }}</span>
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ t('message.emptyConfirm') }} "<b>{{ selectedTable.name }}</b>"?
            </div>
            <div v-if="customizations.tableTruncateDisableFKCheck">
               <label class="form-checkbox form-inline">
                  <input v-model="forceTruncate" type="checkbox"><i class="form-icon" /> {{ t('message.disableFKChecks') }}
               </label>
            </div>
         </template>
      </ConfirmModal>
      <ConfirmModal
         v-if="isDeleteModal"
         @confirm="deleteTable"
         @hide="hideDeleteModal"
      >
         <template #header>
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-table-remove mr-1" />
               <span class="cut-text">{{ selectedTable.type === 'table' ? t('message.deleteTable') : t('message.deleteView') }}</span>
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ t('message.deleteConfirm') }} "<b>{{ selectedTable.name }}</b>"?
            </div>
         </template>
      </ConfirmModal>
   </BaseContextMenu>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import BaseContextMenu from '@/components/BaseContextMenu.vue';
import ConfirmModal from '@/components/BaseConfirmModal.vue';
import Tables from '@/ipc-api/Tables';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
   contextEvent: MouseEvent,
   selectedTable: Object,
   selectedSchema: String
});

const emit = defineEmits(['close-context', 'duplicate-table', 'reload', 'delete-table']);

const { addNotification } = useNotificationsStore();
const workspacesStore = useWorkspacesStore();

const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

const {
   getWorkspace,
   newTab,
   addLoadingElement,
   removeLoadingElement,
   changeBreadcrumbs
} = workspacesStore;

const isDeleteModal = ref(false);
const isEmptyModal = ref(false);
const forceTruncate = ref(false);

const workspace = computed(() => getWorkspace(selectedWorkspace.value));
const customizations = computed(() => workspace.value && workspace.value.customizations ? workspace.value.customizations : null);

const showDeleteModal = () => {
   isDeleteModal.value = true;
};

const hideDeleteModal = () => {
   isDeleteModal.value = false;
};

const showEmptyModal = () => {
   isEmptyModal.value = true;
};

const hideEmptyModal = () => {
   isEmptyModal.value = false;
};

const closeContext = () => {
   emit('close-context');
};

const openTableSettingTab = () => {
   newTab({
      uid: selectedWorkspace.value,
      elementName: props.selectedTable.name,
      schema: props.selectedSchema,
      type: 'table-props',
      elementType: 'table'
   });

   changeBreadcrumbs({
      schema: props.selectedSchema,
      table: props.selectedTable.name
   });

   closeContext();
};

const openViewSettingTab = () => {
   newTab({
      uid: selectedWorkspace.value,
      elementType: 'table',
      elementName: props.selectedTable.name,
      schema: props.selectedSchema,
      type: 'view-props'
   });

   changeBreadcrumbs({
      schema: props.selectedSchema,
      view: props.selectedTable.name
   });

   closeContext();
};

const duplicateTable = () => {
   emit('duplicate-table', { schema: props.selectedSchema, table: props.selectedTable });
};

const emptyTable = async () => {
   closeContext();

   addLoadingElement({
      name: props.selectedTable.name,
      schema: props.selectedSchema,
      type: 'table'
   });

   try {
      const { status, response } = await Tables.truncateTable({
         uid: selectedWorkspace.value,
         table: props.selectedTable.name,
         schema: props.selectedSchema,
         force: forceTruncate.value
      });

      if (status === 'success')
         emit('reload');
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   removeLoadingElement({
      name: props.selectedTable.name,
      schema: props.selectedSchema,
      type: 'table'
   });
};

const deleteTable = () => {
   emit('delete-table', { schema: props.selectedSchema, table: props.selectedTable });
};
</script>
