<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @closeContext="$emit('closeContext')"
   >
      <div class="context-element" @click="showEditModal(contextConnection)">
         <i class="material-icons md-18 text-light pr-1">edit</i> {{ $t('word.edit') }}
      </div>
      <div class="context-element" @click="showConfirmModal">
         <i class="material-icons md-18 text-light pr-1">delete</i> {{ $t('word.delete') }}
      </div>

      <ConfirmModal
         v-if="isConfirmModal"
         @confirm="deleteConnection(contextConnection)"
         @hide="hideConfirmModal"
      >
         <template :slot="'header'">
            {{ $t('message.deleteConnection') }}
         </template>
         <div :slot="'body'">
            <div class="mb-2">
               {{ $t('message.deleteConnectionCorfirm') }} <b>{{ connectionName }}</b>?
            </div>
         </div>
      </ConfirmModal>
   </BaseContextMenu>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
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
