<template>
   <div id="wrapper" :class="[`theme-${applicationTheme}`, !disableBlur || 'no-blur']">
      <TheTitleBar />
      <div id="window-content">
         <TheSettingBar />
         <div id="main-content" class="container">
            <div class="columns col-gapless">
               <Workspace
                  v-for="connection in connections"
                  :key="connection.uid"
                  :connection="connection"
               />
               <div class="connection-panel-wrapper">
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
   </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { ipcRenderer } from 'electron';
import { Menu, getCurrentWindow } from '@electron/remote';

export default {
   name: 'App',
   components: {
      TheTitleBar: () => import(/* webpackChunkName: "TheTitleBar" */'@/components/TheTitleBar'),
      TheSettingBar: () => import(/* webpackChunkName: "TheSettingBar" */'@/components/TheSettingBar'),
      TheFooter: () => import(/* webpackChunkName: "TheFooter" */'@/components/TheFooter'),
      TheNotificationsBoard: () => import(/* webpackChunkName: "TheNotificationsBoard" */'@/components/TheNotificationsBoard'),
      Workspace: () => import(/* webpackChunkName: "Workspace" */'@/components/Workspace'),
      WorkspaceAddConnectionPanel: () => import(/* webpackChunkName: "WorkspaceAddConnectionPanel" */'@/components/WorkspaceAddConnectionPanel'),
      ModalSettings: () => import(/* webpackChunkName: "ModalSettings" */'@/components/ModalSettings'),
      TheScratchpad: () => import(/* webpackChunkName: "TheScratchpad" */'@/components/TheScratchpad'),
      BaseTextEditor: () => import(/* webpackChunkName: "BaseTextEditor" */'@/components/BaseTextEditor')
   },
   data () {
      return {};
   },
   computed: {
      ...mapGetters({
         selectedWorkspace: 'workspaces/getSelected',
         isLoading: 'application/isLoading',
         isSettingModal: 'application/isSettingModal',
         isScratchpad: 'application/isScratchpad',
         connections: 'connections/getConnections',
         applicationTheme: 'settings/getApplicationTheme',
         disableBlur: 'settings/getDisableBlur',
         isUnsavedDiscardModal: 'workspaces/isUnsavedDiscardModal'
      })
   },
   mounted () {
      ipcRenderer.send('check-for-updates');
      this.checkVersionUpdate();

      const InputMenu = Menu.buildFromTemplate([
         {
            label: this.$t('word.cut'),
            role: 'cut'
         },
         {
            label: this.$t('word.copy'),
            role: 'copy'
         },
         {
            label: this.$t('word.paste'),
            role: 'paste'
         },
         {
            type: 'separator'
         },
         {
            label: this.$t('message.selectAll'),
            role: 'selectall'
         }
      ]);

      document.body.addEventListener('contextmenu', (e) => {
         e.preventDefault();
         e.stopPropagation();

         let node = e.target;

         while (node) {
            if (node.nodeName.match(/^(input|textarea)$/i) || node.isContentEditable) {
               InputMenu.popup(getCurrentWindow());
               break;
            }
            node = node.parentNode;
         }
      });
   },
   methods: {
      ...mapActions({
         showNewConnModal: 'application/showNewConnModal',
         checkVersionUpdate: 'application/checkVersionUpdate'
      })
   }
};
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

   .connection-panel-wrapper{
      height: calc(100vh - #{$excluding-size});
      width: 100%;
      padding-top: 15vh;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      overflow: auto;
   }
  }
</style>
