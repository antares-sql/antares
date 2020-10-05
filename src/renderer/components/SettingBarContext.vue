<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="$emit('close-context')"
   >
      <div class="context-element" @click="showEditModal(contextConnection)">
         <span class="d-flex"><i class="mdi mdi-18px mdi-pencil text-light pr-1" /> {{ $t('word.edit') }}</span>
      </div>
      <div class="context-element" @click="showConfirmModal">
         <span class="d-flex"><i class="mdi mdi-18px mdi-delete text-light pr-1" /> {{ $t('word.delete') }}</span>
      </div>

      <ModalEditConnection
         v-if="isEditModal"
         :connection="contextConnection"
         @close="hideEditModal"
      />
      <ConfirmModal
         v-if="isConfirmModal"
         @confirm="confirmDeleteConnection"
         @hide="hideConfirmModal"
      >
         <template :slot="'header'">
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-server-remove mr-1" /> {{ $t('message.deleteConnection') }}
            </div>
         </template>
         <div :slot="'body'">
            <div class="mb-2">
               {{ $t('message.deleteCorfirm') }} <b>{{ connectionName }}</b>?
            </div>
         </div>
      </ConfirmModal>
   </BaseContextMenu>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import BaseContextMenu from '@/components/BaseContextMenu';
import ConfirmModal from '@/components/BaseConfirmModal';
import ModalEditConnection from '@/components/ModalEditConnection';

export default {
   name: 'SettingBarContext',
   components: {
      BaseContextMenu,
      ModalEditConnection,
      ConfirmModal
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
   computed: {
      ...mapGetters({
         getConnectionName: 'connections/getConnectionName'
      }),
      connectionName () {
         return this.getConnectionName(this.contextConnection.uid);
      }
   },
   methods: {
      ...mapActions({
         deleteConnection: 'connections/deleteConnection'
      }),
      confirmDeleteConnection () {
         this.deleteConnection(this.contextConnection);
         this.$emit('close-context');
      },
      showEditModal () {
         this.isEditModal = true;
      },
      hideEditModal () {
         this.isEditModal = false;
         this.closeContext();
      },
      showConfirmModal () {
         this.isConfirmModal = true;
      },
      hideConfirmModal () {
         this.isConfirmModal = false;
      },
      closeContext () {
         this.$emit('close-context');
      }
   }
};
</script>
