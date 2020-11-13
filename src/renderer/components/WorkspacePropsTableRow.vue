<template>
   <div class="tr">
      <div class="td">
         <div class="row-draggable">
            <i class="mdi mdi-drag-horizontal row-draggable-icon" />
            {{ localRow.order }}
         </div>
      </div>
      <div class="td" tabindex="0">
         <i
            v-if="localRow.key"
            :title="keyName(localRow.key)"
            class="mdi mdi-key column-key c-help pl-1"
            :class="`key-${localRow.key}`"
         />
      </div>
      <div class="td">
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
            class="editable-field px-2"
            @blur="editOFF"
         >
      </div>
      <div class="td text-uppercase text-left" :class="`type-${lowerCase(localRow.type)}`">
         <span
            v-if="!isInlineEditor.type"
            class="cell-content"
            @dblclick="editON($event, localRow.type.toUpperCase(), 'type')"
         >
            {{ localRow.type }}
         </span>
         <select
            v-else
            ref="editField"
            v-model="editingContent"
            class="editable-field px-1 text-uppercase"
            @blur="editOFF"
         >
            <optgroup
               v-for="group in dataTypes"
               :key="group.group"
               :label="group.group"
            >
               <option
                  v-for="type in group.types"
                  :key="type.name"
                  :selected="localRow.type.toUpperCase() === type.name"
                  :value="type.name"
               >
                  {{ type.name }}
               </option>
            </optgroup>
         </select>
      </div>
      <div class="td type-int">
         <template v-if="fieldType.length">
            <span
               v-if="!isInlineEditor.length"
               class="cell-content"
               @dblclick="editON($event, localLength, 'length')"
            >
               {{ localLength }}
            </span>
            <input
               v-else
               ref="editField"
               v-model="editingContent"
               type="number"
               autofocus
               class="editable-field px-2"
               @blur="editOFF"
            >
         </template>
      </div>
      <div class="td">
         <label class="form-checkbox">
            <input
               v-model="localRow.unsigned"
               type="checkbox"
               :disabled="!fieldType.unsigned"
            >
            <i class="form-icon" />
         </label>
      </div>
      <div class="td">
         <label class="form-checkbox">
            <input
               v-model="localRow.nullable"
               type="checkbox"
               :disabled="localRow.key === 'pri'"
            >
            <i class="form-icon" />
         </label>
      </div>
      <div class="td">
         <label class="form-checkbox">
            <input
               v-model="localRow.zerofill"
               type="checkbox"
               :disabled="!fieldType.zerofill"
            >
            <i class="form-icon" />
         </label>
      </div>
      <div class="td">
         <span class="cell-content" @dblclick="editON($event, localRow.default, 'default')">
            {{ fieldDefault }}
         </span>
      </div>
      <div class="td type-varchar">
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
            class="editable-field px-2"
            @blur="editOFF"
         >
      </div>
      <div class="td">
         <template v-if="fieldType.collation">
            <span
               v-if="!isInlineEditor.collation"
               class="cell-content"
               @dblclick="editON($event, localRow.collation, 'collation')"
            >
               {{ localRow.collation }}
            </span>
            <select
               v-else
               ref="editField"
               v-model="editingContent"
               class="editable-field px-1"
               @blur="editOFF"
            >
               <option
                  v-for="collation in collations"
                  :key="collation.collation"
                  :selected="localRow.collation === collation.collation"
                  :value="collation.collation"
               >
                  {{ collation.collation }}
               </option>
            </select>
         </template>
      </div>
      <ConfirmModal
         v-if="isDefaultModal"
         :confirm-text="$t('word.confirm')"
         size="400"
         @confirm="editOFF"
         @hide="hideDefaultModal"
      >
         <template :slot="'header'">
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-playlist-edit mr-1" /> {{ $t('word.default') }} "{{ row.name }}"
            </div>
         </template>
         <div :slot="'body'">
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
                        ><i class="form-icon" /> {{ $t('message.customValue') }}
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
               <div class="mb-2">
                  <label class="form-radio form-inline">
                     <input
                        v-model="defaultValue.type"
                        type="radio"
                        name="default"
                        value="null"
                     ><i class="form-icon" /> NULL
                  </label>
               </div>
               <div class="mb-2">
                  <label class="form-radio form-inline">
                     <input
                        v-model="defaultValue.type"
                        :disabled="localRow.key !== 'pri'"
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
                        ><i class="form-icon" /> {{ $t('word.expression') }}
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
               <div>
                  <div class="form-group">
                     <label class="form-label col-4">
                        {{ $t('message.onUpdate') }}
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
         </div>
      </ConfirmModal>
   </div>
</template>

<script>
import { mapGetters } from 'vuex';
import ConfirmModal from '@/components/BaseConfirmModal';

