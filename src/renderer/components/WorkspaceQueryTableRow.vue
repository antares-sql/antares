<template>
   <div class="tr" @click="selectRow($event, row._id)">
      <div
         v-for="(col, cKey) in row"
         v-show="cKey !== '_id'"
         :key="cKey"
         class="td p-0"
         tabindex="0"
         @contextmenu.prevent="openContext($event, { id: row._id, field: cKey })"
      >
         <template v-if="cKey !== '_id'">
            <span
               v-if="!isInlineEditor[cKey]"
               class="cell-content px-2"
               :class="`${isNull(col)} type-${fields[cKey].type.toLowerCase()}`"
               @dblclick="editON($event, col, cKey)"
            >{{ col | typeFormat(fields[cKey].type.toLowerCase(), fields[cKey].length) | cutText }}</span>
            <ForeignKeySelect
               v-else-if="isForeignKey(cKey)"
               class="editable-field"
               :value.sync="editingContent"
               :key-usage="getKeyUsage(cKey)"
               size="small"
               @blur="editOFF"
            />
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
                  <TextEditor
                     :value.sync="editingContent"
                     editor-class="textarea-editor"
                     :mode="editorMode"
                  />
               </div>
               <div class="editor-field-info p-vcentered">
                  <div class="d-flex p-vcentered">
                     <label for="editorMode" class="form-label mr-2">
                        <b>{{ $t('word.content') }}</b>:
                     </label>
                     <select
                        id="editorMode"
                        v-model="editorMode"
                        class="form-select select-sm"
                     >
                        <option value="text">
                           TEXT
                        </option>
                        <option value="html">
                           HTML
                        </option>
                        <option value="xml">
                           XML
                        </option>
                        <option value="json">
                           JSON
                        </option>
                        <option value="svg">
                           SVG
                        </option>
                        <option value="yaml">
                           YAML
                        </option>
                     </select>
                  </div>
                  <div class="d-flex">
                     <div class="p-vcentered">
                        <div class="mr-4">
                           <b>{{ $t('word.size') }}</b>: {{ editingContent ? editingContent.length : 0 }}
                        </div>
                        <div>
                           <b>{{ $t('word.type') }}</b>: {{ editingType.toUpperCase() }}
                        </div>
                     </div>
                  </div>
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
import { TEXT, LONG_TEXT, NUMBER, FLOAT, DATE, TIME, DATETIME, BLOB, BIT } from 'common/fieldTypes';
import { VueMaskDirective } from 'v-mask';
import ConfirmModal from '@/components/BaseConfirmModal';
import TextEditor from '@/components/BaseTextEditor';
import ForeignKeySelect from '@/components/ForeignKeySelect';

export default {
   name: 'WorkspaceQueryTableRow',
   components: {
      ConfirmModal,
      TextEditor,
      ForeignKeySelect
   },
   directives: {
      mask: VueMaskDirective
   },
   filters: {
      formatBytes,
      cutText (val) {
         if (typeof val !== 'string') return val;
         return val.length > 128 ? `${val.substring(0, 128)}[...]` : val;
      },
      typeFormat (val, type, precision) {
         if (!val) return val;

         type = type.toUpperCase();

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
            if (typeof val === 'number') val = [val];
            const hex = Buffer.from(val).toString('hex');
            return hexToBinary(hex);
         }

         return val;
      }
   },
   props: {
      row: Object,
      fields: Object,
      keyUsage: Array
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
         editingLength: null,
         editorMode: 'text',
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

         if ([...NUMBER, ...FLOAT].includes(this.editingType))
            return { type: 'number', mask: false };

         if (TIME.includes(this.editingType)) {
            let timeMask = '##:##:##';
            const precision = this.fields[this.editingField].length;

            for (let i = 0; i < precision; i++)
               timeMask += i === 0 ? '.#' : '#';

            return { type: 'text', mask: timeMask };
         }

         if (DATE.includes(this.editingType))
            return { type: 'text', mask: '####-##-##' };

         if (DATETIME.includes(this.editingType)) {
            let datetimeMask = '####-##-## ##:##:##';
            const precision = this.fields[this.editingField].length;

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
      },
      foreignKeys () {
         return this.keyUsage.map(key => key.field);
      },
      isEditable () {
         if (this.fields) {
            const nElements = Object.keys(this.fields).reduce((acc, curr) => {
               acc.add(this.fields[curr].table);
               acc.add(this.fields[curr].schema);
               return acc;
            }, new Set([]));

            if (nElements.size > 2) return false;

            return !!(this.fields[Object.keys(this.fields)[0]].schema && this.fields[Object.keys(this.fields)[0]].table);
         }

         return false;
      }
   },
   watch: {
      fields () {
         Object.keys(this.fields).forEach(field => {
            this.isInlineEditor[field.name] = false;
         });
      }
   },
   methods: {
      isForeignKey (key) {
         if (key.includes('.'))
            key = key.split('.').pop();

         return this.foreignKeys.includes(key);
      },
      isNull (value) {
         return value === null ? ' is-null' : '';
      },
      bufferToBase64 (val) {
         return bufferToBase64(val);
      },
      editON (event, content, field) {
         if (!this.isEditable) return;

         window.addEventListener('keydown', this.onKey);

         const type = this.fields[field].type.toUpperCase(); ;
         this.originalContent = this.$options.filters.typeFormat(content, type, this.fields[field].length);
         this.editingType = type;
         this.editingField = field;
         this.editingLength = this.fields[field].length;

         if (LONG_TEXT.includes(type)) {
            this.isTextareaEditor = true;
            this.editingContent = this.$options.filters.typeFormat(content, type);
            return;
         }

         if (BLOB.includes(type)) {
            this.isBlobEditor = true;
            this.editingContent = content || '';
            this.fileToUpload = null;
            this.willBeDeleted = false;

            if (content !== null) {
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
         this.editingContent = this.originalContent;
         this.$nextTick(() => { // Focus on input
            event.target.blur();

            this.$nextTick(() => document.querySelector('.editable-field').focus());
         });

         const obj = { [field]: true };
         this.isInlineEditor = { ...this.isInlineEditor, ...obj };
      },
      editOFF () {
         if (!this.editingField) return;

         this.isInlineEditor[this.editingField] = false;
         let content;
         if (!BLOB.includes(this.editingType)) {
            if (this.editingContent === this.$options.filters.typeFormat(this.originalContent, this.editingType, this.editingLength)) return;// If not changed
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

         this.$emit('update-field', {
            field: this.fields[this.editingField].name,
            type: this.editingType,
            content
         });

         this.editingType = null;
         this.editingField = null;
         window.removeEventListener('keydown', this.onKey);
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
      selectRow (event, row) {
         this.$emit('select-row', event, row);
      },
      getKeyUsage (keyName) {
         if (keyName.includes('.'))
            return this.keyUsage.find(key => key.field === keyName.split('.').pop());
         return this.keyUsage.find(key => key.field === keyName);
      },
      openContext (event, payload) {
         if (this.isEditable) {
            payload.field = this.fields[payload.field].name;// Ensures field name only
            this.$emit('contextmenu', event, payload);
         }
      },
      onKey (e) {
         e.stopPropagation();
         if (e.key === 'Escape') {
            this.isInlineEditor[this.editingField] = false;
            this.editingField = null;
            window.removeEventListener('keydown', this.onKey);
         }
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
  margin-top: 0.4rem;
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
