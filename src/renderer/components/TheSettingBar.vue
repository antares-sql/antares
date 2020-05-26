<template>
   <div id="settingbar">
      <div class="settingbar-top-elements">
         <SettingBarContext
            v-if="isContext"
            :context-event="contextEvent"
            :context-connection="contextConnection"
            @closeContext="isContext = false"
         />
         <ul class="settingbar-elements">
            <draggable v-model="connections">
               <li
                  v-for="connection in connections"
                  :key="connection.uid"
                  draggable="true"
                  class="settingbar-element btn btn-link tooltip tooltip-right"
                  :class="{'selected': connection.uid === selectedWorkspace}"
                  :data-tooltip="`${connection.ask ? '': connection.user+'@'}${connection.host}:${connection.port}`"
                  @click="selectWorkspace(connection.uid)"
                  @contextmenu.prevent="contextMenu($event, connection)"
               >
                  <i class="settingbar-element-icon dbi" :class="`dbi-${connection.client} ${connected.includes(connection.uid) ? 'badge' : ''}`" />
               </li>
            </draggable>
            <li
               class="settingbar-element btn btn-link tooltip tooltip-right pt-3"
               :data-tooltip="$t('message.addConnection')"
               @click="showNewConnModal"
            >
               <i class="settingbar-element-icon material-icons text-light">add</i>
            </li>
         </ul>
      </div>

      <div class="settingbar-bottom-elements">
         <ul class="settingbar-elements">
            <li class="settingbar-element btn btn-link tooltip tooltip-right mb-2" :data-tooltip="$t('word.settings')">
               <i class="settingbar-element-icon material-icons text-light">settings</i>
            </li>
         </ul>
      </div>
   </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import draggable from 'vuedraggable';
import SettingBarContext from '@/components/SettingBarContext';

export default {
   name: 'TheSettingBar',
   components: {
      draggable,
      SettingBarContext
   },
   data () {
      return {
         dragElement: null,
         isContext: false,
         contextEvent: null,
         contextConnection: {}
      };
   },
   computed: {
      ...mapGetters({
         getConnections: 'connections/getConnections',
         connected: 'workspaces/getConnected',
         selectedWorkspace: 'workspaces/getSelected'
      }),
      connections: {
         get () {
            return this.getConnections;
         },
         set (value) {
            this.updateConnections(value);
         }
      }
   },
   methods: {
      ...mapActions({
         updateConnections: 'connections/updateConnections',
         showNewConnModal: 'connections/showNewConnModal',
         selectWorkspace: 'workspaces/selectWorkspace'
      }),
      contextMenu (event, connection) {
         this.contextEvent = event;
         this.contextConnection = connection;
         this.isContext = true;
      }
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
         width: $settingbar-width;
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
