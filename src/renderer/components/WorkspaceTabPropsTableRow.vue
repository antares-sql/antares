<template>
   <div class="tr" @contextmenu.prevent="!editingField ? emit('contextmenu', $event, localRow._antares_id) : null">
      <div class="td p-0" tabindex="0">
         <div :class="customizations.sortableFields ? 'row-draggable' : 'text-center'">
            <i v-if="customizations.sortableFields" class="mdi mdi-drag-horizontal row-draggable-icon" />
            {{ localRow.order }}
         </div>
      </div>
      <div class="td p-0" tabindex="0">
         <div class="text-center">
            <i
               v-for="(index, i) in indexes"
               :key="`${index.name}-${i}`"
               :title="index.type"
               class="d-inline-block mdi mdi-key column-key c-help"
               :class="`key-${index.type}`"
            />
            <i
               v-for="foreign in foreigns"
               :key="foreign"
               :title="foreign"
               class="d-inline-block mdi mdi-key-link c-help"
            />
         </div>
      </div>
      <div class="td p-0" tabindex="0">
         <span
            v-if="!isInlineEditor.name"
            class="cell-content"
            @dblclick="editON($event, localRow.name , 'name')"
         >
            {{ localRow.name }}
         </span>
         <input
            v-else
            ref="editField"
            v-model="editingContent"
            type="text"
            autofocus
            class="editable-field form-input input-sm px-1"
            @blur="editOFF"
         >
      </div>
      <div
         class="td p-0 text-uppercase"
         tabindex="0"
      >
         <span
            v-if="!isInlineEditor.type"
            class="cell-content text-left"
            :class="typeClass(localRow.type)"
            @dblclick="editON($event, localRow.type.toUpperCase(), 'type')"
         >
            {{ localRow.type }}
         </span>
         <BaseSelect
            v-else
            ref="editField"
            v-model="editingContent"
            :options="types"
            group-label="group"
            group-values="types"
            option-label="name"
            option-track-by="name"
            class="form-select editable-field pl-1 pr-4 small-select text-uppercase"
            @blur="editOFF"
         />
      </div>
      <div
         v-if="customizations.tableArray"
         class="td p-0"
         tabindex="0"
      >
         <label class="form-checkbox">
            <input v-model="localRow.isArray" type="checkbox">
            <i class="form-icon" />
         </label>
      </div>
      <div class="td p-0 type-int" tabindex="0">
         <template v-if="fieldType?.length">
            <span
               v-if="!isInlineEditor.length"
               class="cell-content"
               @dblclick="editON($event, localLength, 'length')"
            >
               <span v-if="localRow.enumValues">
                  {{ localRow.enumValues }}
               </span>
               <span v-else-if="localRow.numScale">
                  {{ localLength }}, {{ localRow.numScale }}
               </span>
               <span v-else>
                  {{ localLength }}
               </span>
            </span>
            <input
               v-else-if="localRow.enumValues"
               ref="editField"
               v-model="editingContent"
               type="text"
               autofocus
               class="editable-field form-input input-sm px-1"
               @blur="editOFF"
            >
            <input
               v-else-if="fieldType.scale"
               ref="editField"
               v-model="editingContent"
               type="text"
               autofocus
               class="editable-field form-input input-sm px-1"
               @keypress="checkLengthScale"
               @blur="editOFF"
            >
            <input
               v-else
               ref="editField"
               v-model="editingContent"
               type="number"
               autofocus
               class="editable-field form-input input-sm px-1"
               @blur="editOFF"
            >
         </template>
      </div>
      <div
         v-if="customizations.unsigned"
         class="td p-0"
         tabindex="0"
      >
         <label class="form-checkbox">
            <input
               v-model="localRow.unsigned"
               type="checkbox"
               :disabled="!fieldType?.unsigned"
            >
            <i class="form-icon" />
         </label>
      </div>
      <div
         v-if="customizations.nullable"
         class="td p-0"
         tabindex="0"
      >
         <label class="form-checkbox">
            <input
               v-model="localRow.nullable"
               type="checkbox"
               :disabled="!isNullable"
            >
            <i class="form-icon" />
         </label>
      </div>
      <div
         v-if="customizations.zerofill"
         class="td p-0"
         tabindex="0"
      >
         <label class="form-checkbox">
            <input
               v-model="localRow.zerofill"
               type="checkbox"
               :disabled="!fieldType.zerofill"
            >
            <i class="form-icon" />
         </label>
      </div>
      <div class="td p-0" tabindex="0">
         <span class="cell-content" @dblclick="editON($event, localRow.default, 'default')">
            {{ fieldDefault }}
         </span>
      </div>
      <div
         v-if="customizations.comment"
         class="td p-0 type-varchar"
         tabindex="0"
      >
         <span
            v-if="!isInlineEditor.comment"
            class="cell-content"
            @dblclick="editON($event, localRow.comment , 'comment')"
         >
            {{ localRow.comment }}
         </span>
         <input
            v-else
            ref="editField"
            v-model="editingContent"
            type="text"
            autofocus
            class="editable-field form-input input-sm px-1"
            @blur="editOFF"
         >
      </div>
      <div
         v-if="customizations.collation"
         class="td p-0"
         tabindex="0"
      >
         <template v-if="fieldType.collation">
            <span
               v-if="!isInlineEditor.collation"
               class="cell-content"
               @dblclick="editON($event, localRow.collation, 'collation')"
            >
               {{ localRow.collation }}
            </span>
            <BaseSelect
               v-else
               ref="editField"
               v-model="editingContent"
               :options="collations"
               option-label="collation"
               option-track-by="collation"
               class="form-select small-select pl-1 pr-4 editable-field"
               @blur="editOFF"
            />
         </template>
      </div>
      <ConfirmModal
         v-if="isDefaultModal"
         :confirm-text="t('word.confirm')"
         size="400"
         @confirm="editOFF"
         @hide="hideDefaultModal"
      >
         <template #header>
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-playlist-edit mr-1" />
               <span class="cut-text">{{ t('word.default') }} "{{ row.name }}"</span>
            </div>
         </template>
         <template #body>
            <form class="form-horizontal">
               <div class="mb-2">
                  <label class="form-radio form-inline">
                     <input
                        v-model="defaultValue.type"
                        type="radio"
                        name="default"
                        value="noval"
                     ><i class="form-icon" /> No value
                  </label>
               </div>
               <div class="mb-2">
                  <div class="form-group">
                     <label class="form-radio form-inline col-4">
                        <input
                           v-model="defaultValue.type"
                           value="custom"
                           type="radio"
                           name="default"
                        ><i class="form-icon" /> {{ t('message.customValue') }}
                     </label>
                     <div class="column">
                        <input
                           v-model="defaultValue.custom"
                           :disabled="defaultValue.type !== 'custom'"
                           class="form-input"
                           type="text"
                        >
                     </div>
                  </div>
               </div>
               <div v-if="customizations.nullable" class="mb-2">
                  <label class="form-radio form-inline">
                     <input
                        v-model="defaultValue.type"
                        type="radio"
                        name="default"
                        value="null"
                     ><i class="form-icon" /> NULL
                  </label>
               </div>
               <div v-if="customizations.autoIncrement" class="mb-2">
                  <label class="form-radio form-inline">
                     <input
                        v-model="defaultValue.type"
                        :disabled="!canAutoincrement"
                        type="radio"
                        name="default"
                        value="autoincrement"
                     ><i class="form-icon" /> AUTO_INCREMENT
                  </label>
               </div>
               <div class="mb-2">
                  <div class="form-group">
                     <label class="form-radio form-inline col-4">
                        <input
                           v-model="defaultValue.type"
                           type="radio"
                           name="default"
                           value="expression"
                        ><i class="form-icon" /> {{ t('word.expression') }}
                     </label>
                     <div class="column">
                        <input
                           v-model="defaultValue.expression"
                           :disabled="defaultValue.type !== 'expression'"
                           class="form-input"
                           type="text"
                        >
                     </div>
                  </div>
               </div>
               <div v-if="customizations.onUpdate">
                  <div class="form-group">
                     <label class="form-label col-4">
                        {{ t('message.onUpdate') }}
                     </label>
                     <div class="column">
                        <input
                           v-model="defaultValue.onUpdate"
                           class="form-input"
                           type="text"
                        >
                     </div>
                  </div>
               </div>
            </form>
         </template>
      </ConfirmModal>
   </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, Prop, PropType, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useWorkspacesStore } from '@/stores/workspaces';
import ConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import { TableField, TableIndex, TypesGroup } from 'common/interfaces/antares';

const { t } = useI18n();

const props = defineProps({
   row: Object as Prop<TableField>,
   dataTypes: {
      type: Array as PropType<TypesGroup[]>,
      default: () => []
   },
   indexes: Array as Prop<TableIndex[]>,
   foreigns: Array as Prop<string[]>,
   customizations: Object
});

const emit = defineEmits(['contextmenu', 'rename-field']);

const workspacesStore = useWorkspacesStore();

const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

const { getWorkspace } = workspacesStore;

const localRow: Ref<TableField> = ref({} as TableField);
const isInlineEditor: Ref<TableField> = ref({} as TableField);
const isDefaultModal = ref(false);
const defaultValue = ref({
   type: 'noval',
   custom: '',
   expression: '',
   onUpdate: ''
});
const editingContent: Ref<string | number> = ref(null);
const originalContent = ref(null);
const editingField: Ref<keyof TableField> = ref(null);

const localLength = computed(() => {
   const localLength = localRow.value.numLength || localRow.value.charLength || localRow.value.datePrecision || localRow.value.numPrecision || 0 as number | true;
   return localLength === true ? null : localLength;
});

const fieldType = computed(() => {
   const fieldType = props.dataTypes.reduce((acc, group) => [...acc, ...group.types], []).filter(type =>
      type.name === (localRow.value.type ? localRow.value.type.toUpperCase() : '')
   );
   const group = props.dataTypes.filter(group => group.types.some(type =>
      type.name === (localRow.value.type ? localRow.value.type.toUpperCase() : ''))
   );

   return fieldType.length ? { ...fieldType[0], group: group[0].group } : {};
});

