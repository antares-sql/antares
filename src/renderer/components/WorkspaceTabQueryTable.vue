<template>
   <div
      ref="tableWrapper"
      class="vscroll no-outline"
      tabindex="0"
      :style="{ 'height': resultsSize + 'px' }"
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
            :class="{ 'active': resultsetIndex === index }"
            @click="selectResultset(index)"
         >
            <a>{{ result.fields ? result.fields[0]?.tableAlias ?? result.fields[0]?.table : `${t('general.results')} #${index}` }} ({{ result.rows.length }})</a>
         </li>
      </ul>
      <div ref="table" class="table table-hover">
         <div class="thead">
            <div class="tr">
               <div
                  v-for="(field, index) in filteredFields"
                  :key="index"
                  class="th c-hand"
                  :title="`${field.type} ${fieldLength(field) ? `(${fieldLength(field)})` : ''}`"
               >
                  <div ref="columnResize" class="column-resizable">
                     <div class="table-column-title" @click="sort(field)">
                        <div v-if="field.key" :title="keyName(field.key)">
                           <BaseIcon
                              icon-name="mdiKey"
                              :rotate="45"
                              :size="14"
                              class="column-key c-help mt-1 mr-1"
                              :class="`key-${field.key}`"
                           />
                        </div>
                        <span>{{ field.alias || field.name }}</span>
                        <BaseIcon
                           v-if="isSortable && currentSort[resultsetIndex]?.field === field.name || currentSort[resultsetIndex]?.field === `${field.tableAlias || field.table}.${field.name}`"
                           :icon-name="currentSort[resultsetIndex].dir === 'asc' ? 'mdiSortAscending' : 'mdiSortDescending'"
                           :size="18"
                           class="sort-icon ml-1"
                        />
                        <BaseIcon
                           v-else
                           icon-name="mdiMinus"
                           :size="18"
                           class="sort-icon d-invisible"
                        />
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
                  :class="{ 'selected': selectedRows.includes(row._antares_id) }"
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
               <BaseIcon
                  icon-name="mdiDelete"
                  class="mr-1"
                  :size="24"
               />
               <span class="cut-text">{{ t('database.deleteRows', selectedRows.length) }}</span>
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ t('database.confirmToDeleteRows', selectedRows.length) }}
            </div>
         </template>
      </ConfirmModal>

      <ConfirmModal
         v-if="chunkModalRequest"
         @confirm="downloadTable('sql', chunkModalRequest as string, true)"
         @hide="chunkModalRequest = false"
      >
         <template #header>
            <div class="d-flex">
               <BaseIcon
                  icon-name="mdiFileExport"
                  class="mr-1"
                  :size="24"
               />
               <span class="cut-text">{{ t('database.sqlExportOptions') }}</span>
            </div>
         </template>
         <template #body>
            <div class="columns">
               <label class="column col-12 h6 mb-2 cut-text">{{ t('database.targetTable') }}</label>
               <div class="column col-12">
                  <input
                     v-model.number="sqlExportOptions.targetTable"
                     type="text"
                     class="form-input"
                     :placeholder="chunkModalRequest"
                  >
               </div>
               <label class="column col-12 h6 mb-2 mt-4 cut-text">{{ t('database.newInsertStmtEvery') }}:</label>
               <div class="column col-6">
                  <input
                     v-model.number="sqlExportOptions.sqlInsertAfter"
                     type="number"
                     class="form-input"
                  >
               </div>
               <div class="column col-6">
                  <BaseSelect
                     v-model="sqlExportOptions.sqlInsertDivider"
                     class="form-select"
                     :options="[{ value: 'bytes', label: 'KiB' }, { value: 'rows', label: t('database.row', 2) }]"
                  />
               </div>
            </div>
         </template>
      </ConfirmModal>

      <ConfirmModal
         v-if="csvModalRequest"
         @confirm="downloadTable('csv', csvModalRequest as string, true)"
         @hide="csvModalRequest = false"
      >
         <template #header>
            <div class="d-flex">
               <BaseIcon
                  icon-name="mdiFileExport"
                  class="mr-1"
                  :size="24"
               />
               <span class="cut-text">{{ t('application.csvExportOptions') }}</span>
            </div>
         </template>
         <template #body>
            <div class="columns">
               <div class="form-group column col-12 columns col-gapless">
                  <div class="column col-5">
                     <label class="form-label cut-text">{{ t('application.csvFieldDelimiter') }}:</label>
                  </div>
                  <div class="column col-7">
                     <input
                        v-model.number="csvExportOptions.fieldDelimiter"
                        type="string"
                        class="form-input"
                     >
                  </div>
               </div>
               <div class="form-group column col-12 columns col-gapless">
                  <div class="column col-5">
                     <label class="form-label cut-text">{{ t('application.csvStringDelimiter') }}:</label>
                  </div>
                  <div class="column col-7">
                     <BaseSelect
                        v-model="csvExportOptions.stringDelimiter"
                        class="form-select"
                        :options="[
                           { value: '', label: t('general.none') },
                           { value: 'single', label: t('general.singleQuote') },
                           { value: 'double', label: t('general.doubleQuote') }
                        ]"
                     />
                  </div>
               </div>
               <div class="form-group column col-12 columns col-gapless">
                  <div class="column col-5">
                     <label class="form-label cut-text">{{ t('application.csvLinesTerminator') }}:</label>
                  </div>
                  <div class="column col-7">
                     <textarea
                        v-model.number="csvExportOptions.linesTerminator"
                        class="form-input"
                        :style="'resize: none'"
                        rows="1"
                     />
                  </div>
               </div>
               <div class="form-group column col-12 columns col-gapless">
                  <div class="column col-5">
                     <label class="form-label">
                        {{ t('application.csvIncludeHeader') }}
                     </label>
                  </div>
                  <div class="column col-7">
                     <label
                        class="form-switch d-inline-block"
                        @click.prevent="csvExportOptions.header = !csvExportOptions.header"
                     >
                        <input type="checkbox" :checked="csvExportOptions.header">
                        <i class="form-icon" />
                     </label>
                  </div>
               </div>
            </div>
         </template>
      </ConfirmModal>
   </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BLOB, DATE, DATETIME, LONG_TEXT, TEXT, TIME } from 'common/fieldTypes';
