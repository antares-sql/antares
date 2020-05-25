<template>
   <div class="workspace-explorebar column">
      <div class="workspace-explorebar-header">
         <span class="workspace-explorebar-title">{{ connection.ask ? '': connection.user+'@' }}{{ connection.host }}:{{ connection.port }}</span>
         <span v-if="workspace.connected" class="workspace-explorebar-tools">
            <i
               class="material-icons md-18 c-hand"
               :class="{'rotate':isRefreshing}"
               :title="$t('word.refresh')"
               @click="refresh"
            >refresh</i>
            <i
               class="material-icons md-18 c-hand mr-1 ml-2"
               :title="$t('word.disconnect')"
               @click="disconnectWorkspace(connection.uid)"
            >exit_to_app</i>
         </span>
      </div>
      <DatabaseConnectPanel v-if="!workspace.connected" :connection="connection" />
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
   data () {
      return {
         isRefreshing: false
      };
   },
   computed: {
      ...mapGetters({
         getWorkspace: 'workspaces/getWorkspace'
      }),
      workspace () {
         return this.getWorkspace(this.connection.uid);
      }
   },
   methods: {
      ...mapActions({
         disconnectWorkspace: 'workspaces/removeConnected',
         refreshStructure: 'workspaces/refreshStructure'
      }),
      async refresh () {
         this.isRefreshing = true;
         await this.refreshStructure(this.connection.uid);
         this.isRefreshing = false;
      }
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
            display: flex;
            align-items: center;
         }

         .workspace-explorebar-tools {
               display: flex;
               align-items: center;

               > i{
                  opacity: .6;
                  transition: opacity .2s;
                  display: flex;
                  align-items: center;

               &:hover{
                  opacity: 1;
               }
            }
         }
      }
   }
</style>
