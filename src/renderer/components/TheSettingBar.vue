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
                  class="settingbar-element btn btn-link ex-tooltip"
                  :class="{'selected': connection.uid === selectedWorkspace}"
                  @click="selectWorkspace(connection.uid)"
                  @contextmenu.prevent="contextMenu($event, connection)"
                  @mouseover.self="tooltipPosition"
               >
                  <i class="settingbar-element-icon dbi" :class="`dbi-${connection.client} ${connected.includes(connection.uid) ? 'badge' : ''}`" />
                  <span class="ex-tooltip-content">{{ getConnectionName(connection.uid) }}</span>
               </li>
            </draggable>
            <li
               class="settingbar-element btn btn-link ex-tooltip"
               @click="showNewConnModal"
               @mouseover.self="tooltipPosition"
            >
               <i class="settingbar-element-icon material-icons text-light">add</i>
               <span class="ex-tooltip-content">{{ $t('message.addConnection') }}</span>
            </li>
         </ul>
      </div>

      <div class="settingbar-bottom-elements">
         <ul class="settingbar-elements">
            <li class="settingbar-element btn btn-link ex-tooltip" @click="showSettingModal('general')">
               <i class="settingbar-element-icon material-icons text-light">settings</i>
               <span class="ex-tooltip-content">{{ $t('word.settings') }}</span>
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
         contextConnection: {},
         scale: 0
      };
   },
   computed: {
      ...mapGetters({
         getConnections: 'connections/getConnections',
         getConnectionName: 'connections/getConnectionName',
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
         showNewConnModal: 'application/showNewConnModal',
         showSettingModal: 'application/showSettingModal',
         selectWorkspace: 'workspaces/selectWorkspace'
      }),
      contextMenu (event, connection) {
         this.contextEvent = event;
         this.contextConnection = connection;
         this.isContext = true;
      },
      workspaceName (connection) {
         return connection.ask ? '' : `${connection.user + '@'}${connection.host}:${connection.port}`;
      },
      tooltipPosition (e) {
         const el = e.target;
         const fromTop = window.pageYOffset + el.getBoundingClientRect().top - (el.offsetHeight / 4);
         el.querySelector('.ex-tooltip-content').style.top = `${fromTop}px`;
      }
   }
};
</script>

<style lang="scss">
   #settingbar{
      width: $settingbar-width;
      height: calc(100vh - #{$excluding-size});
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      background: $bg-color-light;
      padding: 0;
      box-shadow: 0 0 1px 0px #000;
      z-index: 9;

      .settingbar-top-elements{
         overflow-x: hidden;
         overflow-y: overlay;
         max-height: calc((100vh - 3.5rem) - #{$excluding-size});

         &::-webkit-scrollbar {
            width: 3px;
         }
      }

      .settingbar-bottom-elements{
         padding-top: .5rem;
         background: $bg-color-light;
         z-index: 1;
      }

      .settingbar-elements{
         list-style: none;
         text-align: center;
         width: $settingbar-width;
         padding: 0;
         margin: 0;

         .settingbar-element{
            height: $settingbar-width;
            width: 100%;
            margin: 0;
            border-left: 3px solid transparent;
            opacity: .5;
            transition: opacity .2s;
            display: flex;
            align-content: center;
            justify-content: center;
            flex-direction: column;

            &:hover{
               opacity: 1;
            }

            &.selected{
               border-left-color: $body-font-color;
               opacity: 1;
            }

            .settingbar-element-icon{

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

   .ex-tooltip{// Because both overflow-x: visible and overflow-y:auto are evil!!!
      .ex-tooltip-content{
         z-index: 999;
         visibility: hidden;
         opacity: 0;
         display:block;
         position:absolute;
         background-color:#feffe1;
         text-align: center;
         margin:.0 0 0 calc(#{$settingbar-width} - 5px);
         left: 0;
         padding: .2rem .4rem;
         font-size: .7rem;
         background: rgba(48,55,66,.95);
         border-radius: .1rem;
         color: #fff;
         max-width: 320px;
         pointer-events: none;
         text-overflow: ellipsis;
         transition: opacity .2s;
      }

      &:hover .ex-tooltip-content{
         visibility: visible;
         opacity: 1;
      }
   }
</style>
