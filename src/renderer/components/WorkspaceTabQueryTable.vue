<template>
   <div
      ref="tableWrapper"
      class="vscroll no-outline"
      tabindex="0"
      :style="{'height': resultsSize+'px'}"
      @keyup.46="showDeleteConfirmModal"
      @keydown.ctrl.65="selectAllRows"
      @keydown.esc="deselectRows"
   >
      <TableContext
         v-if="isContext"
         :context-event="contextEvent"
         :selected-rows="selectedRows"
         :selected-cell="selectedCell"
         @show-delete-modal="showDeleteConfirmModal"
         @set-null="setNull"
         @copy-cell="copyCell"
         @copy-row="copyRow"
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
                     </div>
                  </div>
               </div>
            </div>
         </div>
         <BaseVirtualScroll
            v-if="resultsWithRows[resultsetIndex] && resultsWithRows[resultsetIndex].rows"
            ref="resultTable"
            :items="sortedResults"
            :item-height="23"
            class="tbody"
            :visible-height="resultsSize"
            :scroll-element="scrollElement"
         >
            <template slot-scope="{ items }">
               <WorkspaceTabQueryTableRow
                  v-for="row in items"
                  :key="row._id"
                  :row="row"
                  :fields="fieldsObj"
                  :key-usage="keyUsage"
                  :element-type="elementType"
                  :class="{'selected': selectedRows.includes(row._id)}"
                  @select-row="selectRow($event, row._id)"
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
         <template :slot="'header'">
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-delete mr-1" />
               <span class="cut-text">{{ $tc('message.deleteRows', selectedRows.length) }}</span>
            </div>
         </template>
         <div :slot="'body'">
            <div class="mb-2">
               {{ $tc('message.confirmToDeleteRows', selectedRows.length) }}
            </div>
         </div>
      </ConfirmModal>
   </div>
</template>

<script>
import { uidGen } from 'common/libs/uidGen';
import arrayToFile from '../libs/arrayToFile';
import { TEXT, LONG_TEXT, BLOB } from 'common/fieldTypes';
import BaseVirtualScroll from '@/components/BaseVirtualScroll';
import WorkspaceTabQueryTableRow from '@/components/WorkspaceTabQueryTableRow';
import TableContext from '@/components/WorkspaceTabQueryTableContext';
import ConfirmModal from '@/components/BaseConfirmModal';
import { mapActions, mapGetters } from 'vuex';
import moment from 'moment';

