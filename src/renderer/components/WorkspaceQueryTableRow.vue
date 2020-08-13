<template>
   <div class="tr" @click="selectRow($event, row._id)">
      <div
         v-for="(col, cKey) in row"
         v-show="cKey !== '_id'"
         :key="cKey"
         class="td p-0"
         tabindex="0"
         @contextmenu.prevent="$emit('contextmenu', $event, {id: row._id, field: cKey})"
         @updateField="updateField($event, row[primaryField.name])"
      >
         <template v-if="cKey !== '_id'">
            <span
               v-if="!isInlineEditor[cKey]"
               class="cell-content px-2"
               :class="`${isNull(col)} type-${fieldType(cKey)}`"
               @dblclick="editON($event, col, cKey)"
            >{{ col | typeFormat(fieldType(cKey), fieldPrecision(cKey)) | cutText }}</span>
            <template v-else>
               <input
                  v-if="inputProps.mask"
                  ref="editField"
                  v-model="editingContent"
                  v-mask="inputProps.mask"
                  :type="inputProps.type"
                  autofocus
                  class="editable-field px-2"
                  @blur="editOFF"
               >
               <input
                  v-else
                  ref="editField"
                  v-model="editingContent"
                  :type="inputProps.type"
                  autofocus
                  class="editable-field px-2"
                  @blur="editOFF"
               >
            </template>
         </template>
      </div>
      <ConfirmModal
         v-if="isTextareaEditor"
         :confirm-text="$t('word.update')"
         size="medium"
         @confirm="editOFF"
         @hide="hideEditorModal"
      >
         <template :slot="'header'">
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-playlist-edit mr-1" /> {{ $t('word.edit') }} "{{ editingField }}"
            </div>
         </template>
         <div :slot="'body'">
            <div class="mb-2">
               <div>
                  <textarea
                     v-model="editingContent"
                     class="form-input textarea-editor"
                  />
               </div>
               <div class="editor-field-info">
                  <div><b>{{ $t('word.size') }}</b>: {{ editingContent.length }}</div>
                  <div><b>{{ $t('word.type') }}</b>: {{ editingType.toUpperCase() }}</div>
               </div>
            </div>
         </div>
      </ConfirmModal>
      <ConfirmModal
         v-if="isBlobEditor"
         :confirm-text="$t('word.update')"
         @confirm="editOFF"
         @hide="hideEditorModal"
      >
         <template :slot="'header'">
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-playlist-edit mr-1" /> {{ $t('word.edit') }} "{{ editingField }}"
            </div>
         </template>
         <div :slot="'body'">
            <div class="mb-2">
               <transition name="jump-down">
                  <div v-if="contentInfo.size">
                     <img
                        v-if="isImage"
                        :src="`data:${contentInfo.mime};base64, ${bufferToBase64(editingContent)}`"
                        class="img-responsive p-centered bg-checkered"
                     >
                     <div v-else class="text-center">
                        <i class="mdi mdi-36px mdi-file" />
                     </div>
                     <div class="editor-buttons mt-2">
                        <button class="btn btn-link btn-sm" @click="downloadFile">
                           <span>{{ $t('word.download') }}</span>
                           <i class="mdi mdi-24px mdi-download ml-1" />
                        </button>
                        <button class="btn btn-link btn-sm" @click="prepareToDelete">
                           <span>{{ $t('word.delete') }}</span>
                           <i class="mdi mdi-24px mdi-delete-forever ml-1" />
                        </button>
                     </div>
                  </div>
               </transition>
               <div class="editor-field-info">
                  <div>
                     <b>{{ $t('word.size') }}</b>: {{ editingContent.length | formatBytes }}<br>
                     <b>{{ $t('word.mimeType') }}</b>: {{ contentInfo.mime }}
                  </div>
                  <div><b>{{ $t('word.type') }}</b>: {{ editingType.toUpperCase() }}</div>
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
import { mimeFromHex } from 'common/libs/mimeFromHex';
import { formatBytes } from 'common/libs/formatBytes';
import { bufferToBase64 } from 'common/libs/bufferToBase64';
import hexToBinary from 'common/libs/hexToBinary';
import { TEXT, LONG_TEXT, NUMBER, DATE, TIME, DATETIME, BLOB, BIT } from 'common/fieldTypes';
import { mask } from 'vue-the-mask';
import ConfirmModal from '@/components/BaseConfirmModal';

