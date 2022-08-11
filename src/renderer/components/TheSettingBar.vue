<template>
   <div id="settingbar">
      <div ref="sidebarConnections" class="settingbar-top-elements">
         <SettingBarContext
            v-if="isContext"
            :context-event="contextEvent"
            :context-connection="contextConnection"
            @close-context="isContext = false"
         />
         <ul class="settingbar-elements">
            <Draggable
               v-model="pinnedConnectionsArr"
               :item-key="'uid'"
               @start="isDragging = true"
               @end="dragStop"
            >
               <template #item="{ element }">
                  <li
                     :draggable="true"
                     class="settingbar-element btn btn-link"
                     :class="{ 'selected': element.uid === selectedWorkspace }"
                     :title="getConnectionName(element.uid)"
                     @click.stop="selectWorkspace(element.uid)"
                     @contextmenu.prevent="contextMenu($event, element)"
                  >
                     <i
                        class="settingbar-element-icon dbi"
                        :class="[`dbi-${element.client}`, getStatusBadge(element.uid), (pinnedConnections.has(element.uid) ? 'settingbar-element-pin' : false)]"
                     />
                     <small class="settingbar-element-name">{{ getConnectionName(element.uid) }}</small>
                  </li>
               </template>
            </Draggable>

            <div v-if="pinnedConnectionsArr.length" class="divider" />

            <li
               v-for="connection in unpinnedConnectionsArr"
               :key="connection.uid"
               class="settingbar-element btn btn-link"
               :class="{ 'selected': connection.uid === selectedWorkspace }"
               :title="getConnectionName(connection.uid)"
               @click.stop="selectWorkspace(connection.uid)"
               @contextmenu.prevent="contextMenu($event, connection)"
            >
               <i
                  class="settingbar-element-icon dbi"
                  :class="[`dbi-${connection.client}`, getStatusBadge(connection.uid)]"
               />
               <small class="settingbar-element-name">{{ getConnectionName(connection.uid) }}</small>
            </li>
         </ul>
      </div>

      <div class="settingbar-middle-elements">
         <ul class="settingbar-elements">
            <li
               v-if="isScrollable"
               class="settingbar-element btn btn-link"
               :title="t('message.allConnections')"
               @click="emit('show-connections-modal')"
            >
               <i class="settingbar-element-icon mdi mdi-24px mdi-dots-horizontal text-light" />
            </li>
            <li
               class="settingbar-element btn btn-link"
               :class="{ 'selected': 'NEW' === selectedWorkspace }"
               :title="t('message.addConnection')"
               @click="selectWorkspace('NEW')"
            >
               <i class="settingbar-element-icon mdi mdi-24px mdi-plus text-light" />
            </li>
         </ul>
      </div>

      <div class="settingbar-bottom-elements">
         <ul class="settingbar-elements">
            <li
               v-if="!disableScratchpad"
               class="settingbar-element btn btn-link"
               :title="t('word.scratchpad')"
               @click="showScratchpad"
            >
               <i class="settingbar-element-icon mdi mdi-24px mdi-notebook-edit-outline text-light" />
            </li>
            <li
               class="settingbar-element btn btn-link"
               :title="t('word.settings')"
               @click="showSettingModal('general')"
            >
               <i
                  class="settingbar-element-icon mdi mdi-24px mdi-cog text-light"
                  :class="{ ' badge badge-update': hasUpdates }"
               />
            </li>
         </ul>
      </div>
   </div>
</template>

<script setup lang="ts">
import { ref, Ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useApplicationStore } from '@/stores/application';
import { useConnectionsStore } from '@/stores/connections';
import { useWorkspacesStore } from '@/stores/workspaces';
import { useSettingsStore } from '@/stores/settings';
import * as Draggable from 'vuedraggable';
import SettingBarContext from '@/components/SettingBarContext.vue';
import { ConnectionParams } from 'common/interfaces/antares';
import { useElementBounding } from '@vueuse/core';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const applicationStore = useApplicationStore();
const connectionsStore = useConnectionsStore();
const workspacesStore = useWorkspacesStore();
const settingsStore = useSettingsStore();

const { updateStatus } = storeToRefs(applicationStore);
const { connections: storedConnections, pinnedConnections, lastConnections } = storeToRefs(connectionsStore);
const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);
const { disableScratchpad } = storeToRefs(settingsStore);

const { showSettingModal, showScratchpad } = applicationStore;
const { getConnectionName, updatePinnedConnections } = connectionsStore;
const { getWorkspace, selectWorkspace } = workspacesStore;

const emit = defineEmits(['show-connections-modal']);

const isLinux = process.platform === 'linux';

