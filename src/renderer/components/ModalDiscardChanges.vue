<template>
   <ConfirmModal
      :confirm-text="$t('word.discard')"
      :cancel-text="$t('word.stay')"
      @confirm="discardUnsavedChanges"
      @hide="closeUnsavedChangesModal"
   >
      <template slot="header">
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-content-save-alert mr-1" /> {{ $t('message.unsavedChanges') }}
         </div>
      </template>
      <div slot="body">
         <div>
            {{ $t('message.discardUnsavedChanges') }}
         </div>
      </div>
   </ConfirmModal>
</template>

<script>
import { mapActions } from 'vuex';
import ConfirmModal from '@/components/BaseConfirmModal';

export default {
   name: 'ModalDiscardChanges',
   components: {
      ConfirmModal
   },
   created () {
      window.addEventListener('keydown', this.onKey);
   },
   beforeDestroy () {
      window.removeEventListener('keydown', this.onKey);
   },
   methods: {
      ...mapActions({
         discardUnsavedChanges: 'workspaces/discardUnsavedChanges',
         closeUnsavedChangesModal: 'workspaces/closeUnsavedChangesModal'
      }),
      closeModal () {
         this.$emit('close');
      },
      onKey (e) {
         e.stopPropagation();
         if (e.key === 'Escape')
            this.closeModal();
      }
   }
};
</script>

<style scoped>
  .modal-container {
    max-width: 360px;
  }
</style>
