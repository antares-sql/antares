<template>
   <Draggable
      :list="localList"
      item-key="'uid'"
      ghost-class="ghost"
      :group="{ name: 'connections', pull: 'clone' }"
      :swap-threshold="0.3"
      @start="emit('start', $event)"
      @end="emit('end', $event)"
      @change="emit('update:modelValue', localList)"
   >
      <template #item="{ element }">
         <li
            v-if="element.isFolder || !folderedConnections.includes(element.uid)"
            :draggable="true"
            :class="{'folder': element.isFolder}"
            @dragstart="draggedElement = element.uid"
            @dragend="dragEnd"
            @contextmenu.prevent="emit('context', $event, element)"
         >
            <div
               v-if="!element.isFolder && !folderedConnections.includes(element.uid)"
               v-tooltip="{
                  strategy: 'fixed',
                  placement: 'right',
                  content: getConnectionName(element.uid)
               }"
               class="settingbar-element btn btn-link"
               :class="{ 'selected': element.uid === selectedWorkspace }"
               placement="right"
               strategy="fixed"
               @click.stop="selectWorkspace(element.uid)"
            >
               <!-- Creates a new folder -->
               <SettingBarConnections
                  v-if="draggedElement && !foldersUid.includes(draggedElement)"
                  class="drag-area"
                  :class="[{'folder-preview': coveredElement === element.uid && draggedElement !== coveredElement}]"
                  :list="dummyNested"
                  @dragenter="coveredElement = element.uid"
                  @dragleave="coveredElement = false"
                  @change="createFolder"
               />
               <i v-if="coveredElement === element.uid && draggedElement !== coveredElement" class="settingbar-element-icon mdi mdi-folder-plus mdi-36px" />
               <template v-else>
                  <div class="settingbar-element-icon-wrapper">
                     <i
                        class="settingbar-element-icon dbi"
                        :class="[element.icon ? `mdi ${element.icon} mdi-36px`: `dbi-${element.client}`, getStatusBadge(element.uid)]"
                     />
                     <small class="settingbar-element-name">{{ element.name || getConnectionName(element.uid) }}</small>
                  </div>
               </template>
            </div>
            <SettingBarConnectionsFolder
               v-else-if="element.isFolder"
               :key="`${element.uid}-${element.connections.length}`"
               :folder="element"
               :covered-element="coveredElement"
               :dragged-element="draggedElement"
               :folder-drag="folderDrag"
               @select-workspace="selectWorkspace"
               @covered="coveredElement = element.uid"
               @uncovered="coveredElement = false"
               @folder-sort="emit('update:modelValue', localList)"
               @folder-drag="folderDrag = $event"
               @context="emit('context', $event.event, $event.content)"
            />
         </li>
      </template>
   </Draggable>
</template>
<script setup lang="ts">
import { computed, PropType, Ref, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import * as Draggable from 'vuedraggable';
import { SidebarElement, useConnectionsStore } from '@/stores/connections';
import { useWorkspacesStore } from '@/stores/workspaces';
import SettingBarConnectionsFolder from '@/components/SettingBarConnectionsFolder.vue';

const workspacesStore = useWorkspacesStore();
const connectionsStore = useConnectionsStore();

const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);
const { getFolders: folders } = storeToRefs(connectionsStore);

const { getWorkspace, selectWorkspace } = workspacesStore;
const { getConnectionName, addFolder } = connectionsStore;

const props = defineProps({
   modelValue: {
      type: Array as PropType<SidebarElement[]>,
      default: () => []
   }
});

const emit = defineEmits(['start', 'end', 'move', 'context', 'update:modelValue']);

const localList = ref(props.modelValue);
const dummyNested = ref([]);
const draggedElement: Ref<string | false> = ref(false);
const coveredElement: Ref<string | false> = ref(false);
const folderDrag = ref(false);

const foldersUid = computed(() => folders.value.reduce<string[]>((acc, curr) => {
   acc.push(curr.uid);
   return acc;
}, []));
const folderedConnections = computed(() => {
   return folders.value.reduce<string[]>((acc, curr) => {
      acc = [...acc, ...curr.connections];
      return acc;
   }, []);
});

const dragEnd = () => {
   coveredElement.value = false;
   draggedElement.value = false;
};

const createFolder = ({ added }: {added: { element: SidebarElement }}) => {
   if (typeof coveredElement.value === 'string' && !added.element.isFolder) {
      // Create folder
      addFolder({
         after: coveredElement.value,
         connections: [coveredElement.value, added.element.uid]
      });

      coveredElement.value = false;
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

watch(() => props.modelValue, (value) => {
   localList.value = value;
   folderDrag.value = false;// Prenent some edge cases
});

</script>
<style lang="scss">
.drag-area {
  background-color: transparent;
  z-index: 10;
  position: absolute;
  left: 20px;
  top: 20px;
  right: 20px;
  bottom: 20px;
  transition: all .2s;

  &.folder-preview {
      border: 2px dotted;
      border-radius: 15px;
      left: 5px;
      top: 5px;
      right: 5px;
      bottom: 5px;
  }

   li {
      display: none!important;
   }
}

.ghost:not(.folder) {
   height: $settingbar-width;
   display: flex;
   align-items: center;
   justify-content: center;
   padding: 4px;
   position: relative;
   transition: opacity .2s;

   .settingbar-element {
      border-radius: 15px!important;
      background: rgba($color: #fff, $alpha: 0.1);

      .settingbar-element-name {
         position: absolute;
         bottom: 5px;
         left: 3px!important;
         text-align: center!important;
         font-size: 65%;
         font-style: normal;
         display: block;
         overflow: hidden;
         white-space: nowrap;
         text-overflow: ellipsis;
         line-height: 1;
      }
   }
}

.settingbar-element-icon {
   display: flex;
   color: $body-font-color-dark;
}
</style>
