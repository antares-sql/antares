<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="$emit('close-context')"
   >
      <div class="context-element" @click="duplicateConnection">
         <span class="d-flex"><i class="mdi mdi-18px mdi-content-duplicate text-light pr-1" /> {{ $t('word.duplicate') }}</span>
      </div>
      <div class="context-element" @click="showConfirmModal">
         <span class="d-flex"><i class="mdi mdi-18px mdi-delete text-light pr-1" /> {{ $t('word.delete') }}</span>
      </div>

      <ConfirmModal
         v-if="isConfirmModal"
         @confirm="confirmDeleteConnection"
         @hide="hideConfirmModal"
      >
         <template #header>
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-server-remove mr-1" /> {{ $t('message.deleteConnection') }}
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ $t('message.deleteCorfirm') }} <b>{{ connectionName }}</b>?
            </div>
         </template>
      </ConfirmModal>
   </BaseContextMenu>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { uidGen } from 'common/libs/uidGen';
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
   emits: ['close-context'],
   data () {
      return {
         isConfirmModal: false,
         isEditModal: false
      };
   },
   computed: {
      ...mapGetters({
         getConnectionName: 'connections/getConnectionName',
         selectedWorkspace: 'workspaces/getSelected'
      }),
      connectionName () {
         return this.getConnectionName(this.contextConnection.uid);
      }
   },
   methods: {
      ...mapActions({
         addConnection: 'connections/addConnection',
         deleteConnection: 'connections/deleteConnection',
         selectWorkspace: 'workspaces/selectWorkspace'
      }),
      confirmDeleteConnection () {
         if (this.selectedWorkspace === this.contextConnection.uid)
            this.selectWorkspace();
         this.deleteConnection(this.contextConnection);
         this.closeContext();
      },
      duplicateConnection () {
         let connectionCopy = Object.assign({}, this.contextConnection);
         connectionCopy = {
            ...connectionCopy,
            uid: uidGen('C'),
            name: connectionCopy.name ? `${connectionCopy.name}_copy` : ''
         };

         this.addConnection(connectionCopy);
         this.closeContext();
      },
      showConfirmModal () {
         this.isConfirmModal = true;
      },
      hideConfirmModal () {
         this.isConfirmModal = false;
         this.closeContext();
      },
      closeContext () {
         this.$emit('close-context');
      }
   }
};
</script>
