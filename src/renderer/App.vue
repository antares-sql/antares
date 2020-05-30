<template>
   <div id="wrapper">
      <TheSettingBar />
      <div id="main-content" class="container">
         <TheAppWelcome v-if="!connections.length" @newConn="showNewConnModal" />
         <div v-else class="columns col-gapless">
            <DatabaseWorkspace
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
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import TheSettingBar from '@/components/TheSettingBar';
import TheFooter from '@/components/TheFooter';
import TheNotificationsBoard from '@/components/TheNotificationsBoard';
import TheAppWelcome from '@/components/TheAppWelcome';
import DatabaseWorkspace from '@/components/DatabaseWorkspace';
import ModalNewConnection from '@/components/ModalNewConnection';
import ModalEditConnection from '@/components/ModalEditConnection';
import ModalSettings from '@/components/ModalSettings';

export default {
   name: 'App',
   components: {
      TheSettingBar,
      TheFooter,
      TheNotificationsBoard,
      TheAppWelcome,
      DatabaseWorkspace,
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
      display: flex;
      height: 100vh;
      position: relative;
   }

   #main-content {
      padding: 0;
      justify-content: flex-start;

      > .columns{
         height: 100vh;
      }
   }
</style>
