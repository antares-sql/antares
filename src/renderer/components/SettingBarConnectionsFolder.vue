<template>
   <div
      ref="folderEl"
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
            `background: ${resolveFolderColor(folder.color)};`,
            isOpen ? `max-height: ${3*(folder.connections.length+1)}rem` : 'max-height: 3rem',
            !isOpen || folderDrag ? `overflow: hidden;` : ''
         ]"
         :list="localList"
         ghost-class="ghost"
         :group="{ name: 'connections', put: folderDrag ? undefined : 'clone' }"
         @start="dragStart"
         @end="dragStop"
         @change="saveOrder"
      >
         <template #header>
            <div
               v-if="!isOpen"
               v-button="folder.name || t('general.folder')"
               class="folder-overlay"
               aria-expanded="false"
               @click="openFolder"
               @contextmenu.stop="emit('context', {event: $event, content: folder})"
            />
            <div
               v-if="isOpen"
               v-button="folder.name || t('general.folder')"
               class="folder-icon"
               :style="`color: ${resolveFolderColor(folder.color)};`"
               aria-expanded="true"
               @click="closeFolder"
            >
               <BaseIcon
                  class="folder-icon-open"
                  icon-name="folder-open"
                  :size="36"
               />
               <BaseIcon
                  class="folder-icon-close"
                  icon-name="folder"
                  :size="36"
               />
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
               v-button="getConnectionOrderByUid(element)?.name || getConnectionName(element)"
               class="folder-element"
               :class="{ 'selected': element === selectedWorkspace }"
               :tabindex="isOpen ? 0 : -1"
               :aria-current="element === selectedWorkspace ? 'true' : undefined"
               @click="emit('select-workspace', element)"
               @contextmenu.stop="emit('context', {event: $event, content: getConnectionOrderByUid(element)})"
            >
               <div
                  v-if="getConnectionOrderByUid(element).icon"
                  class="folder-element-icon"
                  :class="[getStatusBadge(element)]"
               >
                  <BaseIcon
                     :icon-name="getConnectionOrderByUid(element).icon"
                     :type="getConnectionOrderByUid(element).hasCustomIcon ? 'custom' : 'icon'"
                     :size="36"
                  />
               </div>
               <div
                  v-else
                  class="folder-element-icon dbi"
                  :class="[`dbi-${getConnectionOrderByUid(element).client}`, getStatusBadge(element)]"
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
import { storeToRefs } from 'pinia';
import { computed, inject, PropType, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import * as Draggable from 'vuedraggable';

import BaseIcon from '@/components/BaseIcon.vue';
import SettingBarConnections from '@/components/SettingBarConnections.vue';
import { SidebarElement, useConnectionsStore } from '@/stores/connections';
import { useThemesStore } from '@/stores/themes';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

const workspacesStore = useWorkspacesStore();
const connectionsStore = useConnectionsStore();

const { getFolders: folders } = storeToRefs(connectionsStore);
const { resolveFolderColor } = storeToRefs(useThemesStore());
const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

const { getWorkspace } = workspacesStore;
const { getConnectionOrderByUid, getConnectionName, addToFolder, updateFolderConnections } = connectionsStore;

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
// Copy of the folder connections for the drag and drop, without uids missing from the sidebar (they break the render).
// It follows the store: actions like removeFromFolders replace the folder array without remounting this component
const storeList = () => props.folder.connections.filter(uid => getConnectionOrderByUid(uid));
const localList = ref<string[]>(storeList());
const dummyNested = ref([]);
const folderEl = ref<HTMLDivElement>(null);

watch(() => props.folder.connections, () => {
   localList.value = storeList();
}, { deep: true });

const saveOrder = () => {
   updateFolderConnections({ folder: props.folder.uid, connections: localList.value });
};

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

// Set by TheSettingBar at startup when the selected connection is in this folder: open it and scroll the connection into view.
// Reset after use, so a remount (folders sort) doesn't reopen a folder the user closed
const revealedFolder = inject<Ref<string>>('revealedFolder', ref(null));
watch(revealedFolder, uid => {
   if (uid !== props.folder.uid) return;
   revealedFolder.value = null;
   if (!isOpen.value) openFolder();
   setTimeout(() => { // after the opening transition
      folderEl.value?.querySelector('.folder-element.selected')?.scrollIntoView({ block: 'nearest' });
   }, 200);
}, { immediate: true });

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

   // The selection bar of .settingbar-element is a 3px flex item that would push the folder right
   &::before {
      display: none;
   }

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
      background-color: color-mix(in srgb, var(--settingbar-text) 80%, transparent);
      border-radius: $border-radius;
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
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
   border-radius: var(--radius-lg);
   transition: background .3s;
   color: var(--settingbar-text);

   &::before {
      content: "";
      height: 0;
      width: 3px;
      transition: height 0.2s;
      background-color: color-mix(in srgb, var(--settingbar-text) 80%, transparent);
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
      background: color-mix(in srgb, var(--settingbar-text) 10%, transparent)!important;
      transition: max-height .1s;

      .folder-element {
         opacity: .6;
         height: 2.5rem;
         max-width: initial;
         max-height: initial;
         background: transparent;

         &.ghost {
            background: var(--bg-settingbar);
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
            background-color: color-mix(in srgb, var(--settingbar-text) 80%, transparent);
            border-radius: $border-radius;
            position: absolute;
            left: -8px; // folder padding + container padding: aligned to the sidebar edge
            top: 50%;
            transform: translateY(-50%); // grows from the center, like top-level connections
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
      max-width: 1.15rem;
      max-height: 1.15rem;
      margin-bottom: 3px;
      position: relative;
      transition: opacity .2s;
      background: var(--bg-settingbar);
      border-radius: calc(var(--radius-lg) * 8 / 15); // nested in a --radius-lg folder

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
      gap: 2px;
      justify-items: center;

      .folder-element {
         width: 1.25rem;
         max-width: 1.25rem;
         height: 1.25rem;
         max-height: 1.25rem;
         margin-bottom: 0;
         // Concentric with the folder corners (folder radius minus its padding)
         border-radius: max(calc(var(--radius-lg) * 8 / 15), calc(var(--radius-lg) - 4px));

         .folder-element-icon,
         .folder-element-icon svg {
            width: 1.15rem;
            height: 1.15rem;
            font-size: 0.9rem;
         }

         // Only the 2x2 preview: further rows would peek out of the bottom edge
         &:nth-child(n + 5 of .folder-element) {
            visibility: hidden;
         }
      }
   }
}

.ghost {
   border-radius: var(--radius-lg)!important;
   background: color-mix(in srgb, var(--settingbar-text) 10%, transparent);

   &.folder-element {
      height: $settingbar-width;
      border-radius: var(--radius-lg);
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
