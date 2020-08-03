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
               <div class="editor-field-info">
                  <div><b>{{ $t('word.size') }}</b>: {{ localContent.length }}</div>
                  <div><b>{{ $t('word.type') }}</b>: {{ type.toUpperCase() }}</div>
               </div>
            </div>
         </div>
      </ConfirmModal>
      <ConfirmModal
         v-if="isBlobEditor"
         @confirm="editOFF"
         @hide="hideEditorModal"
      >
         <template :slot="'header'">
            {{ $t('word.edit') }} "{{ field }}"
         </template>
         <div :slot="'body'">
            <div class="mb-2">
               <div>
                  <img
                     v-if="isImage"
                     :src="`data:${contentInfo.mime};base64, ${bufferToBase64(localContent)}`"
                     class="img-responsive p-centered"
                  >
                  <div v-if="contentInfo.size" class="editor-buttons mt-2">
                     <button class="btn btn-link btn-sm" @click="downloadFile">
                        <span>{{ $t('word.download') }}</span>
                        <i class="material-icons ml-1">file_download</i>
                     </button>
                  </div>
               </div>
               <div class="editor-field-info">
                  <div>
                     <b>{{ $t('word.size') }}</b>: {{ localContent.length | formatBytes }}<br>
                     <b>{{ $t('word.mimeType') }}</b>: {{ contentInfo.mime }}
                  </div>
                  <div><b>{{ $t('word.type') }}</b>: {{ type.toUpperCase() }}</div>
               </div>
               <div class="mt-3">
                  <label>{{ $t('message.uploadFile') }}</label>
                  <input
                     class="form-input"
                     type="file"
                     @change="filesChange($event)"
                  >
               </div>
            </div>
         </div>
      </ConfirmModal>
   </div>
</template>

<script>
import moment from 'moment';
import { mimeFromHex, formatBytes, bufferToBase64 } from 'common/libs/utilities';
import hexToBinary from 'common/libs/hexToBinary';
import { mask } from 'vue-the-mask';
import ConfirmModal from '@/components/BaseConfirmModal';

export default {
   name: 'WorkspaceQueryTableCell',
   components: {
      ConfirmModal
   },
   filters: {
      formatBytes,
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
         isBlobEditor: false,
         localContent: null,
         contentInfo: {
            ext: '',
            mime: '',
            size: null
         },
         fileToUpload: null
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
      },
      isImage () {
         return ['gif', 'jpg', 'png'].includes(this.contentInfo.ext);
      }
   },
   methods: {
      isNull (value) {
         return value === null ? ' is-null' : '';
      },
      bufferToBase64 (val) {
         return bufferToBase64(val);
      },
      editON () {
         switch (this.type) {
            // Large text editor
            case 'text':
            case 'mediumtext':
            case 'longtext':
               this.isTextareaEditor = true;
               this.localContent = this.$options.filters.typeFormat(this.content, this.type);
               break;
            // File fields editor
            case 'blob':
            case 'mediumblob':
            case 'longblob':
               this.isBlobEditor = true;
               this.localContent = this.content ? this.content : '';
               this.fileToUpload = null;

               if (this.content !== null) {
                  const buff = Buffer.from(this.localContent);
                  if (buff.length) {
                     const hex = buff.toString('hex').substring(0, 8).toUpperCase();
                     const { ext, mime } = mimeFromHex(hex);
                     this.contentInfo = {
                        ext,
                        mime,
                        size: this.localContent.length
                     };
                  }
               }

               break;
            // Inline editable fields
            default:
               this.localContent = this.$options.filters.typeFormat(this.content, this.type);
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
         let content;
         if (!['blob', 'mediumblob', 'longblob'].includes(this.type)) {
            if (this.localContent === this.$options.filters.typeFormat(this.content, this.type)) return;// If not changed
            content = this.localContent;
         }
         else { // Handle file upload
            if (!this.fileToUpload) return;
            content = this.fileToUpload.file.path;
         }

         this.$emit('updateField', {
            field: this.field,
            type: this.type,
            content
         });
      },
      hideEditorModal () {
         this.isTextareaEditor = false;
         this.isBlobEditor = false;
      },
      downloadFile () {
         const downloadLink = document.createElement('a');

         downloadLink.href = `data:${this.contentInfo.mime};base64, ${bufferToBase64(this.localContent)}`;
         downloadLink.setAttribute('download', `${this.field}.${this.contentInfo.ext}`);
         document.body.appendChild(downloadLink);

         downloadLink.click();
         downloadLink.remove();
      },
      filesChange (event) {
         const { files } = event.target;
         if (!files.length) return;

         this.fileToUpload = { name: files[0].name, file: files[0] };
      }
   }
};
</script>

<style lang="scss">
.editable-field {
  margin: 0;
  border: none;
  line-height: 1;
  width: 100%;
}

.cell-content {
  display: block;
  min-height: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.textarea-editor {
  height: 50vh !important;
}

.editor-field-info {
  margin-top: 0.6rem;
  display: flex;
  justify-content: space-between;
  white-space: normal;
}

.editor-buttons {
  display: flex;
  justify-content: center;

  .btn {
    display: flex;
    align-items: center;
  }
}
</style>
