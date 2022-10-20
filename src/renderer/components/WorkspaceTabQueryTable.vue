<template>
   <div
      ref="tableWrapper"
      class="vscroll no-outline"
      tabindex="0"
      :style="{'height': resultsSize+'px'}"
      @blur="deselectRows"
      @focus="hasFocus = true"
      @keyup.delete="showDeleteConfirmModal"
      @keydown.esc="deselectRows"
   >
      <TableContext
         v-if="isContext"
         :context-event="contextEvent"
         :selected-rows="selectedRows"
         :selected-cell="selectedCell"
         :mode="mode"
         @show-delete-modal="showDeleteConfirmModal"
         @set-null="setNull"
         @copy-cell="copyCell"
         @fill-cell="fillCell"
         @copy-row="copyRow"
         @duplicate-row="duplicateRow"
         @close-context="closeContext"
      />
      <ul v-if="resultsWithRows.length > 1" class="tab tab-block result-tabs">
         <li
            v-for="(result, index) in resultsWithRows"
            :key="index"
            class="tab-item"
            :class="{'active': resultsetIndex === index}"
            @click="selectResultset(index)"
         >
            <a>{{ result.fields ? result.fields[0].table : '' }} ({{ result.rows.length }})</a>
         </li>
      </ul>
      <div ref="table" class="table table-hover">
         <div class="thead">
            <div class="tr">
               <div
                  v-for="(field, index) in fields"
                  :key="index"
                  class="th c-hand"
                  :title="`${field.type} ${fieldLength(field) ? `(${fieldLength(field)})` : ''}`"
               >
                  <div ref="columnResize" class="column-resizable">
                     <div class="table-column-title" @click="sort(field.name)">
                        <i
                           v-if="field.key"
                           class="mdi mdi-key column-key c-help"
                           :class="`key-${field.key}`"
                           :title="keyName(field.key)"
                        />
                        <span>{{ field.alias || field.name }}</span>
                        <i
                           v-if="isSortable && currentSort === field.name || currentSort === `${field.table}.${field.name}`"
                           class="mdi sort-icon"
                           :class="currentSortDir === 'asc' ? 'mdi-sort-ascending':'mdi-sort-descending'"
                        />
                        <i v-else class="mdi sort-icon mdi-minus d-invisible" />
                     </div>
                  </div>
               </div>
            </div>
         </div>
         <BaseVirtualScroll
            v-if="resultsWithRows[resultsetIndex] && resultsWithRows[resultsetIndex].rows"
            ref="resultTable"
            :items="sortedResults"
            :item-height="rowHeight"
            class="tbody"
            :visible-height="resultsSize"
            :scroll-element="scrollElement"
         >
            <template #default="{ items }">
               <WorkspaceTabQueryTableRow
                  v-for="row in items"
                  :key="row._antares_id"
                  :item-height="rowHeight"
                  :row="row"
                  :fields="fieldsObj"
                  :key-usage="keyUsage"
                  :element-type="elementType"
                  :class="{'selected': selectedRows.includes(row._antares_id)}"
                  :selected="selectedRows.includes(row._antares_id)"
                  :selected-cell="selectedRows.length === 1 && selectedRows.includes(row._antares_id) ? selectedField : null"
                  @start-editing="isEditingRow = true"
                  @stop-editing="isEditingRow = false"
                  @select-row="selectRow"
                  @update-field="updateField($event, row)"
                  @contextmenu="contextMenu"
               />
            </template>
         </BaseVirtualScroll>
      </div>

      <ConfirmModal
         v-if="isDeleteConfirmModal"
         @confirm="deleteSelected"
         @hide="hideDeleteConfirmModal"
      >
         <template #header>
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-delete mr-1" />
               <span class="cut-text">{{ t('message.deleteRows', selectedRows.length) }}</span>
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ t('message.confirmToDeleteRows', selectedRows.length) }}
            </div>
         </template>
      </ConfirmModal>
   </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, computed, nextTick, onMounted, onUnmounted, onUpdated, Prop, ref, Ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { uidGen } from 'common/libs/uidGen';