const fieldDefault = computed(() => {
   if (localRow.value.autoIncrement) return 'AUTO_INCREMENT';
   if (localRow.value.default === 'NULL') return 'NULL';
   return localRow.value.default;
});

const collations = computed(() => getWorkspace(selectedWorkspace.value).collations);
const canAutoincrement = computed(() => props.indexes.some(index => ['PRIMARY', 'UNIQUE'].includes(index.type)));
const isNullable = computed(() => props.customizations.nullablePrimary || !props.indexes.some(index => ['PRIMARY'].includes(index.type)));

const isInDataTypes = computed(() => {
   let typeNames: string[] = [];
   for (const group of props.dataTypes) {
      const groupTypeNames = group.types.reduce((acc, curr) => {
         acc.push(curr.name);
         return acc;
      }, []);

      typeNames = [...groupTypeNames, ...typeNames];
   }
   return typeNames.includes(props.row.type);
});

const types = computed(() => {
   const types = [...props.dataTypes];
   if (!isInDataTypes.value)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (types as any).unshift({ name: props.row });

   return types;
});

const typeClass = (type: string) => {
   if (type)
      return `type-${type.toLowerCase().replaceAll(' ', '_').replaceAll('"', '')}`;
   return '';
};

const initLocalRow = () => {
   Object.keys(localRow.value).forEach(key => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (isInlineEditor as any).value[key] = false;
   });

   defaultValue.value.onUpdate = localRow.value.onUpdate;
   defaultValue.value.type = localRow.value.defaultType || 'noval';
   if (defaultValue.value.type === 'custom') {
      defaultValue.value.custom = localRow.value.default
         ? localRow.value.default.includes('\'')
            ? localRow.value.default.split('\'')[1]
            : localRow.value.default
         : '';
   }
   else if (defaultValue.value.type === 'expression') {
      if (localRow.value.default.toUpperCase().includes('ON UPDATE'))
         defaultValue.value.expression = localRow.value.default.replace(/ on update.*$/i, '');
      else
         defaultValue.value.expression = localRow.value.default;
   }
};

const editON = async (event: MouseEvent, content: string | number, field: keyof TableField) => {
   if (field === 'length') {
      if (['integer', 'float', 'binary', 'spatial'].includes(fieldType.value.group)) editingField.value = 'numLength';
      else if (['string', 'unknown'].includes(fieldType.value.group)) editingField.value = 'charLength';
      else if (['other'].includes(fieldType.value.group)) editingField.value = 'enumValues';
      else if (['time'].includes(fieldType.value.group)) editingField.value = 'datePrecision';
   }
   else
      editingField.value = field;

   if (localRow.value.enumValues && field === 'length') {
      editingContent.value = localRow.value.enumValues;
      originalContent.value = localRow.value.enumValues;
   }
   else if (fieldType.value.scale && field === 'length') {
      const scale = localRow.value.numScale !== null ? localRow.value.numScale : 0;
      editingContent.value = `${content}, ${scale}`;
      originalContent.value = `${content}, ${scale}`;
   }
   else {
      editingContent.value = content;
      originalContent.value = content;
   }

   const obj = { [field]: true };
   isInlineEditor.value = { ...isInlineEditor.value, ...obj };

   if (field === 'default')
      isDefaultModal.value = true;
   else {
      await nextTick();
      (event as MouseEvent & { target: HTMLInputElement }).target.blur();
      await nextTick();
      document.querySelector<HTMLInputElement>('.editable-field').focus();
   }
};

