<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="closeContext"
   >
      <div v-if="!connection.readonly" class="context-element">
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiPlus"
               :size="18"
            /> {{ t('general.add') }}</span>
         <BaseIcon
            class="text-light ml-1"
            icon-name="mdiChevronRight"
            :size="18"
         />
         <div class="context-submenu">
            <div
               v-if="workspace.customizations.tableAdd"
               class="context-element"
               @click="openCreateTableTab"
            >
               <span class="d-flex">
                  <BaseIcon
                     class="text-light mt-1 mr-1"
                     icon-name="mdiTable"
                     :size="18"
                  /> {{ t('database.table') }}</span>
            </div>
            <div
               v-if="workspace.customizations.viewAdd"
               class="context-element"
               @click="openCreateViewTab"
            >
               <span class="d-flex">
                  <BaseIcon
                     class="text-light mt-1 mr-1"
                     icon-name="mdiTableEye"
                     :size="18"
                  /> {{ t('database.view') }}</span>
            </div>
            <div
               v-if="workspace.customizations.materializedViewAdd"
               class="context-element"
               @click="openCreateMaterializedViewTab"
            >
               <span class="d-flex">
                  <BaseIcon
                     class="text-light mt-1 mr-1"
                     icon-name="mdiTableEye"
                     :size="18"
                  /> {{ t('database.materializedView') }}</span>
            </div>
            <div
               v-if="workspace.customizations.triggerAdd"
               class="context-element"
               @click="openCreateTriggerTab"
            >
               <span class="d-flex">
                  <BaseIcon
                     class="text-light mt-1 mr-1"
                     icon-name="mdiTableCog"
                     :size="18"
                  /> {{ t('database.trigger', 1) }}</span>
            </div>
            <div
               v-if="workspace.customizations.routineAdd"
               class="context-element"
               @click="openCreateRoutineTab"
            >
               <span class="d-flex">
                  <BaseIcon
                     class="text-light mt-1 mr-1"
                     icon-name="mdiSyncCircle"
                     :size="18"
                  /> {{ t('database.storedRoutine', 1) }}</span>
            </div>
            <div
               v-if="workspace.customizations.functionAdd"
               class="context-element"
               @click="openCreateFunctionTab"
            >
               <span class="d-flex">
                  <BaseIcon
                     class="text-light mt-1 mr-1"
                     icon-name="mdiArrowRightBoldBox"
                     :size="18"
                  /> {{ t('database.function', 1) }}</span>
            </div>
            <div
               v-if="workspace.customizations.triggerFunctionAdd"
               class="context-element"
               @click="openCreateTriggerFunctionTab"
            >
               <span class="d-flex">
                  <BaseIcon
                     class="text-light mt-1 mr-1"
                     icon-name="mdiCogClockwise"
                     :size="18"
                  /> {{ t('database.triggerFunction', 1) }}</span>
            </div>
            <div
               v-if="workspace.customizations.schedulerAdd"
               class="context-element"
               @click="openCreateSchedulerTab"
            >
               <span class="d-flex">
                  <BaseIcon
                     class="text-light mt-1 mr-1"
                     icon-name="mdiCalendarClock"
                     :size="18"
                  /> {{ t('database.scheduler', 1) }}</span>
            </div>
         </div>
      </div>
      <div class="context-element" @click="copyName(selectedSchema)">
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiContentCopy"
               :size="18"
            /> {{ t('general.copyName') }}</span>
      </div>
      <div
         v-if="workspace.customizations.schemaExport"
         class="context-element"
         @click="showExportSchemaModal"
      >
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiDatabaseExport"
               :size="18"
            /> {{ t('database.export') }}</span>
      </div>
      <div
         v-if="workspace.customizations.schemaImport && !connection.readonly"
         class="context-element"
         @click="initImport"
      >
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiDatabaseImport"
               :size="18"
            /> {{ t('database.import') }}</span>
      </div>
      <div
         v-if="workspace.customizations.schemaEdit && !connection.readonly"
         class="context-element"
         @click="showEditModal"
      >
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiDatabaseEdit"
               :size="18"
            /> {{ t('database.editSchema') }}</span>
      </div>
      <div
         v-if="workspace.customizations.schemaDrop && !connection.readonly"
         class="context-element"
         @click="showDeleteModal"
      >
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiDatabaseRemove"
               :size="18"
            /> {{ t('database.deleteSchema') }}</span>
      </div>

      <ConfirmModal
         v-if="isDeleteModal"
         @confirm="deleteSchema"
         @hide="hideDeleteModal"
      >
         <template #header>
            <div class="d-flex">
               <BaseIcon
                  class="text-light mr-1"
                  icon-name="mdiDatabaseRemove"
                  :size="24"
               />
               <span class="cut-text">{{ t('database.deleteSchema') }}</span>
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ t('general.deleteConfirm') }} "<b>{{ selectedSchema }}</b>"?
            </div>
         </template>
      </ConfirmModal>
      <ModalEditSchema
         v-if="isEditModal"
         :selected-schema="selectedSchema"
         @close="hideEditModal"
      />
      <ModalImportSchema
         v-if="isImportSchemaModal"
         ref="importModalRef"
         :selected-schema="selectedSchema"
         @close="hideImportSchemaModal"
      />
   </BaseContextMenu>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { Component, computed, nextTick, Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseContextMenu from '@/components/BaseContextMenu.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import ModalEditSchema from '@/components/ModalEditSchema.vue';
import ModalImportSchema from '@/components/ModalImportSchema.vue';
import Application from '@/ipc-api/Application';
import Schema from '@/ipc-api/Schema';
import { copyText } from '@/libs/copyText';
import { useConnectionsStore } from '@/stores/connections';
import { useNotificationsStore } from '@/stores/notifications';
import { useSchemaExportStore } from '@/stores/schemaExport';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

const props = defineProps({
   contextEvent: MouseEvent,
   selectedSchema: String
});

const emit = defineEmits([
   'open-create-table-tab',
   'open-create-view-tab',
   'open-create-materialized-view-tab',
   'open-create-trigger-tab',
   'open-create-routine-tab',
   'open-create-function-tab',
   'open-create-trigger-function-tab',
   'open-create-scheduler-tab',
   'close-context',
   'reload'
]);

const { addNotification } = useNotificationsStore();
const workspacesStore = useWorkspacesStore();
const schemaExportStore = useSchemaExportStore();
const { showExportModal } = schemaExportStore;

const connectionsStore = useConnectionsStore();
const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);
const { getConnectionByUid } = connectionsStore;

