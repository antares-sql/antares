<template>
   <div id="settingbar">
      <div class="settingbar-top-elements">
         <SettingBarContext
            v-if="isContext"
            :context-event="contextEvent"
            :context-connection="contextConnection"
            @close-context="isContext = false"
         />
         <ul class="settingbar-elements">
            <Draggable
               v-model="connections"
               :item-key="'uid'"
               @start="isDragging = true"
               @end="dragStop"
            >
               <template #item="{element}">
                  <li
                     :draggable="true"
                     class="settingbar-element btn btn-link ex-tooltip"
                     :class="{'selected': element.uid === selectedWorkspace}"
                     @click.stop="selectWorkspace(element.uid)"
                     @contextmenu.prevent="contextMenu($event, element)"
                     @mouseover.self="tooltipPosition"
                  >
                     <i class="settingbar-element-icon dbi" :class="`dbi-${element.client} ${getStatusBadge(element.uid)}`" />
                     <span v-if="!isDragging" class="ex-tooltip-content">{{ getConnectionName(element.uid) }}</span>
                  </li>
               </template>
            </Draggable>
            <li
               class="settingbar-element btn btn-link ex-tooltip"
               :class="{'selected': 'NEW' === selectedWorkspace}"
               @click="selectWorkspace('NEW')"
               @mouseover.self="tooltipPosition"
            >
               <i class="settingbar-element-icon mdi mdi-24px mdi-plus text-light" />
               <span class="ex-tooltip-content">{{ $t('message.addConnection') }}</span>
            </li>
         </ul>
      </div>

      <div class="settingbar-bottom-elements">
         <ul class="settingbar-elements">
            <li class="settingbar-element btn btn-link ex-tooltip" @click="showScratchpad">
               <i class="settingbar-element-icon mdi mdi-24px mdi-notebook-edit-outline text-light" />
               <span class="ex-tooltip-content">{{ $t('word.scratchpad') }}</span>
            </li>
            <li class="settingbar-element btn btn-link ex-tooltip" @click="showSettingModal('general')">
               <i class="settingbar-element-icon mdi mdi-24px mdi-cog text-light" :class="{' badge badge-update': hasUpdates}" />
               <span class="ex-tooltip-content">{{ $t('word.settings') }}</span>
            </li>
         </ul>
      </div>
   </div>
</template>

<script setup lang="ts">
import { ref, Ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useApplicationStore } from '@/stores/application';
import { useConnectionsStore } from '@/stores/connections';
import { useWorkspacesStore } from '@/stores/workspaces';
import * as Draggable from 'vuedraggable';
import SettingBarContext from '@/components/SettingBarContext.vue';
import { ConnectionParams } from 'common/interfaces/antares';

const applicationStore = useApplicationStore();
const connectionsStore = useConnectionsStore();
const workspacesStore = useWorkspacesStore();

const { updateStatus } = storeToRefs(applicationStore);
const { connections: getConnections } = storeToRefs(connectionsStore);
const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

const { showSettingModal, showScratchpad } = applicationStore;
const { getConnectionName, updateConnections } = connectionsStore;
const { getWorkspace, selectWorkspace } = workspacesStore;

const isContext: Ref<boolean> = ref(false);
const isDragging: Ref<boolean> = ref(false);
const contextEvent: Ref<MouseEvent> = ref(null);
const contextConnection: Ref<ConnectionParams> = ref(null);

const connections = computed({
   get () {
      return getConnections.value;
   },
   set (value) {
      updateConnections(value);
   }
});

const hasUpdates = computed(() => ['available', 'downloading', 'downloaded', 'link'].includes(updateStatus.value));

const contextMenu = (event: MouseEvent, connection: ConnectionParams) => {
   contextEvent.value = event;
   contextConnection.value = connection;
   isContext.value = true;
};

const tooltipPosition = (e: Event) => {
   const el = e.target ? e.target : e;
   const fromTop = window.pageYOffset + (el as HTMLElement).getBoundingClientRect().top - ((el as HTMLElement).offsetHeight / 4);
   (el as HTMLElement).querySelector<HTMLElement>('.ex-tooltip-content').style.top = `${fromTop}px`;
};

const getStatusBadge = (uid: string) => {
   if (getWorkspace(uid)) {
      const status = getWorkspace(uid).connectionStatus;

      switch (status) {
         case 'connected':
            return 'badge badge-connected';
         case 'connecting':
            return 'badge badge-connecting';
         case 'failed':
            return 'badge badge-failed';
         default:
            return '';
      }
   }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dragStop = (e: any) => { // TODO: temp
   isDragging.value = false;

   setTimeout(() => {
      tooltipPosition(e.originalEvent.target.parentNode);
   }, 200);
};
</script>

<style lang="scss">
  #settingbar {
    width: $settingbar-width;
    height: calc(100vh - #{$excluding-size});
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 0;
    z-index: 9;

    .settingbar-top-elements {
      overflow-x: hidden;
      overflow-y: overlay;
      max-height: calc((100vh - 3.5rem) - #{$excluding-size});

      &::-webkit-scrollbar {
        width: 3px;
      }
    }

    .settingbar-bottom-elements {
      padding-top: 0.5rem;
      z-index: 1;
    }

    .settingbar-elements {
      list-style: none;
      text-align: center;
      width: $settingbar-width;
      padding: 0;
      margin: 0;

      .settingbar-element {
        height: $settingbar-width;
        width: 100%;
        margin: 0;
        opacity: 0.5;
        transition: opacity 0.2s;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        border-radius: 0;
        padding: 0;

        &:hover {
          opacity: 1;
        }

        &.selected {
          opacity: 1;

          &::before {
            height: $settingbar-width;
          }
        }

        &::before {
          content: "";
          height: 0;
          width: 3px;
          transition: height 0.2s;
          background-color: $primary-color;
          border-radius: $border-radius;
        }

        .settingbar-element-icon {
          margin: 0 auto;

          &.badge::after {
            bottom: -10px;
            right: 0;
            position: absolute;
          }

          &.badge-update::after {
            bottom: initial;
          }
        }
      }
    }
  }

  .ex-tooltip {// Because both overflow-x: visible and overflow-y:auto are evil!!!
    .ex-tooltip-content {
      z-index: 999;
      visibility: hidden;
      opacity: 0;
      display: block;
      position: absolute;
      text-align: center;
      margin: 0 0 0 calc(#{$settingbar-width} - 5px);
      left: 0;
      padding: 0.2rem 0.4rem;
      font-size: 0.7rem;
      background: rgba(48, 55, 66, 0.95);
      border-radius: $border-radius;
      color: #fff;
      max-width: 320px;
      pointer-events: none;
      text-overflow: ellipsis;
      overflow: hidden;
      transition: opacity 0.2s;
    }

    &.sortable-chosen {
      .ex-tooltip-content {
        opacity: 0 !important;
      }
    }

    &:hover:not(.selected) .ex-tooltip-content {
      visibility: visible;
      opacity: 1;
    }
  }
</style>
