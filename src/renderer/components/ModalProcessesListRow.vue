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
               :class="`${isNull(col)} type-${typeof col === 'number' ? 'int' : 'varchar'}`"
               @dblclick="dblClick(cKey)"
            >{{ col | cutText }}</span>
         </template>
      </div>
      <ConfirmModal
         v-if="isInfoModal"
         :confirm-text="$t('word.update')"
         :cancel-text="$t('word.close')"
         size="medium"
         :hide-footer="true"
         @hide="hideInfoModal"
      >
         <template :slot="'header'">
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-information-outline mr-1" /> {{ $t('message.processInfo') }}
            </div>
         </template>
         <div :slot="'body'">
            <div>
               <div>
                  <TextEditor
                     :value="row.info || ''"
                     editor-class="textarea-editor"
                     :mode="editorMode"
                     :read-only="true"
                  />
               </div>
            </div>
         </div>
      </ConfirmModal>
   </div>
</template>

<script>
import ConfirmModal from '@/components/BaseConfirmModal';
import TextEditor from '@/components/BaseTextEditor';

export default {
   name: 'ModalProcessesListRow',
   components: {
      ConfirmModal,
      TextEditor
   },
   filters: {
      cutText (val) {
         if (typeof val !== 'string') return val;
         return val.length > 250 ? `${val.substring(0, 250)}[...]` : val;
      }
   },
   props: {
      row: Object
   },
   data () {
      return {
         isInlineEditor: {},
         isInfoModal: false,
         editorMode: 'sql'
      };
   },
   computed: {},
   watch: {
      fields () {
         Object.keys(this.fields).forEach(field => {
            this.isInlineEditor[field.name] = false;
         });
      }
   },
   methods: {
      isNull (value) {
         return value === null ? ' is-null' : '';
      },
      selectRow (event, row) {
         this.$emit('select-row', event, row);
      },
      openContext (event, payload) {
         if (this.isEditable) {
            payload.field = this.fields[payload.field].name;// Ensures field name only
            this.$emit('contextmenu', event, payload);
         }
      },
      hideInfoModal () {
         this.isInfoModal = false;
      },
      dblClick (col) {
         if (col !== 'info') return;
         this.$emit('stop-refresh');
         this.isInfoModal = true;
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
