<template>
   <div id="wrapper" :class="`theme-${applicationTheme}`">
      <TheTitleBar />
      <div id="window-content">
         <TheSettingBar />
         <div id="main-content" class="container">
            <TheAppWelcome v-if="!connections.length" @new-conn="showNewConnModal" />
            <div v-else class="columns col-gapless">
               <Workspace
                  v-for="connection in connections"
                  :key="connection.uid"
                  :connection="connection"
               />
            </div>
         </div>
         <TheFooter />
         <TheNotificationsBoard />
         <ModalNewConnection v-if="isNewConnModal" />
         <ModalSettings v-if="isSettingModal" />
         <ModalDiscardChanges v-if="isUnsavedDiscardModal" />
      </div>
   </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { ipcRenderer, remote } from 'electron';

export default {
   name: 'App',
   components: {
      TheTitleBar: () => import(/* webpackChunkName: "TheTitleBar" */'@/components/TheTitleBar'),
      TheSettingBar: () => import(/* webpackChunkName: "TheSettingBar" */'@/components/TheSettingBar'),
      TheFooter: () => import(/* webpackChunkName: "TheFooter" */'@/components/TheFooter'),
      TheNotificationsBoard: () => import(/* webpackChunkName: "TheNotificationsBoard" */'@/components/TheNotificationsBoard'),
      TheAppWelcome: () => import(/* webpackChunkName: "TheAppWelcome" */'@/components/TheAppWelcome'),
      Workspace: () => import(/* webpackChunkName: "Workspace" */'@/components/Workspace'),
      ModalNewConnection: () => import(/* webpackChunkName: "ModalNewConnection" */'@/components/ModalNewConnection'),
      ModalSettings: () => import(/* webpackChunkName: "ModalSettings" */'@/components/ModalSettings'),
      ModalDiscardChanges: () => import(/* webpackChunkName: "ModalDiscardChanges" */'@/components/ModalDiscardChanges')
   },
   data () {
      return {};
   },
   computed: {
      ...mapGetters({
         isLoading: 'application/isLoading',
         isNewConnModal: 'application/isNewModal',
         isEditModal: 'application/isEditModal',
         isSettingModal: 'application/isSettingModal',
         connections: 'connections/getConnections',
         applicationTheme: 'settings/getApplicationTheme',
         isUnsavedDiscardModal: 'workspaces/isUnsavedDiscardModal'
      })
   },
   mounted () {
      ipcRenderer.send('check-for-updates');

      const Menu = remote.Menu;

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
               InputMenu.popup(remote.getCurrentWindow());
               break;
            }
            node = node.parentNode;
         }
      });
   },
   methods: {
      ...mapActions({
         showNewConnModal: 'application/showNewConnModal'
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
  }
</style>
