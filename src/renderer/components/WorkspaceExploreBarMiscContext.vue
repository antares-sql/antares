<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="closeContext"
   >
      <div
         v-if="['procedure', 'routine', 'function'].includes(selectedMisc.type)"
         class="context-element"
         @click="runElementCheck"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-play text-light pr-1" /> {{ t('general.run') }}</span>
      </div>
      <div
         v-if="selectedMisc.type === 'trigger' && customizations.triggerEnableDisable"
         class="context-element"
         @click="toggleTrigger"
      >
         <span v-if="!selectedMisc.enabled" class="d-flex">
            <i class="mdi mdi-18px mdi-play text-light pr-1" /> {{ t('general.enable') }}
         </span>
         <span v-else class="d-flex">
            <i class="mdi mdi-18px mdi-pause text-light pr-1" /> {{ t('general.disable') }}
         </span>
      </div>
      <div
         v-if="selectedMisc.type === 'scheduler'"
         class="context-element"
         @click="toggleScheduler"
      >
         <span v-if="!selectedMisc.enabled" class="d-flex">
            <i class="mdi mdi-18px mdi-play text-light pr-1" /> {{ t('general.enable') }}
         </span>
         <span v-else class="d-flex">
            <i class="mdi mdi-18px mdi-pause text-light pr-1" /> {{ t('general.disable') }}
         </span>
      </div>
      <div class="context-element" @click="showDeleteModal">
         <span class="d-flex"><i class="mdi mdi-18px mdi-table-remove text-light pr-1" /> {{ t('general.delete') }}</span>
      </div>
      <ConfirmModal
         v-if="isDeleteModal"
         @confirm="deleteMisc"
         @hide="hideDeleteModal"
      >
         <template #header>
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-delete mr-1" />
               <span class="cut-text">{{ deleteMessage }}</span>
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ t('general.deleteConfirm') }} "<b>{{ selectedMisc.name }}</b>"?
            </div>
         </template>
      </ConfirmModal>
      <ModalAskParameters
         v-if="isAskingParameters"
         :local-routine="(localElement as any)"
         :client="workspace.client"
         @confirm="runElement"
         @close="hideAskParamsModal"
      />
   </BaseContextMenu>
</template>

