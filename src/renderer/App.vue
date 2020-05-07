<template>
   <div id="wrapper">
      <!-- <TheHeader @toggleSidebar="toggleSidebar" /> -->
      <!-- <TheSidebar /> -->
      <div id="main-content">
         <!-- <BaseLoaderLayer
            id="main-loader"
            :is-loading="isLoading"
         /> -->
         <QueryEditor v-model="query" />
      </div>
      <!-- <TheFooter /> -->
   </div>
</template>

<script>
import QueryEditor from '@/components/QueryEditor';

export default {
   name: 'App',
   components: {
      QueryEditor
   },
   data () {
      return {
         query: ''
      };
   },
   computed: {
      isLoading () {
         return this.$store.state.application.isLoading;
      }
   },
   methods: {
   }
};
</script>

<style>
   html,
   body{
      height: 100%;
      background: #fff;
   }
</style>
