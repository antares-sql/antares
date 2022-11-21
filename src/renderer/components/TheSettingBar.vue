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
            <SettingBarConnections
               v-model="connectionsArr"
               @context="contextMenu"
            />
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
import { useConnectionsStore, SidebarElement } from '@/stores/connections';
import { useWorkspacesStore } from '@/stores/workspaces';
import { useSettingsStore } from '@/stores/settings';
import SettingBarContext from '@/components/SettingBarContext.vue';
import SettingBarConnections from '@/components/SettingBarConnections.vue';
import { useElementBounding } from '@vueuse/core';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const applicationStore = useApplicationStore();
const connectionsStore = useConnectionsStore();
const workspacesStore = useWorkspacesStore();
const settingsStore = useSettingsStore();

const { updateStatus } = storeToRefs(applicationStore);
const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);
const { getConnectionsOrder: connectionsOrder } = storeToRefs(connectionsStore);
const { disableScratchpad } = storeToRefs(settingsStore);

const { showSettingModal, showScratchpad } = applicationStore;
const { updateConnectionsOrder } = connectionsStore;
const { selectWorkspace } = workspacesStore;

const emit = defineEmits(['show-connections-modal']);

const sidebarConnections: Ref<HTMLDivElement> = ref(null);
const isContext: Ref<boolean> = ref(false);
const isScrollable: Ref<boolean> = ref(false);
const contextEvent: Ref<MouseEvent> = ref(null);
const contextConnection: Ref<SidebarElement> = ref(null);
const sidebarConnectionsHeight = ref(useElementBounding(sidebarConnections)?.height);

const connectionsArr = computed({
   get: () => connectionsOrder.value,
   set: (value: SidebarElement[]) => {
      updateConnectionsOrder(value);
   }
});

const hasUpdates = computed(() => ['available', 'downloading', 'downloaded', 'link'].includes(updateStatus.value));

const contextMenu = (event: MouseEvent, connection: SidebarElement) => {
   contextEvent.value = event;
   contextConnection.value = connection;
   isContext.value = true;
};

watch(sidebarConnectionsHeight, (value) => {
   isScrollable.value = value < sidebarConnections.value.scrollHeight;
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
            text-align: center;
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