import { useSettingsStore } from '@/stores/settings';
import { useWorkspacesStore } from '@/stores/workspaces';
import { useConsoleStore } from '@/stores/console';
import { exportRows } from '../libs/exportRows';
import { TEXT, LONG_TEXT, BLOB, DATE, DATETIME, TIME } from 'common/fieldTypes';
import BaseVirtualScroll from '@/components/BaseVirtualScroll.vue';
import WorkspaceTabQueryTableRow from '@/components/WorkspaceTabQueryTableRow.vue';
import TableContext from '@/components/WorkspaceTabQueryTableContext.vue';
import ConfirmModal from '@/components/BaseConfirmModal.vue';
import * as moment from 'moment';
import { useI18n } from 'vue-i18n';
import { TableField, QueryResult } from 'common/interfaces/antares';
import { TableUpdateParams } from 'common/interfaces/tableApis';
import { jsonToSqlInsert } from 'common/libs/sqlUtils';
import { unproxify } from '@/libs/unproxify';
import faker from '@faker-js/faker';

const { t } = useI18n();

const settingsStore = useSettingsStore();
const consoleStore = useConsoleStore();
const { getWorkspace } = useWorkspacesStore();

const { dataTabLimit: pageSize } = storeToRefs(settingsStore);

const { consoleHeight } = storeToRefs(consoleStore);

const props = defineProps({
   results: Array as Prop<QueryResult[]>,
   connUid: String,
   mode: String as Prop<'table' | 'query'>,
   isSelected: Boolean,
   elementType: { type: String, default: 'table' }
});

const emit = defineEmits([
   'update-field',
   'delete-selected',
   'hard-sort',
   'duplicate-row'
]);

const resultTable: Ref<Component & {updateWindow: () => void}> = ref(null);
const tableWrapper: Ref<HTMLDivElement> = ref(null);
const table: Ref<HTMLDivElement> = ref(null);
const resultsSize = ref(0);
const localResults: Ref<QueryResult<any>[]> = ref([]);
const isContext = ref(false);
const isDeleteConfirmModal = ref(false);
const hasFocus = ref(false);
const contextEvent = ref(null);
const selectedCell = ref(null);
const selectedRows = ref([]);
const currentSort = ref('');
const currentSortDir = ref('asc');
const resultsetIndex = ref(0);
const scrollElement = ref(null);
const rowHeight = ref(23);
const selectedField = ref(null);
const isEditingRow = ref(false);

const workspaceSchema = computed(() => getWorkspace(props.connUid).breadcrumbs.schema);
const workspaceClient = computed(() => getWorkspace(props.connUid).client);

const primaryField = computed(() => {
   const primaryFields = fields.value.filter(field => field.key === 'pri');
   const uniqueFields = fields.value.filter(field => field.key === 'uni');

   if ((primaryFields.length > 1 || !primaryFields.length) && (uniqueFields.length > 1 || !uniqueFields.length))
      return null;

   return primaryFields[0] || uniqueFields[0];
});

const isSortable = computed(() => {
   return fields.value.every(field => field.name);
});

const isHardSort = computed(() => {
   return props.mode === 'table' && localResults.value.length === pageSize.value;
});

const sortedResults = computed(() => {
   if (currentSort.value && !isHardSort.value) {
      return [...localResults.value].sort((a: any, b: any) => {
         let modifier = 1;
         let valA = typeof a[currentSort.value] === 'string' ? a[currentSort.value].toLowerCase() : a[currentSort.value];
         if (!isNaN(valA)) valA = Number(valA);
         let valB = typeof b[currentSort.value] === 'string' ? b[currentSort.value].toLowerCase() : b[currentSort.value];
         if (!isNaN(valB)) valB = Number(valB);
         if (currentSortDir.value === 'desc') modifier = -1;
         if (valA < valB) return -1 * modifier;
         if (valA > valB) return 1 * modifier;
         return 0;
      });
   }
   else
      return localResults.value;
});

