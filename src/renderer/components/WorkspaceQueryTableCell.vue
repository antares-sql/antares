<template>
   <div
      v-if="field !== '_id'"
      ref="cell"
      class="td"
      :class="`type-${type} p-0`"
      tabindex="0"
   >
      <span
         v-if="!isEditing"
         class="cell-content px-2"
         :class="isNull(content)"
         @dblclick="editON"
      >{{ content | typeFormat(type) }}</span>
      <input
         v-else
         ref="editField"
         v-model="localContent"
         v-mask="inputProps.mask"
         :type="inputProps.type"
         autofocus
         class="editable-field px-2"
         @blur="editOFF"
      >
   </div>
</template>

<script>
import moment from 'moment';
import { mimeFromHex, formatBytes } from 'common/libs/utilities';
import hexToBinary from 'common/libs/hexToBinary';
import { mask } from 'vue-the-mask';

export default {
   name: 'WorkspaceQueryTableCell',
   filters: {
      typeFormat (val, type) {
         if (!val) return val;

         switch (type) {
            case 'char':
            case 'varchar':
            case 'text':
            case 'mediumtext':
               return val.substring(0, 128);
            case 'date': {
               return moment(val).isValid() ? moment(val).format('YYYY-MM-DD') : val;
            }
            case 'datetime':
            case 'timestamp': {
               return moment(val).isValid() ? moment(val).format('YYYY-MM-DD HH:mm:ss.SSS') : val;
            }
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
   directives: {
      mask
   },
   props: {
      type: String,
      field: String,
      content: [String, Number, Object, Date, Uint8Array]
   },
   data () {
      return {
         isEditing: false,
         localContent: ''
      };
   },
   computed: {
      inputProps () {
         switch (this.type) {
            case 'char':
            case 'varchar':
            case 'text':
            case 'mediumtext':
               return { type: 'text', mask: false };
            case 'int':
            case 'tinyint':
            case 'smallint':
            case 'mediumint':
               return { type: 'number', mask: false };
            case 'date':
               return { type: 'text', mask: '####-##-##' };
            case 'datetime':
            case 'timestamp':
               return { type: 'text', mask: '####-##-## ##:##:##.###' };// TODO: field length
            case 'blob':
            case 'mediumblob':
            case 'longblob':
            case 'bit':
            default:
               return 'hidden';
         }
      }
   },
   methods: {
      isNull (value) {
         return value === null ? ' is-null' : '';
      },
      editON () {
         this.$nextTick(() => {
            this.$refs.cell.blur();

            this.$nextTick(() => this.$refs.editField.focus());
         });
         this.localContent = this.$options.filters.typeFormat(this.content, this.type);
         this.isEditing = true;
      },
      editOFF () {
         this.isEditing = false;
         if (this.localContent === this.content) return;

         const { field, type, localContent: content } = this;
         this.$emit('updateField', { field, type, content });
      }
   }
};
</script>

<style lang="scss">
.editable-field{
   margin: 0;
   border: none;
   line-height: 1;
   width: 100%;
   max-width: 200px;
}

.cell-content{
   display: block;
   min-height: .8rem;
   text-overflow: ellipsis;
   max-width: 200px;
   white-space: nowrap;
   overflow: hidden;
}
</style>
