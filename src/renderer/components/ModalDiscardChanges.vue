<template>
   <ConfirmModal
      :confirm-text="t('general.discard')"
      :cancel-text="t('general.stay')"
      @confirm="emit('confirm')"
      @hide="emit('close')"
   >
      <template #header>
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-content-save-alert mr-1" /> {{ t('application.unsavedChanges') }}
         </div>
      </template>
      <template #body>
         <div>
            {{ t('application.discardUnsavedChanges') }}
         </div>
      </template>
   </ConfirmModal>
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmModal from '@/components/BaseConfirmModal.vue';

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