const sidebarConnections: Ref<HTMLDivElement> = ref(null);
const isContext: Ref<boolean> = ref(false);
const isDragging: Ref<boolean> = ref(false);
const isScrollable: Ref<boolean> = ref(false);
const contextEvent: Ref<MouseEvent> = ref(null);
const contextConnection: Ref<ConnectionParams> = ref(null);
const sidebarConnectionsHeight = ref(useElementBounding(sidebarConnections)?.height);

const pinnedConnectionsArr = computed({
   get: () => [...pinnedConnections.value].map(c => storedConnections.value.find(sc => sc.uid === c)).filter(Boolean),
   set: (value: ConnectionParams[]) => {
      const pinnedUid = value.reduce((acc, curr) => {
         acc.push(curr.uid);
         return acc;
      }, []);

      updatePinnedConnections(pinnedUid);
   }
});

const unpinnedConnectionsArr = computed(() => {
   return storedConnections.value
      .filter(c => !pinnedConnections.value.has(c.uid))
      .map(c => {
         const connTime = lastConnections.value.find((lc) => lc.uid === c.uid)?.time || 0;
         return { ...c, time: connTime };
      })
      .sort((a, b) => {
         if (a.time < b.time) return 1;
         else if (a.time > b.time) return -1;
         return 0;
      });
});

const hasUpdates = computed(() => ['available', 'downloading', 'downloaded', 'link'].includes(updateStatus.value));

const contextMenu = (event: MouseEvent, connection: ConnectionParams) => {
   contextEvent.value = event;
   contextConnection.value = connection;
   isContext.value = true;
};

const tooltipPosition = (e: Event) => {
   const el = (e.target ? e.target : e) as unknown as HTMLElement;
   const tooltip = el.querySelector<HTMLElement>('.ex-tooltip-content');
   if (tooltip) {
      const fromTop = isLinux
         ? window.scrollY + el.getBoundingClientRect().top + (el.offsetHeight / 4)
         : window.scrollY + el.getBoundingClientRect().top - (el.offsetHeight / 4);
      tooltip.style.top = `${fromTop}px`;
   }
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
const dragStop = (e: any) => {
   isDragging.value = false;

   setTimeout(() => {
      tooltipPosition(e.originalEvent.target.parentNode);
   }, 200);
};

watch(sidebarConnectionsHeight, (value) => {
   isScrollable.value = value < sidebarConnections.value.scrollHeight;
});

watch(unpinnedConnectionsArr, (newVal, oldVal) => {
   if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
      setTimeout(() => {
         const element = document.querySelector<HTMLElement>('.settingbar-element.selected');
         if (element) {
            const rect = element.getBoundingClientRect();
            const elemTop = rect.top;
            const elemBottom = rect.bottom;
            const isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);

            if (!isVisible) {
               element.setAttribute('tabindex', '-1');
               element.focus();
               element.removeAttribute('tabindex');
            }
         }
      }, 50);
   }
});

watch(selectedWorkspace, (newVal, oldVal) => {
   if (newVal !== oldVal) {
      setTimeout(() => {
         const element = document.querySelector<HTMLElement>('.settingbar-element.selected');
         if (element) {
            element.setAttribute('tabindex', '-1');
            element.focus();
            element.removeAttribute('tabindex');
         }
      }, 150);
   }
});
</script>

<style lang="scss">
#settingbar {
   width: $settingbar-width;
   height: calc(100vh - #{$excluding-size});
   display: flex;
   flex-direction: column;
   //  justify-content: space-between;
   align-items: center;
   padding: 0;
   z-index: 9;

   .settingbar-top-elements {
      overflow-x: hidden;
      overflow-y: overlay;
      // max-height: calc((100vh - 3.5rem) - #{$excluding-size});

      &::-webkit-scrollbar {
         width: 3px;
      }
   }

   .settingbar-bottom-elements {
      z-index: 1;
      margin-top: auto;
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
         opacity: 0.6;
         transition: opacity 0.2s;
         display: flex;
         align-items: center;
         justify-content: flex-start;
         border-radius: 0;
         padding: 0;
         position: relative;

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
               top: 5px;
               right: -4px;
               position: absolute;
            }

            &.badge-update::after {
               bottom: initial;
            }
         }

         .settingbar-element-name {
            font-size: 65%;
            bottom: 5px;
            left: 7px;
            position: absolute;
            font-style: normal;
            display: block;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            width: calc($settingbar-width - 15px);
            text-align: left;
            line-height: 1.1;
            color: rgba($body-font-color-dark, 0.8);
         }

         .settingbar-element-pin {
            margin: 0 auto;

            &::before {
               font: normal normal normal 14px/1 "Material Design Icons";
               content: "\F0403";
               color: $body-font-color-dark;
               transform: rotate(45deg);
               opacity: 0.25;
               top: -8px;
               left: -10px;
               position: absolute;
            }
         }
      }
   }
}
</style>
