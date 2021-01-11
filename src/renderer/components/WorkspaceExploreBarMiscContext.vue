<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="closeContext"
   >
      <div
         v-if="['procedure', 'function'].includes(selectedMisc.type)"
         class="context-element disabled"
         @click="showRunModal"
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
   </BaseContextMenu>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import BaseContextMenu from '@/components/BaseContextMenu';
import ConfirmModal from '@/components/BaseConfirmModal';
import Triggers from '@/ipc-api/Triggers';
import Routines from '@/ipc-api/Routines';
import Functions from '@/ipc-api/Functions';

export default {
   name: 'WorkspaceExploreBarMiscContext',
   components: {
      BaseContextMenu,
      ConfirmModal
   },
   props: {
      contextEvent: MouseEvent,
      selectedMisc: Object
   },
   data () {
      return {
         isDeleteModal: false,
         isRunModal: false
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
            default:
               return '';
         }
      }
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification',
         changeBreadcrumbs: 'workspaces/changeBreadcrumbs'
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
      showRunModal () {
         this.isRunModal = true;
      },
      hideRunModal () {
         this.isRunModal = false;
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
               // case 'schedulers':
               //    res = await Tables.dropScheduler({
               //       uid: this.selectedWorkspace,
               //       scheduler: this.selectedMisc.name
               //    });
               //    break;
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
      }
   }
};
</script>
