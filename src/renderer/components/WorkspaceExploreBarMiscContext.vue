<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="closeContext"
   >
      <div
         v-if="['procedure', 'function'].includes(selectedMisc.type)"
         class="context-element"
         @click="runElementCheck"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-play text-light pr-1" /> {{ $t('word.run') }}</span>
      </div>
      <div
         v-if="selectedMisc.type === 'trigger' && customizations.triggerEnableDisable"
         class="context-element"
         @click="toggleTrigger"
      >
         <span v-if="!selectedMisc.enabled" class="d-flex">
            <i class="mdi mdi-18px mdi-play text-light pr-1" /> {{ $t('word.enable') }}
         </span>
         <span v-else class="d-flex">
            <i class="mdi mdi-18px mdi-pause text-light pr-1" /> {{ $t('word.disable') }}
         </span>
      </div>
      <div
         v-if="selectedMisc.type === 'scheduler'"
         class="context-element"
         @click="toggleScheduler"
      >
         <span v-if="!selectedMisc.enabled" class="d-flex">
            <i class="mdi mdi-18px mdi-play text-light pr-1" /> {{ $t('word.enable') }}
         </span>
         <span v-else class="d-flex">
            <i class="mdi mdi-18px mdi-pause text-light pr-1" /> {{ $t('word.disable') }}
         </span>
      </div>
      <div class="context-element" @click="showDeleteModal">
         <span class="d-flex"><i class="mdi mdi-18px mdi-table-remove text-light pr-1" /> {{ $t('word.delete') }}</span>
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
               {{ $t('message.deleteCorfirm') }} "<b>{{ selectedMisc.name }}</b>"?
            </div>
         </template>
      </ConfirmModal>
      <ModalAskParameters
         v-if="isAskingParameters"
         :local-routine="localElement"
         :client="workspace.client"
         @confirm="runElement"
         @close="hideAskParamsModal"
      />
   </BaseContextMenu>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import BaseContextMenu from '@/components/BaseContextMenu';
import ConfirmModal from '@/components/BaseConfirmModal';
import ModalAskParameters from '@/components/ModalAskParameters';
import Triggers from '@/ipc-api/Triggers';
import Routines from '@/ipc-api/Routines';
import Functions from '@/ipc-api/Functions';
import Schedulers from '@/ipc-api/Schedulers';

