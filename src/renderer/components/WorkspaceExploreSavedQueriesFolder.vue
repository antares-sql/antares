<template>
   <li class="menu-item saved-query-folder" :style="{ paddingLeft: `${depth * 12}px` }">
      <div class="accordion folder-accordion" :class="{ 'open': folder.isExpanded }">
         <div
            class="folder-header"
            @click="toggleFolder"
            @dblclick.prevent="startRename"
            @contextmenu.prevent="showContext"
         >
            <BaseIcon
               class="folder-caret"
               icon-name="mdiChevronRight"
               :size="14"
            />
            <BaseIcon
               v-if="folder.isExpanded"
               class="folder-icon mr-1"
               icon-name="mdiFolderOpen"
               :size="16"
            />
            <BaseIcon
               v-else
               class="folder-icon mr-1"
               icon-name="mdiFolder"
               :size="16"
            />
            <span v-if="!isRenaming" class="folder-name">{{ folder.name }}</span>
            <input
               v-else
               ref="renameInput"
               v-model="renameValue"
               type="text"
               class="form-input input-sm folder-rename-input"
               @blur="confirmRename"
               @keydown.enter="confirmRename"
               @keydown.esc="cancelRename"
               @keydown.stop
               @keypress.stop
               @click.stop
               @dblclick.stop
            >
         </div>
         <div v-show="folder.isExpanded" class="accordion-body folder-contents">
            <WorkspaceExploreSavedQueriesFolder
               v-for="subfolder in subfolders"
               :key="subfolder.uid"
               :folder="subfolder"
               :connection-uid="connectionUid"
               :depth="depth + 1"
               @open-query="handleOpenQuery"
               @run-query="handleRunQuery"
               @show-folder-context="handleShowFolderContext"
               @show-query-context="handleShowQueryContext"
            />
            <WorkspaceExploreSavedQueriesItem
               v-for="query in queriesInFolder"
               :key="query.uid"
               :query="query"
               :connection-uid="connectionUid"
               :depth="depth + 1"
               @open-query="handleOpenQuery"
               @run-query="handleRunQuery"
               @show-context="handleShowQueryContext"
            />
         </div>
      </div>
   </li>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, nextTick, PropType, Ref, ref } from 'vue';

import BaseIcon from '@/components/BaseIcon.vue';
import WorkspaceExploreSavedQueriesItem from '@/components/WorkspaceExploreSavedQueriesItem.vue';
import { QueryFolder, SavedQuery, useSavedQueriesStore } from '@/stores/savedQueries';

const props = defineProps({
   folder: {
      type: Object as PropType<QueryFolder>,
      required: true
   },
   connectionUid: {
      type: String as PropType<string>,
      required: true
   },
   depth: {
      type: Number as PropType<number>,
      default: 0
   }
});

const emit = defineEmits(['open-query', 'run-query', 'show-folder-context', 'show-query-context']);

const savedQueriesStore = useSavedQueriesStore();
const { getQueriesInFolder, getSubfolders } = storeToRefs(savedQueriesStore);
const { toggleFolderExpanded, renameFolder } = savedQueriesStore;

const isRenaming = ref(false);
const renameValue = ref('');
const renameInput: Ref<HTMLInputElement> = ref(null);

const subfolders = computed(() => getSubfolders.value(props.connectionUid, props.folder.uid));
const queriesInFolder = computed(() => getQueriesInFolder.value(props.connectionUid, props.folder.uid));

const toggleFolder = () => {
   toggleFolderExpanded({
      connectionUid: props.connectionUid,
      folderUid: props.folder.uid
   });
};

const showContext = (event: MouseEvent) => {
   emit('show-folder-context', event, props.folder);
};

const handleOpenQuery = (query: SavedQuery) => {
   emit('open-query', query);
};

const handleRunQuery = (query: SavedQuery) => {
   emit('run-query', query);
};

const handleShowFolderContext = (event: MouseEvent, folder: QueryFolder) => {
   emit('show-folder-context', event, folder);
};

const handleShowQueryContext = (event: MouseEvent, query: SavedQuery) => {
   emit('show-query-context', event, query);
};

const startRename = () => {
   renameValue.value = props.folder.name;
   isRenaming.value = true;
   nextTick(() => {
      renameInput.value?.focus();
      renameInput.value?.select();
   });
};

const confirmRename = () => {
   if (renameValue.value.trim() && renameValue.value !== props.folder.name) {
      renameFolder({
         connectionUid: props.connectionUid,
         folderUid: props.folder.uid,
         name: renameValue.value.trim()
      });
   }
   isRenaming.value = false;
};

const cancelRename = () => {
   isRenaming.value = false;
   renameValue.value = props.folder.name;
};
</script>

<style lang="scss" scoped>
.saved-query-folder {
   list-style: none;

   .folder-accordion {
      width: 100%;
   }

   .folder-header {
      display: flex;
      align-items: center;
      padding: 0.2rem 0.25rem;
      cursor: pointer;
      border-radius: $border-radius;
      user-select: none;

      &:hover {
         background: var(--bg-color-light-dark);
      }

      .folder-caret {
         transition: transform 0.2s;
         min-width: 14px;
         opacity: 0.6;
      }

      .folder-icon {
         color: var(--primary-color);
         min-width: 16px;
      }

      .folder-name {
         font-size: 0.7rem;
         white-space: nowrap;
         overflow: hidden;
         text-overflow: ellipsis;
      }

      .folder-rename-input {
         font-size: 0.7rem;
         height: 1.2rem;
         padding: 0 0.25rem;
         flex: 1;
         min-width: 0;
      }
   }

   .folder-accordion.open > .folder-header .folder-caret {
      transform: rotate(90deg);
   }

   .folder-contents {
      padding-left: 0.5rem;
   }
}
</style>
