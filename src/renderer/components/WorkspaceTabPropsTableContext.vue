<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="closeContext"
   >
      <div class="context-element">
         <span class="d-flex"><i class="mdi mdi-18px mdi-key-plus text-light pr-1" /> {{ t('database.createNewIndex') }}</span>
         <i class="mdi mdi-18px mdi-chevron-right text-light pl-1" />
         <div class="context-submenu">
            <div
               v-for="index in indexTypes"
               :key="index"
               class="context-element"
               :class="{'disabled': index === 'PRIMARY' && hasPrimary}"
               @click="addNewIndex(index)"
            >
               <span class="d-flex"><i class="mdi mdi-18px mdi-key column-key pr-1" :class="`key-${index}`" /> {{ index }}</span>
            </div>
         </div>
      </div>
      <div v-if="indexes.length" class="context-element">
         <span class="d-flex"><i class="mdi mdi-18px mdi-key-arrow-right text-light pr-1" /> {{ t('database.addToIndex') }}</span>
         <i class="mdi mdi-18px mdi-chevron-right text-light pl-1" />
         <div class="context-submenu">
            <div
               v-for="index in indexes"
               :key="index.name"
               class="context-element"
               :class="{'disabled': index.fields.includes(selectedField.name)}"
               @click="addToIndex(index._antares_id)"
            >
               <span class="d-flex"><i class="mdi mdi-18px mdi-key column-key pr-1" :class="`key-${index.type}`" /> {{ index.name }}</span>
            </div>
         </div>
      </div>
      <div class="context-element" @click="duplicateField">
         <span class="d-flex"><i class="mdi mdi-18px mdi-content-duplicate text-light pr-1" /> {{ t('general.duplicate') }}</span>
      </div>
      <div class="context-element" @click="deleteField">
         <span class="d-flex"><i class="mdi mdi-18px mdi-delete text-light pr-1" /> {{ t('database.deleteField') }}</span>
      </div>
   </BaseContextMenu>
</template>

<script setup lang="ts">
import { TableIndex } from 'common/interfaces/antares';
import { computed, Prop } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseContextMenu from '@/components/BaseContextMenu.vue';

const { t } = useI18n();

const props = defineProps({
   contextEvent: MouseEvent,
   indexes: Array as Prop<TableIndex[]>,
   indexTypes: Array as Prop<string[]>,
   selectedField: Object
});

const emit = defineEmits(['close-context', 'duplicate-selected', 'delete-selected', 'add-new-index', 'add-to-index']);

const hasPrimary = computed(() => props.indexes.some(index => index.type === 'PRIMARY'));

const closeContext = () => {
   emit('close-context');
};

const duplicateField = () => {
   emit('duplicate-selected');
   closeContext();
};

const deleteField = () => {
   emit('delete-selected');
   closeContext();
};

const addNewIndex = (index: string) => {
   emit('add-new-index', { field: props.selectedField.name, index });
   closeContext();
};

const addToIndex = (index: string) => {
   emit('add-to-index', { field: props.selectedField.name, index });
   closeContext();
};
</script>
