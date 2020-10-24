<template>
   <div
      ref="tableWrapper"
      class="vscroll"
      :style="{'height': resultsSize+'px'}"
   >
      <TableContext
         v-if="isContext"
         :context-event="contextEvent"
         :selected-rows="selectedRows"
         @delete-selected="deleteSelected"
         @close-context="isContext = false"
      />
      <div ref="propTable" class="table table-hover">
         <div class="thead">
            <div class="tr">
               <div class="th">
                  <div class="text-right">
                     {{ $t('word.order') }}
                  </div>
               </div>
               <div class="th">
                  <div class="table-column-title">
                     {{ $tc('word.key', 2) }}
                  </div>
               </div>
               <div class="th">
                  <div class="column-resizable">
                     <div class="table-column-title">
                        {{ $t('word.name') }}
                     </div>
                  </div>
               </div>
               <div class="th">
                  <div class="column-resizable">
                     <div class="table-column-title">
                        {{ $t('word.type') }}
                     </div>
                  </div>
               </div>
               <div class="th">
                  <div class="column-resizable">
                     <div class="table-column-title">
                        {{ $t('word.length') }}
                     </div>
                  </div>
               </div>
               <div class="th">
                  <div class="column-resizable">
                     <div class="table-column-title">
                        {{ $t('word.unsigned') }}
                     </div>
                  </div>
               </div>
               <div class="th">
                  <div class="column-resizable">
                     <div class="table-column-title">
                        {{ $t('message.allowNull') }}
                     </div>
                  </div>
               </div>
               <div class="th">
                  <div class="column-resizable">
                     <div class="table-column-title">
                        {{ $t('message.zeroFill') }}
                     </div>
                  </div>
               </div>
               <div class="th">
                  <div class="column-resizable">
                     <div class="table-column-title">
                        {{ $t('word.default') }}
                     </div>
                  </div>
               </div>
               <div class="th">
                  <div class="column-resizable">
                     <div class="table-column-title">
                        {{ $t('word.comment') }}
                     </div>
                  </div>
               </div>
               <div class="th">
                  <div class="column-resizable">
                     <div class="table-column-title">
                        {{ $t('word.collation') }}
                     </div>
                  </div>
               </div>
            </div>
         </div>
         <div ref="resultTable" class="tbody">
            <div
               v-for="row in results"
               :key="row.name"
               class="tr"
            >
               <div class="td">
                  <div class="row-draggable">
                     <i class="mdi mdi-drag-horizontal row-draggable-icon" />
                     {{ row.order }}
                  </div>
               </div>
               <div class="td">
                  <i
                     v-if="row.key"
                     :title="keyName(row.key)"
                     class="mdi mdi-key column-key c-help pl-1"
                     :class="`key-${row.key}`"
                  />
               </div>
               <div class="td">
                  {{ row.name }}
               </div>
               <div class="td text-uppercase" :class="`type-${row.type}`">
                  {{ row.type }}
               </div>
               <div class="td type-int">
                  {{ row.numLength || row.charLength || row.datePrecision }}
               </div>
               <div class="td">
                  <label class="form-checkbox">
                     <input type="checkbox" :checked="row.unsigned ">
                     <i class="form-icon" />
                  </label>
               </div>
               <div class="td">
                  <label class="form-checkbox">
                     <input type="checkbox" :checked="row.nullable ">
                     <i class="form-icon" />
                  </label>
               </div>
               <div class="td">
                  <label class="form-checkbox">
                     <input type="checkbox" :checked="row.zerofill ">
                     <i class="form-icon" />
                  </label>
               </div>
               <div class="td">
                  {{ (row.autoIncrement ? 'AUTO_INCREMENT' : false) || row.default }}
               </div>
               <div class="td type-varchar">
                  {{ row.comment }}
               </div>
               <div class="td">
                  {{ row.collation }}
               </div>
            </div>
         </div>
      </div>
   </div>
</template>

<script>
import TableContext from '@/components/WorkspaceQueryTableContext';
import { mapActions, mapGetters } from 'vuex';

export default {
   name: 'WorkspacePropsTable',
   components: {
      TableContext
   },
   props: {
      results: Array,
      tabUid: [String, Number],
      connUid: String,
      table: String,
      schema: String,
      mode: String
   },
   data () {
      return {
         resultsSize: 1000,
         localResults: [],
         isContext: false,
         contextEvent: null,
         selectedCell: null,
         selectedRows: [],
         scrollElement: null
      };
   },
   computed: {
      ...mapGetters({
         getWorkspaceTab: 'workspaces/getWorkspaceTab',
         getWorkspace: 'workspaces/getWorkspace'
      }),
      workspaceSchema () {
         return this.getWorkspace(this.connUid).breadcrumbs.schema;
      },
      primaryField () {
         return this.results.filter(field => ['pri', 'uni'].includes(field.key))[0] || false;
      },
      tabProperties () {
         return this.getWorkspaceTab(this.tabUid);
      }

   },
   updated () {
      if (this.$refs.propTable)
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
      resizeResults () {
         if (this.$refs.resultTable) {
            const el = this.$refs.tableWrapper;

            if (el) {
               const footer = document.getElementById('footer');
               const size = window.innerHeight - el.getBoundingClientRect().top - footer.offsetHeight;
               this.resultsSize = size;
            }
            // this.$refs.resultTable.updateWindow();
         }
      },
      refreshScroller () {
         this.resizeResults();
      },
      contextMenu (event, cell) {
         this.selectedCell = cell;
         if (!this.selectedRows.includes(cell.id))
            this.selectedRows = [cell.id];
         this.contextEvent = event;
         this.isContext = true;
      }
   }
};
</script>

<style lang="scss" scoped>
.column-resizable {
  &:hover,
  &:active {
    resize: horizontal;
    overflow: hidden;
  }
}

.row-draggable {
  position: relative;
  text-align: right;
  padding-left: 28px;
  cursor: grab;

  .row-draggable-icon {
    position: absolute;
    left: 0;
    font-size: 22px;
  }
}

.table-column-title {
  display: flex;
  align-items: center;
}

.form-checkbox {
  padding: 0;
  margin: 0;
  line-height: 1;
  min-height: auto;

  .form-icon {
    top: 0.15rem;
    left: calc(50% - 8px);
  }
}
</style>
