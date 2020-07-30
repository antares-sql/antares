<template>
   <div
      v-if="field !== '_id'"
      ref="cell"
      class="td p-0"
      tabindex="0"
      @contextmenu.prevent="$emit('contextmenu', $event)"
   >
      <span
         v-if="!isInlineEditor"
         class="cell-content px-2"
         :class="`${isNull(content)} type-${type}`"
         @dblclick="editON"
      >{{ content | typeFormat(type, precision) | cutText }}</span>
      <template v-else>
         <input
            v-if="inputProps.mask"
            ref="editField"
            v-model="localContent"
            v-mask="inputProps.mask"
            :type="inputProps.type"
            autofocus
            class="editable-field px-2"
            @blur="editOFF"
         >
         <input
            v-else
            ref="editField"
            v-model="localContent"
            :type="inputProps.type"
            autofocus
            class="editable-field px-2"
            @blur="editOFF"
         >
      </template>
      <ConfirmModal
         v-if="isTextareaEditor"
         size="medium"
         @confirm="editOFF"
         @hide="hideEditorModal"
      >
         <template :slot="'header'">
            {{ $t('word.edit') }} "{{ field }}"
         </template>
         <div :slot="'body'">
            <div class="mb-2">
               <div>
                  <textarea
                     v-model="localContent"
                     class="form-input textarea-editor"
                  />
               </div>
               <div class="pt-2">
                  <b>{{ $t('word.size') }}</b>: {{ localContent.length }}
               </div>
            </div>
         </div>
      </ConfirmModal>
   </div>
</template>

<script>
import moment from 'moment';
import { mimeFromHex, formatBytes } from 'common/libs/utilities';
import hexToBinary from 'common/libs/hexToBinary';
import { mask } from 'vue-the-mask';
import ConfirmModal from '@/components/BaseConfirmModal';

export default {
   name: 'WorkspaceQueryTableCell',
   components: {
      ConfirmModal
   },
   filters: {
      cutText (val) {
         if (typeof val !== 'string') return val;
         return val.length > 128 ? `${val.substring(0, 128)}[...]` : val;
      },
      typeFormat (val, type, precision) {
         if (!val) return val;

         switch (type) {
            case 'char':
            case 'varchar':
            case 'text':
            case 'mediumtext':
               return val;
            case 'date': {
               return moment(val).isValid() ? moment(val).format('YYYY-MM-DD') : val;
            }
            case 'datetime':
            case 'timestamp': {
               let datePrecision = '';
               for (let i = 0; i < precision; i++)
                  datePrecision += i === 0 ? '.S' : 'S';

               return moment(val).isValid() ? moment(val).format(`YYYY-MM-DD HH:mm:ss${datePrecision}`) : val;
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
      precision: [Number, null],
      content: [String, Number, Object, Date, Uint8Array]
   },
   data () {
      return {
         isInlineEditor: false,
         isTextareaEditor: false,
         localContent: null
      };
   },
   computed: {
      inputProps () {
         switch (this.type) {
            case 'char':
            case 'varchar':
            case 'text':
            case 'mediumtext':
            case 'longtext':
               return { type: 'text', mask: false };
            case 'int':
            case 'tinyint':
            case 'smallint':
            case 'mediumint':
            case 'bigint':
               return { type: 'number', mask: false };
            case 'date':
               return { type: 'text', mask: '####-##-##' };
            case 'datetime':
            case 'timestamp': {
               let datetimeMask = '####-##-## ##:##:##';
               for (let i = 0; i < this.precision; i++)
                  datetimeMask += i === 0 ? '.#' : '#';
               return { type: 'text', mask: datetimeMask };
            }
            case 'blob':
            case 'mediumblob':
            case 'longblob':
            case 'bit':
               return { type: 'file', mask: false };
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
         if (['file'].includes(this.inputProps.type)) return;// TODO: remove temporary file block
         this.localContent = this.$options.filters.typeFormat(this.content, this.type);

         switch (this.type) {
            case 'text':
            case 'mediumtext':
            case 'longtext':
               this.isTextareaEditor = true;
               break;

            default:// Inline editable fields
               this.$nextTick(() => { // Focus on input
                  this.$refs.cell.blur();

                  this.$nextTick(() => this.$refs.editField.focus());
               });
               this.isInlineEditor = true;
               break;
         }
      },
      editOFF () {
         this.isInlineEditor = false;
         if (this.localContent === this.$options.filters.typeFormat(this.content, this.type)) return;// If not changed

         const { field, type, localContent: content } = this;
         this.$emit('updateField', { field, type, content });
      },
      hideEditorModal () {
         this.isTextareaEditor = false;
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
}

.cell-content{
   display: block;
   min-height: .8rem;
   text-overflow: ellipsis;
   white-space: nowrap;
   overflow: hidden;
}

.textarea-editor{
   height: 50vh!important;
}
</style>
