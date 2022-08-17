<template>
   <div class="dummy-wrapper">
      <Teleport to="#window-content">
         <div class="modal active" :class="modalSizeClass">
            <a class="modal-overlay" @click="hideModal" />
            <div ref="trapRef" class="modal-container">
               <div v-if="hasHeader" class="modal-header pl-2">
                  <div class="modal-title h6">
                     <slot name="header" />
                  </div>
                  <a class="btn btn-clear float-right" @click="hideModal" />
               </div>
               <div v-if="hasDefault" class="modal-header">
                  <div class="modal-title h6">
                     <slot />
                  </div>
                  <a class="btn btn-clear float-right" @click="hideModal" />
               </div>
               <div v-if="hasBody" class="modal-body pb-0">
                  <a
                     v-if="!hasHeader && !hasDefault"
                     class="btn btn-clear float-right"
                     @click="hideModal"
                  />
                  <div class="content">
                     <slot name="body" />
                  </div>
               </div>
               <div v-if="!hideFooter" class="modal-footer">
                  <button
                     class="btn btn-primary mr-2"
                     @click.stop="confirmModal"
                  >
                     {{ confirmText || t('word.confirm') }}
                  </button>
                  <button
                     class="btn btn-link"
                     @click="hideModal"
                  >
                     {{ cancelText || t('word.cancel') }}
                  </button>
               </div>
            </div>
         </div>
      </Teleport>
   </div>
</template>

<script setup lang="ts">
import { useFocusTrap } from '@/composables/useFocusTrap';
import { computed, onBeforeUnmount, PropType, useSlots } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
   size: {
      type: String as PropType<'small' | 'medium' | '400' | 'large'>,
      validator: (prop: string) => ['small', 'medium', '400', 'large'].includes(prop),
      default: 'small'
   },
   hideFooter: {
      type: Boolean,
      default: false
   },
   confirmText: String,
   cancelText: String,
   disableAutofocus: {
      type: Boolean,
      default: false
   },
   closeOnConfirm: {
      type: Boolean,
      default: true
   }
});
const emit = defineEmits(['confirm', 'hide']);
const slots = useSlots();

const { trapRef } = useFocusTrap({ disableAutofocus: props.disableAutofocus });

const hasHeader = computed(() => !!slots.header);
const hasBody = computed(() => !!slots.body);
const hasDefault = computed(() => !!slots.default);
const modalSizeClass = computed(() => {
   if (props.size === 'small')
      return 'modal-sm';
   if (props.size === '400')
      return 'modal-400';
   else if (props.size === 'large')
      return 'modal-lg';
   else return '';
});

const confirmModal = () => {
   emit('confirm');
   if (props.closeOnConfirm) hideModal();
};

const hideModal = () => {
   emit('hide');
};

const onKey = (e: KeyboardEvent) => {
   e.stopPropagation();
   if (e.key === 'Escape')
      hideModal();
};

window.addEventListener('keydown', onKey);

onBeforeUnmount(() => {
   window.removeEventListener('keydown', onKey);
});
</script>

<style scoped>
.modal-400 .modal-container {
  max-width: 400px;
}

.modal.modal-sm .modal-container {
  padding: 0;
}
</style>
