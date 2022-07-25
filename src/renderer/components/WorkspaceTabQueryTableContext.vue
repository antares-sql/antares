<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="closeContext"
   >
      <div v-if="selectedRows.length === 1" class="context-element">
         <span class="d-flex"><i class="mdi mdi-18px mdi-content-copy text-light pr-1" /> {{ t('word.copy') }}</span>
         <i class="mdi mdi-18px mdi-chevron-right text-light pl-1" />
         <div class="context-submenu">
            <div
               v-if="selectedRows.length === 1"
               class="context-element"
               @click="copyCell"
            >
               <span class="d-flex">
                  <i class="mdi mdi-18px mdi-numeric-0 mdi-rotate-90 text-light pr-1" /> {{ t('word.cell', 1) }}
               </span>
            </div>
            <div
               v-if="selectedRows.length === 1"
               class="context-element"
               @click="copyRow('json')"
            >
               <span class="d-flex">
                  <i class="mdi mdi-18px mdi-table-row text-light pr-1" /> {{ t('word.row', 1) }} (JSON)
               </span>
            </div>
            <div
               v-if="selectedRows.length === 1"
               class="context-element"
               @click="copyRow('sql')"
            >
               <span class="d-flex">
                  <i class="mdi mdi-18px mdi-table-row text-light pr-1" /> {{ t('word.row', 1) }} (SQL INSERT)
               </span>
            </div>
         </div>
      </div>
      <div
         v-if="selectedRows.length === 1 && selectedCell.isEditable && mode === 'table'"
         class="context-element"
         @click="duplicateRow"
      >
         <span class="d-flex">
            <i class="mdi mdi-18px mdi-content-duplicate text-light pr-1" /> {{ t('word.duplicate') }}
         </span>
      </div>
      <div
         v-if="selectedRows.length === 1 && selectedCell.isEditable"
         class="context-element"
         @click="setNull"
      >
         <span class="d-flex">
            <i class="mdi mdi-18px mdi-null text-light pr-1" /> {{ t('message.setNull') }}
         </span>
      </div>
      <div
         v-if="selectedCell.isEditable"
         class="context-element"
         @click="showConfirmModal"
      >
         <span class="d-flex">
            <i class="mdi mdi-18px mdi-delete text-light pr-1" /> {{ t('message.deleteRows', selectedRows.length) }}
         </span>
      </div>
   </BaseContextMenu>
</template>

<script setup lang="ts">
import { Prop } from 'vue';
import BaseContextMenu from '@/components/BaseContextMenu.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps({
   contextEvent: MouseEvent,
   selectedRows: Array,
   selectedCell: Object,
   mode: String as Prop<'table' | 'query'>
});

const emit = defineEmits([
   'show-delete-modal',
   'close-context',
   'set-null',
   'copy-cell',
   'copy-row',
   'duplicate-row'
]);

const showConfirmModal = () => {
   emit('show-delete-modal');
};

const closeContext = () => {
   emit('close-context');
};

const setNull = () => {
   emit('set-null');
   closeContext();
};

const copyCell = () => {
   emit('copy-cell');
   closeContext();
};

const copyRow = (format: string) => {
   emit('copy-row', format);
   closeContext();
};

const duplicateRow = () => {
   emit('duplicate-row');
   closeContext();
};
</script>
