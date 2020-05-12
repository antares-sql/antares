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
      <ModalNewConnection v-if="isNewConnModal" />
   </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import TheSettingBar from '@/components/TheSettingBar';
import TheExploreBar from '@/components/TheExploreBar';
import TheFooter from '@/components/TheFooter';
import TheAppWelcome from '@/components/TheAppWelcome';
import ModalNewConnection from '@/components/ModalNewConnection';

export default {
   name: 'App',
   components: {
      TheSettingBar,
      TheExploreBar,
      TheFooter,
      TheAppWelcome,
      ModalNewConnection
   },
   data () {
      return {
      };
   },
   computed: {
      ...mapGetters({
         isLoading: 'application/isLoading',
         isNewConnModal: 'connections/isNewModal'
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

   /* #main-content{
      background: #232524;
   } */
</style>
