<template>
   <div
      class="tr"
      :style="{height: itemHeight+'px'}"
      @click="selectRow($event, row._antares_id)"
   >
      <div
         v-for="(col, cKey) in row"
         v-show="cKey !== '_antares_id'"
         :key="cKey"
         class="td p-0"
         tabindex="0"
         @contextmenu.prevent="openContext($event, { id: row._antares_id, orgField: cKey })"
      >
         <template v-if="cKey !== '_antares_id'">
            <span
               v-if="!isInlineEditor[cKey] && fields[cKey]"
               class="cell-content"
               :class="`${isNull(col)} ${typeClass(fields[cKey].type)}`"
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
                  class="editable-field form-input input-sm px-1"
                  @blur="editOFF"
               >
               <select
                  v-else-if="inputProps.type === 'boolean'"
                  v-model="editingContent"
                  class="form-select small-select editable-field"
                  @blur="editOFF"
               >
                  <option>true</option>
                  <option>false</option>
               </select>
               <select
                  v-else-if="enumArray"
                  v-model="editingContent"
                  class="form-select small-select editable-field"
                  @blur="editOFF"
               >
                  <option v-for="value in enumArray" :key="value">
                     {{ value }}
                  </option>
               </select>
               <input
                  v-else
                  ref="editField"
                  v-model="editingContent"
                  :type="inputProps.type"
                  autofocus
                  class="editable-field form-input input-sm px-1"
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
         <template #header>
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-playlist-edit mr-1" /> <span class="cut-text">{{ $t('word.edit') }} "{{ editingField }}"</span>
            </div>
         </template>
         <template #body>
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
                        <option
                           v-for="language in availableLanguages"
                           :key="language.slug"
                           :value="language.slug"
                        >
                           {{ language.name }}
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
         </template>
      </ConfirmModal>
      <ConfirmModal
         v-if="isMapModal"
         :hide-footer="true"
         size="medium"
         @hide="hideEditorModal"
      >
         <template #header>
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-map mr-1" /> <span class="cut-text">"{{ editingField }}"</span>
            </div>
         </template>
         <template #body>
            <BaseMap :points="editingContent" :is-multi-spatial="isMultiSpatial" />
         </template>
      </ConfirmModal>
      <ConfirmModal
         v-if="isBlobEditor"
         :confirm-text="$t('word.update')"
         @confirm="editOFF"
         @hide="hideEditorModal"
      >
         <template #header>
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-playlist-edit mr-1" />
               <span class="cut-text">{{ $t('word.edit') }} "{{ editingField }}"</span>
            </div>
         </template>
         <template #body>
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
         </template>
      </ConfirmModal>
   </div>
</template>

<script>
import moment from 'moment';
import { ModelOperations } from '@vscode/vscode-languagedetection';
import { mimeFromHex } from 'common/libs/mimeFromHex';
import { formatBytes } from 'common/libs/formatBytes';
import { bufferToBase64 } from 'common/libs/bufferToBase64';
import hexToBinary from 'common/libs/hexToBinary';
import {
   TEXT,
   LONG_TEXT,
   ARRAY,
   TEXT_SEARCH,
   NUMBER,
   FLOAT,
   BOOLEAN,
   DATE,
   TIME,
   DATETIME,
   BLOB,
   BIT,
   HAS_TIMEZONE,
   SPATIAL,
   IS_MULTI_SPATIAL
} from 'common/fieldTypes';
import { VueMaskDirective } from 'v-mask';
import ConfirmModal from '@/components/BaseConfirmModal';
import TextEditor from '@/components/BaseTextEditor';
import BaseMap from '@/components/BaseMap';
import ForeignKeySelect from '@/components/ForeignKeySelect';

