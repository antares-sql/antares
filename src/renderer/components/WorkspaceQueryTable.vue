<template>
   <div>
      <TableContext
         v-if="isContext"
         :context-event="contextEvent"
         :selected-rows="selectedRows"
         @closeContext="isContext = false"
      />
      <BaseVirtualScroll
         v-if="results.rows"
         ref="resultTable"
         :items="localResults"
         :item-height="25"
         class="vscroll"
         :style="{'height': resultsSize+'px'}"
      >
         <template slot-scope="{ items }">
            <div class="table table-hover">
               <div class="thead">
                  <div class="tr">
                     <div
                        v-for="field in fields"
                        :key="field.name"
                        class="th"
                     >
                        <div class="table-column-title">
                           <i
                              v-if="field.key"
                              class="material-icons column-key c-help"
                              :class="`key-${field.key}`"
                              :title="keyName(field.key)"
                           >vpn_key</i>
                           <span>{{ field.name }}</span>
                        </div>
                     </div>
                  </div>
               </div>
               <div class="tbody">
                  <div
                     v-for="row in items"
                     :key="row._id"
                     class="tr"
                     :class="{'selected': selectedRows.includes(row._id)}"
                     @click="selectRow($event, row._id)"
                  >
                     <WorkspaceQueryTableCell
                        v-for="(col, cKey) in row"
                        :key="cKey"
                        :content="col"
                        :field="cKey"
                        :precision="fieldPrecision(cKey)"
                        :type="fieldType(cKey)"
                        @updateField="updateField($event, row[primaryField.name])"
                        @contextmenu="contextMenu($event, {id: row._id, field: cKey})"
                     />
                  </div>
               </div>
            </div>
         </template>
      </BaseVirtualScroll>
   </div>
</template>

<script>
import { uidGen } from 'common/libs/utilities';
import BaseVirtualScroll from '@/components/BaseVirtualScroll';
import WorkspaceQueryTableCell from '@/components/WorkspaceQueryTableCell';
import TableContext from '@/components/WorkspaceQueryTableContext';
import { mapActions } from 'vuex';

export default {
   name: 'WorkspaceQueryTable',
   components: {
      BaseVirtualScroll,
      WorkspaceQueryTableCell,
      TableContext
   },
   props: {
      results: Object,
      fields: Array
   },
   data () {
      return {
         resultsSize: 1000,
         localResults: [],
         isContext: false,
         contextEvent: null,
         selectedCell: null,
         selectedRows: []
      };
   },
   computed: {
      primaryField () {
         return this.fields.filter(field => field.key === 'pri')[0] || false;
      }
   },
   watch: {
      results () {
         this.localResults = this.results.rows ? this.results.rows.map(item => {
            return { ...item, _id: uidGen() };
         }) : [];
      }
   },
   updated () {
      if (this.$refs.resultTable)
         this.resizeResults();
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
            length = field.precision;

         return length;
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
      resizeResults (e) {
         if (this.$refs.resultTable) {
            const el = this.$refs.resultTable.$el;
            const footer = document.getElementById('footer');

            if (el) {
               const size = window.innerHeight - el.getBoundingClientRect().top - footer.offsetHeight;
               this.resultsSize = size;
            }
         }
      },
      updateField (payload, id) {
         if (!this.primaryField)
            this.addNotification({ status: 'warning', message: this.$t('message.unableEditFieldWithoutPrimary') });
         else {
            const params = {
               primary: this.primaryField.name,
               id,
               ...payload
            };
            this.$emit('updateField', params);
         }
      },
      applyUpdate (params) {
         const { primary, id, field, content } = params;
         this.localResults = this.localResults.map(row => {
            if (row[primary] === id)
               row[field] = content;

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
               const lastIndex = this.localResults.findIndex(el => el._id === lastID);
               const clickedIndex = this.localResults.findIndex(el => el._id === row);
               if (lastIndex > clickedIndex) {
                  for (let i = clickedIndex; i < lastIndex; i++)
                     this.selectedRows.push(this.localResults[i]._id);
               }
               else if (lastIndex < clickedIndex) {
                  for (let i = clickedIndex; i > lastIndex; i--)
                     this.selectedRows.push(this.localResults[i]._id);
               }
            }
         }
         else
            this.selectedRows = [row];
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

<style lang="scss">
.vscroll {
   height: 1000px;
   overflow: auto;
   overflow-anchor: none;
}

.table-column-title{
   display: flex;
   align-items: center;
}

.column-key{
   transform: rotate(90deg);
   font-size: .7rem;
   line-height: 1.5;
   margin-right: .2rem;

   &.key-pri{
      color: goldenrod;
   }

   &.key-uni{
      color: deepskyblue;
   }

   &.key-mul{
      color: palegreen;
   }
}
</style>
