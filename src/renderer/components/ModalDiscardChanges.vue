<template>
   <ConfirmModal
      :confirm-text="t('word.discard')"
      :cancel-text="t('word.stay')"
      @confirm="emit('confirm')"
      @hide="emit('close')"
   >
      <template #header>
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-content-save-alert mr-1" /> {{ t('message.unsavedChanges') }}
         </div>
      </template>
      <template #body>
         <div>
            {{ t('message.discardUnsavedChanges') }}
         </div>
      </template>
   </ConfirmModal>
</template>

<script setup lang="ts">
import ConfirmModal from '@/components/BaseConfirmModal.vue';
import { onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const emit = defineEmits(['confirm', 'close']);

const onKey = (e: KeyboardEvent) => {
   e.stopPropagation();
   if (e.key === 'Escape')
      emit('close');
};

window.addEventListener('keydown', onKey);

onBeforeUnmount(() => {
   window.removeEventListener('keydown', onKey);
});
</script>

<style scoped>
  .modal-container {
    max-width: 360px;
  }
</style>
