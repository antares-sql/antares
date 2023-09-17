<template>
   <div
      class="tr"
      :style="{height: itemHeight+'px'}"
   >
      <div
         v-for="(col, cKey) in row"
         v-show="cKey !== '_antares_id'"
         :key="cKey"
         class="td p-0"
         :class="{selected: selectedCell === cKey}"
         @click="selectRow($event, cKey)"

         @contextmenu.prevent="openContext($event, {
            id: row._antares_id,
            orgField: cKey,
            type: fields[cKey].type,
            length: fields[cKey].charLength || fields[cKey].length
         })"
      >
         <template v-if="cKey !== '_antares_id'">
            <span
               v-if="!isInlineEditor[cKey] && fields[cKey]"
               class="cell-content"
               :class="`${isNull(col)} ${typeClass(fields[cKey].type)}`"
               @dblclick="editON(cKey)"
            >{{ cutText(typeFormat(col, fields[cKey].type.toLowerCase(), fields[cKey].length) as string, 250) }}</span>
            <ForeignKeySelect
               v-else-if="isForeignKey(cKey)"
               v-model="editingContent"
               class="editable-field"
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
               <BaseSelect
                  v-else-if="inputProps.type === 'boolean'"
                  v-model="editingContent"
                  :options="['true', 'false']"
                  class="form-select small-select editable-field"
                  @blur="editOFF"
               />
               <BaseSelect
                  v-else-if="enumArray"
                  v-model="editingContent"
                  :options="enumArray"
                  class="form-select small-select editable-field"
                  dropdown-class="small-select"
                  @blur="editOFF"
               />
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
         :confirm-text="t('application.update')"
         size="medium"
         :disable-autofocus="true"
         @confirm="editOFF"
         @hide="hideEditorModal"
      >
         <template #header>
            <div class="d-flex">
               <BaseIcon
                  icon-name="mdiPlaylistEdit"
                  class="mr-1"
                  :size="24"
               /> <span class="cut-text">{{ t('general.edit') }} "{{ editingField }}"</span>
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               <div>
                  <TextEditor
                     v-model="editingContent"
                     editor-class="textarea-editor"
                     :mode="editorMode"
                  />
               </div>
               <div class="editor-field-info p-vcentered">
                  <div class="d-flex p-vcentered">
                     <label for="editorMode" class="form-label mr-2">
                        <b>{{ t('general.content') }}</b>:
                     </label>
                     <BaseSelect
                        id="editorMode"
                        v-model="editorMode"
                        :options="availableLanguages"
                        option-label="name"
                        option-track-by="slug"
                        class="form-select select-sm"
                     />
                  </div>
                  <div class="d-flex">
                     <div class="p-vcentered">
                        <div class="mr-4">
                           <b>{{ t('general.size') }}</b>: {{ editingContent ? editingContent.length : 0 }}
                        </div>
                        <div v-if="editingType">
                           <b>{{ t('database.type') }}</b>: {{ editingType.toUpperCase() }}
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
               <BaseIcon
                  icon-name="mdiMap"
                  class="mr-1"
                  :size="24"
               /> <span class="cut-text">"{{ editingField }}"</span>
            </div>
         </template>
         <template #body>
            <BaseMap :points="editingContent" :is-multi-spatial="isMultiSpatial" />
         </template>
      </ConfirmModal>
      <ConfirmModal
         v-if="isBlobEditor"
         :confirm-text="t('application.update')"
         @confirm="editOFF"
         @hide="hideEditorModal"
      >
         <template #header>
            <div class="d-flex">
               <BaseIcon
                  icon-name="mdiPlaylistEdit"
                  class="mr-1"
                  :size="24"
               />
               <span class="cut-text">{{ t('general.edit') }} "{{ editingField }}"</span>
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               <Transition name="jump-down">
                  <div v-if="contentInfo.size">
                     <img
                        v-if="isImage"
                        :src="`data:${contentInfo.mime};base64, ${bufferToBase64(editingContent)}`"
                        class="img-responsive p-centered bg-checkered"
                     >
                     <div v-else class="text-center">
                        <BaseIcon icon-name="mdiFile" :size="36" />
                     </div>
                     <div class="editor-buttons mt-2">
                        <button class="btn btn-link btn-sm" @click="downloadFile">
                           <span>{{ t('general.download') }}</span>
                           <BaseIcon
                              icon-name="mdiDownload"
                              class="ml-1"
                              :size="24"
                           />
                        </button>
                        <button class="btn btn-link btn-sm" @click="prepareToDelete">
                           <span>{{ t('general.delete') }}</span>
                           <BaseIcon
                              icon-name="mdiDeleteForever"
                              class="ml-1"
                              :size="24"
                           />
                        </button>
                     </div>
                  </div>
               </Transition>
               <div class="editor-field-info">
                  <div>
                     <b>{{ t('general.size') }}</b>: {{ formatBytes(editingContent.length) }}<br>
                     <b>{{ t('general.mimeType') }}</b>: {{ contentInfo.mime }}
                  </div>
                  <div v-if="editingType">
                     <b>{{ t('database.type') }}</b>: {{ editingType.toUpperCase() }}
                  </div>
               </div>
               <div class="mt-3">
                  <label>{{ t('general.uploadFile') }}</label>
                  <input
                     class="form-input"
                     type="file"
                     @change="filesChange($event as any)"
                  >
               </div>
            </div>
         </template>
      </ConfirmModal>
   </div>
