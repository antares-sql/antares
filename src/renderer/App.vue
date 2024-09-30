<template>
   <div id="wrapper" :class="[`theme-${applicationTheme}`, !disableBlur || 'no-blur']">
      <TheTitleBar />
      <div id="window-content">
         <TheSettingBar @show-connections-modal="isAllConnectionsModal = true" />
         <div id="main-content" class="container">
            <div class="columns col-gapless">
               <Workspace
                  v-for="connection in connections"
                  :key="connection.uid"
                  :connection="connection"
               />
               <WorkspaceAddConnectionPanel v-if="selectedWorkspace === 'NEW'" />
            </div>
            <TheFooter />
            <TheNotificationsBoard />
            <TheScratchpad v-if="isScratchpad" />
            <ModalSettings v-if="isSettingModal" />
            <BaseTextEditor class="d-none" value="" />
         </div>
      </div>
      <ModalAllConnections
         v-if="isAllConnectionsModal"
         @close="isAllConnectionsModal = false"
      />

      <ModalExportSchema
         v-if="isExportSchemaModal"
         @close="hideExportModal"
      />
   </div>
</template>

<script setup lang="ts">
import { getCurrentWindow, Menu } from '@electron/remote';
import { ipcRenderer } from 'electron';
import { storeToRefs } from 'pinia';
import { defineAsyncComponent, onMounted, Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ModalExportSchema from '@/components/ModalExportSchema.vue';
import TheSettingBar from '@/components/TheSettingBar.vue';
import { useApplicationStore } from '@/stores/application';
import { useConnectionsStore } from '@/stores/connections';
import { useSchemaExportStore } from '@/stores/schemaExport';
import { useSettingsStore } from '@/stores/settings';
import { useWorkspacesStore } from '@/stores/workspaces';

import { useConsoleStore } from './stores/console';

const { t } = useI18n();

const TheTitleBar = defineAsyncComponent(() => import(/* webpackChunkName: "TheTitleBar" */'@/components/TheTitleBar.vue'));
const TheFooter = defineAsyncComponent(() => import(/* webpackChunkName: "TheFooter" */'@/components/TheFooter.vue'));
const TheNotificationsBoard = defineAsyncComponent(() => import(/* webpackChunkName: "TheNotificationsBoard" */'@/components/TheNotificationsBoard.vue'));
const Workspace = defineAsyncComponent(() => import(/* webpackChunkName: "Workspace" */'@/components/Workspace.vue'));
const WorkspaceAddConnectionPanel = defineAsyncComponent(() => import(/* webpackChunkName: "WorkspaceAddConnectionPanel" */'@/components/WorkspaceAddConnectionPanel.vue'));
const ModalSettings = defineAsyncComponent(() => import(/* webpackChunkName: "ModalSettings" */'@/components/ModalSettings.vue'));
const ModalAllConnections = defineAsyncComponent(() => import(/* webpackChunkName: "ModalAllConnections" */'@/components/ModalAllConnections.vue'));
const TheScratchpad = defineAsyncComponent(() => import(/* webpackChunkName: "TheScratchpad" */'@/components/TheScratchpad.vue'));
const BaseTextEditor = defineAsyncComponent(() => import(/* webpackChunkName: "BaseTextEditor" */'@/components/BaseTextEditor.vue'));

const applicationStore = useApplicationStore();
const connectionsStore = useConnectionsStore();
const settingsStore = useSettingsStore();
const workspacesStore = useWorkspacesStore();

const {
   isSettingModal,
   isScratchpad
} = storeToRefs(applicationStore);
const { connections } = storeToRefs(connectionsStore);
const { applicationTheme, disableBlur } = storeToRefs(settingsStore);
const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

const { checkVersionUpdate } = applicationStore;
const { changeApplicationTheme } = settingsStore;

const schemaExportStore = useSchemaExportStore();
const { hideExportModal } = schemaExportStore;
const { isExportModal: isExportSchemaModal } = storeToRefs(schemaExportStore);

const consoleStore = useConsoleStore();

const isAllConnectionsModal: Ref<boolean> = ref(false);

document.addEventListener('DOMContentLoaded', () => {
   setTimeout(() => {
      changeApplicationTheme(applicationTheme.value);// Forces persistentStore to save on file and mail process
   }, 1000);
});

onMounted(() => {
   ipcRenderer.on('open-all-connections', () => {
      isAllConnectionsModal.value = true;
   });

   ipcRenderer.on('open-scratchpad', () => {
      isScratchpad.value = true;
   });

   ipcRenderer.on('open-settings', () => {
      isSettingModal.value = true;
   });

   ipcRenderer.on('create-connection', () => {
      workspacesStore.selectWorkspace('NEW');
   });

   ipcRenderer.send('check-for-updates');
   checkVersionUpdate();

   const InputMenu = Menu.buildFromTemplate([
      {
         label: t('general.cut'),
         role: 'cut'
      },
      {
         label: t('general.copy'),
         role: 'copy'
      },
      {
         label: t('general.paste'),
         role: 'paste'
      },
      {
         type: 'separator'
      },
      {
         label: t('general.selectAll'),
         role: 'selectAll'
      }
   ]);

   document.body.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let node: any = e.target;

      while (node) {
         if (node.nodeName.match(/^(input|textarea)$/i) || node.isContentEditable) {
            if (!node.parentNode.className.split(' ').includes('editor-query')) {
               InputMenu.popup({ window: getCurrentWindow() });
               console.log(node.parentNode.className);
               break;
            }
         }
         node = node.parentNode;
      }
   });

   document.addEventListener('keydown', e => {
      if (e.altKey && e.key === 'Alt') { // Prevent Alt key to trigger hidden shortcut menu
         e.preventDefault();
      }
   });
});

// Console messages
const oldLog = console.log;
const oldWarn = console.warn;
const oldInfo = console.info;
const oldError = console.error;

console.log = function (...args) {
   consoleStore.putLog('debug', {
      level: 'log',
      process: 'renderer',
      message: args.join(' '),
      date: new Date()
   });
   oldLog.apply(this, args);
};

console.info = function (...args) {
   consoleStore.putLog('debug', {
      level: 'info',
      process: 'renderer',
      message: args.join(' '),
      date: new Date()
   });
   oldInfo.apply(this, args);
};

console.warn = function (...args) {
   consoleStore.putLog('debug', {
      level: 'warn',
      process: 'renderer',
      message: args.join(' '),
      date: new Date()
   });
   oldWarn.apply(this, args);
};

console.error = function (...args) {
   consoleStore.putLog('debug', {
      level: 'error',
      process: 'renderer',
      message: args.join(' '),
      date: new Date()
   });
   oldError.apply(this, args);
};

window.addEventListener('unhandledrejection', (event) => {
   console.error(event.reason);
});

window.addEventListener('error', (event) => {
   console.error(event.error, '| File name:', event.filename.split('/').pop().split('?')[0]);
});
</script>

<style lang="scss">
  html,
  body {
    height: 100%;
  }

  #wrapper {
    height: 100vh;
    position: relative;
  }

  #window-content {
    display: flex;
    position: relative;
    overflow: hidden;
  }

  #main-content {
    padding: 0;
    justify-content: flex-start;
    height: calc(100vh - #{$excluding-size});
    width: calc(100% - #{$settingbar-width});

    > .columns {
      height: calc(100vh - #{$footer-height});
    }

    .connection-panel-wrapper {
      height: calc(100vh - #{$excluding-size});
      width: 100%;
      padding-top: 10vh;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      overflow: auto;
    }
  }
</style>
