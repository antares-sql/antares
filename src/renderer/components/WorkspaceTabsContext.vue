<template>
   <BaseContextMenu
      :context-event="props.contextEvent"
      @close-context="closeContext"
   >
      <div class="context-element" @click.stop="closeAllTabs">
         <span class="d-flex"><i class="mdi mdi-18px mdi-asterisk text-light pr-1" /> {{ t('application.closeAllTabs') }}</span>
      </div>

      <div class="context-element" @click.stop="closeOtherTabs">
         <span class="d-flex"><i class="mdi mdi-18px mdi-not-equal text-light pr-1" /> {{ t('application.closeOtherTabs') }}</span>
      </div>

      <div class="context-element" @click.stop="closeLeftTabs">
         <span class="d-flex"><i class="mdi mdi-18px mdi-less-than text-light pr-1" /> {{ t('application.closeTabsToLeft') }}</span>
      </div>

      <div class="context-element" @click.stop="closeRightTabs">
         <span class="d-flex"><i class="mdi mdi-18px mdi-greater-than text-light pr-1" /> {{ t('application.closeTabsToRight') }}</span>
      </div>
   </BaseContextMenu>
</template>

<script setup lang="ts">
import BaseContextMenu from '@/components/BaseContextMenu.vue';
import { useI18n } from 'vue-i18n';

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
