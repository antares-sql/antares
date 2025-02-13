<template>
   <BaseContextMenu
      :context-event="props.contextEvent"
      @close-context="closeContext"
   >
      <div
         v-if="props.selectedMisc === 'view'"
         class="context-element"
         @click="emit('open-create-view-tab')"
      >
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiTableCog"
               :size="18"
            /> {{ t('database.createNewView') }}</span>
      </div>
      <div
         v-if="props.selectedMisc === 'materializedView'"
         class="context-element"
         @click="emit('open-create-materializedView-tab')"
      >
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiTableCog"
               :size="18"
            /> {{ t('database.createNewMaterializedView') }}</span>
      </div>
      <div
         v-if="props.selectedMisc === 'trigger'"
         class="context-element"
         @click="emit('open-create-trigger-tab')"
      >
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiTableCog"
               :size="18"
            /> {{ t('database.createNewTrigger') }}</span>
      </div>
      <div
         v-if="['procedure', 'routine'].includes(props.selectedMisc)"
         class="context-element"
         @click="emit('open-create-routine-tab')"
      >
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiSyncCircle"
               :size="18"
            /> {{ t('database.createNewRoutine') }}</span>
      </div>
      <div
         v-if="props.selectedMisc === 'function'"
         class="context-element"
         @click="emit('open-create-function-tab')"
      >
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiArrowRightBoldBox"
               :size="18"
            /> {{ t('database.createNewFunction') }}</span>
      </div>
      <div
         v-if="props.selectedMisc === 'triggerFunction'"
         class="context-element"
         @click="emit('open-create-trigger-function-tab')"
      >
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiCogClockwise"
               :size="18"
            /> {{ t('database.createNewFunction') }}</span>
      </div>
      <div
         v-if="props.selectedMisc === 'scheduler'"
         class="context-element"
         @click="emit('open-create-scheduler-tab')"
      >
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiCalendarClock"
               :size="18"
            /> {{ t('database.createNewScheduler') }}</span>
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
   selectedMisc: String,
   selectedSchema: String
});

const emit = defineEmits([
   'open-create-view-tab',
   'open-create-materializedView-tab',
   'open-create-trigger-tab',
   'open-create-routine-tab',
   'open-create-function-tab',
   'open-create-trigger-function-tab',
   'open-create-scheduler-tab',
   'close-context'
]);

const closeContext = () => {
   emit('close-context');
};
</script>
