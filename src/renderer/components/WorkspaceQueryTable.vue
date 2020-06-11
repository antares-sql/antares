<template>
   <BaseVirtualScroll
      v-if="results.rows"
      ref="resultTable"
      :items="results.rows"
      :item-height="25"
      class="vscroll"
      :style="{'height': resultsSize+'px'}"
   >
      <template slot-scope="{ items }">
         <div class="table table-hover">
            <div class="thead">
               <div class="tr">
                  <div
                     v-for="field in results.fields"
                     :key="field.name"
                     class="th"
                  >
                     {{ field.name }}
                  </div>
               </div>
            </div>
            <div class="tbody">
               <div
                  v-for="(row, rKey) in items"
                  :key="rKey"
                  class="tr"
                  tabindex="0"
               >
                  <div
                     v-for="(col, cKey) in row"
                     :key="cKey"
                     class="td"
                     :class="fieldType(col)"
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
import BaseVirtualScroll from '@/components/BaseVirtualScroll';

export default {
   name: 'WorkspaceQueryTable',
   components: {
      BaseVirtualScroll
   },
   props: {
      results: Object
   },
   data () {
      return {
         resultsSize: 1000
      };
   },
   computed: {
      rows () {
         return this.results.rows ? this.results.rows.map(item => Object.assign({}, item)) : [];
      }
   },
   watch: {
      results: function () {
         if (this.$refs.resultTable)
            this.resizeResults();
      }
   },
   mounted () {
      window.addEventListener('resize', this.resizeResults);
   },
   destroyed () {
      window.removeEventListener('resize', this.resizeResults);
   },
   methods: {
      fieldType (col) {
         let type = typeof col;
         if (type === 'object')
            if (col instanceof Date) type = 'date';
         if (col instanceof Uint8Array) type = 'blob';
         if (col === null) type = 'null';

         return `type-${type}`;
      },
      resizeResults (e) {
         const el = this.$refs.resultTable.$el;
         const footer = document.getElementById('footer');

         if (el) {
            const size = window.innerHeight - el.getBoundingClientRect().top - footer.offsetHeight;
            this.resultsSize = size;
         }
      }
   }
};
</script>

<style>
.vscroll {
   height: 1000px;
   overflow: auto;
   overflow-anchor: none;
}
</style>