const resultsWithRows = computed(() => props.results.filter(result => result.rows));
const fields = computed(() => resultsWithRows.value.length ? resultsWithRows.value[resultsetIndex.value].fields : []);
const keyUsage = computed(() => resultsWithRows.value.length ? resultsWithRows.value[resultsetIndex.value].keys : []);

const fieldsObj = computed(() => {
   if (sortedResults.value.length) {
      const fieldsObj: {[key: string]: TableField} = {};
      for (const key in sortedResults.value[0]) {
         if (key === '_antares_id') continue;

         const fieldObj = fields.value.find(field => {
            let fieldNames = [
               field.name,
               field.alias,
               `${field.table}.${field.name}`,
               `${field.table}.${field.alias}`,
               `${field.tableAlias}.${field.name}`,
               `${field.tableAlias}.${field.alias}`
            ];

            if (field.table)
               fieldNames = [...fieldNames, `${field.table.toLowerCase()}.${field.name}`, `${field.table.toLowerCase()}.${field.alias}`];

            if (field.tableAlias)
               fieldNames = [...fieldNames, `${field.tableAlias.toLowerCase()}.${field.name}`, `${field.tableAlias.toLowerCase()}.${field.alias}`];

            return fieldNames.includes(key);
         });

         fieldsObj[key] = fieldObj;
      }
      return fieldsObj;
   }
   return {};
});

const fieldLength = (field: TableField) => {
   if ([...BLOB, ...LONG_TEXT].includes(field.type)) return null;
   else if (TEXT.includes(field.type)) return field.charLength;
   else if (field.numScale) return `${field.numPrecision}, ${field.numScale}`;
   return field.length;
};

const keyName = (key: string) => {
   switch (key) {
      case 'pri':
         return 'PRIMARY';
      case 'uni':
         return 'UNIQUE';
      case 'mul':
         return 'INDEX';
      default:
         return 'UNKNOWN ' + key;
   }
};

const getTable = (index: number) => {
   if (resultsWithRows.value[index] && resultsWithRows.value[index].fields && resultsWithRows.value[index].fields.length)
      return resultsWithRows.value[index].fields[0].table;
   return '';
};

const getSchema = (index: number) => {
   if (resultsWithRows.value[index] && resultsWithRows.value[index].fields && resultsWithRows.value[index].fields.length)
      return resultsWithRows.value[index].fields[0].schema;
   return workspaceSchema.value;
};

const getPrimaryValue = (row: any) => {
   if (!primaryField.value) return null;

   const primaryFieldName = Object.keys(row).find(prop => [
      primaryField.value.alias,
      primaryField.value.name,
      `${primaryField.value.table}.${primaryField.value.alias}`,
      `${primaryField.value.table}.${primaryField.value.name}`,
      `${primaryField.value.tableAlias}.${primaryField.value.alias}`,
      `${primaryField.value.tableAlias}.${primaryField.value.name}`
   ].includes(prop));
   return row[primaryFieldName];
};

const setLocalResults = () => {
   localResults.value = resultsWithRows.value[resultsetIndex.value] && resultsWithRows.value[resultsetIndex.value].rows
      ? resultsWithRows.value[resultsetIndex.value].rows.map(item => {
         return { ...item, _antares_id: uidGen() };
      })
      : [];
};

const resizeResults = () => {
   if (resultTable.value && props.isSelected) {
      const el = tableWrapper.value;

      if (el) {
         let sizeToSubtract = 0;
         const footer = document.getElementById('footer');
         if (footer) sizeToSubtract += footer.offsetHeight;

         sizeToSubtract += consoleHeight.value;

         const size = window.innerHeight - el.getBoundingClientRect().top - sizeToSubtract;
         resultsSize.value = size;
      }
      resultTable.value.updateWindow();
   }
};

const refreshScroller = () => resizeResults();

