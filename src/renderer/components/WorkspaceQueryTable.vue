<template>
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
               >
                  <div
                     v-for="(col, cKey) in row"
                     :key="cKey"
                     class="td"
                     :class="fieldType(col)"
                     :style="{'display': cKey === '_id'? 'none' : ''}"
                     tabindex="0"
                  >
                     {{ col }}
                  </div>
               </div>
            </div>
         </div>
      </template>
   </BaseVirtualScroll>
</template>

<script>
import { uidGen } from 'common/libs/utilities';
import BaseVirtualScroll from '@/components/BaseVirtualScroll';

export default {
   name: 'WorkspaceQueryTable',
   components: {
      BaseVirtualScroll
   },
   props: {
      results: Object,
      fields: Array
   },
   data () {
      return {
         resultsSize: 1000,
         localResults: []
      };
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
      fieldType (col) { // TODO: get from fields
         let type = typeof col;
         if (type === 'object')
            if (col instanceof Date) type = 'date';
         if (col instanceof Uint8Array) type = 'blob';
         if (col === null) type = 'null';

         return `type-${type}`;
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