</template>

<script setup lang="ts">
import {
   ARRAY,
   BINARY,
   BIT,
   BLOB,
   BOOLEAN,
   DATE,
   DATETIME,
   FLOAT,
   HAS_TIMEZONE,
   IS_BIGINT,
   IS_MULTI_SPATIAL,
   LONG_TEXT,
   NUMBER,
   SPATIAL,
   TEXT,
   TEXT_SEARCH,
   TIME } from 'common/fieldTypes';
import { QueryForeign, TableField } from 'common/interfaces/antares';
import { bufferToBase64 } from 'common/libs/bufferToBase64';
import { formatBytes } from 'common/libs/formatBytes';
import hexToBinary, { HexChar } from 'common/libs/hexToBinary';
import { langDetector } from 'common/libs/langDetector';
import { mimeFromHex } from 'common/libs/mimeFromHex';
import * as moment from 'moment';
import { computed, nextTick, onBeforeUnmount, Prop, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import BaseMap from '@/components/BaseMap.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import TextEditor from '@/components/BaseTextEditor.vue';
import ForeignKeySelect from '@/components/ForeignKeySelect.vue';
import { useFilters } from '@/composables/useFilters';

const { t } = useI18n();
const { cutText } = useFilters();

const props = defineProps({
   row: Object,
   fields: Object as Prop<{
      [key: string]: TableField;
   }>,
   keyUsage: Array as Prop<QueryForeign[]>,
   itemHeight: Number,
   elementType: { type: String, default: 'table' },
   selected: { type: Boolean, default: false },
   selectedCell: { type: String, default: null }
});

const emit = defineEmits(['update-field', 'select-row', 'contextmenu', 'start-editing', 'stop-editing']);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isInlineEditor: Ref<any> = ref({});
const isTextareaEditor = ref(false);
const isBlobEditor = ref(false);
const isMapModal = ref(false);
const isMultiSpatial = ref(false);
const willBeDeleted = ref(false);
const originalContent = ref(null);
const editingContent = ref(null);
const editingType = ref(null);
const editingField = ref(null);
const editingLength = ref(null);
const editorMode = ref('text');
const contentInfo = ref({
   ext: '',
   mime: '',
   size: null
});
const fileToUpload = ref(null);
const availableLanguages = ref([
   { name: 'TEXT', slug: 'text', id: 'text' },
   { name: 'HTML', slug: 'html', id: 'html' },
   { name: 'XML', slug: 'xml', id: 'xml' },
   { name: 'JSON', slug: 'json', id: 'json' },
   { name: 'SVG', slug: 'svg', id: 'svg' },
   { name: 'INI', slug: 'ini', id: 'ini' },
   { name: 'MARKDOWN', slug: 'markdown', id: 'md' },
   { name: 'YAML', slug: 'yaml', id: 'yaml' }
]);

const inputProps = computed(() => {
   if ([...TEXT, ...LONG_TEXT].includes(editingType.value))
      return { type: 'text', mask: false };

   if ([...NUMBER, ...FLOAT].includes(editingType.value)) {
      if (IS_BIGINT.includes(editingType.value))
         return { type: 'text', mask: false };
      else
         return { type: 'number', mask: false };
   }

   if (TIME.includes(editingType.value)) {
      let timeMask = '##:##:##';
      const precision = props.fields[editingField.value].length;

      for (let i = 0; i < Number(precision); i++)
         timeMask += i === 0 ? '.#' : '#';

      if (HAS_TIMEZONE.includes(editingType.value))
         timeMask += 'X##';

      return { type: 'text', mask: timeMask };
   }

   if (DATE.includes(editingType.value))
      return { type: 'text', mask: '####-##-##' };

   if (DATETIME.includes(editingType.value)) {
      let datetimeMask = '####-##-## ##:##:##';
      const precision = props.fields[editingField.value].length;

      for (let i = 0; i < Number(precision); i++)
         datetimeMask += i === 0 ? '.#' : '#';

      if (HAS_TIMEZONE.includes(editingType.value))
         datetimeMask += 'X##';

      return { type: 'text', mask: datetimeMask };
   }

   if (BLOB.includes(editingType.value))
      return { type: 'file', mask: false };

   if (BOOLEAN.includes(editingType.value))
      return { type: 'boolean', mask: false };

   if (SPATIAL.includes(editingType.value))
      return { type: 'map', mask: false };

   return { type: 'text', mask: false };
});

const isImage = computed(() => {
   return ['gif', 'jpg', 'png', 'bmp', 'ico', 'tif'].includes(contentInfo.value.ext);
});

const foreignKeys = computed(() => {
   return props.keyUsage.map(key => key.field);
});

const isEditable = computed(() => {
   if (props.elementType === 'view') return false;

   if (props.fields) {
      const nElements = Object.keys(props.fields).reduce((acc, curr) => {
         acc.add(props.fields[curr].table);
         acc.add(props.fields[curr].schema);
         return acc;
      }, new Set([]));

      if (nElements.size > 2) return false;

      return !!(props.fields[Object.keys(props.fields)[0]].schema && props.fields[Object.keys(props.fields)[0]].table);
   }

   return false;
});

const isBaseSelectField = computed(() => {
   return isForeignKey(editingField.value) || inputProps.value.type === 'boolean' || enumArray.value;
});

const enumArray = computed(() => {
   if (props.fields[editingField.value] && props.fields[editingField.value].enumValues)
      return props.fields[editingField.value].enumValues.replaceAll('\'', '').split(',');
   return false;
});

const isForeignKey = (key: string) => {
   if (key) {
      if (key.includes('.'))
         key = key.split('.').pop();

      return foreignKeys.value.includes(key);
   }
};

const isNull = (value: null | string | number) => {
   return value === null ? ' is-null' : '';
};

const typeClass = (type: string) => {
   if (type)
      return `type-${type.toLowerCase().replaceAll(' ', '_').replaceAll('"', '')}`;
   return '';
};

const editON = async (field: string) => {
   if (!isEditable.value || editingType.value === 'none') return;

   const content = props.row[field];
   const type = props.fields[field].type.toUpperCase();

   if (BINARY.includes(type)) return;

   originalContent.value = typeFormat(content, type, props.fields[field].length);
   editingType.value = type;
   editingField.value = field;
   editingLength.value = props.fields[field].length;

   if ([...LONG_TEXT, ...ARRAY, ...TEXT_SEARCH].includes(type)) {
      isTextareaEditor.value = true;
      editingContent.value = typeFormat(content, type);
      emit('start-editing', field);
      return;
   }

   if (SPATIAL.includes(type)) {
      if (content) {
         isMultiSpatial.value = IS_MULTI_SPATIAL.includes(type);
         isMapModal.value = true;
         editingContent.value = typeFormat(content, type);
      }
      emit('start-editing', field);
      return;
   }

   if (BLOB.includes(type)) {
      isBlobEditor.value = true;
      editingContent.value = content || '';
      fileToUpload.value = null;
      willBeDeleted.value = false;

      if (content !== null) {
         const buff = Buffer.from(editingContent.value);
         if (buff.length) {
            const hex = buff.toString('hex').substring(0, 8).toUpperCase();
            const { ext, mime } = mimeFromHex(hex);
            contentInfo.value = {
               ext,
               mime,
               size: editingContent.value.length
            };
         }
      }
      emit('start-editing', field);
      return;
   }

   // Inline editable fields
   editingContent.value = originalContent.value;

   const obj = { [field]: true };
   isInlineEditor.value = { ...isInlineEditor.value, ...obj };
   nextTick(() => {
      document.querySelector<HTMLInputElement>('.editable-field').focus();
   });

   emit('start-editing', field);
};

const editOFF = () => {
   if (!editingField.value) return;

   isInlineEditor.value[editingField.value] = false;
   let content;
   if (!BLOB.includes(editingType.value)) {
      if ([...DATETIME, ...TIME].includes(editingType.value)) {
         if (editingContent.value !== null && editingContent.value.substring(editingContent.value.length - 1) === '.')
            editingContent.value = editingContent.value.slice(0, -1);
      }

      // If not changed
      if (editingContent.value === typeFormat(originalContent.value, editingType.value, editingLength.value)) {
         editingType.value = null;
         editingField.value = null;
         emit('stop-editing', editingField.value);
         return;
      }

      content = editingContent.value;
   }
   else { // Handle file upload
      if (willBeDeleted.value) {
         content = '';
         willBeDeleted.value = false;
      }
      else {
         if (!fileToUpload.value) return;
         content = fileToUpload.value.file.path;
      }
   }

   emit('update-field', {
      field: props.fields[editingField.value].name,
      type: editingType.value,
      content
   });

   emit('stop-editing', editingField.value);

   editingType.value = null;
   editingField.value = null;
};

const hideEditorModal = () => {
   isTextareaEditor.value = false;
   isBlobEditor.value = false;
   isMapModal.value = false;
   isMultiSpatial.value = false;
   emit('stop-editing', editingField.value);
};

const downloadFile = () => {
   const downloadLink = document.createElement('a');

   downloadLink.href = `data:${contentInfo.value.mime};base64, ${bufferToBase64(editingContent.value)}`;
   downloadLink.setAttribute('download', `${editingField.value}.${contentInfo.value.ext}`);
   document.body.appendChild(downloadLink);

   downloadLink.click();
   downloadLink.remove();
};

const filesChange = (event: Event & {target: {files: {name: string}[]}}) => {
   const { files } = event.target;
   if (!files.length) return;

   fileToUpload.value = { name: files[0].name, file: files[0] };
   willBeDeleted.value = false;
};

const prepareToDelete = () => {
   editingContent.value = '';
   contentInfo.value = {
      ext: '',
      mime: '',
      size: null
   };
   willBeDeleted.value = true;
};

const selectRow = (event: Event, field: string) => {
   emit('select-row', event, props.row, field);
};

const getKeyUsage = (keyName: string) => {
   if (keyName.includes('.'))
      return props.keyUsage.find(key => key.field === keyName.split('.').pop());
   return props.keyUsage.find(key => key.field === keyName);
};

const openContext = (event: MouseEvent, payload: {
   id: string;
   field?: string;
   orgField: string;
   isEditable?: boolean;
   type: string;
   length: number | false;
}) => {
   payload.field = props.fields[payload.orgField].name;// Ensures field name only
   payload.isEditable = isEditable.value;
   emit('contextmenu', event, payload);
};

const onKey = (e: KeyboardEvent) => {
   e.stopPropagation();

   if (!editingField.value && e.key === 'Enter')
      return editON(props.selectedCell);

   if (editingField.value && e.key === 'Enter' && !isBaseSelectField.value)
      return editOFF();

   if (editingField.value && e.key === 'Escape') {
      isInlineEditor.value[editingField.value] = false;
      editingField.value = null;
      emit('stop-editing', editingField.value);
   }
};

const typeFormat = (val: string | number | Date | number[], type: string, precision?: number | false) => {
   if (!val) return val;

   type = type.toUpperCase();

   if (DATE.includes(type))
      return moment(val).isValid() ? moment(val).format('YYYY-MM-DD') : val;

   if (DATETIME.includes(type)) {
      if (typeof val === 'string')
         return val;

      let datePrecision = '';
      for (let i = 0; i < Number(precision); i++)
         datePrecision += i === 0 ? '.S' : 'S';

      return moment(val).isValid() ? moment(val).format(`YYYY-MM-DD HH:mm:ss${datePrecision}`) : val;
   }

   if (BLOB.includes(type)) {
      if (typeof val === 'string') return val;

      const buff = Buffer.from(val as unknown as ArrayBuffer);
      if (!buff.length) return '';

      const hex = buff.toString('hex').substring(0, 8).toUpperCase();
      return `${mimeFromHex(hex).mime} (${formatBytes(buff.length)})`;
   }

   if (BIT.includes(type)) {
      if (typeof val === 'number') val = [val] as number[];
      const hex = Buffer.from(val as number[]).toString('hex') as unknown as HexChar[];
      const bitString = hexToBinary(hex);
      return parseInt(bitString).toString().padStart(Number(precision), '0');
   }

   if (BINARY.includes(type))
      return Buffer.from(val as number[]).toString('hex');

   if (ARRAY.includes(type)) {
      if (Array.isArray(val))
         return JSON.stringify(val).replaceAll('[', '{').replaceAll(']', '}');
      return val;
   }

   if (SPATIAL.includes(type))
      return val;

   return typeof val === 'object' ? JSON.stringify(val) : val;
};

watch(() => props.fields, () => {
   Object.keys(props.fields).forEach(field => {
      isInlineEditor.value[field] = false;
   });
});

watch(isTextareaEditor, (val) => {
   if (val)
      editorMode.value = langDetector(editingContent.value);
});

watch(() => props.selected, (isSelected) => {
   if (isSelected)
      window.addEventListener('keydown', onKey);

   else {
      editOFF();
      window.removeEventListener('keydown', onKey);
   }
});

onBeforeUnmount(() => {
   if (props.selected)
      window.removeEventListener('keydown', onKey);
});
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
