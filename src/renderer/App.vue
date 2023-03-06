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
               <div class="connection-panel-wrapper p-relative">
                  <WorkspaceAddConnectionPanel v-if="selectedWorkspace === 'NEW'" />
               </div>
            </div>
            <TheFooter />
            <TheNotificationsBoard />
            <TheScratchpad v-if="isScratchpad" />
            <ModalSettings v-if="isSettingModal" />
            <BaseTextEditor class="d-none" value="" />
         </div>
      </div>
      <ModalAllConnections v-if="isAllConnectionsModal" @close="isAllConnectionsModal = false" />
   </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onMounted, Ref, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { ipcRenderer } from 'electron';
import { useI18n } from 'vue-i18n';
import { Menu, getCurrentWindow } from '@electron/remote';
import { useApplicationStore } from '@/stores/application';
import { useConnectionsStore } from '@/stores/connections';
import { useSettingsStore } from '@/stores/settings';
import { useWorkspacesStore } from '@/stores/workspaces';
import TheSettingBar from '@/components/TheSettingBar.vue';

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
         label: t('word.cut'),
         role: 'cut'
      },
      {
         label: t('word.copy'),
         role: 'copy'
      },
      {
         label: t('word.paste'),
         role: 'paste'
      },
      {
         type: 'separator'
      },
      {
         label: t('message.selectAll'),
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
            InputMenu.popup({ window: getCurrentWindow() });
            break;
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
