<template>
   <div id="settingbar">
      <div class="settingbar-top-elements">
         <ul class="settingbar-elements">
            <li
               v-for="connection in connections"
               :key="connection.uid"
               class="settingbar-element btn btn-link tooltip tooltip-right"
               :class="{'selected': connection.uid === selectedWorkspace}"
               :data-tooltip="`${connection.user}@${connection.host}:${connection.port}`"
               @click="selectWorkspace(connection.uid)"
            >
               <i class="settingbar-element-icon dbi" :class="`dbi-${connection.client} ${connected.includes(connection.uid) ? 'badge' : ''}`" />
            </li>
            <li
               class="settingbar-element btn btn-link tooltip tooltip-right pt-3"
               data-tooltip="Add connection"
               @click="showNewConnModal"
            >
               <i class="settingbar-element-icon material-icons text-light">add</i>
            </li>
         </ul>
      </div>

      <div class="settingbar-bottom-elements">
         <ul class="settingbar-elements">
            <li class="settingbar-element btn btn-link tooltip tooltip-right mb-2" data-tooltip="Settings">
               <i class="settingbar-element-icon material-icons text-light">settings</i>
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
         connected: 'workspaces/getConnected',
         selectedWorkspace: 'workspaces/getSelected'
      })
   },
   methods: {
      ...mapActions({
         showNewConnModal: 'connections/showNewConnModal',
         selectWorkspace: 'workspaces/selectWorkspace'
      })
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
      padding: 0;
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
            width: 100%;
            padding: 0;
            padding: .3rem 0 0;
            margin: 0;
            border-left: 3px solid transparent;
            opacity: .5;
            transition: opacity .2s;

            &:hover{
               opacity: 1;
            }

            &.selected{
               border-left-color: $body-font-color;
               opacity: 1;
            }

            .settingbar-element-icon{
               margin-left: -3px;

               &.badge::after{
                  bottom: -10px;
                  right: 0;
                  position: absolute;
                  background: $success-color;
               }
            }
         }

      }
   }
</style>