export default {
   name: 'WorkspaceTabQueryTable',
   components: {
      BaseVirtualScroll,
      WorkspaceTabQueryTableRow,
      TableContext,
      ConfirmModal
   },
   props: {
      results: Array,
      connUid: String,
      mode: String,
      isSelected: Boolean,
      elementType: { type: String, default: 'table' }
   },
   data () {
      return {
         resultsSize: 0,
         localResults: [],
         isContext: false,
         isDeleteConfirmModal: false,
         contextEvent: null,
         selectedCell: null,
         selectedRows: [],
         currentSort: '',
         currentSortDir: 'asc',
         resultsetIndex: 0,
         scrollElement: null
      };
   },
   computed: {
      ...mapGetters({
         getWorkspace: 'workspaces/getWorkspace',
         pageSize: 'settings/getDataTabLimit'
      }),
      workspaceSchema () {
         return this.getWorkspace(this.connUid).breadcrumbs.schema;
      },
      primaryField () {
         const primaryFields = this.fields.filter(field => field.key === 'pri');
         const uniqueFields = this.fields.filter(field => field.key === 'uni');

         if ((primaryFields.length > 1 || !primaryFields.length) && (uniqueFields.length > 1 || !uniqueFields.length))
            return false;

         return primaryFields[0] || uniqueFields[0];
      },
      isSortable () {
         return this.fields.every(field => field.name);
      },
      isHardSort () {
         return this.mode === 'table' && this.localResults.length === this.pageSize;
      },
      sortedResults () {
         if (this.currentSort && !this.isHardSort) {
            return [...this.localResults].sort((a, b) => {
               let modifier = 1;
               const valA = typeof a[this.currentSort] === 'string' ? a[this.currentSort].toLowerCase() : a[this.currentSort];
               const valB = typeof b[this.currentSort] === 'string' ? b[this.currentSort].toLowerCase() : b[this.currentSort];
               if (this.currentSortDir === 'desc') modifier = -1;
               if (valA < valB) return -1 * modifier;
               if (valA > valB) return 1 * modifier;
               return 0;
            });
         }
         else
            return this.localResults;
      },
      resultsWithRows () {
         return this.results.filter(result => result.rows);
      },
      fields () {
         return this.resultsWithRows.length ? this.resultsWithRows[this.resultsetIndex].fields : [];
      },
      keyUsage () {
         return this.resultsWithRows.length ? this.resultsWithRows[this.resultsetIndex].keys : [];
      },
      fieldsObj () {
         if (this.sortedResults.length) {
            const fieldsObj = {};
            for (const key in this.sortedResults[0]) {
               if (key === '_id') continue;

               const fieldObj = this.fields.find(field => {
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
      }
   },
   watch: {
      results () {
         this.setLocalResults();
         this.resultsetIndex = 0;
      },
      resultsetIndex () {
         this.setLocalResults();
      },
      isSelected (val) {
         if (val) this.refreshScroller();
      }
   },
   updated () {
      if (this.$refs.table)
         this.refreshScroller();

      if (this.$refs.tableWrapper)
         this.scrollElement = this.$refs.tableWrapper;
   },
   mounted () {
      window.addEventListener('resize', this.resizeResults);
   },
   destroyed () {
      window.removeEventListener('resize', this.resizeResults);
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification'
      }),
      fieldType (cKey) {
         let type = 'unknown';
         const field = this.fields.filter(field => field.name === cKey)[0];
         if (field)
            type = field.type;

         return type;
      },
      fieldPrecision (cKey) {
         let length = 0;
         const field = this.fields.filter(field => field.name === cKey)[0];
         if (field)
            length = field.datePrecision;

         return length;
      },
      fieldLength (field) {
         if ([...BLOB, ...LONG_TEXT].includes(field.type)) return null;
         else if (TEXT.includes(field.type)) return field.charLength;
         return field.length;
      },
      keyName (key) {
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
      },
      getTable (index) {
         if (this.resultsWithRows[index] && this.resultsWithRows[index].fields && this.resultsWithRows[index].fields.length)
            return this.resultsWithRows[index].fields[0].table;
         return '';
      },
      getSchema (index) {
         if (this.resultsWithRows[index] && this.resultsWithRows[index].fields && this.resultsWithRows[index].fields.length)
            return this.resultsWithRows[index].fields[0].schema;
         return this.workspaceSchema;
      },
      getPrimaryValue (row) {
         const primaryFieldName = Object.keys(row).find(prop => [
            this.primaryField.alias,
            this.primaryField.name,
            `${this.primaryField.table}.${this.primaryField.alias}`,
            `${this.primaryField.table}.${this.primaryField.name}`,
            `${this.primaryField.tableAlias}.${this.primaryField.alias}`,
            `${this.primaryField.tableAlias}.${this.primaryField.name}`
         ].includes(prop));
         return row[primaryFieldName];
      },
      setLocalResults () {
         this.localResults = this.resultsWithRows[this.resultsetIndex] && this.resultsWithRows[this.resultsetIndex].rows
            ? this.resultsWithRows[this.resultsetIndex].rows.map(item => {
               return { ...item, _id: uidGen() };
            })
            : [];
      },
      resizeResults () {
         if (this.$refs.resultTable && this.isSelected) {
            const el = this.$refs.tableWrapper;

            if (el) {
               const footer = document.getElementById('footer');
               const size = window.innerHeight - el.getBoundingClientRect().top - footer.offsetHeight;
               this.resultsSize = size;
            }
            this.$refs.resultTable.updateWindow();
         }
      },
      refreshScroller () {
         this.resizeResults();
      },
      updateField (payload, row) {
         const orgRow = this.localResults.find(lr => lr._id === row._id);

         Object.keys(orgRow).forEach(key => { // remap the row
            if (orgRow[key] instanceof Date && moment(orgRow[key]).isValid()) { // if datetime
               let datePrecision = '';
               const precision = this.fields.find(field => field.name === key).datePrecision;
               for (let i = 0; i < precision; i++)
                  datePrecision += i === 0 ? '.S' : 'S';

               orgRow[key] = moment(orgRow[key]).format(`YYYY-MM-DD HH:mm:ss${datePrecision}`);
            }
         });

         const params = {
            primary: this.primaryField.name,
            schema: this.getSchema(this.resultsetIndex),
            table: this.getTable(this.resultsetIndex),
            id: this.getPrimaryValue(orgRow),
            row,
            orgRow,
            ...payload
         };
         this.$emit('update-field', params);
      },
      closeContext () {
         this.isContext = false;
      },
      showDeleteConfirmModal (e) {
         if (e && e.path && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.path[0].tagName))
            return;
         this.isDeleteConfirmModal = true;
      },
      hideDeleteConfirmModal () {
         this.isDeleteConfirmModal = false;
      },
      deleteSelected () {
         this.closeContext();
         const rows = JSON.parse(JSON.stringify(this.localResults)).filter(row => this.selectedRows.includes(row._id)).map(row => {
            delete row._id;
            return row;
         });

         const params = {
            primary: this.primaryField.name,
            schema: this.getSchema(this.resultsetIndex),
            table: this.getTable(this.resultsetIndex),
            rows
         };
         this.$emit('delete-selected', params);
      },
      setNull () {
         const row = this.localResults.find(row => this.selectedRows.includes(row._id));

         const params = {
            primary: this.primaryField.name,
            schema: this.getSchema(this.resultsetIndex),
            table: this.getTable(this.resultsetIndex),
            id: this.getPrimaryValue(row),
            row,
            orgRow: row,
            field: this.selectedCell.field,
            content: null
         };
         this.$emit('update-field', params);
      },
      copyCell () {
         const row = this.localResults.find(row => this.selectedRows.includes(row._id));
         const cellName = Object.keys(row).find(prop => [
            this.selectedCell.field,
            `${this.fields[0].table}.${this.selectedCell.field}`,
            `${this.fields[0].tableAlias}.${this.selectedCell.field}`
         ].includes(prop));
         const valueToCopy = row[cellName];
         navigator.clipboard.writeText(valueToCopy);
      },
      copyRow () {
         const row = this.localResults.find(row => this.selectedRows.includes(row._id));
         const rowToCopy = JSON.parse(JSON.stringify(row));
         delete rowToCopy._id;
         navigator.clipboard.writeText(JSON.stringify(rowToCopy));
      },
      applyUpdate (params) {
         const { primary, id, field, table, content } = params;

         this.localResults = this.localResults.map(row => {
            if (row[primary] === id)// only fieldName
               row[field] = content;
            else if (row[`${table}.${primary}`] === id)// table.fieldName
               row[`${table}.${field}`] = content;

            return row;
         });
      },
      selectRow (event, row) {
         if (event.ctrlKey) {
            if (this.selectedRows.includes(row))
               this.selectedRows = this.selectedRows.filter(el => el !== row);
            else
               this.selectedRows.push(row);
         }
         else if (event.shiftKey) {
            if (!this.selectedRows.length)
               this.selectedRows.push(row);
            else {
               const lastID = this.selectedRows.slice(-1)[0];
               const lastIndex = this.sortedResults.findIndex(el => el._id === lastID);
               const clickedIndex = this.sortedResults.findIndex(el => el._id === row);
               if (lastIndex > clickedIndex) {
                  for (let i = clickedIndex; i < lastIndex; i++)
                     this.selectedRows.push(this.sortedResults[i]._id);
               }
               else if (lastIndex < clickedIndex) {
                  for (let i = clickedIndex; i > lastIndex; i--)
                     this.selectedRows.push(this.sortedResults[i]._id);
               }
            }
         }
         else
            this.selectedRows = [row];
      },
      selectAllRows () {
         this.selectedRows = this.localResults.reduce((acc, curr) => {
            acc.push(curr._id);
            return acc;
         }, []);
      },
      deselectRows () {
         this.selectedRows = [];
      },
      contextMenu (event, cell) {
         if (event.target.localName === 'input') return;

         this.selectedCell = cell;
         if (!this.selectedRows.includes(cell.id))
            this.selectedRows = [cell.id];
         this.contextEvent = event;
         this.isContext = true;
      },
      sort (field) {
         if (!this.isSortable) return;

         this.selectedRows = [];

         if (this.mode === 'query')
            field = `${this.getTable(this.resultsetIndex)}.${field}`;

         if (field === this.currentSort) {
            if (this.currentSortDir === 'asc')
               this.currentSortDir = 'desc';
            else
               this.resetSort();
         }
         else {
            this.currentSortDir = 'asc';
            this.currentSort = field;
         }

         if (this.isHardSort)
            this.$emit('hard-sort', { field: this.currentSort, dir: this.currentSortDir });
      },
      resetSort () {
         this.currentSort = '';
         this.currentSortDir = 'asc';
      },
      selectResultset (index) {
         this.resultsetIndex = index;
      },
      downloadTable (format, filename) {
         if (!this.sortedResults) return;

         const rows = JSON.parse(JSON.stringify(this.sortedResults)).map(row => {
            delete row._id;
            return row;
         });

         arrayToFile({
            type: format,
            content: rows,
            filename
         });
      }
   }
};
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
