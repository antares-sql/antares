<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @closeContext="$emit('closeContext')"
   >
      <div class="context-element" @click="showEditModal(contextConnection)">
         <i class="material-icons md-18 text-light pr-1">edit</i> Edit
      </div>
      <div class="context-element" @click="showConfirmModal">
         <i class="material-icons md-18 text-light pr-1">delete</i> Delete
      </div>

      <ConfirmModal
         v-if="isConfirmModal"
         @confirm="deleteConnection(contextConnection)"
         @hide="hideConfirmModal"
      >
         <template :slot="'header'">
            Delete connection
         </template>
         <div :slot="'body'">
            <div class="mb-2">
               Do you confirm the cancellation of <b>{{ contextConnection.user }}@{{ contextConnection.host }}:{{ contextConnection.port }}</b>?
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
   name: 'SettingBarContext',
   components: {
      BaseContextMenu,
      ConfirmModal
   },
   props: {
      contextEvent: MouseEvent,
      contextConnection: Object
   },
   data () {
      return {
         isConfirmModal: false
      };
   },
   methods: {
      ...mapActions({
         deleteConnection: 'connections/deleteConnection',
         showEditModal: 'connections/showEditConnModal'
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
