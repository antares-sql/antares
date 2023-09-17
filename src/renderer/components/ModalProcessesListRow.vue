<template>
   <div class="tr" @click="selectRow()">
      <div
         v-for="(col, cKey) in row"
         :key="cKey"
         class="td p-0"
         tabindex="0"
         @contextmenu.prevent="openContext($event, { id: row.id, field: cKey })"
      >
         <span
            v-if="!isInlineEditor[cKey]"
            class="cell-content"
            :class="`${isNull(col)} type-${typeof col === 'number' ? 'int' : 'varchar'}`"
            @dblclick="dblClick(cKey)"
         >{{ cutText(col, 250) }}</span>
      </div>
      <ConfirmModal
         v-if="isInfoModal"
         :confirm-text="t('application.update')"
         :cancel-text="t('general.close')"
         size="medium"
         :hide-footer="true"
         @hide="hideInfoModal"
      >
         <template #header>
            <div class="d-flex">
               <BaseIcon
                  icon-name="mdiInformationOutline"
                  :size="24"
                  class="mr-1"
               /> {{ t('database.processInfo') }}
            </div>
         </template>
         <template #body>
            <div>
               <div>
                  <TextEditor
                     :model-value="props.row.info || ''"
                     editor-class="textarea-editor"
                     :mode="editorMode"
                     :read-only="true"
                  />
                  <div class="mb-4" />
               </div>
            </div>
         </template>
      </ConfirmModal>
   </div>
</template>

<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import TextEditor from '@/components/BaseTextEditor.vue';
import { useFilters } from '@/composables/useFilters';

const { t } = useI18n();

const { cutText } = useFilters();

const props = defineProps({
   row: Object
});

const emit = defineEmits(['select-row', 'contextmenu', 'stop-refresh']);

const isInlineEditor: Ref<{[key: string]: boolean}> = ref({});
const isInfoModal = ref(false);
const editorMode = ref('sql');

const isNull = (value: string | number) => value === null ? ' is-null' : '';

const selectRow = () => {
   emit('select-row');
};

const openContext = (event: MouseEvent, payload: { id: number; field: string }) => {
   emit('contextmenu', event, payload);
};

const hideInfoModal = () => {
   isInfoModal.value = false;
};

const dblClick = (col: string) => {
   if (col !== 'info') return;
   emit('stop-refresh');
   isInfoModal.value = true;
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
