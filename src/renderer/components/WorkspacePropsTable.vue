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
         <draggable
            ref="resultTable"
            :list="fields"
            class="tbody"
            handle=".row-draggable"
         >
            <TableRow
               v-for="row in fields"
               :key="row._id"
               :row="row"
               :data-types="dataTypes"
            />
         </draggable>
      </div>
   </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import draggable from 'vuedraggable';
import TableRow from '@/components/WorkspacePropsTableRow';

export default {
   name: 'WorkspacePropsTable',
   components: {
      TableRow,
      draggable
   },
   props: {
      fields: Array,
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
      dataTypes () {
         return this.getWorkspace(this.connUid).dataTypes;
      },
      primaryField () {
         return this.fields.filter(field => ['pri', 'uni'].includes(field.key))[0] || false;
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
</style>
