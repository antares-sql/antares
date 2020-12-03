<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="closeContext"
   >
      <div class="context-element" @click="showEmptyModal">
         <span class="d-flex"><i class="mdi mdi-18px mdi-table-off text-light pr-1" /> {{ $t('message.emptyTable') }}</span>
      </div>
      <div class="context-element" @click="showDeleteModal">
         <span class="d-flex"><i class="mdi mdi-18px mdi-table-remove text-light pr-1" /> {{ $t('word.delete') }}</span>
      </div>

      <ConfirmModal
         v-if="isEmptyModal"
         @confirm="emptyTable"
         @hide="hideEmptyModal"
      >
         <template slot="header">
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-table-off mr-1" /> {{ $t('message.emptyTable') }}
            </div>
         </template>
         <div slot="body">
            <div class="mb-2">
               {{ $t('message.emptyCorfirm') }} "<b>{{ selectedTable }}</b>"?
            </div>
         </div>
      </ConfirmModal>
      <ConfirmModal
         v-if="isDeleteModal"
         @confirm="deleteTable"
         @hide="hideDeleteModal"
      >
         <template slot="header">
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-table-remove mr-1" /> {{ $t('message.deleteTable') }}
            </div>
         </template>
         <div slot="body">
            <div class="mb-2">
               {{ $t('message.deleteCorfirm') }} "<b>{{ selectedTable }}</b>"?
            </div>
         </div>
      </ConfirmModal>
   </BaseContextMenu>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import BaseContextMenu from '@/components/BaseContextMenu';
import ConfirmModal from '@/components/BaseConfirmModal';
import Tables from '@/ipc-api/Tables';

export default {
   name: 'WorkspaceExploreBarTableContext',
   components: {
      BaseContextMenu,
      ConfirmModal
   },
   props: {
      contextEvent: MouseEvent,
      selectedTable: String
   },
   data () {
      return {
         isDeleteModal: false,
         isEmptyModal: false
      };
   },
   computed: {
      ...mapGetters({
         selectedWorkspace: 'workspaces/getSelected',
         getWorkspace: 'workspaces/getWorkspace'
      }),
      workspace () {
         return this.getWorkspace(this.selectedWorkspace);
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
      showEmptyModal () {
         this.isEmptyModal = true;
      },
      hideEmptyModal () {
         this.isEmptyModal = false;
      },
      closeContext () {
         this.$emit('close-context');
      },
      async emptyTable () {
         try {
            const { status, response } = await Tables.truncateTable({
               uid: this.selectedWorkspace,
               table: this.selectedTable
            });

            if (status === 'success') {
               if (this.selectedTable === this.workspace.breadcrumbs.table)
                  this.changeBreadcrumbs({ table: null });

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
      async deleteTable () {
         try {
            const { status, response } = await Tables.dropTable({
               uid: this.selectedWorkspace,
               table: this.selectedTable
            });

            if (status === 'success') {
               if (this.selectedTable === this.workspace.breadcrumbs.table)
                  this.changeBreadcrumbs({ table: null });

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