const {
   getWorkspace,
   changeBreadcrumbs
} = workspacesStore;

const importModalRef: Ref<Component & {startImport: (file: string) => void}> = ref(null);
const isDeleteModal = ref(false);
const isEditModal = ref(false);
const isImportSchemaModal = ref(false);

const workspace = computed(() => getWorkspace(selectedWorkspace.value));
const connection = computed(() => getConnectionByUid(selectedWorkspace.value));

const openCreateTableTab = () => {
   emit('open-create-table-tab');
};

const openCreateViewTab = () => {
   emit('open-create-view-tab');
};

const openCreateMaterializedViewTab = () => {
   emit('open-create-materialized-view-tab');
};

const openCreateTriggerTab = () => {
   emit('open-create-trigger-tab');
};

const openCreateRoutineTab = () => {
   emit('open-create-routine-tab');
};

const openCreateFunctionTab = () => {
   emit('open-create-function-tab');
};

const openCreateTriggerFunctionTab = () => {
   emit('open-create-trigger-function-tab');
};

const openCreateSchedulerTab = () => {
   emit('open-create-scheduler-tab');
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

const showEditModal = () => {
   isEditModal.value = true;
};

const hideEditModal = () => {
   isEditModal.value = false;
   closeContext();
};

const showExportSchemaModal = () => {
   showExportModal(props.selectedSchema);
   closeContext();
};

const showImportSchemaModal = () => {
   isImportSchemaModal.value = true;
};

const hideImportSchemaModal = () => {
   isImportSchemaModal.value = false;
   closeContext();
};

const initImport = async () => {
   const result = await Application.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'SQL', extensions: ['sql'] }] });
   if (result && !result.canceled) {
      const file = result.filePaths[0];
      showImportSchemaModal();
      await nextTick();
      importModalRef.value.startImport(file);
   }
};

const closeContext = () => {
   emit('close-context');
};

const deleteSchema = async () => {
   try {
      const { status, response } = await Schema.deleteSchema({
         uid: selectedWorkspace.value,
         database: props.selectedSchema
      });

      if (status === 'success') {
         if (props.selectedSchema === workspace.value.breadcrumbs.schema)
            changeBreadcrumbs({ schema: null });

         closeContext();
         emit('reload');
      }
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }
};
</script>

<style lang="scss" scoped>
.context-submenu {
  min-width: 150px !important;
}
</style>
