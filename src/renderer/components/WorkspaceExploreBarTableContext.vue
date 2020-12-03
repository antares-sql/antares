<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="closeContext"
   >
      <div class="context-element">
         <span class="d-flex"><i class="mdi mdi-18px mdi-plus text-light pr-1" /> {{ $t('word.add') }}</span>
         <i class="mdi mdi-18px mdi-chevron-right text-light pl-1" />
         <div class="context-submenu">
            <div class="context-element" @click="showCreateTableModal">
               <span class="d-flex"><i class="mdi mdi-18px mdi-table text-light pr-1" /> {{ $t('word.table') }}</span>
            </div>
         </div>
      </div>
      <div class="context-element" @click="showEditModal">
         <span class="d-flex"><i class="mdi mdi-18px mdi-pencil text-light pr-1" /> {{ $t('word.edit') }}</span>
      </div>
      <div class="context-element" @click="showDeleteModal">
         <span class="d-flex"><i class="mdi mdi-18px mdi-delete text-light pr-1" /> {{ $t('word.delete') }}</span>
      </div>

      <ConfirmModal
         v-if="isDeleteModal"
         @confirm="deleteDatabase"
         @hide="hideDeleteModal"
      >
         <template slot="header">
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-database-remove mr-1" /> {{ $t('message.deleteDatabase') }}
            </div>
         </template>
         <div slot="body">
            <div class="mb-2">
               {{ $t('message.deleteCorfirm') }} "<b>{{ selectedDatabase }}</b>"?
            </div>
         </div>
      </ConfirmModal>
      <ModalEditDatabase
         v-if="isEditModal"
         :selected-database="selectedDatabase"
         @close="hideEditModal"
      />
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
         isDeleteModal: false
      };
   },
   computed: {
      ...mapGetters({
         selectedWorkspace: 'workspaces/getSelected'
      })
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification'
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
      showEditModal () {
         this.isEditModal = true;
      },
      hideEditModal () {
         this.isEditModal = false;
         this.closeContext();
      },
      closeContext () {
         this.$emit('close-context');
      },
      async deleteDatabase () {
         try {
            const { status, response } = await Database.deleteDatabase({
               uid: this.selectedWorkspace,
               database: this.selectedDatabase
            });

            if (status === 'success') {
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