export default {
   name: 'WorkspaceQueryTableRow',
   components: {
      ConfirmModal
   },
   directives: {
      mask
   },
   filters: {
      formatBytes,
      cutText (val) {
         if (typeof val !== 'string') return val;
         return val.length > 128 ? `${val.substring(0, 128)}[...]` : val;
      },
      typeFormat (val, type, precision) {
         if (!val) return val;

         if (DATE.includes(type))
            return moment(val).isValid() ? moment(val).format('YYYY-MM-DD') : val;

         if (DATETIME.includes(type)) {
            let datePrecision = '';
            for (let i = 0; i < precision; i++)
               datePrecision += i === 0 ? '.S' : 'S';

            return moment(val).isValid() ? moment(val).format(`YYYY-MM-DD HH:mm:ss${datePrecision}`) : val;
         }

         if (BLOB.includes(type)) {
            const buff = Buffer.from(val);
            if (!buff.length) return '';

            const hex = buff.toString('hex').substring(0, 8).toUpperCase();
            return `${mimeFromHex(hex).mime} (${formatBytes(buff.length)})`;
         }

         if (BIT.includes(type)) {
            const hex = Buffer.from(val).toString('hex');
            return hexToBinary(hex);
         }

         return val;
      }
   },
   props: {
      row: Object,
      fields: Array
   },
   data () {
      return {
         isInlineEditor: {},
         isTextareaEditor: false,
         isBlobEditor: false,
         willBeDeleted: false,
         originalContent: null,
         editingContent: null,
         editingType: null,
         editingField: null,
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
         if ([...TEXT, ...LONG_TEXT].includes(this.editingType))
            return { type: 'text', mask: false };

         if (NUMBER.includes(this.editingType))
            return { type: 'number', mask: false };

         if (TIME.includes(this.editingType)) {
            let timeMask = '##:##:##';
            const precision = this.fieldPrecision(this.editingField);

            for (let i = 0; i < precision; i++)
               timeMask += i === 0 ? '.#' : '#';

            return { type: 'text', mask: timeMask };
         }

         if (DATE.includes(this.editingType))
            return { type: 'text', mask: '####-##-##' };

         if (DATETIME.includes(this.editingType)) {
            let datetimeMask = '####-##-## ##:##:##';
            const precision = this.fieldPrecision(this.editingField);

            for (let i = 0; i < precision; i++)
               datetimeMask += i === 0 ? '.#' : '#';

            return { type: 'text', mask: datetimeMask };
         }

         if (BLOB.includes(this.editingType))
            return { type: 'file', mask: false };

         if (BIT.includes(this.editingType))
            return { type: 'text', mask: false };

         return { type: 'text', mask: false };
      },
      isImage () {
         return ['gif', 'jpg', 'png', 'bmp', 'ico', 'tif'].includes(this.contentInfo.ext);
      }
   },
   created () {
      this.fields.forEach(field => {
         this.isInlineEditor[field.name] = false;
      });
   },
   methods: {
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
      isNull (value) {
         return value === null ? ' is-null' : '';
      },
      bufferToBase64 (val) {
         return bufferToBase64(val);
      },
      editON (event, content, field) {
         const type = this.fieldType(field);
         this.originalContent = content;
         this.editingType = type;
         this.editingField = field;

         if (LONG_TEXT.includes(type)) {
            this.isTextareaEditor = true;
            this.editingContent = this.$options.filters.typeFormat(this.originalContent, type);
            return;
         }

         if (BLOB.includes(type)) {
            this.isBlobEditor = true;
            this.editingContent = this.originalContent || '';
            this.fileToUpload = null;
            this.willBeDeleted = false;

            if (this.originalContent !== null) {
               const buff = Buffer.from(this.editingContent);
               if (buff.length) {
                  const hex = buff.toString('hex').substring(0, 8).toUpperCase();
                  const { ext, mime } = mimeFromHex(hex);
                  this.contentInfo = {
                     ext,
                     mime,
                     size: this.editingContent.length
                  };
               }
            }
            return;
         }

         // Inline editable fields
         this.editingContent = this.$options.filters.typeFormat(this.originalContent, type, this.fieldPrecision(field));
         this.$nextTick(() => { // Focus on input
            event.target.blur();

            this.$nextTick(() => document.querySelector('.editable-field').focus());
         });

         const obj = {
            [field]: true
         };
         this.isInlineEditor = { ...this.isInlineEditor, ...obj };
      },
      editOFF () {
         this.isInlineEditor[this.editingField] = false;
         let content;
         if (!['blob', 'mediumblob', 'longblob'].includes(this.editingType)) {
            if (this.editingContent === this.$options.filters.typeFormat(this.originalContent, this.editingType)) return;// If not changed
            content = this.editingContent;
         }
         else { // Handle file upload
            if (this.willBeDeleted) {
               content = '';
               this.willBeDeleted = false;
            }
            else {
               if (!this.fileToUpload) return;
               content = this.fileToUpload.file.path;
            }
         }

         this.$emit('updateField', {
            field: this.editingField,
            type: this.editingType,
            content
         });

         this.editingType = null;
         this.editingField = null;
      },
      hideEditorModal () {
         this.isTextareaEditor = false;
         this.isBlobEditor = false;
      },
      downloadFile () {
         const downloadLink = document.createElement('a');

         downloadLink.href = `data:${this.contentInfo.mime};base64, ${bufferToBase64(this.editingContent)}`;
         downloadLink.setAttribute('download', `${this.editingField}.${this.contentInfo.ext}`);
         document.body.appendChild(downloadLink);

         downloadLink.click();
         downloadLink.remove();
      },
      filesChange (event) {
         const { files } = event.target;
         if (!files.length) return;

         this.fileToUpload = { name: files[0].name, file: files[0] };
         this.willBeDeleted = false;
      },
      prepareToDelete () {
         this.editingContent = '';
         this.contentInfo = {
            ext: '',
            mime: '',
            size: null
         };
         this.willBeDeleted = true;
      },
      updateField (event, id) {
         this.$emit('updateField', event, id);
      },
      contextMenu (event, cell) {
         this.$emit('updateField', event, cell);
      },
      selectRow (event, row) {
         this.$emit('selectRow', event, row);
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
  position: absolute;
  left: 0;
  right: 0;
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
  justify-content: space-evenly;

  .btn {
    display: flex;
    align-items: center;
  }
}
</style>