const editOFF = () => {
   if (editingField.value === 'name')
      emit('rename-field', { old: localRow.value[editingField.value], new: editingContent.value });

   if (editingField.value === 'numLength' && fieldType.value.scale) {
      const [length, scale] = (editingContent.value as string).split(',');
      localRow.value.numLength = +length;
      localRow.value.numScale = scale ? +scale : null;
   }
   else
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (localRow.value as any)[editingField.value] = editingContent.value;

   if (editingField.value === 'type' && editingContent.value !== originalContent.value) {
      localRow.value.numLength = null;
      localRow.value.numScale = null;
      localRow.value.charLength = null;
      localRow.value.datePrecision = null;
      localRow.value.enumValues = '';

      if (fieldType.value.length) {
         if (['integer', 'float', 'binary', 'spatial'].includes(fieldType.value.group)) localRow.value.numLength = 11;
         if (['string'].includes(fieldType.value.group)) localRow.value.charLength = 15;
         if (['time'].includes(fieldType.value.group)) localRow.value.datePrecision = 0;
         if (['other'].includes(fieldType.value.group)) localRow.value.enumValues = '\'valA\',\'valB\'';
      }

      if (!fieldType.value.collation)
         localRow.value.collation = null;

      if (!fieldType.value.unsigned)
         localRow.value.unsigned = false;

      if (!fieldType.value.zerofill)
         localRow.value.zerofill = false;
   }
   else if (editingField.value === 'default') {
      switch (defaultValue.value.type) {
         case 'autoincrement':
            localRow.value.autoIncrement = true;
            break;
         case 'noval':
            localRow.value.autoIncrement = false;
            localRow.value.default = null;
            break;
         case 'null':
            localRow.value.autoIncrement = false;
            localRow.value.default = 'NULL';
            break;
         case 'custom':
            localRow.value.autoIncrement = false;
            localRow.value.default = Number.isNaN(+defaultValue.value.custom) ? `'${defaultValue.value.custom}'` : defaultValue.value.custom;
            break;
         case 'expression':
            localRow.value.autoIncrement = false;
            localRow.value.default = defaultValue.value.expression;
            break;
      }

      localRow.value.onUpdate = defaultValue.value.onUpdate;
   }

   Object.keys(isInlineEditor.value).forEach(key => {
      isInlineEditor.value = { ...isInlineEditor.value, [key]: false };
   });

   editingContent.value = null;
   originalContent.value = null;
   editingField.value = null;
};

const checkLengthScale = (e: KeyboardEvent & { target: HTMLInputElement }) => {
   e = (e) || window.event as KeyboardEvent & { target: HTMLInputElement };
   const charCode = (e.which) ? e.which : e.code;

   if (((charCode > 31 && (charCode < 48 || charCode > 57)) && charCode !== 44) || (charCode === 44 && e.target.value.includes(',')))
      e.preventDefault();
   else
      return true;
};

const hideDefaultModal = () => {
   isDefaultModal.value = false;
};

watch(localRow, () => {
   initLocalRow();
});

watch(() => props.row, () => {
   localRow.value = props.row;
});

watch(() => props.indexes, () => {
   if (!canAutoincrement.value)
      localRow.value.autoIncrement = false;

   if (!isNullable.value)
      localRow.value.nullable = false;
});

onMounted(() => {
   localRow.value = props.row;
   initLocalRow();
   isInlineEditor.value.length = false;
});
</script>

<style lang="scss" scoped>
.editable-field {
  margin: 0;
  border: none;
  line-height: 1;
  width: 100%;
  position: absolute;
  left: 0;
  right: 0;
  max-height: 21px;
  border-radius: 3px;
  font-size: 0.7rem;
}

.row-draggable {
  position: relative;
  text-align: right;
  padding-left: 28px;
  padding-right: 2px;
  cursor: grab;

  .row-draggable-icon {
    position: absolute;
    left: 0;
    font-size: 22px;
  }
}

.table-column-title {
  display: flex;
  align-items: center;
}

.form-checkbox {
  padding: 0;
  margin: 0;
  line-height: 1;
  min-height: auto;

  .form-icon {
    top: -0.65rem;
    left: calc(50% - 8px);
  }
}

.cell-content {
  display: block;
  padding: 0 0.2rem;
  min-height: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
</style>
