<template>
   <div id="wrapper">
      <TheTitleBar />
      <div id="window-content">
         <TheSettingBar />
         <div id="main-content" class="container">
            <TheAppWelcome v-if="!connections.length" @newConn="showNewConnModal" />
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
         <ModalEditConnection v-if="isEditModal" />
         <ModalSettings v-if="isSettingModal" />
      </div>
   </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import TheTitleBar from '@/components/TheTitleBar';
import TheSettingBar from '@/components/TheSettingBar';
import TheFooter from '@/components/TheFooter';
import TheNotificationsBoard from '@/components/TheNotificationsBoard';
import TheAppWelcome from '@/components/TheAppWelcome';
import Workspace from '@/components/Workspace';
import ModalNewConnection from '@/components/ModalNewConnection';
import ModalEditConnection from '@/components/ModalEditConnection';
import ModalSettings from '@/components/ModalSettings';

export default {
   name: 'App',
   components: {
      TheTitleBar,
      TheSettingBar,
      TheFooter,
      TheNotificationsBoard,
      TheAppWelcome,
      Workspace,
      ModalNewConnection,
      ModalEditConnection,
      ModalSettings
   },
   data () {
      return {
      };
   },
   computed: {
      ...mapGetters({
         isLoading: 'application/isLoading',
         isNewConnModal: 'application/isNewModal',
         isEditModal: 'application/isEditModal',
         isSettingModal: 'application/isSettingModal',
         connections: 'connections/getConnections'
      })
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
   body{
      height: 100%;
   }

   #wrapper{
      height: 100vh;
      position: relative;
   }

   #window-content{
      display: flex;
      position: relative;
      overflow: hidden;
   }

   #main-content {
      padding: 0;
      justify-content: flex-start;
      height: calc(100vh - #{$excluding-size});

      > .columns{
         height: calc(100vh - #{$footer-height});
      }
   }
</style>