const updateField = (payload: { field: string; type: string; content: any }, row: {[key: string]: any}) => {
   const orgRow: any = localResults.value.find((lr: any) => lr._antares_id === row._antares_id);

   Object.keys(orgRow).forEach(key => { // remap the row
      if (orgRow[key] instanceof Date && moment(orgRow[key]).isValid()) { // if datetime
         let datePrecision = '';
         const precision = fields.value.find(field => field.name === key)?.datePrecision;
         for (let i = 0; i < precision; i++)
            datePrecision += i === 0 ? '.S' : 'S';

         orgRow[key] = moment(orgRow[key]).format(`YYYY-MM-DD HH:mm:ss${datePrecision}`);
      }
   });

   const params = {
      primary: primaryField.value?.name,
      schema: getSchema(resultsetIndex.value),
      table: getTable(resultsetIndex.value),
      id: getPrimaryValue(orgRow),
      row,
      orgRow,
      ...payload
   };
   emit('update-field', params);
};

const closeContext = () => {
   isContext.value = false;
};

const showDeleteConfirmModal = (e: any) => {
   if (e && e.path && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.path[0].tagName))
      return;
   if (selectedRows.value.length === 0) return;

   isDeleteConfirmModal.value = true;
};

const hideDeleteConfirmModal = () => {
   isDeleteConfirmModal.value = false;
};

const deleteSelected = () => {
   closeContext();
   const rows = JSON.parse(JSON.stringify(localResults.value)).filter((row: any) => selectedRows.value.includes(row._antares_id)).map((row: any) => {
      delete row._antares_id;
      return row;
   });

   const params = {
      primary: primaryField.value?.name,
      schema: getSchema(resultsetIndex.value),
      table: getTable(resultsetIndex.value),
      rows
   };
   emit('delete-selected', params);
};

const setNull = () => {
   const row = localResults.value.find((row: any) => selectedRows.value.includes(row._antares_id));

   const params = {
      primary: primaryField.value?.name,
      schema: getSchema(resultsetIndex.value),
      table: getTable(resultsetIndex.value),
      id: getPrimaryValue(row),
      row,
      orgRow: row,
      field: selectedCell.value.field,
      content: null as string
   };
   emit('update-field', params);
};

const copyCell = () => {
   const row: any = localResults.value.find((row: any) => selectedRows.value.includes(row._antares_id));
   const cellName = Object.keys(row).find(prop => [
      selectedCell.value.field,
      selectedCell.value.orgField,
      `${fields.value[0].table}.${selectedCell.value.field}`,
      `${fields.value[0].tableAlias}.${selectedCell.value.field}`
   ].includes(prop));
   let valueToCopy = row[cellName];
   if (typeof valueToCopy === 'object')
      valueToCopy = JSON.stringify(valueToCopy);
   navigator.clipboard.writeText(valueToCopy);
};

const copyRow = (format: string) => {
   let contentToCopy;

   if (selectedRows.value.length === 1) {
      const row = localResults.value.find((row: any) => selectedRows.value.includes(row._antares_id));
      const rowToCopy = unproxify(row);
      delete rowToCopy._antares_id;
      contentToCopy = rowToCopy;
   }
   else {
      contentToCopy = unproxify(localResults.value).filter((row: any) => selectedRows.value.includes(row._antares_id)).map((row: any) => {
         delete row._antares_id;
         return row;
      });
   }

   if (format === 'json')
      navigator.clipboard.writeText(JSON.stringify(contentToCopy));
   else if (format === 'sql') {
      const sqlInserts = [];
      if (!Array.isArray(contentToCopy)) contentToCopy = [contentToCopy];

      for (const row of contentToCopy) {
         sqlInserts.push(jsonToSqlInsert({
            json: row,
            client: workspaceClient.value,
            fields: fieldsObj.value as {
               [key: string]: {type: string; datePrecision: number};
            },
            table: getTable(resultsetIndex.value)
         }));
      }
      navigator.clipboard.writeText(sqlInserts.join('\n'));
   }
   else if (format === 'csv') {
      const csv = [];
      if (!Array.isArray(contentToCopy)) contentToCopy = [contentToCopy];

      if (contentToCopy.length)
         csv.push(Object.keys(contentToCopy[0]).join(';'));

      for (const row of contentToCopy)
         csv.push(Object.values(row).map(col => typeof col === 'string' ? `"${col}"` : col).join(';'));

      navigator.clipboard.writeText(csv.join('\n'));
   }
};

