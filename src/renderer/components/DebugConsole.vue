<template>
   <div
      ref="wrapper"
      class="console-wrapper"
      @mouseenter="isHover = true"
      @mouseleave="isHover = false"
   >
      <div ref="resizer" class="console-resizer" />
      <div
         id="console"
         ref="queryConsole"
         class="console column col-12"
         :style="{height: localHeight ? localHeight+'px' : ''}"
      >
         <div class="console-header">
            <ul class="tab tab-block">
               <li class="tab-item" :class="{'active': selectedTab === 'query'}">
                  <a class="tab-link" @click="selectedTab = 'query'">{{ t('application.executedQueries') }}</a>
               </li>
               <li class="tab-item" :class="{'active': selectedTab === 'debug'}">
                  <a class="tab-link" @click="selectedTab = 'debug'">{{ t('application.debugConsole') }}</a>
               </li>
            </ul>
            <div class="d-flex">
               <div
                  v-if="isDevelopment"
                  class="c-hand mr-2"
                  @click="openDevTools()"
               >
                  <BaseIcon icon-name="mdiBugPlayOutline" :size="22" />
               </div>
               <div
                  v-if="isDevelopment"
                  class="c-hand mr-2"
                  @click="reload()"
               >
                  <BaseIcon icon-name="mdiRefresh" :size="22" />
               </div>
               <button class="btn btn-clear mr-1" @click="resizeConsole(0)" />
            </div>
         </div>
         <div
            v-show="selectedTab === 'query'"
            ref="queryConsoleBody"
            class="console-body"
         >
            <div
               v-for="(wLog, i) in workspaceQueryLogs"
               :key="i"
               class="console-log"
               tabindex="0"
               @contextmenu.prevent="contextMenu($event, wLog)"
            >
               <span class="console-log-datetime">{{ moment(wLog.date).format('HH:mm:ss') }}</span>: <code class="console-log-sql" v-html="highlight(wLog.sql, {html: true})" />
            </div>
         </div>
         <div
            v-show="selectedTab === 'debug'"
            ref="logConsoleBody"
            class="console-body"
         >
            <div
               v-for="(log, i) in debugLogs"
               :key="i"
               class="console-log"
               tabindex="0"
               @contextmenu.prevent="contextMenu($event, log)"
            >
               <span class="console-log-datetime">{{ moment(log.date).format('HH:mm:ss') }}</span> <small>[{{ log.process.substring(0, 1).toUpperCase() }}]</small>: <span class="console-log-message" :class="`console-log-level-${log.level}`">{{ log.message }}</span>
            </div>
         </div>
      </div>
   </div>
   <BaseContextMenu
      v-if="isContext"
      :context-event="contextEvent"
      @close-context="isContext = false"
   >
      <div class="context-element" @click="copyLog">
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
import { getCurrentWindow } from '@electron/remote';
import * as moment from 'moment';
import { storeToRefs } from 'pinia';
import { highlight } from 'sql-highlight';
import { computed, nextTick, onMounted, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseContextMenu from '@/components/BaseContextMenu.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import { copyText } from '@/libs/copyText';
import { useConsoleStore } from '@/stores/console';

const { t } = useI18n();

const consoleStore = useConsoleStore();

const { resizeConsole, getLogsByWorkspace } = consoleStore;
const {
   isConsoleOpen,
   consoleHeight,
   selectedTab,
   debugLogs
} = storeToRefs(consoleStore);

const props = defineProps({
   uid: {
      type: String,
      default: null,
      required: false
   }
});

const wrapper: Ref<HTMLInputElement> = ref(null);
const queryConsole: Ref<HTMLInputElement> = ref(null);
const queryConsoleBody: Ref<HTMLInputElement> = ref(null);
const logConsoleBody: Ref<HTMLInputElement> = ref(null);
const resizer: Ref<HTMLInputElement> = ref(null);
const localHeight = ref(consoleHeight.value);
const isHover = ref(false);
const isContext = ref(false);
const contextContent: Ref<string> = ref(null);
const contextEvent: Ref<MouseEvent> = ref(null);
const w = ref(getCurrentWindow());
const isDevelopment = ref(process.env.NODE_ENV === 'development');

const resize = (e: MouseEvent) => {
   const el = queryConsole.value;
   let elementHeight = el.getBoundingClientRect().bottom - e.pageY;
   if (elementHeight > 400) elementHeight = 400;
   localHeight.value = elementHeight;
};

const workspaceQueryLogs = computed(() => {
   return getLogsByWorkspace(props.uid);
});

const stopResize = () => {
   if (localHeight.value < 0) localHeight.value = 0;
   resizeConsole(localHeight.value);
   window.removeEventListener('mousemove', resize);
   window.removeEventListener('mouseup', stopResize);
};

const contextMenu = (event: MouseEvent, wLog: {date: Date; sql?: string; message?: string}) => {
   contextEvent.value = event;
   contextContent.value = wLog.sql || wLog.message;
   isContext.value = true;
};

const copyLog = () => {
   copyText(contextContent.value);
   isContext.value = false;
};

const openDevTools = () => {
   w.value.webContents.openDevTools();
};

const reload = () => {
   w.value.reload();
};

watch(workspaceQueryLogs, async () => {
   if (!isHover.value) {
      await nextTick();
      queryConsoleBody.value.scrollTop = queryConsoleBody.value.scrollHeight;
   }
});

watch(() => debugLogs.value.length, async () => {
   if (!isHover.value) {
      await nextTick();
      logConsoleBody.value.scrollTop = logConsoleBody.value.scrollHeight;
   }
});

watch(isConsoleOpen, async () => {
   queryConsoleBody.value.scrollTop = queryConsoleBody.value.scrollHeight;
   logConsoleBody.value.scrollTop = logConsoleBody.value.scrollHeight;
});

watch(selectedTab, async () => {
   queryConsoleBody.value.scrollTop = queryConsoleBody.value.scrollHeight;
   logConsoleBody.value.scrollTop = logConsoleBody.value.scrollHeight;
});

watch(consoleHeight, async (val) => {
   await nextTick();
   localHeight.value = val;
});

onMounted(() => {
   queryConsoleBody.value.scrollTop = queryConsoleBody.value.scrollHeight;
   logConsoleBody.value.scrollTop = logConsoleBody.value.scrollHeight;

   resizer.value.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();

      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResize);
   });
});
</script>
<style lang="scss" scoped>
.console-wrapper {
  width: -webkit-fill-available;
  z-index: 9;
  margin-top: auto;
  position: absolute;
  bottom: 0;

  .console-resizer {
    height: 4px;
    top: -1px;
    width: 100%;
    cursor: ns-resize;
    position: absolute;
    z-index: 99;
    transition: background 0.2s;

    &:hover {
      background: var(--primary-color-dark);
    }
  }

  .console {
    padding: 0;
    padding-bottom: $footer-height;

    .console-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 4px;

      .tab-block {
         margin-top: 0;
         margin-bottom: 0;
      }

      .tab-block,
      .tab-item {
         background-color: transparent;
      }

      .tab-link {
         padding: 0.2rem 0.6rem;
         cursor: pointer;
         white-space: nowrap;
      }
    }

    .console-body {
      overflow: auto;
      display: flex;
      flex-direction: column;
      max-height: 100%;
      padding: 0 6px 3px;

      .console-log {
        padding: 1px 3px;
        margin: 1px 0;
        border-radius: $border-radius;
        user-select: text;

        &-datetime {
            opacity: .6;
            font-size: 90%;
        }

        &-sql {
          font-size: 95%;
          opacity: 0.8;
          font-weight: 700;

          &:hover {
            user-select: text;
          }
        }

        &-message {
          font-size: 95%;
        }

        &-level {
         // &-log,
         // &-info {}
         &-warn {
            color: orange;
         }
         &-error {
            color: red;
         }
        }

        small {
         opacity: .6;
        }
      }
    }
  }
}
</style>
