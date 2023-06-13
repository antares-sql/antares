<template>
   <div
      v-tooltip="{
         strategy: 'fixed',
         placement: 'right',
         content: folder.name,
         disabled: isOpen || !folder.name
      }"
      class="settingbar-element folder btn btn-link p-1"
      :class="[{ 'selected-inside': hasSelectedInside && !isOpen }]"
      :style="isOpen ? `height: auto; opacity: 1;` : null"
   >
      <Draggable
         class="folder-container"
         :item-key="((item: string) => localList.indexOf(item))"
         :class="[{'opened': isOpen}]"
         :style="[
            `background: ${folder.color};`,
            isOpen ? `max-height: ${60*(folder.connections.length+1)}px` : 'max-height: 60px',
            !isOpen || folderDrag ? `overflow: hidden;` : ''
         ]"
         :list="localList"
         ghost-class="ghost"
         :group="{ name: 'connections', put: folderDrag ? undefined : 'clone' }"
         @start="dragStart"
         @end="dragStop"
      >
         <template #header>
            <div
               v-if="!isOpen"
               class="folder-overlay"
               @click="openFolder"
               @contextmenu.stop="emit('context', {event: $event, content: folder})"
            />
            <div
               v-if="isOpen"
               class="folder-icon"
               :style="`color: ${folder.color};`"
               @click="closeFolder"
            >
               <i class="folder-icon-open mdi mdi-folder-open mdi-36px" />
               <i class="folder-icon-close mdi mdi-folder mdi-36px" />
            </div>
         </template>
         <template #item="{ element }">
            <div
               :key="element"
               v-tooltip="{
                  strategy: 'fixed',
                  placement: 'right',
                  content: getConnectionName(element)
               }"
               class="folder-element"
               :class="{ 'selected': element === selectedWorkspace }"
               @click="emit('select-workspace', element)"
               @contextmenu.stop="emit('context', {event: $event, content: getConnectionOrderByUid(element)})"
            >
               <i
                  class="folder-element-icon dbi"
                  :class="[getConnectionOrderByUid(element)?.icon ? `mdi ${getConnectionOrderByUid(element).icon}`: `dbi-${getConnectionOrderByUid(element)?.client}`, getStatusBadge(element)]"
               />
               <small v-if="isOpen" class="folder-element-name">{{ getConnectionOrderByUid(element)?.name || getConnectionName(element) }}</small>
            </div>
         </template>
      </Draggable>
      <SettingBarConnections
         v-if="draggedElement && !foldersUid.includes(draggedElement)"
         class="drag-area"
         :class="[{'folder-preview': coveredElement === folder.uid && draggedElement !== coveredElement}]"
         :list="dummyNested"
         :swap-threshold="1"
         @dragenter="emit('covered')"
         @dragleave="emit('uncovered')"
         @change="addIntoFolder"
      />
   </div>