const fillCell = (event: { name: string; group: string; type: string }) => {
   const row = localResults.value.find((row: any) => selectedRows.value.includes(row._antares_id));
   let fakeValue;
   let datePrecision = '';

   if (['datetime', 'time'].includes(event.group)) {
      for (let i = 0; i < selectedCell.value.length; i++)
         datePrecision += i === 0 ? '.S' : 'S';
   }

   if (event.group === 'custom') {
      if (event.type === 'time' && event.name === 'now')
         fakeValue = moment().format(`HH:mm:ss${datePrecision}`);
      else if (event.type === 'time' && event.name === 'random')
         fakeValue = moment(faker.date.recent()).format(`HH:mm:ss${datePrecision}`);
      else if (event.type === 'datetime' && event.name === 'now')
         fakeValue = moment().format(`YYYY-MM-DD HH:mm:ss${datePrecision}`);
   }
   else {
      fakeValue = (faker as any)[event.group][event.name]();
      if (['string', 'number'].includes(typeof fakeValue)) {
         if (typeof fakeValue === 'number')
            fakeValue = String(fakeValue);

         if (selectedCell.value.length)
            fakeValue = fakeValue.substring(0, selectedCell.value.length < 1024 ? Number(selectedCell.value.length) : 1024);
      }
      else if ([...DATE, ...DATETIME].includes(selectedCell.value.type))
         fakeValue = moment(fakeValue).format(`YYYY-MM-DD HH:mm:ss${datePrecision}`);
      else if (TIME.includes(selectedCell.value.type))
         fakeValue = moment(fakeValue).format(`HH:mm:ss${datePrecision}`);
   }

   const params = {
      primary: primaryField.value?.name,
      schema: getSchema(resultsetIndex.value),
      table: getTable(resultsetIndex.value),
      id: getPrimaryValue(row),
      row,
      orgRow: row,
      field: selectedCell.value.field,
      content: fakeValue
   };

   emit('update-field', params);
};

const duplicateRow = () => {
   const row = localResults.value.find((row: any) => selectedRows.value.includes(row._antares_id));
   const rowToDuplicate = JSON.parse(JSON.stringify(row));
   delete rowToDuplicate._antares_id;
   emit('duplicate-row', rowToDuplicate);
};

const applyUpdate = (params: TableUpdateParams) => {
   const { primary, id, field, table, content } = params;

   localResults.value = localResults.value.map((row: any) => {
      if (row[primary] === id)// only fieldName
         row[field] = content;
      else if (row[`${table}.${primary}`] === id)// table.fieldName
         row[`${table}.${field}`] = content;

      return row;
   });
};

const selectRow = (event: KeyboardEvent, row: any, field: string) => {
   selectedField.value = field;
   const selectedRowId = row._antares_id;

   if (event.ctrlKey || event.metaKey) {
      if (selectedRows.value.includes(selectedRowId))
         selectedRows.value = selectedRows.value.filter(el => el !== selectedRowId);
      else
         selectedRows.value.push(selectedRowId);
   }
   else if (event.shiftKey) {
      if (!selectedRows.value.length)
         selectedRows.value.push(selectedRowId);
      else {
         const lastID = selectedRows.value.slice(-1)[0];
         const lastIndex = sortedResults.value.findIndex((el: any) => el._antares_id === lastID);
         const clickedIndex = sortedResults.value.findIndex((el: any) => el._antares_id === selectedRowId);
         if (lastIndex > clickedIndex) {
            for (let i = clickedIndex; i < lastIndex; i++)
               selectedRows.value.push((sortedResults.value[i] as any)._antares_id);
         }
         else if (lastIndex < clickedIndex) {
            for (let i = clickedIndex; i > lastIndex; i--)
               selectedRows.value.push((sortedResults.value[i] as any)._antares_id);
         }
      }
   }
   else
      selectedRows.value = [selectedRowId];
};