import { QueryResult, TableField } from 'common/interfaces/antares';
import { TableUpdateParams } from 'common/interfaces/tableApis';
import { fakerCustom } from 'common/libs/fakerCustom';
import { jsonToSqlInsert } from 'common/libs/sqlUtils';
import { uidGen } from 'common/libs/uidGen';
import * as json2php from 'json2php';
import * as moment from 'moment';
import { storeToRefs } from 'pinia';
import { Component, computed, nextTick, onMounted, onUnmounted, onUpdated, Prop, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import BaseVirtualScroll from '@/components/BaseVirtualScroll.vue';
import TableContext from '@/components/WorkspaceTabQueryTableContext.vue';
import WorkspaceTabQueryTableRow from '@/components/WorkspaceTabQueryTableRow.vue';
import { copyText } from '@/libs/copyText';
import { unproxify } from '@/libs/unproxify';
import { useConsoleStore } from '@/stores/console';
import { useSettingsStore } from '@/stores/settings';
import { useWorkspacesStore } from '@/stores/workspaces';

import { exportRows } from '../libs/exportRows';

const { t } = useI18n();

const settingsStore = useSettingsStore();
const consoleStore = useConsoleStore();
const { getWorkspace } = useWorkspacesStore();

const { /* dataTabLimit: pageSize, */ defaultCopyType } = storeToRefs(settingsStore);

const { consoleHeight } = storeToRefs(consoleStore);

const props = defineProps({
   results: Array as Prop<QueryResult[]>,
   connUid: String,
   isQuering: Boolean,
   mode: String as Prop<'table' | 'query'>,
   page: {
      type: Number,
      required: false
   },
   isSelected: Boolean,
   elementType: { type: String, default: 'table' }
});

const emit = defineEmits([
   'update-field',
   'delete-selected',
   'hard-sort',
   'duplicate-row'
]);

const resultTable: Ref<Component & { updateWindow: () => void }> = ref(null);
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
const currentSort: Ref<{field: string; dir: 'asc' | 'desc'}[]> = ref([]);
const resultsetIndex = ref(0);
const scrollElement = ref(null);
const rowHeight = ref(23);
const selectedField = ref(null);
const isEditingRow = ref(false);
const chunkModalRequest: Ref<false | string> = ref(false);
const csvModalRequest: Ref<false | string> = ref(false);
const sqlExportOptions = ref({
   sqlInsertAfter: 250,
   sqlInsertDivider: 'bytes' as 'bytes' | 'rows',
   targetTable: ''
});
const csvExportOptions = ref({
   header: true,
   fieldDelimiter: ';',
   linesTerminator: '\n',
   stringDelimiter: 'double'
});

const workspaceSchema = computed(() => getWorkspace(props.connUid).breadcrumbs.schema);
const workspaceClient = computed(() => getWorkspace(props.connUid).client);
const customizations = computed(() => getWorkspace(props.connUid).customizations);

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

// const isHardSort = computed(() => {
//    return props.mode === 'table' && localResults.value.length === pageSize.value;
// });

const sortedResults = computed(() => {
   // if (currentSort.value[resultsetIndex.value] && !isHardSort.value) {
   //    const sortObj = currentSort.value[resultsetIndex.value];

   //    return [...localResults.value].sort((a: any, b: any) => {
   //       const modifier = sortObj.dir === 'desc' ? -1 : 1;
   //       let valA = a[sortObj.field];
   //       let valB = b[sortObj.field];

   //       // Handle null values
   //       if (valA === null && valB !== null) return sortObj.dir === 'asc' ? -1 : 1;
   //       if (valA !== null && valB === null) return sortObj.dir === 'asc' ? 1 : -1;
   //       if (valA === null && valB === null) return 0;

   //       valA = typeof valA === 'string' ? valA.toLowerCase() : valA;
   //       valB = typeof valB === 'string' ? valB.toLowerCase() : valB;

   //       if (typeof valA !== 'number' && !isNaN(valA)) valA = String(Number(valA));
   //       if (typeof valB !== 'number' && !isNaN(valB)) valB = String(Number(valB));

   //       if (valA < valB) return -1 * modifier;
   //       if (valA > valB) return 1 * modifier;
   //       return 0;
   //    });
   // }
   // else
   return localResults.value;
});

const resultsWithRows = computed(() => props.results.filter(result => result.rows.length));
const fields = computed(() => resultsWithRows.value.length ? resultsWithRows.value[resultsetIndex.value].fields : []);
const filteredFields = computed(() => fields.value.reduce((acc, cur) => {
   if (acc.findIndex(f => JSON.stringify(f) === JSON.stringify(cur)))
      acc.push(cur);
   return acc;
}, [] as TableField[]));
const keyUsage = computed(() => resultsWithRows.value.length ? resultsWithRows.value[resultsetIndex.value].keys : []);

const fieldsObj = computed(() => {
   if (sortedResults.value.length) {
      const fieldsObj: { [key: string]: TableField } = {};
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
      case 'fk':
         return 'REFERENCES';
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

const updateField = (payload: { field: string; type: string; content: any }, row: { [key: string]: any }) => {
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
   if (e && e.code !== 'Delete') return;
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
   console.log(params);
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
   copyText(valueToCopy);
};

const copyRow = (format: string) => {
   let contentToCopy;

   if (selectedRows.value.length === 1) {
      const row = localResults.value.find((row: any) => selectedRows.value.includes(row._antares_id));
      const rowToCopy = unproxify(row);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
      copyText(JSON.stringify(contentToCopy));
   else if (format === 'sql') {
      if (!Array.isArray(contentToCopy)) contentToCopy = [contentToCopy];

      const sqlInserts = jsonToSqlInsert({
         json: contentToCopy,
         client: workspaceClient.value,
         fields: fieldsObj.value as {
            [key: string]: { type: string; datePrecision: number };
         },
         table: getTable(resultsetIndex.value)
      });
      copyText(sqlInserts);
   }
   else if (format === 'csv') {
      const csv = [];
      if (!Array.isArray(contentToCopy)) contentToCopy = [contentToCopy];

      if (contentToCopy.length)
         csv.push(Object.keys(contentToCopy[0]).join(';'));

      for (const row of contentToCopy)
         csv.push(Object.values(row).map(col => typeof col === 'string' ? `"${col}"` : col).join(';'));

      copyText(csv.join('\n'));
   }
   else if (format === 'html') {
      const arrayContent = new Array<string[]>();
      if (!Array.isArray(contentToCopy)) contentToCopy = [contentToCopy];

      for (const row of contentToCopy)
         arrayContent.push(Object.values(row));

      const htmlContent = createHtmlTable(arrayContent);
      const htmlBlob = new Blob([htmlContent.outerHTML], { type: 'text/html' });
      const textBlob = new Blob([arrayContent.map(row => row.join('\t')).join('\n')], { type: 'text/plain' });
      const data = [new ClipboardItem({
         'text/plain': textBlob,
         'text/html': htmlBlob
      })];

      navigator.clipboard.write(data);
   }
   else if (format === 'php') {
      if (!Array.isArray(contentToCopy)) contentToCopy = [contentToCopy];
      const printer = json2php.make({ linebreak: '\n', indent: '\t', shortArraySyntax: true });
      const phpString = printer(contentToCopy);
      copyText(phpString);
   }
};

const createHtmlTable = (tableData: Array<string[]>) => {
   const table = document.createElement('table');
   const tableBody = document.createElement('tbody');
   tableData.forEach(function (rowData: Array<string>) {
      const row = document.createElement('tr');

      rowData.forEach(function (cellData: string) {
         const cell = document.createElement('td');
         cell.appendChild(document.createTextNode(cellData));
         row.appendChild(cell);
      });

      tableBody.appendChild(row);
   });

   table.appendChild(tableBody);
   return table;
};

const fillCell = (event: { name: string; group: string; type: string }) => {
   const row = localResults.value.find((row: any) => selectedRows.value.includes(row._antares_id));
   let fakeValue;
   let datePrecision = '';

   if (['datetime', 'time'].includes(event.group)) {
      for (let i = 0; i < selectedCell.value.length; i++)
         datePrecision += i === 0 ? '.S' : 'S';
   }

   fakeValue = (fakerCustom as any)[event.group][event.name]();
   const isDateType = [...DATE, ...DATETIME].includes(selectedCell.value.type);
   if (isDateType)
      fakeValue = moment(fakeValue).format(`YYYY-MM-DD HH:mm:ss${datePrecision}`);
   else if (['string', 'number'].includes(typeof fakeValue)) {
      if (typeof fakeValue === 'number')
         fakeValue = String(fakeValue);
      if (selectedCell.value.length)
         fakeValue = fakeValue.substring(0, selectedCell.value.length < 1024 ? Number(selectedCell.value.length) : 1024);
   }
   else if (TIME.includes(selectedCell.value.type))
      fakeValue = moment(fakeValue).format(`HH:mm:ss${datePrecision}`);

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

      if (e.type === 'blur')
         hasFocus.value = false;
   }

   selectedField.value = null;
};

const contextMenu = (event: MouseEvent, cell: any) => {
   if ((event.target as HTMLElement).localName === 'input') return;

   selectedCell.value = cell;
   if (!selectedRows.value.includes(cell.id))
      selectedRows.value = [cell.id];
   contextEvent.value = event;
   isContext.value = true;
};

const sort = (field: TableField) => {
   if (!isSortable.value || props.isQuering) return;

   selectedRows.value = [];
   let fieldName = field.name;
   const hasTableInFieldname = Object.keys(localResults.value[0]).find(k => k !== '_antares_id').includes('.');

   if (props.mode === 'query' && hasTableInFieldname)
      fieldName = `${field.tableAlias || field.table}.${field.name}`;

   if (fieldName === currentSort.value[resultsetIndex.value]?.field) {
      if (currentSort.value[resultsetIndex.value].dir === 'asc')
         currentSort.value[resultsetIndex.value].dir = 'desc';
      else
         resetSort();
   }
   else {
      currentSort.value[resultsetIndex.value] = {
         field: fieldName,
         dir: 'asc'
      };
   }

   // if (isHardSort.value) {
   emit('hard-sort', {
      field: currentSort.value[resultsetIndex.value].field,
      dir: currentSort.value[resultsetIndex.value].dir
   });
   // }
};

const resetSort = () => {
   currentSort.value[resultsetIndex.value] = {
      field: null,
      dir: 'asc'
   };
};

const selectResultset = (index: number) => {
   resultsetIndex.value = index;
};

const downloadTable = (format: 'csv' | 'json' | 'sql' | 'php', table: string, popup = false) => {
   if (!sortedResults.value) return;

   if (format === 'sql' && !popup && customizations.value.exportByChunks) {
      sqlExportOptions.value = {
         sqlInsertAfter: 250,
         sqlInsertDivider: 'bytes' as 'bytes' | 'rows',
         targetTable: ''
      };
      chunkModalRequest.value = table;
      return;
   }
   else if (format === 'csv' && !popup) {
      csvExportOptions.value = {
         header: true,
         fieldDelimiter: ';',
         linesTerminator: '\\n',
         stringDelimiter: 'double'
      };
      csvModalRequest.value = table;
      return;
   }
   else {
      chunkModalRequest.value = false;
      csvModalRequest.value = false;
   }

   const rows = sortedResults.value.map((row: any) => {
      const clonedRow = { ...row };
      delete clonedRow._antares_id;
      return clonedRow;
   });

   exportRows({
      type: format,
      content: rows,
      fields: JSON.parse(JSON.stringify(fieldsObj.value)) as {
         [key: string]: { type: string; datePrecision: number };
      },
      client: workspaceClient.value,
      table,
      page: props.page,
      sqlOptions: popup ? { ...sqlExportOptions.value } : null,
      csvOptions: popup ? { ...csvExportOptions.value } : null
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

   if ((e.ctrlKey || e.metaKey) && e.code === 'KeyC' && !e.altKey) {
      const copyType = defaultCopyType.value;
      if (selectedRows.value.length >= 1) {
         if (selectedRows.value.length === 1 && copyType === 'cell')
            await copyText(scrollElement.value.querySelector('.td.selected').innerText);
         else if (selectedRows.value.length > 1 && copyType === 'cell')
            copyRow('html');
         else
            copyRow(copyType);
      }
   }

   // row navigation stuff
   if (!(e.ctrlKey || e.metaKey) && (e.code.includes('Arrow') || e.code === 'Tab') && sortedResults.value.length > 0 && !e.altKey) {
      e.preventDefault();

      const aviableFields = Object.keys(sortedResults.value[0]).slice(0, -1); // removes _antares_id

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

               if (nextIndex > sortedResults.value.length - 1)
                  nextIndex = sortedResults.value.length - 1;

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

               if (nextFieldIndex > aviableFields.length - 1)
                  nextFieldIndex = 0;

               break;

            case 'ArrowLeft':
               nextIndex = selectedIndex;
               nextFieldIndex = selectedFieldIndex - 1;

               if (nextFieldIndex < 0)
                  nextFieldIndex = aviableFields.length - 1;

               break;

            case 'Tab':
               nextIndex = selectedIndex;
               if (e.shiftKey) {
                  nextFieldIndex = selectedFieldIndex - 1;
                  if (nextFieldIndex < 0)
                     nextFieldIndex = aviableFields.length - 1;
               }
               else {
                  nextFieldIndex = selectedFieldIndex + 1;
                  if (nextFieldIndex > aviableFields.length - 1)
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
