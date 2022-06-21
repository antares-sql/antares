<template>
   <BaseContextMenu
      :context-event="props.contextEvent"
      @close-context="closeContext"
   >
      <div v-if="props.selectedRow" class="context-element">
         <span class="d-flex"><i class="mdi mdi-18px mdi-content-copy text-light pr-1" /> {{ $t('word.copy') }}</span>
         <i class="mdi mdi-18px mdi-chevron-right text-light pl-1" />
         <div class="context-submenu">
            <div
               v-if="props.selectedRow"
               class="context-element"
               @click="copyCell"
            >
               <span class="d-flex">
                  <i class="mdi mdi-18px mdi-numeric-0 mdi-rotate-90 text-light pr-1" /> {{ $tc('word.cell', 1) }}
               </span>
            </div>
            <div
               v-if="props.selectedRow"
               class="context-element"
               @click="copyRow"
            >
               <span class="d-flex">
                  <i class="mdi mdi-18px mdi-table-row text-light pr-1" /> {{ $tc('word.row', 1) }}
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
            <i class="mdi mdi-18px mdi-close-circle-outline text-light pr-1" /> {{ $t('message.killProcess') }}
         </span>
      </div>
   </BaseContextMenu>
</template>

<script setup lang="ts">
import BaseContextMenu from '@/components/BaseContextMenu.vue';

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
