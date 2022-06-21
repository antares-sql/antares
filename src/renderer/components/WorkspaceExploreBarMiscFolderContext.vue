<template>
   <BaseContextMenu
      :context-event="props.contextEvent"
      @close-context="closeContext"
   >
      <div
         v-if="props.selectedMisc === 'trigger'"
         class="context-element"
         @click="emit('open-create-trigger-tab')"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-table-cog text-light pr-1" /> {{ t('message.createNewTrigger') }}</span>
      </div>
      <div
         v-if="['procedure', 'routine'].includes(props.selectedMisc)"
         class="context-element"
         @click="emit('open-create-routine-tab')"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-sync-circle text-light pr-1" /> {{ t('message.createNewRoutine') }}</span>
      </div>
      <div
         v-if="props.selectedMisc === 'function'"
         class="context-element"
         @click="emit('open-create-function-tab')"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-arrow-right-bold-box text-light pr-1" /> {{ t('message.createNewFunction') }}</span>
      </div>
      <div
         v-if="props.selectedMisc === 'triggerFunction'"
         class="context-element"
         @click="emit('open-create-trigger-function-tab')"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-cog-clockwise text-light pr-1" /> {{ t('message.createNewFunction') }}</span>
      </div>
      <div
         v-if="props.selectedMisc === 'scheduler'"
         class="context-element"
         @click="emit('open-create-scheduler-tab')"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-calendar-clock text-light pr-1" /> {{ t('message.createNewScheduler') }}</span>
      </div>
   </BaseContextMenu>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import BaseContextMenu from '@/components/BaseContextMenu.vue';

const { t } = useI18n();

const props = defineProps({
   contextEvent: MouseEvent,
   selectedMisc: String,
   selectedSchema: String
});

const emit = defineEmits([
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
