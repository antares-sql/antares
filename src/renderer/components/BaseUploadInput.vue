<template>
   <label
      :for="`id_${id}`"
      class="file-uploader"
      data-a11y-group-label
   >
      <span class="file-uploader-message">
         <BaseIcon
            icon-name="folder-open"
            class="mr-1 mt-1"
            :size="18"
         />{{ message }}
      </span>
      <span :id="`value_${id}`" class="text-ellipsis file-uploader-value">
         {{ lastPart(modelValue, 19) }}
      </span>
      <BaseIcon
         v-if="modelValue"
         v-button="t('general.clear')"
         class="file-upload-icon-clear"
         icon-name="x"
         :size="18"
         @click.prevent="clear"
      />
      <form :ref="`form_${id}`">
         <!-- Visually hidden but focusable: Enter/Space open the file dialog -->
         <input
            :id="`id_${id}`"
            class="file-uploader-input text-assistive"
            type="file"
            :accept="accept"
            :aria-describedby="modelValue ? `value_${id}` : null"
            @change="$emit('change', $event)"
         >
      </form>
   </label>
</template>

<script setup lang="ts">
import { uidGen } from 'common/libs/uidGen';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import { useFilters } from '@/composables/useFilters';

const { t } = useI18n();
const { lastPart } = useFilters();

defineProps({
   message: {
      default: 'Browse',
      type: String
   },
   accept: {
      default: '',
      type: String
   },
   modelValue: {
      default: '',
      type: String
   }
});

const emit = defineEmits(['change', 'clear']);

const id = uidGen();

const clear = () => {
   emit('clear');
};
</script>

<style lang="scss" scoped>
.file-uploader {
  border-radius: $border-radius;
  height: 1.8rem;
  line-height: 1.2rem;
  display: flex;
  cursor: pointer;
  transition: background 0.2s, border 0.2s, box-shadow 0.2s, color 0.2s;
  position: relative;
  flex: 1 1 auto;

  .file-upload-icon-clear {
   position: absolute;
   right: 4px;
   top: 8px;
  }

  > span {
    padding: 0.25rem 0.4rem;
  }

  .file-uploader-message {
    display: flex;
    word-break: keep-all;
    border-radius: $border-radius 0 0 $border-radius;
  }

  .file-uploader-value {
    display: block;
    width: 100%;
    padding-right: 1rem;
  }

  .file-uploader-reset {
    z-index: 1;
    position: absolute;
    right: 5px;
    top: calc(50% - 8px);
  }
}

:disabled {
  .file-uploader {
    cursor: not-allowed;
    opacity: 0.5;
  }
}
</style>

<style lang="scss">
/* The native input is visually hidden: the keyboard focus ring goes on the visible box */
:root:not([data-input-modality="pointer"]) .file-uploader:has(.file-uploader-input:focus-visible) {
  outline: max(2px, var(--focus-ring-width)) solid var(--primary-color);
  outline-offset: 1px;
}
</style>
