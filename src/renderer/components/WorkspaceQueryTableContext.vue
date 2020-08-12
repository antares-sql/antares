<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @closeContext="closeContext"
   >
      <div class="context-element" @click="showConfirmModal">
         <i class="mdi mdi-18px mdi-delete text-light pr-1" /> {{ $tc('message.deleteRows', selectedRows.length) }}
      </div>

      <ConfirmModal
         v-if="isConfirmModal"
         @confirm="deleteRows"
         @hide="hideConfirmModal"
      >
         <template :slot="'header'">
            {{ $tc('message.deleteRows', selectedRows.length) }}
         </template>
         <div :slot="'body'">
            <div class="mb-2">
               {{ $tc('message.confirmToDeleteRows', selectedRows.length) }}
            </div>
         </div>
      </ConfirmModal>
   </BaseContextMenu>
</template>

<script>
import { mapActions } from 'vuex';
import BaseContextMenu from '@/components/BaseContextMenu';
import ConfirmModal from '@/components/BaseConfirmModal';

export default {
   name: 'WorkspaceQueryTableContext',
   components: {
      BaseContextMenu,
      ConfirmModal
   },
   props: {
      contextEvent: MouseEvent,
      selectedRows: Array
   },
   data () {
      return {
         isConfirmModal: false
      };
   },
   computed: {
   },
   methods: {
      ...mapActions({
         deleteConnection: 'connections/deleteConnection',
         showEditModal: 'application/showEditConnModal'
      }),
      showConfirmModal () {
         this.isConfirmModal = true;
      },
      hideConfirmModal () {
         this.isConfirmModal = false;
      },
      closeContext () {
         this.$emit('closeContext');
      },
      deleteRows () {
         this.$emit('deleteSelected');
         this.closeContext();
      }
   }
};
</script>
