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
                     :class="`type-${fieldType(cKey)}${isNull(col)}`"
                     :style="{'display': cKey === '_id' ? 'none' : ''}"
                     tabindex="0"
                  >
                     {{ col | typeFormat(fieldType(cKey)) }}
                  </div>
               </div>
            </div>
         </div>
      </template>
   </BaseVirtualScroll>
</template>

<script>
import { uidGen, mimeFromHex, formatBytes } from 'common/libs/utilities';
import hexToBinary from 'common/libs/hexToBinary';
import moment from 'moment';
import BaseVirtualScroll from '@/components/BaseVirtualScroll';

export default {
   name: 'WorkspaceQueryTable',
   components: {
      BaseVirtualScroll
   },
   filters: {
      typeFormat (val, type) {
         if (!val) return val;

         switch (type) {
            case 'char':
            case 'varchar':
            case 'text':
               return val.substring(0, 128);
            case 'date':
               return moment(val).format('YYYY-MM-DD');
            case 'datetime':
               return moment(val).format('YYYY-MM-DD HH:mm:ss.SSS');
            case 'blob':
            case 'mediumblob':
            case 'longblob': {
               const buff = Buffer.from(val);
               if (!buff.length) return '';

               const hex = buff.toString('hex').substring(0, 8).toUpperCase();
               return `${mimeFromHex(hex).mime} (${formatBytes(buff.length)})`;
            }
            case 'bit': {
               const hex = Buffer.from(val).toString('hex');
               return hexToBinary(hex);
            }
            default:
               return val;
         }
      }
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
      fieldType (cKey) {
         let type = 'unknown';
         const field = this.fields.filter(field => field.name === cKey)[0];
         if (field)
            type = field.type;

         return type;
      },
      isNull (col) {
         return col === null ? ' is-null' : '';
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
