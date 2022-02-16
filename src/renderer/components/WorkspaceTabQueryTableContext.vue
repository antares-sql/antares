<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="closeContext"
   >
      <div v-if="selectedRows.length === 1" class="context-element">
         <span class="d-flex"><i class="mdi mdi-18px mdi-content-copy text-light pr-1" /> {{ $t('word.copy') }}</span>
         <i class="mdi mdi-18px mdi-chevron-right text-light pl-1" />
         <div class="context-submenu">
            <div
               v-if="selectedRows.length === 1"
               class="context-element"
               @click="copyCell"
            >
               <span class="d-flex">
                  <i class="mdi mdi-18px mdi-numeric-0 mdi-rotate-90 text-light pr-1" /> {{ $tc('word.cell', 1) }}
               </span>
            </div>
            <div
               v-if="selectedRows.length === 1"
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
         v-if="selectedRows.length === 1 && selectedCell.isEditable"
         class="context-element"
         @click="setNull"
      >
         <span class="d-flex">
            <i class="mdi mdi-18px mdi-null text-light pr-1" /> {{ $t('message.setNull') }}
         </span>
      </div>
      <div
         v-if="selectedCell.isEditable"
         class="context-element"
         @click="showConfirmModal"
      >
         <span class="d-flex">
            <i class="mdi mdi-18px mdi-delete text-light pr-1" /> {{ $tc('message.deleteRows', selectedRows.length) }}
         </span>
      </div>
   </BaseContextMenu>
</template>

<script>
import BaseContextMenu from '@/components/BaseContextMenu';

export default {
   name: 'WorkspaceTabQueryTableContext',
   components: {
      BaseContextMenu
   },
   props: {
      contextEvent: MouseEvent,
      selectedRows: Array,
      selectedCell: Object
   },
   methods: {
      showConfirmModal () {
         this.$emit('show-delete-modal');
      },
      closeContext () {
         this.$emit('close-context');
      },
      setNull () {
         this.$emit('set-null');
         this.closeContext();
      },
      copyCell () {
         this.$emit('copy-cell');
         this.closeContext();
      },
      copyRow () {
         this.$emit('copy-row');
         this.closeContext();
      }
   }
};
</script>
