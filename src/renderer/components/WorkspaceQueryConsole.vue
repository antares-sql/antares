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
            <div>{{ t('application.console') }}</div>
            <button class="btn btn-clear mr-1" @click="resizeConsole(0)" />
         </div>
         <div ref="queryConsoleBody" class="query-console-body">
            <div
               v-for="(wLog, i) in workspaceLogs"
               :key="i"
               class="query-console-log"
               tabindex="0"
               @contextmenu.prevent="contextMenu($event, wLog)"
            >
               <span class="type-datetime">{{ moment(wLog.date).format('HH:mm:ss') }}</span>: <code class="query-console-log-sql">{{ wLog.sql }}</code>
            </div>
         </div>
      </div>
   </div>
   <BaseContextMenu
      v-if="isContext"
      :context-event="contextEvent"
      @close-context="isContext = false"
   >
      <div class="context-element" @click="copyQuery">
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiContentCopy"
               :size="18"
            /> {{ t('general.copy') }}</span>
      </div>
   </BaseContextMenu>
</template>
<script setup lang="ts">
import * as moment from 'moment';
import { storeToRefs } from 'pinia';
import { computed, nextTick, onMounted, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseContextMenu from '@/components/BaseContextMenu.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import { useConsoleStore } from '@/stores/console';

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
const isContext = ref(false);
const contextQuery: Ref<string> = ref(null);
const contextEvent: Ref<MouseEvent> = ref(null);

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

const contextMenu = (event: MouseEvent, wLog: {date: Date; sql: string}) => {
   contextEvent.value = event;
   contextQuery.value = wLog.sql;
   isContext.value = true;
};

const copyQuery = () => {
   navigator.clipboard.writeText(contextQuery.value);
   isContext.value = false;
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
.query-console-wrapper {
  width: 100%;
  z-index: 9;
  margin-top: auto;
  position: absolute;
  bottom: 0;

  .query-console-resizer {
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
      padding: 0 6px 3px;

      .query-console-log {
        padding: 1px 3px;
        margin: 1px 0;
        border-radius: $border-radius;

        .query-console-log-sql {
          font-size: 95%;
          opacity: 0.8;
          font-weight: 700;

          &:hover {
            user-select: text;
          }
        }
      }
    }
  }
}
</style>