const selectAllRows = (e: KeyboardEvent) => {
   if ((e.target as HTMLElement).classList.contains('editable-field')) return;

   selectedField.value = 0;
   selectedRows.value = localResults.value.reduce((acc, curr: any) => {
      acc.push(curr._antares_id);
      return acc;
   }, []);
};

const deselectRows = (e: Event) => {
   if (!isEditingRow.value) {
      if (!isDeleteConfirmModal.value)
         selectedRows.value = [];

      selectedField.value = null;

      if (e.type === 'blur')
         hasFocus.value = false;
   }
};

const contextMenu = (event: MouseEvent, cell: any) => {
   if ((event.target as HTMLElement).localName === 'input') return;

   selectedCell.value = cell;
   if (!selectedRows.value.includes(cell.id))
      selectedRows.value = [cell.id];
   contextEvent.value = event;
   isContext.value = true;
};

const sort = (field: string) => {
   if (!isSortable.value) return;

   selectedRows.value = [];

   if (props.mode === 'query')
      field = `${getTable(resultsetIndex.value)}.${field}`;

   if (field === currentSort.value) {
      if (currentSortDir.value === 'asc')
         currentSortDir.value = 'desc';
      else
         resetSort();
   }
   else {
      currentSortDir.value = 'asc';
      currentSort.value = field;
   }

   if (isHardSort.value)
      emit('hard-sort', { field: currentSort.value, dir: currentSortDir.value });
};

const resetSort = () => {
   currentSort.value = '';
   currentSortDir.value = 'asc';
};

const selectResultset = (index: number) => {
   resultsetIndex.value = index;
};

const downloadTable = (format: 'csv' | 'json' | 'sql', table: string) => {
   if (!sortedResults.value) return;

   const rows = JSON.parse(JSON.stringify(sortedResults.value)).map((row: any) => {
      delete row._antares_id;
      return row;
   });

   exportRows({
      type: format,
      content: rows,
      fields: fieldsObj.value as {
         [key: string]: {type: string; datePrecision: number};
      },
      client: workspaceClient.value,
      table
   });
};

const onKey = async (e: KeyboardEvent) => {
   if (!props.isSelected)
      return;

   if (!hasFocus.value)
      return;

   if (isEditingRow.value)
      return;

   if ((e.ctrlKey || e.metaKey) && e.code === 'KeyA' && !e.altKey)
      selectAllRows(e);

   // row navigation stuff
   if (!(e.ctrlKey || e.metaKey) && (e.code.includes('Arrow') || e.code === 'Tab') && sortedResults.value.length > 0 && !e.altKey) {
      e.preventDefault();

      const aviableFields= Object.keys(sortedResults.value[0]).slice(0, -1); // removes _antares_id

      if (!selectedField.value)
         selectedField.value = aviableFields[0];

      const selectedId = selectedRows.value[0];
      const selectedIndex = sortedResults.value.findIndex((row: any) => row._antares_id === selectedId);
      const selectedFieldIndex = aviableFields.findIndex(field => field === selectedField.value);
      let nextIndex = 0;
      let nextFieldIndex = 0;

      if (selectedIndex > -1) {
         switch (e.code) {
            case 'ArrowDown':
               nextIndex = selectedIndex + 1;
               nextFieldIndex = selectedFieldIndex;

               if (nextIndex > sortedResults.value.length -1)
                  nextIndex = sortedResults.value.length -1;

               break;
            case 'ArrowUp':
               nextIndex = selectedIndex - 1;
               nextFieldIndex = selectedFieldIndex;

               if (nextIndex < 0)
                  nextIndex = 0;

               break;

            case 'ArrowRight':
               nextIndex = selectedIndex;
               nextFieldIndex = selectedFieldIndex + 1;

               if (nextFieldIndex > aviableFields.length -1)
                  nextFieldIndex = 0;

               break;

            case 'ArrowLeft':
               nextIndex = selectedIndex;
               nextFieldIndex = selectedFieldIndex - 1;

               if (nextFieldIndex < 0)
                  nextFieldIndex = aviableFields.length -1;

               break;

            case 'Tab':
               nextIndex = selectedIndex;
               if (e.shiftKey) {
                  nextFieldIndex = selectedFieldIndex - 1;
                  if (nextFieldIndex < 0)
                     nextFieldIndex = aviableFields.length -1;
               }
               else {
                  nextFieldIndex = selectedFieldIndex + 1;
                  if (nextFieldIndex > aviableFields.length -1)
                     nextFieldIndex = 0;
               }
         }
      }

      if (sortedResults.value[nextIndex] && nextIndex !== selectedIndex) {
         selectedRows.value = [(sortedResults.value[nextIndex] as any)._antares_id];
         await nextTick();
         scrollToCell(scrollElement.value.querySelector('.td.selected'));
      }

      if (aviableFields[nextFieldIndex] && nextFieldIndex !== selectedFieldIndex) {
         selectedField.value = aviableFields[nextFieldIndex];
         await nextTick();
         scrollToCell(scrollElement.value.querySelector('.td.selected'));
      }
   }
};

