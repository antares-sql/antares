<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="closeContext"
   >
      <!-- <div class="context-element">
         <span class="d-flex"><i class="mdi mdi-18px mdi-plus text-light pr-1" /> {{ $t('word.add') }}</span>
         <i class="mdi mdi-18px mdi-chevron-right text-light pl-1" />
      </div> -->
      <div class="context-element">
         <span class="d-flex"><i class="mdi mdi-18px mdi-pencil text-light pr-1" /> {{ $t('word.edit') }}</span>
      </div>
      <div class="context-element" @click="showConfirmModal">
         <span class="d-flex"><i class="mdi mdi-18px mdi-delete text-light pr-1" /> {{ $t('word.delete') }}</span>
      </div>

      <ConfirmModal
         v-if="isConfirmModal"
         @confirm="deleteDatabase"
         @hide="hideConfirmModal"
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
   </BaseContextMenu>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import BaseContextMenu from '@/components/BaseContextMenu';
import ConfirmModal from '@/components/BaseConfirmModal';
import Database from '@/ipc-api/Database';

export default {
   name: 'WorkspaceExploreBarDatabaseContext',
   components: {
      BaseContextMenu,
      ConfirmModal
   },
   props: {
      contextEvent: MouseEvent,
      selectedDatabase: String
   },
   data () {
      return {
         isConfirmModal: false
      };
   },
   computed: {
      ...mapGetters({
         selectedWorkspace: 'workspaces/getSelected'
      })
   },
   methods: {
      ...mapActions({
         deleteConnection: 'connections/deleteConnection',
         showEditModal: 'application/showEditConnModal',
         addNotification: 'notifications/addNotification'
      }),
      showConfirmModal () {
         this.isConfirmModal = true;
      },
      hideConfirmModal () {
         this.isConfirmModal = false;
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
