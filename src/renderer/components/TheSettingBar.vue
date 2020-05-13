<template>
   <div id="settingbar" class="container">
      <div class="settingbar-top-elements">
         <ul class="settingbar-elements">
            <li
               v-for="connection in connections"
               :key="connection.uid"
               class="settingbar-element btn btn-link tooltip tooltip-right p-0"
               :class="{'selected': connection.uid === selectedConnection}"
               :data-tooltip="`${connection.user}@${connection.host}:${connection.port}`"
            >
               <i class="dbi" :class="`dbi-${connection.client}`" />
            </li>
            <li
               class="settingbar-element btn btn-link tooltip tooltip-right"
               data-tooltip="Add connection"
               @click="showNewConnModal"
            >
               <i class="material-icons text-light">add</i>
            </li>
         </ul>
      </div>

      <div class="settingbar-bottom-elements">
         <ul class="settingbar-elements">
            <li class="settingbar-element btn btn-link tooltip tooltip-right" data-tooltip="Settings">
               <i class="material-icons text-light">settings</i>
            </li>
         </ul>
      </div>
   </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
   name: 'TheSettingBar',
   computed: {
      ...mapGetters({
         connections: 'connections/getConnections',
         selectedConnection: 'connections/getSelected'
      })
   },
   methods: {
      ...mapActions({
         showNewConnModal: 'connections/showNewConnModal'
      }),
      isActiveTab: uid => uid === this.selectedConnection
   }
};
</script>

<style lang="scss">
   #settingbar{
      width: $settingbar-width;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      background: $bg-color-light;
      padding: .5rem 0;
      margin-bottom: $footer-height;
      box-shadow: 0 0 1px 0px #000;
      z-index: 9;

      .settingbar-elements{
         list-style: none;
         text-align: center;
         padding: 0;
         margin: 0;

         .settingbar-element{
            height: initial;

            .settingbar-element-icon{
               width: 42px;
            }
         }

      }
   }
</style>
