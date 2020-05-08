<template>
   <div id="wrapper">
      <!-- <TheHeader /> -->
      <TheSettingBar />
      <TheExploreBar />
      <div id="main-content" class="container">
         <!-- <BaseLoaderLayer
            id="main-loader"
            :is-loading="isLoading"
         /> -->
         <TheAppWelcome @newConn="showNewConnModal" />
      </div>
      <TheFooter />
      <NewConnectionModal :is-opened="isNewConnModal" />
   </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import TheSettingBar from '@/components/TheSettingBar';
import TheExploreBar from '@/components/TheExploreBar';
import TheFooter from '@/components/TheFooter';
import TheAppWelcome from '@/components/TheAppWelcome';
import NewConnectionModal from '@/components/NewConnectionModal';

export default {
   name: 'App',
   components: {
      TheSettingBar,
      TheExploreBar,
      TheFooter,
      TheAppWelcome,
      NewConnectionModal
   },
   data () {
      return {
      };
   },
   computed: {
      ...mapState({
         isLoading: state => state.application.isLoading,
         isNewConnModal: state => state.connections.isNewConnModal
      })
   },
   methods: {
      ...mapActions({
         showNewConnModal: 'connections/showNewConnModal'
      })
   }
};
</script>

<style>
   html,
   body{
      height: 100%;
   }

   #wrapper{
      display: flex;
      height: 100vh;
      position: relative;
   }

   #main-content{
      /* background: #232524; */
   }
</style>
