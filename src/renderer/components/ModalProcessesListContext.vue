<template>
   <BaseContextMenu
      :context-event="props.contextEvent"
      @close-context="closeContext"
   >
      <div v-if="props.selectedRow" class="context-element">
         <span class="d-flex"><BaseIcon
            icon-name="mdiContentCopy"
            class="text-light mt-1 mr-1"
            :size="18"
         /> {{ t('general.copy') }}</span>
         <BaseIcon
            icon-name="mdiChevronRight"
            class="text-light"
            :size="18"
         />
         <div class="context-submenu">
            <div
               v-if="props.selectedRow"
               class="context-element"
               @click="copyCell"
            >
               <span class="d-flex">
                  <BaseIcon
                     icon-name="mdiNumeric0"
                     rotate="90deg"
                     class="text-light mt-1 mr-1"
                     :size="18"
                  /> {{ t('database.cell', 1) }}
               </span>
            </div>
            <div
               v-if="props.selectedRow"
               class="context-element"
               @click="copyRow"
            >
               <span class="d-flex">
                  <BaseIcon
                     icon-name="mdiTableRow"
                     class="text-light mt-1 mr-1"
                     :size="18"
                  /> {{ t('database.row', 1) }}
               </span>
            </div>
         </div>
      </div>
      <div
         v-if="props.selectedRow"
         class="context-element"
         @click="killProcess"
      >
         <span class="d-flex">
            <BaseIcon
               icon-name="mdiCloseCircleOutline"
               class="text-light mt-1 mr-1"
               :size="18"
            /> {{ t('database.killProcess') }}
         </span>
      </div>
   </BaseContextMenu>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import BaseContextMenu from '@/components/BaseContextMenu.vue';
import BaseIcon from '@/components/BaseIcon.vue';

const { t } = useI18n();

const props = defineProps({
   contextEvent: MouseEvent,
   selectedRow: Number,
   selectedCell: Object
});

const emit = defineEmits(['close-context', 'copy-cell', 'copy-row', 'kill-process']);

const closeContext = () => {
   emit('close-context');
};

const copyCell = () => {
   emit('copy-cell');
   closeContext();
};

const copyRow = () => {
   emit('copy-row');
   closeContext();
};

const killProcess = () => {
   emit('kill-process');
   closeContext();
};
</script>