export default {
   name: 'WorkspaceExploreBarMiscContext',
   components: {
      BaseContextMenu,
      ConfirmModal,
      ModalAskParameters
   },
   props: {
      contextEvent: MouseEvent,
      selectedMisc: Object,
      selectedSchema: String
   },
   emits: ['close-context', 'reload'],
   data () {
      return {
         isDeleteModal: false,
         isRunModal: false,
         isAskingParameters: false,
         localElement: {}
      };
   },
   computed: {
      ...mapGetters({
         selectedWorkspace: 'workspaces/getSelected',
         getWorkspace: 'workspaces/getWorkspace'
      }),
      workspace () {
         return this.getWorkspace(this.selectedWorkspace);
      },
      customizations () {
         return this.getWorkspace(this.selectedWorkspace).customizations;
      },
      deleteMessage () {
         switch (this.selectedMisc.type) {
            case 'trigger':
               return this.$t('message.deleteTrigger');
            case 'procedure':
               return this.$t('message.deleteRoutine');
            case 'function':
            case 'triggerFunction':
               return this.$t('message.deleteFunction');
            case 'scheduler':
               return this.$t('message.deleteScheduler');
            default:
               return '';
         }
      }
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification',
         changeBreadcrumbs: 'workspaces/changeBreadcrumbs',
         addLoadingElement: 'workspaces/addLoadingElement',
         removeLoadingElement: 'workspaces/removeLoadingElement',
         removeTabs: 'workspaces/removeTabs',
         newTab: 'workspaces/newTab'
      }),
      showDeleteModal () {
         this.isDeleteModal = true;
      },
      hideDeleteModal () {
         this.isDeleteModal = false;
      },
      showAskParamsModal () {
         this.isAskingParameters = true;
      },
      hideAskParamsModal () {
         this.isAskingParameters = false;
         this.closeContext();
      },
      closeContext () {
         this.$emit('close-context');
      },
      async deleteMisc () {
         try {
            let res;

            switch (this.selectedMisc.type) {
               case 'trigger':
                  res = await Triggers.dropTrigger({
                     uid: this.selectedWorkspace,
                     schema: this.selectedSchema,
                     trigger: this.selectedMisc.name
                  });
                  break;
               case 'procedure':
                  res = await Routines.dropRoutine({
                     uid: this.selectedWorkspace,
                     schema: this.selectedSchema,
                     routine: this.selectedMisc.name
                  });
                  break;
               case 'function':
               case 'triggerFunction':
                  res = await Functions.dropFunction({
                     uid: this.selectedWorkspace,
                     schema: this.selectedSchema,
                     func: this.selectedMisc.name
                  });
                  break;
               case 'scheduler':
                  res = await Schedulers.dropScheduler({
                     uid: this.selectedWorkspace,
                     schema: this.selectedSchema,
                     scheduler: this.selectedMisc.name
                  });
                  break;
            }

            const { status, response } = res;

            if (status === 'success') {
               this.removeTabs({
                  uid: this.selectedWorkspace,
                  elementName: this.selectedMisc.name,
                  elementType: this.selectedMisc.type,
                  schema: this.selectedSchema
               });

               this.closeContext();
               this.$emit('reload');
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }
      },
      runElementCheck () {
         if (this.selectedMisc.type === 'procedure')
            this.runRoutineCheck();
         else if (this.selectedMisc.type === 'function')
            this.runFunctionCheck();
      },
      runElement (params) {
         if (this.selectedMisc.type === 'procedure')
            this.runRoutine(params);
         else if (this.selectedMisc.type === 'function')
            this.runFunction(params);
      },
      async runRoutineCheck () {
         const params = {
            uid: this.selectedWorkspace,
            schema: this.selectedSchema,
            routine: this.selectedMisc.name
         };

         try {
            const { status, response } = await Routines.getRoutineInformations(params);
            if (status === 'success')
               this.localElement = response;

            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         if (this.localElement.parameters.length)
            this.showAskParamsModal();
         else
            this.runRoutine();
      },
      runRoutine (params) {
         if (!params) params = [];

         let sql;
         switch (this.workspace.client) { // TODO: move in a better place
            case 'maria':
            case 'mysql':
            case 'pg':
               sql = `CALL ${this.localElement.name}(${params.join(',')})`;
               break;
            case 'mssql':
               sql = `EXEC ${this.localElement.name} ${params.join(',')}`;
               break;
            default:
               sql = `CALL \`${this.localElement.name}\`(${params.join(',')})`;
         }

         this.newTab({ uid: this.workspace.uid, content: sql, type: 'query', autorun: true });
         this.closeContext();
      },
      async runFunctionCheck () {
         const params = {
            uid: this.selectedWorkspace,
            schema: this.selectedSchema,
            func: this.selectedMisc.name
         };

         try {
            const { status, response } = await Functions.getFunctionInformations(params);
            if (status === 'success')
               this.localElement = response;
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         if (this.localElement.parameters.length)
            this.showAskParamsModal();
         else
            this.runFunction();
      },
      runFunction (params) {
         if (!params) params = [];

         let sql;
         switch (this.workspace.client) { // TODO: move in a better place
            case 'maria':
            case 'mysql':
               sql = `SELECT \`${this.localElement.name}\` (${params.join(',')})`;
               break;
            case 'pg':
               sql = `SELECT ${this.localElement.name}(${params.join(',')})`;
               break;
            case 'mssql':
               sql = `SELECT ${this.localElement.name} ${params.join(',')}`;
               break;
            default:
               sql = `SELECT \`${this.localElement.name}\` (${params.join(',')})`;
         }

         this.newTab({ uid: this.workspace.uid, content: sql, type: 'query', autorun: true });
         this.closeContext();
      },
      async toggleTrigger () {
         this.addLoadingElement({
            name: this.selectedMisc.name,
            schema: this.selectedSchema,
            type: 'trigger'
         });

         try {
            const { status, response } = await Triggers.toggleTrigger({
               uid: this.selectedWorkspace,
               schema: this.selectedSchema,
               trigger: this.selectedMisc.name,
               enabled: this.selectedMisc.enabled
            });

            if (status !== 'success')
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.removeLoadingElement({
            name: this.selectedMisc.name,
            schema: this.selectedSchema,
            type: 'trigger'
         });

         this.closeContext();
         this.$emit('reload');
      },
      async toggleScheduler () {
         this.addLoadingElement({
            name: this.selectedMisc.name,
            schema: this.selectedSchema,
            type: 'scheduler'
         });

         try {
            const { status, response } = await Schedulers.toggleScheduler({
               uid: this.selectedWorkspace,
               schema: this.selectedSchema,
               scheduler: this.selectedMisc.name,
               enabled: this.selectedMisc.enabled
            });

            if (status !== 'success')
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.removeLoadingElement({
            name: this.selectedMisc.name,
            schema: this.selectedSchema,
            type: 'scheduler'
         });

         this.closeContext();
         this.$emit('reload');
      }
   }
};
</script>
