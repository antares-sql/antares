<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @closeContext="$emit('closeContext')"
   >
      <div class="context-element" @click="showEditModal">
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
      <!-- TODO: move to vuex -->
      <ModalEditConnection
         v-if="isEditModal"
         :connection="contextConnection"
         @close="isEditModal = false"
      />
   </BaseContextMenu>
</template>

<script>
import { mapActions } from 'vuex';
import BaseContextMenu from '@/components/BaseContextMenu';
import ConfirmModal from '@/components/BaseConfirmModal';
import ModalEditConnection from '@/components/ModalEditConnection';

export default {
   name: 'SettingBarContext',
   components: {
      BaseContextMenu,
      ConfirmModal,
      ModalEditConnection
   },
   props: {
      contextEvent: MouseEvent,
      contextConnection: Object
   },
   data () {
      return {
         isConfirmModal: false,
         isEditModal: false
      };
   },
   methods: {
      ...mapActions({
         deleteConnection: 'connections/deleteConnection'
      }),
      showConfirmModal () {
         this.isConfirmModal = true;
      },
      hideConfirmModal () {
         this.isConfirmModal = false;
      },
      showEditModal () {
         this.isEditModal = true;
      },
      hideEditModal () {
         this.isEditModal = false;
      }
   }
};
</script>

<style>

</style>
