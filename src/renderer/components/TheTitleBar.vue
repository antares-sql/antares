<template>
   <div id="titlebar" @dblclick="toggleFullScreen">
      <div class="titlebar-resizer" />
      <div class="titlebar-elements">
         <img
            v-if="!isMacOS"
            class="titlebar-logo"
            :src="appIcon"
         >
      </div>
      <div class="titlebar-elements titlebar-title">
         {{ windowTitle }}
      </div>
      <div class="titlebar-elements">
         <div
            v-if="isDevelopment"
            class="titlebar-element"
            @click="openDevTools"
         >
            <i class="mdi mdi-24px mdi-code-tags" />
         </div>
         <div
            v-if="isDevelopment"
            class="titlebar-element"
            @click="reload"
         >
            <i class="mdi mdi-24px mdi-refresh" />
         </div>
         <div
            v-if="!isMacOS"
            class="titlebar-element"
            @click="minimizeApp"
         >
            <i class="mdi mdi-24px mdi-minus" />
         </div>
         <div
            v-if="!isMacOS"
            class="titlebar-element"
            @click="toggleFullScreen"
         >
            <i v-if="isMaximized" class="mdi mdi-24px mdi-fullscreen-exit" />
            <i v-else class="mdi mdi-24px mdi-fullscreen" />
         </div>
         <div
            v-if="!isMacOS"
            class="titlebar-element close-button"
            @click="closeApp"
         >
            <i class="mdi mdi-24px mdi-close" />
         </div>
      </div>
   </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ipcRenderer } from 'electron';
import { getCurrentWindow } from '@electron/remote';
import { useConnectionsStore } from '@/stores/connections';
import { useWorkspacesStore } from '@/stores/workspaces';
import { onUnmounted, ref } from 'vue';
import { computed } from '@vue/reactivity';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const { getConnectionName } = useConnectionsStore();
const workspacesStore = useWorkspacesStore();

const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

const { getWorkspace } = workspacesStore;

const appIcon = require('@/images/logo.svg');
const w = ref(getCurrentWindow());
const isMaximized = ref(getCurrentWindow().isMaximized());
const isDevelopment = ref(process.env.NODE_ENV === 'development');
const isMacOS = ref(process.platform === 'darwin');

const windowTitle = computed(() => {
   if (!selectedWorkspace.value) return '';
   if (selectedWorkspace.value === 'NEW') return t('message.createNewConnection');

   const connectionName = getConnectionName(selectedWorkspace.value);
   const workspace = getWorkspace(selectedWorkspace.value);
   const breadcrumbs = Object.values(workspace.breadcrumbs).filter(breadcrumb => breadcrumb) || [workspace.client];

   return [connectionName, ...breadcrumbs].join(' • ');
});

const closeApp = () => {
   ipcRenderer.send('close-app');
};

const minimizeApp = () => {
   w.value.minimize();
};

const toggleFullScreen = () => {
   if (isMaximized.value)
      w.value.unmaximize();
   else
      w.value.maximize();
};

const openDevTools = () => {
   w.value.webContents.openDevTools();
};

const reload = () => {
   w.value.reload();
};

const onResize = () => {
   isMaximized.value = w.value.isMaximized();
};

window.addEventListener('resize', onResize);

onUnmounted(() => {
   window.removeEventListener('resize', onResize);
});
</script>

<style lang="scss">
  #titlebar {
    display: flex;
    position: relative;
    justify-content: space-between;
    align-items: center;
    height: $titlebar-height;
    -webkit-app-region: drag;
    user-select: none;
    z-index: 9999;

    .titlebar-resizer {
      position: absolute;
      top: 0;
      width: 100%;
      height: 4px;
      z-index: 999;
      -webkit-app-region: no-drag;
    }

    .titlebar-elements {
      display: flex;
      align-items: center;

      &.titlebar-title {
        position: absolute;
        left: 0;
        right: 0;
        text-align: center;
        display: block;
        pointer-events: none;
      }

      .titlebar-logo {
        height: $titlebar-height;
        padding: 0.3rem 0.4rem;
      }

      .titlebar-element {
        display: flex;
        align-items: center;
        height: $titlebar-height;
        line-height: 0;
        padding: 0 0.7rem;
        opacity: 0.7;
        transition: opacity 0.2s;
        -webkit-app-region: no-drag;

        &:hover {
          opacity: 1;
        }
      }
    }
  }
</style>