export default {
   name: 'WorkspacePropsTableRow',
   components: {
      ConfirmModal
   },
   props: {
      row: Object,
      dataTypes: Array
   },
   data () {
      return {
         localRow: {},
         isInlineEditor: {},
         isDefaultModal: false,
         defaultValue: {
            type: 'noval',
            custom: '',
            expression: '',
            onUpdate: ''
         },
         editingContent: null,
         editingField: null
      };
   },
   computed: {
      ...mapGetters({
         selectedWorkspace: 'workspaces/getSelected',
         getWorkspace: 'workspaces/getWorkspace'
      }),
      localLength () {
         return this.localRow.numLength || this.localRow.charLength || this.localRow.datePrecision || 0;
      },
      fieldType () {
         const fieldType = this.dataTypes.reduce((acc, group) => [...acc, ...group.types], []).filter(type =>
            type.name === (this.localRow.type ? this.localRow.type.toUpperCase() : '')
         );
         const group = this.dataTypes.filter(group => group.types.some(type =>
            type.name === (this.localRow.type ? this.localRow.type.toUpperCase() : ''))
         );

         return fieldType.length ? { ...fieldType[0], group: group[0].group } : {};
      },
      fieldDefault () {
         if (this.localRow.autoIncrement) return 'AUTO_INCREMENT';
         if (this.localRow.default === 'NULL') return 'NULL';
         return this.localRow.default;
      },
      collations () {
         return this.getWorkspace(this.selectedWorkspace).collations;
      }
   },
   watch: {
      localRow () {
         this.initLocalRow();
      },
      row () {
         this.localRow = this.row;
      }
   },
   mounted () {
      this.localRow = this.row;
      this.initLocalRow();
      this.isInlineEditor.length = false;
   },
   methods: {
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
      lowerCase (val) {
         if (val)
            return val.toLowerCase();
         return val;
      },
      initLocalRow () {
         Object.keys(this.localRow).forEach(key => {
            this.isInlineEditor[key] = false;
         });

         this.defaultValue.onUpdate = this.localRow.onUpdate;

         if (this.localRow.autoIncrement)
            this.defaultValue.type = 'autoincrement';
         else if (this.localRow.default === null)
            this.defaultValue.type = 'noval';
         else if (this.localRow.default === 'NULL')
            this.defaultValue.type = 'null';
         else if (this.localRow.default.match(/^'.*'$/g)) {
            this.defaultValue.type = 'custom';
            this.defaultValue.custom = this.localRow.default.replace(/(^')|('$)/g, '');
         }
         else if (!isNaN(this.localRow.default)) {
            this.defaultValue.type = 'custom';
            this.defaultValue.custom = this.localRow.default;
         }
         else {
            this.defaultValue.type = 'expression';
            this.defaultValue.expression = this.localRow.default;
         }
      },
      updateRow () {
         this.$emit('input', this.localRow);
      },
      editON (event, content, field) {
         if (field === 'length') {
            if (['integer', 'float', 'binary', 'spatial', 'other'].includes(this.fieldType.group)) this.editingField = 'numLength';
            if (['string'].includes(this.fieldType.group)) this.editingField = 'charLength';
            if (['time'].includes(this.fieldType.group)) this.editingField = 'datePrecision';
         }
         else
            this.editingField = field;

         this.editingContent = content;

         const obj = { [field]: true };
         this.isInlineEditor = { ...this.isInlineEditor, ...obj };

         if (field === 'default')
            this.isDefaultModal = true;
         else {
            this.$nextTick(() => { // Focus on input
               event.target.blur();

               this.$nextTick(() => document.querySelector('.editable-field').focus());
            });
         }
      },
      editOFF () {
         this.localRow[this.editingField] = this.editingContent;

         if (this.editingField === 'type') {
            this.localRow.numLength = false;
            this.localRow.charLength = false;
            this.localRow.datePrecision = false;

            if (this.fieldType.length) {
               if (['integer', 'float', 'binary', 'spatial', 'other'].includes(this.fieldType.group)) this.localRow.numLength = 11;
               if (['string'].includes(this.fieldType.group)) this.localRow.charLength = 15;
               if (['time'].includes(this.fieldType.group)) this.localRow.datePrecision = 0;
            }

            if (!this.fieldType.collation)
               this.localRow.collation = null;
         }

         if (this.editingField === 'default') {
            switch (this.defaultValue.type) {
               case 'autoincrement':
                  this.localRow.autoIncrement = true;
                  break;
               case 'noval':
                  this.localRow.autoIncrement = false;
                  this.localRow.default = null;
                  break;
               case 'null':
                  this.localRow.autoIncrement = false;
                  this.localRow.default = 'NULL';
                  break;
               case 'custom':
                  this.localRow.autoIncrement = false;
                  this.localRow.default = `'${this.defaultValue.custom}'`;
                  break;
               case 'expression':
                  this.localRow.autoIncrement = false;
                  this.localRow.default = this.defaultValue.expression;
                  break;
            }

            this.localRow.onUpdate = this.defaultValue.onUpdate;
         }

         Object.keys(this.isInlineEditor).forEach(key => {
            this.isInlineEditor = { ...this.isInlineEditor, [key]: false };
         });

         this.editingContent = null;
         this.editingField = null;
      },
      hideDefaultModal () {
         this.isDefaultModal = false;
      }
   }
};
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
}

.row-draggable {
  position: relative;
  text-align: right;
  padding-left: 28px;
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
    top: 0.15rem;
    left: calc(50% - 8px);
  }
}

.cell-content {
  display: block;
  min-height: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
</style>