const scrollToCell = (el: HTMLElement) => {
   if (!el) return;
   const visYMin = scrollElement.value.scrollTop;
   const visYMax = scrollElement.value.scrollTop + scrollElement.value.clientHeight - el.clientHeight;
   const visXMin = scrollElement.value.scrollLeft;
   const visXMax = scrollElement.value.scrollLeft + scrollElement.value.clientWidth - el.clientWidth;

   if (el.offsetTop < visYMin)
      scrollElement.value.scrollTop = el.offsetTop;

   else if (el.offsetTop >= visYMax)
      scrollElement.value.scrollTop = el.offsetTop - scrollElement.value.clientHeight + el.clientHeight;

   if (el.offsetLeft < visXMin)
      scrollElement.value.scrollLeft = el.offsetLeft;

   else if (el.offsetLeft >= visXMax)
      scrollElement.value.scrollLeft = el.offsetLeft - scrollElement.value.clientWidth + el.clientWidth;
};

defineExpose({
   applyUpdate,
   refreshScroller,
   resetSort,
   resizeResults,
   downloadTable
});

watch(() => props.results, () => {
   setLocalResults();
   resultsetIndex.value = 0;
});

watch(resultsetIndex, () => {
   setLocalResults();
});

watch(() => props.isSelected, async (val) => {
   if (val) {
      await nextTick();
      refreshScroller();
   }
});

watch(consoleHeight, () => {
   resizeResults();
});

onUpdated(() => {
   if (table.value)
      refreshScroller();

   if (tableWrapper.value)
      scrollElement.value = tableWrapper.value;

   document.querySelectorAll<HTMLElement>('.column-resizable').forEach(element => {
      if (element.clientWidth !== 0)
         element.style.width = element.clientWidth + 'px';
   });
});

onMounted(() => {
   window.addEventListener('resize', resizeResults);
   window.addEventListener('keydown', onKey);
});

onUnmounted(() => {
   window.removeEventListener('resize', resizeResults);
   window.removeEventListener('keydown', onKey);
});

</script>

<style lang="scss" scoped>
.vscroll {
  height: 1000px;
  overflow: auto;
  overflow-anchor: none;
}

.column-resizable {
  &:hover,
  &:active {
    resize: horizontal;
    overflow: hidden;
  }
}

.table-column-title {
  display: flex;
  align-items: center;
}

.sort-icon {
  font-size: 0.7rem;
  line-height: 1;
  margin-left: 0.2rem;
}

.result-tabs {
  background: transparent !important;
  margin: 0;
}
</style>
