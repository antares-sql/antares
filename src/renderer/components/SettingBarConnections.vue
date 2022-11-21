<template>
   <Draggable
      :list="localList"
      item-key="'uid'"
      ghost-class="ghost"
      :group="{ name: 'connections', pull: 'clone' }"
      class="pb-1"
      :swap-threshold="0.3"
      @start="emit('start', $event)"
      @end="emit('end', $event)"
      @move="emit('move', $event)"
      @change="emit('update:modelValue', localList)"
   >
      <template #item="{ element }">
         <li
            v-if="element.isFolder || !folderedConnections.includes(element.uid)"
            :draggable="true"
            class="settingbar-element btn btn-link"
            :class="{ 'selected': element.uid === selectedWorkspace }"
            @dragstart="draggedElement = element.uid"
            @dragend="coveredElement = false"
            @contextmenu.prevent="emit('context', $event, element)"
         >
            <div
               v-if="!element.isFolder && !folderedConnections.includes(element.uid)"
               class="p-relative"
               :style="`
                  width: 100%;
                  height: 100%;
                  display: flex;
                  align-items: center;
               `"
               :title="getConnectionName(element.uid)"
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
               <i
                  class="settingbar-element-icon dbi"
                  :class="[`dbi-${element.client}`, getStatusBadge(element.uid)]"
               />
               <small class="settingbar-element-name">{{ getConnectionName(element.uid) }}</small>
            </div>
            <div
               v-else-if="element.isFolder"
               class="p-relative"
               :style="`
                  width: 100%;
                  height: 100%;
                  display: flex;
                  align-items: center;
               `"
            >
               <i class="settingbar-element-icon mdi mdi-folder mdi-36px" />
               <small class="settingbar-element-name">{{ element.name }}</small>
            </div>
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

const createFolder = ({ added }: {added: { element: SidebarElement }}) => {
   if (typeof coveredElement.value === 'string' && !added.element.isFolder) {
      console.log('added', added.element);
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
});

</script>
<style scoped lang="scss">
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
   border: 1px dashed;
   border-radius: 5px;
   left: 5px;
   top: 5px;
   right: 5px;
   bottom: 5px;
  }

   li {
      display: none!important;
   }
}
</style>
