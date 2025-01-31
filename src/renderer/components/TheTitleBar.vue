<template>
   <div
      id="titlebar"
      @dblclick="toggleFullScreen"
   >
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
            <BaseIcon icon-name="mdiBugPlayOutline" :size="18" />
         </div>
         <div
            v-if="isDevelopment"
            class="titlebar-element"
            @click="reload"
         >
            <BaseIcon icon-name="mdiRefresh" :size="18" />
         </div>
         <div v-if="isWindows" :style="'width: 140px;'" />
         <div v-if="isLinux" class="d-flex">
            <div class="titlebar-element" @click="minimize">
               <BaseIcon icon-name="mdiWindowMinimize" :size="18" />
            </div>
            <div class="titlebar-element" @click="toggleFullScreen">
               <BaseIcon :icon-name="isMaximized ? 'mdiWindowRestore' : 'mdiWindowMaximize'" :size="18" />
            </div>
            <div class="titlebar-element" @click="closeApp">
               <BaseIcon icon-name="mdiClose" :size="18" />
            </div>
         </div>
      </div>
   </div>
</template>

<script setup lang="ts">
import { getCurrentWindow } from '@electron/remote';
import { ipcRenderer } from 'electron';
import { storeToRefs } from 'pinia';
import { computed, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import { useConnectionsStore } from '@/stores/connections';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

const { getConnectionName } = useConnectionsStore();
const workspacesStore = useWorkspacesStore();

const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

const { getWorkspace } = workspacesStore;

const appIcon = require('@/images/logo.svg');
const w = ref(getCurrentWindow());
const isMaximized = ref(getCurrentWindow().isMaximized());
const isDevelopment = ref(process.env.NODE_ENV === 'development');
const isMacOS = process.platform === 'darwin';
const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';

const windowTitle = computed(() => {
   if (!selectedWorkspace.value) return '';
   if (selectedWorkspace.value === 'NEW') return t('connection.createNewConnection');

   const connectionName = getConnectionName(selectedWorkspace.value);
   const workspace = getWorkspace(selectedWorkspace.value);
   const breadcrumbs = workspace ? Object.values(workspace.breadcrumbs).filter(breadcrumb => breadcrumb) || [workspace.client] : [];

   return [connectionName, ...breadcrumbs].join(' • ');
});

const openDevTools = () => {
   w.value.webContents.openDevTools();
};

const reload = () => {
   w.value.reload();
};

const minimize = () => {
   w.value.minimize();
};

const toggleFullScreen = () => {
   if (isMaximized.value)
      w.value.unmaximize();
   else
      w.value.maximize();
};

const closeApp = () => {
   ipcRenderer.send('close-app');
};

const onResize = () => {
   isMaximized.value = w.value.isMaximized();
};

watch(windowTitle, (val) => {
   ipcRenderer.send('change-window-title', val);
});

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
        opacity: 0.9;
        transition: opacity 0.2s;
        -webkit-app-region: no-drag;

        &:hover {
          opacity: 1;
        }
      }
    }
  }
</style>
