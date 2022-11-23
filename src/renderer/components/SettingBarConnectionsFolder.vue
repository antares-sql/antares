<template>
   <div
      class="settingbar-element btn btn-link p-1"
      :style="isOpen ? `height: auto; opacity: 1;` : null"
      :title="folder.name"
   >
      <Draggable
         class="folder-container"
         :item-key="((item: string) => localList.indexOf(item))"
         :class="[{'opened': isOpen}]"
         :style="[`background: ${folder.color};`, isOpen ? `max-height: ${60*(folder.connections.length+1)}px` : 'max-height: 60px']"
         :list="localList"
         ghost-class="ghost"
         :group="{ name: 'connections' }"
      >
         <template #header>
            <div
               v-if="!isOpen"
               class="folder-overlay"
               @click="isOpen = true"
            />
            <div
               v-if="isOpen"
               class="folder-icon"
               :style="`color: ${folder.color};`"
               @click="isOpen = false"
            >
               <i class="folder-icon-open mdi mdi-folder-open mdi-36px" />
               <i class="folder-icon-close mdi mdi-folder mdi-36px" />
            </div>
         </template>
         <template #item="{ element }">
            <div
               :key="element"
               class="folder-element"

               :class="{ 'selected': element === selectedWorkspace }"
               @click="emit('select-workspace', element)"
            >
               <i
                  class="folder-element-icon dbi"
                  :class="[`dbi-${getConnectionByUid(element).client}`, getStatusBadge(getConnectionByUid(element).uid)]"
               />
               <small v-if="isOpen" class="folder-element-name">{{ getConnectionName(element) }}</small>
            </div>
         </template>
      </Draggable>
      <SettingBarConnections
         v-if="draggedElement && !foldersUid.includes(draggedElement)"
         class="drag-area"
         :class="[{'folder-preview': coveredElement === folder.uid && draggedElement !== coveredElement}]"
         :list="dummyNested"
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
const { getConnectionByUid, getConnectionName, addToFolder } = connectionsStore;

const props = defineProps({
   folder: {
      type: Object as PropType<SidebarElement>,
      required: true
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

const emit = defineEmits(['covered', 'uncovered', 'select-workspace', 'folder-sort']);

const isOpen = ref(false);
const localList = ref(props.folder.connections);
const dummyNested = ref([]);

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

watch(() => dummyNested.value.length, () => {
   dummyNested.value = [];
});

watch(localList, () => {
   emit('folder-sort');
}, { deep: true });

</script>
<style lang="scss" scoped>
.folder-container{
   display: grid;
   grid-template-columns: auto auto;
   grid-template-rows: 50%;
   gap: 4px;
   padding: 4px;
   height: 100%;
   width: 100%;
   border-radius: 15px;
   overflow: hidden;
   transition: background .3s;

   &.opened {
      gap: 4px 6px;
      grid-template-columns: auto;
      grid-template-rows: auto;
      background: rgba($color: #fff, $alpha: 0.1)!important;
      transition: max-height .3s;

      .folder-element {
         opacity: .6;
         height: 2.5rem;
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
      margin-bottom: 3px;
      position: relative;
      transition: opacity .2s;

      &:hover, &.selected {
         opacity: 1;
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
         line-height: 1;
      }
   }

   &:not(.opened){
      .folder-element {

         .folder-element-icon {
            width: 21px;
            height: 21px;
         }
      }
   }
}
</style>
