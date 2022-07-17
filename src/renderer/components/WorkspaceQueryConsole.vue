<template>
   <div
      ref="wrapper"
      class="query-console-wrapper"
      @mouseenter="isHover = true"
      @mouseleave="isHover = false"
   >
      <div ref="resizer" class="query-console-resizer" />
      <div
         id="query-console"
         ref="queryConsole"
         class="query-console column col-12"
         :style="{height: localHeight ? localHeight+'px' : ''}"
      >
         <div class="query-console-header">
            <div>{{ t('word.console') }}</div>
            <button class="btn btn-clear mr-1" @click="resizeConsole(0)" />
         </div>
         <div ref="queryConsoleBody" class="query-console-body">
            <div
               v-for="(wLog, i) in workspaceLogs"
               :key="i"
               class="query-console-log"
               tabindex="0"
            >
               <span class="type-datetime">{{ moment(wLog.date).format('YYYY-MM-DD HH:mm:ss') }}</span>: <span class="type-string">{{ wLog.sql }}</span>
            </div>
         </div>
      </div>
   </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, Ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import * as moment from 'moment';
import { useConsoleStore } from '@/stores/console';
import { storeToRefs } from 'pinia';

const { t } = useI18n();

const consoleStore = useConsoleStore();

const { resizeConsole, getLogsByWorkspace } = consoleStore;
const { consoleHeight } = storeToRefs(consoleStore);

const props = defineProps({
   uid: String
});

const wrapper: Ref<HTMLInputElement> = ref(null);
const queryConsole: Ref<HTMLInputElement> = ref(null);
const queryConsoleBody: Ref<HTMLInputElement> = ref(null);
const resizer: Ref<HTMLInputElement> = ref(null);
const localHeight = ref(250);
const isHover = ref(false);

const resize = (e: MouseEvent) => {
   const el = queryConsole.value;
   let consoleHeight = el.getBoundingClientRect().bottom - e.pageY;
   if (consoleHeight > 400) consoleHeight = 400;
   localHeight.value = consoleHeight;
};

const workspaceLogs = computed(() => {
   return getLogsByWorkspace(props.uid);
});

const stopResize = () => {
   if (localHeight.value < 0) localHeight.value = 0;
   resizeConsole(localHeight.value);
   window.removeEventListener('mousemove', resize);
   window.removeEventListener('mouseup', stopResize);
};

watch(workspaceLogs, async () => {
   if (!isHover.value) {
      await nextTick();
      queryConsoleBody.value.scrollTop = queryConsoleBody.value.scrollHeight;
   }
});

onMounted(() => {
   localHeight.value = consoleHeight.value;
   queryConsoleBody.value.scrollTop = queryConsoleBody.value.scrollHeight;
});

onMounted(() => {
   resizer.value.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();

      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResize);
   });
});
</script>
<style lang="scss" scoped>
.query-console-wrapper{
   width: 100%;
   z-index: 9;
   margin-top: auto;
   position: absolute;
   bottom: 0;

   .query-console-resizer{
      height: 4px;
      top: -1px;
      width: 100%;
      cursor: ns-resize;
      position: absolute;
      z-index: 99;
      transition: background 0.2s;

      &:hover {
         background: rgba($primary-color, 50%);
      }
   }

   .query-console {
      padding: 0;
      padding-bottom: $footer-height;
      .query-console-header {
         display: flex;
         justify-content: space-between;
         align-items: center;
         padding: 4px;
         font-weight: 700;
      }

      .query-console-body {
         overflow: auto;
         display: flex;
         flex-direction: column;
         max-height: 100%;
         padding: 0 6px;

         .query-console-log {
            padding: 1px 3px;
            user-select: text;
            border-radius: $border-radius;
            &:hover,
            &:focus {
               background: $bg-color-gray;
            }
         }
      }
   }

}
</style>