</template>
<script setup lang="ts">
import { computed, PropType, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import * as Draggable from 'vuedraggable';
import { SidebarElement, useConnectionsStore } from '@/stores/connections';
import { useWorkspacesStore } from '@/stores/workspaces';
import SettingBarConnections from '@/components/SettingBarConnections.vue';

const workspacesStore = useWorkspacesStore();
const connectionsStore = useConnectionsStore();

const { getFolders: folders } = storeToRefs(connectionsStore);
const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

const { getWorkspace } = workspacesStore;
const { getConnectionOrderByUid, getConnectionName, addToFolder } = connectionsStore;

const foldersOpened = JSON.parse(localStorage.getItem('opened-folders')) || [];

const props = defineProps({
   folder: {
      type: Object as PropType<SidebarElement>,
      required: true
   },
   folderDrag: {
      type: Boolean,
      default: false
   },
   draggedElement: {
      type: [String, Boolean] as PropType<string | false>,
      required: true
   },
   coveredElement: {
      type: [String, Boolean] as PropType<string | false>,
      required: true
   }
});

const emit = defineEmits(['context', 'covered', 'uncovered', 'select-workspace', 'folder-sort', 'folder-drag']);

const isOpen = ref(foldersOpened.includes(props.folder.uid));
const localList = ref(props.folder.connections);
const dummyNested = ref([]);

const hasSelectedInside = computed(() => localList.value.includes(selectedWorkspace.value));

const foldersUid = computed(() => folders.value.reduce<string[]>((acc, curr) => {
   acc.push(curr.uid);
   return acc;
}, []));

const addIntoFolder = ({ added }: {added: { element: SidebarElement }}) => {
   if (typeof props.coveredElement === 'string' && !added.element.isFolder) {
      addToFolder({
         folder: props.coveredElement,
         connection: added.element.uid
      });

      emit('uncovered');
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

const openFolder = () => {
   isOpen.value = true;
   const opened: string[] = JSON.parse(localStorage.getItem('opened-folders')) || [];
   opened.push(props.folder.uid);
   localStorage.setItem('opened-folders', JSON.stringify(opened));
};

const closeFolder = () => {
   isOpen.value = false;
   let opened: string[] = JSON.parse(localStorage.getItem('opened-folders')) || [];
   opened = opened.filter(uid => uid !== props.folder.uid);
   localStorage.setItem('opened-folders', JSON.stringify(opened));
};

const dragStart = () => {
   emit('folder-drag', true);
};

const dragStop = () => {
   emit('folder-drag', false);
};

watch(() => dummyNested.value.length, () => {
   dummyNested.value = [];
});

emit('folder-sort');// To apply changes on component key change
</script>
<style lang="scss" scoped>
.folder {
   position: relative;
   &.selected-inside {
      opacity: 1!important;

      &::after {
         height: 2.5rem;
         position: absolute;
      }
   }

   &::after {
      content: "";
      height: 0;
      width: 3px;
      transition: height 0.2s;
      background-color: rgba($color: #fff, $alpha: 0.8);
      border-radius: $border-radius;
      position: absolute;
      left: 0;
   }
}

.folder-container {
   display: grid;
   grid-template-columns: auto auto;
   grid-template-rows: 50%;
   gap: 4px;
   padding: 4px;
   height: 100%;
   width: 100%;
   border-radius: 15px;
   transition: background .3s;
   color: $body-font-color-dark;

   &::before {
      content: "";
      height: 0;
      width: 3px;
      transition: height 0.2s;
      background-color: rgba($color: #fff, $alpha: 0.8);
      border-radius: $border-radius;
      position: absolute;
      left: -11px;
   }

   .folder-element-icon {
      margin: 0 auto;

      &.badge::after {
         top: 10px;
         right: 0px;
         position: absolute;
         display: none;
      }

      &.badge-update::after {
         bottom: initial;
      }
   }

   &.opened {
      gap: 4px 6px;
      grid-template-columns: auto;
      grid-template-rows: auto;
      background: rgba($color: #fff, $alpha: 0.1)!important;
      transition: max-height .1s;

      .folder-element {
         opacity: .6;
         height: 2.5rem;
         max-width: initial;
         max-height: initial;
         background: transparent;

         &.ghost {
            background: $bg-color-light-dark;
            &.selected::before {
               height: 0;
               position: absolute;
            }
         }

         &.selected {
            opacity: 1;

            &::before {
               height: 2.5rem;
               position: absolute;
            }
         }

         &::before {
            content: "";
            height: 0;
            width: 3px;
            transition: height 0.2s;
            background-color: rgba($color: #fff, $alpha: 0.8);
            border-radius: $border-radius;
            position: absolute;
            left: -11px;
         }

         .folder-element-icon {
            margin: 0 auto;
            font-size: 36px;
            display: flex;

            &.badge::after {
               top: 14px;
               right: -4px;
               position: absolute;
               display: block;
            }

            &.badge-update::after {
               bottom: initial;
            }
         }
      }

      .folder-icon {
         height: 2.5rem;
         display: flex;
         align-items: center;
         justify-content: center;
         margin-bottom: 3px;
         position: relative;
         transition: opacity .2s;

         .folder-icon-open {
            display: block;
         }

         .folder-icon-close {
            display: none;
         }

         &:hover {
            opacity: 1;

            .folder-icon-open {
               display: none;
            }

            .folder-icon-close {
               display: block;
            }
         }
      }
   }

   .folder-overlay {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 10;
   }

   .folder-element {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      max-width: 23px;
      max-height: 23px;
      margin-bottom: 3px;
      position: relative;
      transition: opacity .2s;
      background: $bg-color-light-dark;
      border-radius: 8px;

      &.ghost {
         margin:0 ;
         margin-bottom: 3px;
         height: 2.5rem;
      }

      &:hover, &.selected {
         opacity: 1;
      }

      .folder-element-icon {
         transition: margin .2s;
      }

      .folder-element-name {
         position: absolute;
         max-width: 90%;
         bottom: 0;
         font-size: 65%;
         font-style: normal;
         display: block;
         overflow: hidden;
         white-space: nowrap;
         text-overflow: ellipsis;
         line-height: 1.02;
         transition: bottom .2s;
      }
   }

   &:not(.opened){
      .folder-element {

         .folder-element-icon {
            width: 21px;
            height: 21px;
            font-size: 16px;
         }
      }
   }
}

.ghost {
   border-radius: 15px!important;
   background: rgba($color: #fff, $alpha: 0.1);

   &.folder-element {
      height: $settingbar-width;
      border-radius: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 4px;
      position: relative;
      transition: opacity .2s;

      &:hover, &.selected {
         opacity: 1;
      }

      .folder-element-icon {
         margin: 0 auto;
         font-size: 36px;
         display: flex;
         align-items: center;
         justify-content: center;

         &.badge::after {
            top: 5px;
            right: -4px;
            position: absolute;
         }

         &.badge-update::after {
            bottom: initial;
         }
      }

      .folder-element-name {
         position: absolute;
         max-width: 90%;
         bottom: 5px;
         text-align: center;
         font-size: 65%;
         font-style: normal;
         display: block;
         overflow: hidden;
         white-space: nowrap;
         text-overflow: ellipsis;
         line-height: 1.02;
      }
   }
}
</style>
