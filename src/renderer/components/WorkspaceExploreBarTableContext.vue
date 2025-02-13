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
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiWrenchCog"
               :size="18"
            /> {{ t('application.settings') }}</span>
      </div>
      <div class="context-element" @click="copyName(selectedTable.name)">
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiContentCopy"
               :size="18"
            /> {{ t('general.copyName') }}</span>
      </div>
      <div
         v-if="selectedTable && selectedTable.type === 'table' && customizations.schemaExport"
         class="context-element"
         @click="showTableExportModal"
      >
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiTableArrowRight"
               :size="18"
            /> {{ t('database.exportTable') }}</span>
      </div>
      <div
         v-if="selectedTable && selectedTable.type === 'view' && customizations.viewSettings"
         class="context-element"
         @click="openViewSettingTab"
      >
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiWrenchCog"
               :size="18"
            /> {{ t('application.settings') }}</span>
      </div>
      <div
         v-if="selectedTable && selectedTable.type === 'materializedView' && customizations.materializedViewSettings"
         class="context-element"
         @click="openMaterializedViewSettingTab"
      >
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiWrenchCog"
               :size="18"
            /> {{ t('application.settings') }}</span>
      </div>
      <div
         v-if="selectedTable && selectedTable.type === 'table' && customizations.tableDuplicate && !connection.readonly"
         class="context-element"
         @click="duplicateTable"
      >
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiTableMultiple"
               :size="18"
            /> {{ t('database.duplicateTable') }}</span>
      </div>
      <div
         v-if="selectedTable && selectedTable.type === 'table' && !connection.readonly"
         class="context-element"
         @click="showEmptyModal"
      >
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiTableOff"
               :size="18"
            /> {{ t('database.emptyTable') }}</span>
      </div>
      <div
         v-if="!connection.readonly"
         class="context-element"
         @click="showDeleteModal"
      >
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiTableRemove"
               :size="18"
            /> {{ t('database.deleteTable') }}</span>
      </div>

      <ConfirmModal
         v-if="isEmptyModal"
         @confirm="emptyTable"
         @hide="hideEmptyModal"
      >
         <template #header>
            <div class="d-flex">
               <BaseIcon
                  class="text-light mr-1"
                  icon-name="mdiTableOff"
                  :size="24"
               /> <span class="cut-text">{{ t('database.emptyTable') }}</span>
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ t('database.emptyConfirm') }} "<b>{{ selectedTable.name }}</b>"?
            </div>
            <div v-if="customizations.tableTruncateDisableFKCheck">
               <label class="form-checkbox form-inline">
                  <input v-model="forceTruncate" type="checkbox"><i class="form-icon" /> {{ t('database.disableFKChecks') }}
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
               <BaseIcon
                  class="text-light mr-1"
                  icon-name="mdiTableRemove"
                  :size="24"
               />
               <span class="cut-text">{{ selectedTable.type === 'table' ? t('database.deleteTable') : t('database.deleteView') }}</span>
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ t('general.deleteConfirm') }} "<b>{{ selectedTable.name }}</b>"?
            </div>
         </template>
      </ConfirmModal>
   </BaseContextMenu>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseContextMenu from '@/components/BaseContextMenu.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import Tables from '@/ipc-api/Tables';
import { copyText } from '@/libs/copyText';
import { useConnectionsStore } from '@/stores/connections';
import { useNotificationsStore } from '@/stores/notifications';
import { useSchemaExportStore } from '@/stores/schemaExport';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

const props = defineProps({
   contextEvent: MouseEvent,
   selectedTable: Object,
   selectedSchema: String
});

const emit = defineEmits(['close-context', 'duplicate-table', 'reload', 'delete-table']);

const { addNotification } = useNotificationsStore();
const workspacesStore = useWorkspacesStore();
const { showExportModal } = useSchemaExportStore();
const { getConnectionByUid } = useConnectionsStore();

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
const connection = computed(() => getConnectionByUid(selectedWorkspace.value));

const showTableExportModal = () => {
   showExportModal(props.selectedSchema, props.selectedTable.name);
   closeContext();
};

const copyName = (name: string) => {
   copyText(name);
   closeContext();
};

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

const openMaterializedViewSettingTab = () => {
   newTab({
      uid: selectedWorkspace.value,
      elementType: 'table',
      elementName: props.selectedTable.name,
      schema: props.selectedSchema,
      type: 'materialized-view-props'
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
