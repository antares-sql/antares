<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="closeContext"
   >
      <div class="context-element">
         <span class="d-flex"><i class="mdi mdi-18px mdi-plus text-light pr-1" /> {{ $t('word.add') }}</span>
         <i class="mdi mdi-18px mdi-chevron-right text-light pl-1" />
         <div class="context-submenu">
            <div
               v-if="workspace.customizations.tableAdd"
               class="context-element"
               @click="openCreateTableTab"
            >
               <span class="d-flex"><i class="mdi mdi-18px mdi-table text-light pr-1" /> {{ $t('word.table') }}</span>
            </div>
            <div
               v-if="workspace.customizations.viewAdd"
               class="context-element"
               @click="openCreateViewTab"
            >
               <span class="d-flex"><i class="mdi mdi-18px mdi-table-eye text-light pr-1" /> {{ $t('word.view') }}</span>
            </div>
            <div
               v-if="workspace.customizations.triggerAdd"
               class="context-element"
               @click="openCreateTriggerTab"
            >
               <span class="d-flex"><i class="mdi mdi-18px mdi-table-cog text-light pr-1" /> {{ $tc('word.trigger', 1) }}</span>
            </div>
            <div
               v-if="workspace.customizations.routineAdd"
               class="context-element"
               @click="openCreateRoutineTab"
            >
               <span class="d-flex"><i class="mdi mdi-18px mdi-sync-circle pr-1" /> {{ $tc('word.storedRoutine', 1) }}</span>
            </div>
            <div
               v-if="workspace.customizations.functionAdd"
               class="context-element"
               @click="openCreateFunctionTab"
            >
               <span class="d-flex"><i class="mdi mdi-18px mdi-arrow-right-bold-box pr-1" /> {{ $tc('word.function', 1) }}</span>
            </div>
            <div
               v-if="workspace.customizations.triggerFunctionAdd"
               class="context-element"
               @click="openCreateTriggerFunctionTab"
            >
               <span class="d-flex"><i class="mdi mdi-18px mdi-cog-clockwise pr-1" /> {{ $tc('word.triggerFunction', 1) }}</span>
            </div>
            <div
               v-if="workspace.customizations.schedulerAdd"
               class="context-element"
               @click="openCreateSchedulerTab"
            >
               <span class="d-flex"><i class="mdi mdi-18px mdi-calendar-clock text-light pr-1" /> {{ $tc('word.scheduler', 1) }}</span>
            </div>
         </div>
      </div>
      <div
         v-if="workspace.customizations.schemaExport"
         class="context-element"
         @click="showExportSchemaModal"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-database-arrow-down text-light pr-1" /> {{ $t('word.export') }}</span>
      </div>
      <div
         v-if="workspace.customizations.schemaImport"
         class="context-element"
         @click="initImport"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-database-arrow-up text-light pr-1" /> {{ $t('word.import') }}</span>
      </div>
      <div
         v-if="workspace.customizations.schemaEdit"
         class="context-element"
         @click="showEditModal"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-database-edit text-light pr-1" /> {{ $t('word.edit') }}</span>
      </div>
      <div
         v-if="workspace.customizations.schemaDrop"
         class="context-element"
         @click="showDeleteModal"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-database-remove text-light pr-1" /> {{ $t('word.delete') }}</span>
      </div>

      <ConfirmModal
         v-if="isDeleteModal"
         @confirm="deleteSchema"
         @hide="hideDeleteModal"
      >
         <template #header>
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-database-remove mr-1" />
               <span class="cut-text">{{ $t('message.deleteSchema') }}</span>
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ $t('message.deleteCorfirm') }} "<b>{{ selectedSchema }}</b>"?
            </div>
         </template>
      </ConfirmModal>
      <ModalEditSchema
         v-if="isEditModal"
         :selected-schema="selectedSchema"
         @close="hideEditModal"
      />
      <ModalExportSchema
         v-if="isExportSchemaModal"
         :selected-schema="selectedSchema"
         @close="hideExportSchemaModal"
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
import { Component, computed, nextTick, Ref, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import BaseContextMenu from '@/components/BaseContextMenu.vue';
import ConfirmModal from '@/components/BaseConfirmModal.vue';
import ModalEditSchema from '@/components/ModalEditSchema.vue';
import ModalExportSchema from '@/components/ModalExportSchema.vue';
import ModalImportSchema from '@/components/ModalImportSchema.vue';
import Schema from '@/ipc-api/Schema';
import Application from '@/ipc-api/Application';

const props = defineProps({
   contextEvent: MouseEvent,
   selectedSchema: String
});

const emit = defineEmits([
   'open-create-table-tab',
   'open-create-view-tab',
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

const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

const {
   getWorkspace,
   changeBreadcrumbs
} = workspacesStore;

const importModalRef: Ref<Component & {startImport: (file: string) => void}> = ref(null);
const isDeleteModal = ref(false);
const isEditModal = ref(false);
const isExportSchemaModal = ref(false);
const isImportSchemaModal = ref(false);

const workspace = computed(() => getWorkspace(selectedWorkspace.value));

const openCreateTableTab = () => {
   emit('open-create-table-tab');
};

const openCreateViewTab = () => {
   emit('open-create-view-tab');
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
   isExportSchemaModal.value = true;
};

const hideExportSchemaModal = () => {
   isExportSchemaModal.value = false;
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
