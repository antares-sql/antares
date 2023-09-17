<template>
   <BaseContextMenu
      :context-event="props.contextEvent"
      @close-context="closeContext"
   >
      <div class="context-element" @click.stop="closeAllTabs">
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiAsterisk"
               :size="18"
            /> {{ t('application.closeAllTabs') }}</span>
      </div>

      <div class="context-element" @click.stop="closeOtherTabs">
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiNotEqual"
               :size="18"
            /> {{ t('application.closeOtherTabs') }}</span>
      </div>

      <div class="context-element" @click.stop="closeLeftTabs">
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiLessThan"
               :size="18"
            /> {{ t('application.closeTabsToLeft') }}</span>
      </div>

      <div class="context-element" @click.stop="closeRightTabs">
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiGreaterThan"
               :size="18"
            /> {{ t('application.closeTabsToRight') }}</span>
      </div>
   </BaseContextMenu>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import BaseContextMenu from '@/components/BaseContextMenu.vue';
import BaseIcon from '@/components/BaseIcon.vue';

const { t } = useI18n();

const props = defineProps({
   contextEvent: MouseEvent,
   selectedTab: Object
});

const emit = defineEmits([
   'close-context',
   'close-all-tabs',
   'close-other-tabs',
   'close-to-left',
   'close-to-right'
]);

const closeContext = () => {
   emit('close-context');
};

const closeAllTabs = () => {
   emit('close-all-tabs');
   closeContext();
};

const closeLeftTabs = () => {
   emit('close-to-left');
   closeContext();
};

const closeRightTabs = () => {
   emit('close-to-right');
   closeContext();
};

const closeOtherTabs = () => {
   emit('close-other-tabs');
   closeContext();
};
</script>
