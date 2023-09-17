<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="closeContext"
   >
      <div class="context-element">
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiKeyPlus"
               :size="18"
            /> {{ t('database.createNewIndex') }}</span>
         <BaseIcon
            class="text-light mt-1"
            icon-name="mdiChevronRight"
            :size="18"
         />
         <div class="context-submenu">
            <div
               v-for="index in indexTypes"
               :key="index"
               class="context-element"
               :class="{'disabled': index === 'PRIMARY' && hasPrimary}"
               @click="addNewIndex(index)"
            >
               <span class="d-flex">
                  <BaseIcon
                     class="column-key pr-1 mt-1 mr-1"
                     :class="`key-${index}`"
                     icon-name="mdiKey"
                     rotate="45deg"
                     :size="20"
                  /> {{ index }}</span>
            </div>
         </div>
      </div>
      <div v-if="indexes.length" class="context-element">
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiKeyArrowRight"
               :size="18"
            /> {{ t('database.addToIndex') }}</span>
         <BaseIcon
            class="text-light mt-1"
            icon-name="mdiChevronRight"
            :size="18"
         />
         <div class="context-submenu">
            <div
               v-for="index in indexes"
               :key="index.name"
               class="context-element"
               :class="{'disabled': index.fields.includes(selectedField.name)}"
               @click="addToIndex(index._antares_id)"
            >
               <span class="d-flex">
                  <BaseIcon
                     class="column-key pr-1 mt-1 mr-1"
                     :class="`key-${index.type}`"
                     icon-name="mdiKey"
                     rotate="45deg"
                     :size="20"
                  /> {{ index.name }}</span>
            </div>
         </div>
      </div>
      <div class="context-element" @click="duplicateField">
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiContentDuplicate"
               :size="18"
            /> {{ t('general.duplicate') }}</span>
      </div>
      <div class="context-element" @click="deleteField">
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiDelete"
               :size="18"
            /> {{ t('database.deleteField') }}</span>
      </div>
   </BaseContextMenu>
</template>

<script setup lang="ts">
import { TableIndex } from 'common/interfaces/antares';
import { computed, Prop } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseContextMenu from '@/components/BaseContextMenu.vue';
import BaseIcon from '@/components/BaseIcon.vue';

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