export default {
   name: 'WorkspaceTabQueryTableRow',
   components: {
      ConfirmModal,
      TextEditor,
      ForeignKeySelect,
      BaseMap
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
            if (typeof val === 'string')
               return val;

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

         if (ARRAY.includes(type)) {
            if (Array.isArray(val))
               return JSON.stringify(val).replaceAll('[', '{').replaceAll(']', '}');
            return val;
         }

         if (SPATIAL.includes(type))
            return val;

         return typeof val === 'object' ? JSON.stringify(val) : val;
      }
   },
   props: {
      row: Object,
      fields: Object,
      keyUsage: Array,
      itemHeight: Number,
      elementType: { type: String, default: 'table' }
   },
   data () {
      return {
         isInlineEditor: {},
         isTextareaEditor: false,
         isBlobEditor: false,
         isMapModal: false,
         isMultiSpatial: false,
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
         fileToUpload: null,
         availableLanguages: [
            { name: 'TEXT', slug: 'text', id: 'text' },
            { name: 'HTML', slug: 'html', id: 'html' },
            { name: 'XML', slug: 'xml', id: 'xml' },
            { name: 'JSON', slug: 'json', id: 'json' },
            { name: 'SVG', slug: 'svg', id: 'svg' },
            { name: 'INI', slug: 'ini', id: 'ini' },
            { name: 'MARKDOWN', slug: 'markdown', id: 'md' },
            { name: 'YAML', slug: 'yaml', id: 'yaml' }
         ]
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

            if (HAS_TIMEZONE.includes(this.editingType))
               timeMask += 'X##';

            return { type: 'text', mask: timeMask };
         }

         if (DATE.includes(this.editingType))
            return { type: 'text', mask: '####-##-##' };

         if (DATETIME.includes(this.editingType)) {
            let datetimeMask = '####-##-## ##:##:##';
            const precision = this.fields[this.editingField].length;

            for (let i = 0; i < precision; i++)
               datetimeMask += i === 0 ? '.#' : '#';

            if (HAS_TIMEZONE.includes(this.editingType))
               datetimeMask += 'X##';

            return { type: 'text', mask: datetimeMask };
         }

         if (BLOB.includes(this.editingType))
            return { type: 'file', mask: false };

         if (BOOLEAN.includes(this.editingType))
            return { type: 'boolean', mask: false };

         if (SPATIAL.includes(this.editingType))
            return { type: 'map', mask: false };

         return { type: 'text', mask: false };
      },
      isImage () {
         return ['gif', 'jpg', 'png', 'bmp', 'ico', 'tif'].includes(this.contentInfo.ext);
      },
      foreignKeys () {
         return this.keyUsage.map(key => key.field);
      },
      isEditable () {
         if (this.elementType === 'view') return false;

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
      },
      enumArray () {
         if (this.fields[this.editingField] && this.fields[this.editingField].enumValues)
            return this.fields[this.editingField].enumValues.replaceAll('\'', '').split(',');
         return false;
      }
   },
   watch: {
      fields () {
         Object.keys(this.fields).forEach(field => {
            this.isInlineEditor[field.name] = false;
         });
      },
      isTextareaEditor (val) {
         if (val) {
            const modelOperations = new ModelOperations();
            (async () => {
               const detected = await modelOperations.runModel(this.editingContent);
               const filteredLanguages = detected.filter(dLang =>
                  this.availableLanguages.some(aLang => aLang.id === dLang.languageId) &&
                     dLang.confidence > 0.1
               );

               if (filteredLanguages.length)
                  this.editorMode = this.availableLanguages.find(lang => lang.id === filteredLanguages[0].languageId).slug;
            })();
         }
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
      typeClass (type) {
         if (type)
            return `type-${type.toLowerCase().replaceAll(' ', '_').replaceAll('"', '')}`;
         return '';
      },
      bufferToBase64 (val) {
         return bufferToBase64(val);
      },
      editON (event, content, field) {
         if (!this.isEditable || this.editingType === 'none') return;

         window.addEventListener('keydown', this.onKey);

         const type = this.fields[field].type.toUpperCase(); ;
         this.originalContent = this.$options.filters.typeFormat(content, type, this.fields[field].length);
         this.editingType = type;
         this.editingField = field;
         this.editingLength = this.fields[field].length;

         if ([...LONG_TEXT, ...ARRAY, ...TEXT_SEARCH].includes(type)) {
            this.isTextareaEditor = true;
            this.editingContent = this.$options.filters.typeFormat(content, type);
            return;
         }

         if (SPATIAL.includes(type)) {
            if (content) {
               this.isMultiSpatial = IS_MULTI_SPATIAL.includes(type);
               this.isMapModal = true;
               this.editingContent = this.$options.filters.typeFormat(content, type);
            }
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
            if ([...DATETIME, ...TIME].includes(this.editingType)) {
               if (this.editingContent.substring(this.editingContent.length - 1) === '.')
                  this.editingContent = this.editingContent.slice(0, -1);
            }

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
         this.isMapModal = false;
         this.isMultiSpatial = false;
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
         payload.field = this.fields[payload.orgField].name;// Ensures field name only
         payload.isEditable = this.isEditable;
         this.$emit('contextmenu', event, payload);
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
  max-height: 21px;
  border-radius: 3px;
  font-size: 0.7rem;
  position: absolute;
  left: 0;
  right: 0;
}

.cell-content {
  display: block;
  padding: 0 0.2rem;
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