<script setup lang="ts">
import { computed, Prop, Ref, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import BaseContextMenu from '@/components/BaseContextMenu.vue';
import ConfirmModal from '@/components/BaseConfirmModal.vue';
import ModalAskParameters from '@/components/ModalAskParameters.vue';
import Triggers from '@/ipc-api/Triggers';
import Routines from '@/ipc-api/Routines';
import Functions from '@/ipc-api/Functions';
import Schedulers from '@/ipc-api/Schedulers';
import { EventInfos, FunctionInfos, IpcResponse, RoutineInfos, TriggerInfos } from 'common/interfaces/antares';

const { t } = useI18n();

const props = defineProps({
   contextEvent: MouseEvent,
   selectedMisc: Object as Prop<{ name:string; type:string; enabled?: boolean }>,
   selectedSchema: String
});

const emit = defineEmits(['close-context', 'reload']);

const { addNotification } = useNotificationsStore();
const workspacesStore = useWorkspacesStore();

const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

const {
   getWorkspace,
   addLoadingElement,
   removeLoadingElement,
   removeTabs,
   newTab
} = workspacesStore;

const isDeleteModal = ref(false);
const isAskingParameters = ref(false);
const localElement: Ref<TriggerInfos | RoutineInfos | FunctionInfos | EventInfos> = ref(null);

const workspace = computed(() => {
   return getWorkspace(selectedWorkspace.value);
});

const customizations = computed(() => {
   return getWorkspace(selectedWorkspace.value).customizations;
});

const deleteMessage = computed(() => {
   switch (props.selectedMisc.type) {
      case 'trigger':
         return t('database.deleteTrigger');
      case 'procedure':
         return t('database.deleteRoutine');
      case 'function':
      case 'triggerFunction':
         return t('database.deleteFunction');
      case 'scheduler':
         return t('database.deleteScheduler');
      default:
         return '';
   }
});

const showDeleteModal = () => {
   isDeleteModal.value = true;
};

const hideDeleteModal = () => {
   isDeleteModal.value = false;
};

const showAskParamsModal = () => {
   isAskingParameters.value = true;
};

const hideAskParamsModal = () => {
   isAskingParameters.value = false;
   closeContext();
};

const closeContext = () => {
   emit('close-context');
};

const deleteMisc = async () => {
   try {
      let res: IpcResponse;

      switch (props.selectedMisc.type) {
         case 'trigger':
            res = await Triggers.dropTrigger({
               uid: selectedWorkspace.value,
               schema: props.selectedSchema,
               trigger: props.selectedMisc.name
            });
            break;
         case 'routine':
         case 'procedure':
            res = await Routines.dropRoutine({
               uid: selectedWorkspace.value,
               schema: props.selectedSchema,
               routine: props.selectedMisc.name
            });
            break;
         case 'function':
         case 'triggerFunction':
            res = await Functions.dropFunction({
               uid: selectedWorkspace.value,
               schema: props.selectedSchema,
               func: props.selectedMisc.name
            });
            break;
         case 'scheduler':
            res = await Schedulers.dropScheduler({
               uid: selectedWorkspace.value,
               schema: props.selectedSchema,
               scheduler: props.selectedMisc.name
            });
            break;
      }

      const { status, response } = res;

      if (status === 'success') {
         removeTabs({
            uid: selectedWorkspace.value,
            elementName: props.selectedMisc.name,
            elementType: props.selectedMisc.type,
            schema: props.selectedSchema
         });

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

const runElementCheck = () => {
   if (['procedure', 'routine'].includes(props.selectedMisc.type))
      runRoutineCheck();
   else if (props.selectedMisc.type === 'function')
      runFunctionCheck();
};

const runElement = (params: string[]) => {
   if (['procedure', 'routine'].includes(props.selectedMisc.type))
      runRoutine(params);
   else if (props.selectedMisc.type === 'function')
      runFunction(params);
};

const runRoutineCheck = async () => {
   const params = {
      uid: selectedWorkspace.value,
      schema: props.selectedSchema,
      routine: props.selectedMisc.name
   };

   try {
      const { status, response } = await Routines.getRoutineInformations(params);
      if (status === 'success')
         localElement.value = response;

      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   if ((localElement.value as RoutineInfos).parameters.length)
      showAskParamsModal();
   else
      runRoutine();
};

const runRoutine = (params?: string[]) => {
   if (!params) params = [];

   let sql;
   switch (workspace.value.client) { // TODO: move in a better place
      case 'maria':
      case 'mysql':
      case 'pg':
         sql = `CALL ${localElement.value.name}(${params.join(',')})`;
         break;
      case 'firebird':
         sql = `EXECUTE PROCEDURE "${localElement.value.name}"(${params.join(',')})`;
         break;
      // case 'mssql':
      //    sql = `EXEC ${localElement.value.name} ${params.join(',')}`;
      //    break;
      default:
         sql = `CALL \`${localElement.value.name}\`(${params.join(',')})`;
   }

   newTab({
      uid: workspace.value.uid,
      content: sql,
      type: 'query',
      schema: props.selectedSchema,
      autorun: true
   });
   closeContext();
};

const runFunctionCheck = async () => {
   const params = {
      uid: selectedWorkspace.value,
      schema: props.selectedSchema,
      func: props.selectedMisc.name
   };

   try {
      const { status, response } = await Functions.getFunctionInformations(params);
      if (status === 'success')
         localElement.value = response;
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   if ((localElement.value as FunctionInfos).parameters.length)
      showAskParamsModal();
   else
      runFunction();
};

const runFunction = (params?: string[]) => {
   if (!params) params = [];

   let sql;
   switch (workspace.value.client) { // TODO: move in a better place
      case 'maria':
      case 'mysql':
         sql = `SELECT \`${localElement.value.name}\` (${params.join(',')})`;
         break;
      case 'pg':
         sql = `SELECT ${localElement.value.name}(${params.join(',')})`;
         break;
      // case 'mssql':
      //    sql = `SELECT ${localElement.value.name} ${params.join(',')}`;
      //    break;
      default:
         sql = `SELECT \`${localElement.value.name}\` (${params.join(',')})`;
   }

   newTab({
      uid: workspace.value.uid,
      content: sql,
      type: 'query',
      schema: props.selectedSchema,
      autorun: true
   });
   closeContext();
};

const toggleTrigger = async () => {
   addLoadingElement({
      name: props.selectedMisc.name,
      schema: props.selectedSchema,
      type: 'trigger'
   });

   try {
      const { status, response } = await Triggers.toggleTrigger({
         uid: selectedWorkspace.value,
         schema: props.selectedSchema,
         trigger: props.selectedMisc.name,
         enabled: props.selectedMisc.enabled
      });

      if (status !== 'success')
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   removeLoadingElement({
      name: props.selectedMisc.name,
      schema: props.selectedSchema,
      type: 'trigger'
   });

   closeContext();
   emit('reload');
};

const toggleScheduler = async () => {
   addLoadingElement({
      name: props.selectedMisc.name,
      schema: props.selectedSchema,
      type: 'scheduler'
   });

   try {
      const { status, response } = await Schedulers.toggleScheduler({
         uid: selectedWorkspace.value,
         schema: props.selectedSchema,
         scheduler: props.selectedMisc.name,
         enabled: props.selectedMisc.enabled
      });

      if (status !== 'success')
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   removeLoadingElement({
      name: props.selectedMisc.name,
      schema: props.selectedSchema,
      type: 'scheduler'
   });

   closeContext();
   emit('reload');
};
</script>
