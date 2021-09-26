<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="closeContext"
   >
      <div v-if="selectedRow" class="context-element">
         <span class="d-flex"><i class="mdi mdi-18px mdi-content-copy text-light pr-1" /> {{ $t('word.copy') }}</span>
         <i class="mdi mdi-18px mdi-chevron-right text-light pl-1" />
         <div class="context-submenu">
            <div
               v-if="selectedRow"
               class="context-element"
               @click="copyCell"
            >
               <span class="d-flex">
                  <i class="mdi mdi-18px mdi-numeric-0 mdi-rotate-90 text-light pr-1" /> {{ $tc('word.cell', 1) }}
               </span>
            </div>
            <div
               v-if="selectedRow"
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
         v-if="selectedRow"
         class="context-element"
         @click="killProcess"
      >
         <span class="d-flex">
            <i class="mdi mdi-18px mdi-close-circle-outline text-light pr-1" /> {{ $t('message.killProcess') }}
         </span>
      </div>
   </BaseContextMenu>
</template>

<script>
import BaseContextMenu from '@/components/BaseContextMenu';

export default {
   name: 'ModalProcessesListContext',
   components: {
      BaseContextMenu
   },
   props: {
      contextEvent: MouseEvent,
      selectedRow: Number,
      selectedCell: Object
   },
   computed: {
   },
   methods: {
      closeContext () {
         this.$emit('close-context');
      },
      copyCell () {
         this.$emit('copy-cell');
         this.closeContext();
      },
      copyRow () {
         this.$emit('copy-row');
         this.closeContext();
      },
      killProcess () {
         this.$emit('kill-process');
         this.closeContext();
      }
   }
};
</script>
