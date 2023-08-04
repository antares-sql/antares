<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="closeContext"
   >
      <div class="context-element">
         <span class="d-flex"><i class="mdi mdi-18px mdi-content-copy text-light pr-1" /> {{ t('general.copy') }}</span>
         <i class="mdi mdi-18px mdi-chevron-right text-light pl-1" />
         <div class="context-submenu">
            <div
               v-if="selectedRows.length === 1"
               class="context-element"
               @click="copyCell"
            >
               <span class="d-flex">
                  <i class="mdi mdi-18px mdi-numeric-0 mdi-rotate-90 text-light pr-1" /> {{ t('database.cell', 1) }}
               </span>
            </div>
            <div class="context-element" @click="copyRow('html')">
               <span class="d-flex">
                  <i class="mdi mdi-18px mdi-table-row text-light pr-1" /> {{ t('database.row', selectedRows.length) }} ({{ t('database.table') }})
               </span>
            </div>
            <div class="context-element" @click="copyRow('json')">
               <span class="d-flex">
                  <i class="mdi mdi-18px mdi-table-row text-light pr-1" /> {{ t('database.row', selectedRows.length) }} (JSON)
               </span>
            </div>
            <div class="context-element" @click="copyRow('csv')">
               <span class="d-flex">
                  <i class="mdi mdi-18px mdi-table-row text-light pr-1" /> {{ t('database.row', selectedRows.length) }} (CSV)
               </span>
            </div>
            <div class="context-element" @click="copyRow('php')">
               <span class="d-flex">
                  <i class="mdi mdi-18px mdi-table-row text-light pr-1" /> {{ t('database.row', selectedRows.length) }} (PHP)
               </span>
            </div>
            <div class="context-element" @click="copyRow('sql')">
               <span class="d-flex">
                  <i class="mdi mdi-18px mdi-table-row text-light pr-1" /> {{ t('database.row', selectedRows.length) }} (SQL INSERT)
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
            <i class="mdi mdi-18px mdi-content-duplicate text-light pr-1" /> {{ t('general.duplicate') }}
         </span>
      </div>
      <div
         v-if="selectedRows.length === 1 && selectedCell.isEditable && mode === 'table' && fakerGroup"
         class="context-element"
      >
         <span class="d-flex">
            <i class="mdi mdi-18px mdi-auto-fix text-light pr-1" /> {{ t('database.fillCell') }}
         </span>
         <i class="mdi mdi-18px mdi-chevron-right text-light pl-1" />
         <div class="context-submenu">
            <div
               v-for="method in fakerMethods[fakerGroup]"
               :key="method.name"
               class="context-element"
               @click="fillCell(method)"
            >
               <span class="d-flex">
                  {{ t(`faker.${method.name}`) }}
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
            <i class="mdi mdi-18px mdi-null text-light pr-1" /> {{ t('database.setNull') }}
         </span>
      </div>
      <div
         v-if="selectedCell.isEditable"
         class="context-element"
         @click="showConfirmModal"
      >
         <span class="d-flex">
            <i class="mdi mdi-18px mdi-delete text-light pr-1" /> {{ t('database.deleteRows', selectedRows.length) }}
         </span>
      </div>
   </BaseContextMenu>
</template>

<script setup lang="ts">
import { computed, Prop } from 'vue';
import BaseContextMenu from '@/components/BaseContextMenu.vue';
import { useI18n } from 'vue-i18n';
import { TEXT, LONG_TEXT, NUMBER, FLOAT, DATE, TIME, DATETIME, UUID } from 'common/fieldTypes';

const { t } = useI18n();

const props = defineProps({
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
   'duplicate-row',
   'fill-cell'
]);

const fakerMethods = {
   string: [
      { name: 'word', group: 'lorem' },
      { name: 'text', group: 'lorem' },
      { name: 'firstName', group: 'name' },
      { name: 'lastName', group: 'name' },
      { name: 'jobTitle', group: 'name' },
      { name: 'phoneNumber', group: 'phone' },
      { name: 'exampleEmail', group: 'internet' },
      { name: 'ip', group: 'internet' },
      { name: 'domainName', group: 'internet' },
      { name: 'color', group: 'internet' },
      { name: 'uuid', group: 'random' }
   ],
   number: [
      { name: 'number', group: 'random' }
   ],
   float: [
      { name: 'float', group: 'random' },
      { name: 'amount', group: 'finance' }
   ],
   datetime: [
      { name: 'now', group: 'custom' },
      { name: 'past', group: 'date' },
      { name: 'future', group: 'date' }
   ],
   time: [
      { name: 'now', group: 'custom' },
      { name: 'random', group: 'custom' }
   ],
   uuid: [
      { name: 'uuid', group: 'random' }
   ]
};

const fakerGroup = computed(() => {
   if ([...TEXT, ...LONG_TEXT].includes(props.selectedCell.type))
      return 'string';
   else if (NUMBER.includes(props.selectedCell.type))
      return 'number';
   else if (FLOAT.includes(props.selectedCell.type))
      return 'float';
   else if ([...DATE, ...DATETIME].includes(props.selectedCell.type))
      return 'datetime';
   else if (TIME.includes(props.selectedCell.type))
      return 'time';
   else if (UUID.includes(props.selectedCell.type))
      return 'uuid';
   else
      return false;
});

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

const fillCell = (method: {name: string; group: string}) => {
   emit('fill-cell', { ...method, type: fakerGroup.value });
   closeContext();
};
</script>
