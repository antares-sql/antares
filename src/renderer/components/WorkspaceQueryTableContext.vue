<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @closeContext="$emit('closeContext')"
   >
      <div class="context-element" @click="showEditModal()">
         <i class="material-icons md-18 text-light pr-1">edit</i> {{ $t('message.editCell') }}
      </div>
      <div class="context-element" @click="showConfirmModal">
         <i class="material-icons md-18 text-light pr-1">delete</i> {{ $t('message.deleteRow') }}
      </div>

      <ConfirmModal
         v-if="isConfirmModal"
         @confirm="deleteConnection()"
         @hide="hideConfirmModal"
      >
      <!--  -->
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
      contextEvent: MouseEvent
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
      }
   }
};
</script>

<style>

</style>
