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
      <div class="context-element" @click="showDeleteModal">
         <span class="d-flex"><i class="mdi mdi-18px mdi-table-remove text-light pr-1" /> {{ $t('word.delete') }}</span>
      </div>
      <ConfirmModal
         v-if="isDeleteModal"
         @confirm="deleteMisc"
         @hide="hideDeleteModal"
      >
         <template slot="header">
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-delete mr-1" /> {{ deleteMessage }}
            </div>
         </template>
         <div slot="body">
            <div class="mb-2">
               {{ $t('message.deleteCorfirm') }} "<b>{{ selectedMisc.name }}</b>"?
            </div>
         </div>
      </ConfirmModal>
      <ModalAskParameters
         v-if="isAskingParameters"
         :local-routine="localElement"
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
      selectedMisc: Object
   },
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
      deleteMessage () {
         switch (this.selectedMisc.type) {
            case 'trigger':
               return this.$t('message.deleteTrigger');
            case 'procedure':
               return this.$t('message.deleteRoutine');
            case 'function':
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
         newTab: 'workspaces/newTab'
      }),
      showCreateTableModal () {
         this.$emit('show-create-table-modal');
      },
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
                     trigger: this.selectedMisc.name
                  });
                  break;
               case 'procedure':
                  res = await Routines.dropRoutine({
                     uid: this.selectedWorkspace,
                     routine: this.selectedMisc.name
                  });
                  break;
               case 'function':
                  res = await Functions.dropFunction({
                     uid: this.selectedWorkspace,
                     func: this.selectedMisc.name
                  });
                  break;
               case 'scheduler':
                  res = await Schedulers.dropScheduler({
                     uid: this.selectedWorkspace,
                     scheduler: this.selectedMisc.name
                  });
                  break;
            }

            const { status, response } = res;

            if (status === 'success') {
               this.changeBreadcrumbs({ [this.selectedMisc.type]: null });

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
            schema: this.workspace.breadcrumbs.schema,
            routine: this.workspace.breadcrumbs.procedure
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
               sql = `CALL \`${this.localElement.name}\` (${params.join(',')})`;
               break;
            case 'mssql':
               sql = `EXEC ${this.localElement.name} ${params.join(',')}`;
               break;
            default:
               sql = `CALL \`${this.localElement.name}\` (${params.join(',')})`;
         }

         this.newTab({ uid: this.workspace.uid, content: sql, autorun: true });
         this.closeContext();
      },
      async runFunctionCheck () {
         const params = {
            uid: this.selectedWorkspace,
            schema: this.workspace.breadcrumbs.schema,
            func: this.workspace.breadcrumbs.function
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
            case 'pg':
               sql = `SELECT \`${this.localElement.name}\` (${params.join(',')})`;
               break;
            case 'mssql':
               sql = `SELECT ${this.localElement.name} ${params.join(',')}`;
               break;
            default:
               sql = `SELECT \`${this.localElement.name}\` (${params.join(',')})`;
         }

         this.newTab({ uid: this.workspace.uid, content: sql, autorun: true });
         this.closeContext();
      }
   }
};
</script>
