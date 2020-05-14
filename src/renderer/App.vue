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
      <ModalNewConnection v-if="isNewConnModal" />
   </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import TheSettingBar from '@/components/TheSettingBar';
import TheFooter from '@/components/TheFooter';
import TheAppWelcome from '@/components/TheAppWelcome';
import DatabaseWorkspace from '@/components/DatabaseWorkspace';
import ModalNewConnection from '@/components/ModalNewConnection';

export default {
   name: 'App',
   components: {
      TheSettingBar,
      TheFooter,
      TheAppWelcome,
      DatabaseWorkspace,
      ModalNewConnection
   },
   data () {
      return {
      };
   },
   computed: {
      ...mapGetters({
         isLoading: 'application/isLoading',
         isNewConnModal: 'connections/isNewModal',
         connections: 'connections/getConnections'
      })
   },
   methods: {
      ...mapActions({
         showNewConnModal: 'connections/showNewConnModal'
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
