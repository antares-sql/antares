<template>
   <div class="workspace-explorebar column">
      <div class="workspace-explorebar-title">
         {{ connection.user }}@{{ connection.host }}:{{ connection.port }}
      </div>
      <DatabaseConnectPanel :connection="connection" />
   </div>
</template>

<script>
import DatabaseConnectPanel from '@/components/DatabaseConnectPanel';

export default {
   name: 'DatabaseExploreBar',
   components: {
      DatabaseConnectPanel
   },
   props: {
      connection: Object
   }
};
</script>

<style lang="scss">
   .workspace-explorebar{
      width: $explorebar-width;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      text-align: left;
      background: $bg-color-gray;
      margin-bottom: $footer-height;
      box-shadow: 0 0 1px 0px #000;
      z-index: 8;
      flex: initial;
      position: relative;
      padding-top: 1.4rem;

      .workspace-explorebar-title{
         top: 0;
         left: 0;
         right: 0;
         padding: .3rem;
         position: absolute;
         font-size: .6rem;
         font-weight: 700;
         text-transform: uppercase;
      }
   }
</style>
