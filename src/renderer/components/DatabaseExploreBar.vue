<template>
   <div class="workspace-explorebar column">
      <div class="workspace-explorebar-header">
         <span class="workspace-explorebar-title">{{ connection.user }}@{{ connection.host }}:{{ connection.port }}</span>
         <span v-if="isConnected" class="workspace-explorebar-tools">
            <i class="material-icons md-18 c-hand mr-1" title="Refresh">cached</i>
            <i
               class="material-icons md-18 c-hand"
               title="Disconnect"
               @click="disconnectWorkspace(connection.uid)"
            >exit_to_app</i>
         </span>
      </div>
      <DatabaseConnectPanel v-if="!isConnected" :connection="connection" />
   </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import DatabaseConnectPanel from '@/components/DatabaseConnectPanel';

export default {
   name: 'DatabaseExploreBar',
   components: {
      DatabaseConnectPanel
   },
   props: {
      connection: Object
   },
   computed: {
      ...mapGetters({
         connected: 'workspaces/getConnected'
      }),
      isConnected () {
         return this.connected.includes(this.connection.uid);
      }
   },
   methods: {
      ...mapActions({
         disconnectWorkspace: 'workspaces/removeConnected'
      })
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

      .workspace-explorebar-header{
         top: 0;
         left: 0;
         right: 0;
         padding: .3rem;
         position: absolute;
         display: flex;
         justify-content: space-between;
         font-size: .6rem;
         font-weight: 700;
         text-transform: uppercase;

         .workspace-explorebar-title{
            width: 80%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
         }

         .workspace-explorebar-tools > i{
            opacity: .6;
            transition: opacity .2s;;

            &:hover{
               opacity: 1;
            }
         }
      }
   }
</style>
