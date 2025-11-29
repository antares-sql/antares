<template>
   <div class="workspace-saved-queries">
      <details
         ref="accordion"
         class="accordion"
         :open="isExpanded"
      >
         <summary
            class="accordion-header saved-queries-header"
            @click.prevent="toggleExpanded"
            @contextmenu.prevent="showHeaderContext"
         >
            <BaseIcon
               class="icon"
               icon-name="mdiChevronRight"
               :size="18"
            />
            <BaseIcon
               class="mr-1"
               icon-name="mdiBookmarkMultiple"
               :size="18"
            />
            <span class="saved-queries-title">{{ t('database.savedQueries') }}</span>
            <span v-if="queryCount > 0" class="saved-queries-count">({{ queryCount }})</span>
            <div class="saved-queries-tools">
               <BaseIcon
                  v-tooltip="{
                     strategy: 'fixed',
                     content: t('database.createNewQuery')
                  }"
                  class="c-hand"
                  icon-name="mdiPlus"
                  :size="16"
                  @click.stop.prevent="createNewQuery"
               />
            </div>
         </summary>
         <div class="accordion-body">
            <div v-if="queryCount === 0 && folderCount === 0" class="empty-state">
               <small>{{ t('database.noSavedQueries') }}</small>
            </div>
            <ul v-else class="menu menu-nav pt-0 saved-queries-list">
               <WorkspaceExploreSavedQueriesFolder
                  v-for="folder in rootFolders"
                  :key="folder.uid"
                  :folder="folder"
                  :connection-uid="connectionUid"
                  :depth="0"
                  @open-query="openQuery"
                  @run-query="runQuery"
                  @show-folder-context="showFolderContext"
                  @show-query-context="showQueryContext"
               />
               <WorkspaceExploreSavedQueriesItem
                  v-for="query in rootQueries"
                  :key="query.uid"
                  :query="query"
                  :connection-uid="connectionUid"
                  @open-query="openQuery"
                  @run-query="runQuery"
                  @show-context="showQueryContext"
               />
            </ul>
         </div>
      </details>

      <BaseContextMenu
         v-if="isHeaderContext"
         :context-event="contextEvent"
         @close-context="closeContext"
      >
         <div class="context-element" @click="createNewQuery">
            <span class="d-flex">
               <BaseIcon
                  class="text-light mt-1 mr-1"
                  icon-name="mdiCodeBrackets"
                  :size="18"
               /> {{ t('database.newQuery') }}</span>
         </div>
         <div class="context-element" @click="createNewFolder">
            <span class="d-flex">
               <BaseIcon
                  class="text-light mt-1 mr-1"
                  icon-name="mdiFolderPlus"
                  :size="18"
               /> {{ t('database.newFolder') }}</span>
         </div>
      </BaseContextMenu>

      <BaseContextMenu
         v-if="isFolderContext && selectedFolder"
         :context-event="contextEvent"
         @close-context="closeContext"
      >
         <div class="context-element" @click="createQueryInFolder">
            <span class="d-flex">
               <BaseIcon
                  class="text-light mt-1 mr-1"
                  icon-name="mdiCodeBrackets"
                  :size="18"
               /> {{ t('database.newQuery') }}</span>
         </div>
         <div
            v-if="canAddSubfolder"
            class="context-element"
            @click="createSubfolder"
         >
            <span class="d-flex">
               <BaseIcon
                  class="text-light mt-1 mr-1"
                  icon-name="mdiFolderPlus"
                  :size="18"
               /> {{ t('database.newSubfolder') }}</span>
         </div>
         <div class="context-element" @click="startRenameFolder">
            <span class="d-flex">
               <BaseIcon
                  class="text-light mt-1 mr-1"
                  icon-name="mdiRenameBox"
                  :size="18"
               /> {{ t('general.rename') }}</span>
         </div>
         <div class="context-element-divider" />
         <div class="context-element" @click="confirmDeleteFolder">
            <span class="d-flex">
               <BaseIcon
                  class="text-light mt-1 mr-1"
                  icon-name="mdiDeleteForever"
                  :size="18"
               /> {{ t('general.delete') }}</span>
         </div>
      </BaseContextMenu>

      <BaseContextMenu
         v-if="isQueryContext && selectedQuery"
         :context-event="contextEvent"
         @close-context="closeContext"
      >
         <div class="context-element" @click="runSelectedQuery">
            <span class="d-flex">
               <BaseIcon
                  class="text-light mt-1 mr-1"
                  icon-name="mdiPlay"
                  :size="18"
               /> {{ t('database.runQuery') }}</span>
         </div>
         <div class="context-element" @click="openSelectedQuery">
            <span class="d-flex">
               <BaseIcon
                  class="text-light mt-1 mr-1"
                  icon-name="mdiOpenInNew"
                  :size="18"
               /> {{ t('database.openInNewTab') }}</span>
         </div>
         <div class="context-element-divider" />
         <div class="context-element" @click="startRenameQuery">
            <span class="d-flex">
               <BaseIcon
                  class="text-light mt-1 mr-1"
                  icon-name="mdiRenameBox"
                  :size="18"
               /> {{ t('general.rename') }}</span>
         </div>
         <div class="context-element" @click="duplicateSelectedQuery">
            <span class="d-flex">
               <BaseIcon
                  class="text-light mt-1 mr-1"
                  icon-name="mdiContentDuplicate"
                  :size="18"
               /> {{ t('general.duplicate') }}</span>
         </div>
         <div class="context-element-divider" />
         <div class="context-element context-element-submenu">
            <span class="d-flex">
               <BaseIcon
                  class="text-light mt-1 mr-1"
                  icon-name="mdiFolderMove"
                  :size="18"
               /> {{ t('general.moveTo') }}</span>
            <BaseIcon
               class="submenu-arrow"
               icon-name="mdiChevronRight"
               :size="18"
            />
            <div class="context-submenu">
               <div
                  class="context-element"
                  :class="{ disabled: selectedQuery.folderId === null }"
                  @click="moveQueryToFolder(null)"
               >
                  <span class="d-flex">{{ t('general.root') }}</span>
               </div>
               <div v-if="allFolders.length" class="context-element-divider" />
               <div
                  v-for="folder in allFolders"
                  :key="folder.uid"
                  class="context-element"
                  :class="{ disabled: selectedQuery.folderId === folder.uid }"
                  @click="moveQueryToFolder(folder.uid)"
               >
                  <span class="d-flex">
                     <BaseIcon
                        class="text-light mt-1 mr-1"
                        icon-name="mdiFolder"
                        :size="18"
                     /> {{ folder.name }}</span>
               </div>
            </div>
         </div>
         <div class="context-element-divider" />
         <div class="context-element" @click="confirmDeleteQuery">
            <span class="d-flex">
               <BaseIcon
                  class="text-light mt-1 mr-1"
                  icon-name="mdiDeleteForever"
                  :size="18"
               /> {{ t('general.delete') }}</span>
         </div>
      </BaseContextMenu>

      <ConfirmModal
         v-if="isRenameModal"
         size="small"
         :confirm-text="t('general.save')"
         :cancel-text="t('general.cancel')"
         @confirm="confirmRename"
         @hide="closeRenameModal"
      >
         <template #header>
            <div class="d-flex">
               <BaseIcon
                  icon-name="mdiRenameBox"
                  class="mr-1"
                  :size="24"
               />
               <span>{{ t('general.rename') }}</span>
            </div>
         </template>
         <template #body>
            <div class="form-group">
               <input
                  ref="renameInput"
                  v-model="renameValue"
                  type="text"
                  class="form-input"
                  @keydown.enter="confirmRename"
                  @keydown.esc="closeRenameModal"
               >
            </div>
         </template>
      </ConfirmModal>

      <ConfirmModal
         v-if="isDeleteModal"
         size="small"
         :confirm-text="t('general.delete')"
         :cancel-text="t('general.cancel')"
         @confirm="confirmDelete"
         @hide="closeDeleteModal"
      >
         <template #header>
            <div class="d-flex">
               <BaseIcon
                  icon-name="mdiDeleteForever"
                  class="mr-1"
                  :size="24"
               />
               <span>{{ t('general.delete') }}</span>
            </div>
         </template>
         <template #body>
            <p>{{ deleteModalMessage }}</p>
            <div v-if="deleteType === 'folder' && folderHasContents" class="form-group mt-3">
               <label class="form-checkbox">
                  <input v-model="deleteContents" type="checkbox">
                  <i class="form-icon" />
                  <span>{{ t('database.deleteFolderContents') }}</span>
               </label>
            </div>
         </template>
      </ConfirmModal>
   </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, nextTick, PropType, Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseContextMenu from '@/components/BaseContextMenu.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import WorkspaceExploreSavedQueriesFolder from '@/components/WorkspaceExploreSavedQueriesFolder.vue';
import WorkspaceExploreSavedQueriesItem from '@/components/WorkspaceExploreSavedQueriesItem.vue';
import { useSavedQuerySync } from '@/composables/useSavedQuerySync';
import { useNotificationsStore } from '@/stores/notifications';
import { getSavedQueryMarker, QueryFolder, SavedQuery, useSavedQueriesStore } from '@/stores/savedQueries';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

const props = defineProps({
   connectionUid: {
      type: String as PropType<string>,
      required: true
   }
});

const savedQueriesStore = useSavedQueriesStore();
const workspacesStore = useWorkspacesStore();
const { addNotification } = useNotificationsStore();
const { renameQueryAndSyncTab, closeTabForQuery } = useSavedQuerySync();

const { getQueriesByConnection, getRootQueries, getRootFolders, getQueryCount } = storeToRefs(savedQueriesStore);
const { addQuery, addFolder, renameFolder, deleteQuery, deleteFolder, duplicateQuery, moveQueryToFolder: moveQuery, getFolderDepth } = savedQueriesStore;
const { getWorkspace: getWorkspaceGetter } = storeToRefs(workspacesStore);
const { newTab, selectTab } = workspacesStore;

const isExpanded = ref(true);
const accordion: Ref<HTMLDetailsElement> = ref(null);
const contextEvent: Ref<MouseEvent> = ref(null);
const isHeaderContext = ref(false);
const isFolderContext = ref(false);
const isQueryContext = ref(false);
const selectedFolder: Ref<QueryFolder | null> = ref(null);
const selectedQuery: Ref<SavedQuery | null> = ref(null);

const isRenameModal = ref(false);
const renameValue = ref('');
const renameType: Ref<'query' | 'folder'> = ref('query');
const renameInput: Ref<HTMLInputElement> = ref(null);

const isDeleteModal = ref(false);
const deleteType: Ref<'query' | 'folder'> = ref('query');
const deleteContents = ref(false);

const connectionQueries = computed(() => getQueriesByConnection.value(props.connectionUid));
const rootQueries = computed(() => getRootQueries.value(props.connectionUid));
const rootFolders = computed(() => getRootFolders.value(props.connectionUid));
const queryCount = computed(() => getQueryCount.value(props.connectionUid));
const folderCount = computed(() => connectionQueries.value.folders.length);
const allFolders = computed(() => connectionQueries.value.folders);

const canAddSubfolder = computed(() => {
   if (!selectedFolder.value) return false;
   const depth = getFolderDepth(props.connectionUid, selectedFolder.value.uid);
   return depth < 3;
});

const folderHasContents = computed(() => {
   if (!selectedFolder.value) return false;
   const queriesInFolder = connectionQueries.value.queries.filter(q => q.folderId === selectedFolder.value.uid);
   const subfoldersInFolder = connectionQueries.value.folders.filter(f => f.parentId === selectedFolder.value.uid);
   return queriesInFolder.length > 0 || subfoldersInFolder.length > 0;
});

const deleteModalMessage = computed(() => {
   if (deleteType.value === 'query' && selectedQuery.value)
      return `${t('general.deleteConfirm')} "${selectedQuery.value.name}"?`;

   if (deleteType.value === 'folder' && selectedFolder.value)
      return `${t('general.deleteConfirm')} "${selectedFolder.value.name}"?`;

   return '';
});

const toggleExpanded = () => {
   isExpanded.value = !isExpanded.value;
};

const closeContext = (clearSelection = true) => {
   isHeaderContext.value = false;
   isFolderContext.value = false;
   isQueryContext.value = false;
   if (clearSelection) {
      selectedFolder.value = null;
      selectedQuery.value = null;
   }
};

const showHeaderContext = (event: MouseEvent) => {
   closeContext();
   contextEvent.value = event;
   isHeaderContext.value = true;
};

const showFolderContext = (event: MouseEvent, folder: QueryFolder) => {
   closeContext();
   contextEvent.value = event;
   selectedFolder.value = folder;
   isFolderContext.value = true;
};

const showQueryContext = (event: MouseEvent, query: SavedQuery) => {
   closeContext();
   contextEvent.value = event;
   selectedQuery.value = query;
   isQueryContext.value = true;
};

const createNewQuery = () => {
   closeContext();
   const workspace = getWorkspaceGetter.value(props.connectionUid);
   const newQueryItem = addQuery({
      connectionUid: props.connectionUid,
      name: t('database.newQuery'),
      sql: '',
      schema: workspace?.breadcrumbs?.schema,
      database: workspace?.database
   });
   openQuery(newQueryItem);
};

const createNewFolder = () => {
   closeContext();
   addFolder({
      connectionUid: props.connectionUid,
      name: t('database.newFolder')
   });
};

const createQueryInFolder = () => {
   if (!selectedFolder.value) return;
   closeContext();
   const workspace = getWorkspaceGetter.value(props.connectionUid);
   const newQueryItem = addQuery({
      connectionUid: props.connectionUid,
      name: t('database.newQuery'),
      sql: '',
      folderId: selectedFolder.value.uid,
      schema: workspace?.breadcrumbs?.schema,
      database: workspace?.database
   });
   openQuery(newQueryItem);
};

const createSubfolder = () => {
   if (!selectedFolder.value) return;
   closeContext();
   addFolder({
      connectionUid: props.connectionUid,
      name: t('database.newFolder'),
      parentId: selectedFolder.value.uid
   });
};

const openQuery = (query: SavedQuery) => {
   if (!query || !query.uid) {
      addNotification({ status: 'error', message: 'Invalid query object' });
      return;
   }

   const workspace = getWorkspaceGetter.value(props.connectionUid);
   if (!workspace || workspace.connectionStatus !== 'connected') return;

   const savedQueryMarker = getSavedQueryMarker(query.uid);
   const existingTab = workspace.tabs.find(
      tab => tab.type === 'query' && tab.elementType === savedQueryMarker
   );

   if (existingTab) {
      selectTab({ uid: props.connectionUid, tab: existingTab.uid });
      return;
   }

   const sqlContent = query.sql || '';

   newTab({
      uid: props.connectionUid,
      type: 'query',
      content: sqlContent,
      elementName: query.name,
      elementType: savedQueryMarker,
      autorun: false,
      schema: query.schema || workspace.breadcrumbs.schema
   });
};

const runQuery = (query: SavedQuery) => {
   const workspace = getWorkspaceGetter.value(props.connectionUid);
   if (!workspace || workspace.connectionStatus !== 'connected') return;

   const savedQueryMarker = getSavedQueryMarker(query.uid);
   const existingTab = workspace.tabs.find(
      tab => tab.type === 'query' && tab.elementType === savedQueryMarker
   );

   if (existingTab) {
      selectTab({ uid: props.connectionUid, tab: existingTab.uid });
      return;
   }

   newTab({
      uid: props.connectionUid,
      type: 'query',
      content: query.sql || '',
      elementName: query.name,
      elementType: savedQueryMarker,
      autorun: true,
      schema: query.schema || workspace.breadcrumbs.schema
   });
};

const openSelectedQuery = () => {
   if (selectedQuery.value)
      openQuery(selectedQuery.value);

   closeContext();
};

const runSelectedQuery = () => {
   if (selectedQuery.value)
      runQuery(selectedQuery.value);

   closeContext();
};

const startRenameQuery = () => {
   if (!selectedQuery.value) return;
   renameType.value = 'query';
   renameValue.value = selectedQuery.value.name;
   closeContext(false);
   isRenameModal.value = true;
   nextTick(() => {
      renameInput.value?.focus();
      renameInput.value?.select();
   });
};

const startRenameFolder = () => {
   if (!selectedFolder.value) return;
   renameType.value = 'folder';
   renameValue.value = selectedFolder.value.name;
   closeContext(false);
   isRenameModal.value = true;
   nextTick(() => {
      renameInput.value?.focus();
      renameInput.value?.select();
   });
};

const confirmRename = () => {
   if (!renameValue.value.trim()) return;

   if (renameType.value === 'query' && selectedQuery.value) {
      renameQueryAndSyncTab(
         props.connectionUid,
         selectedQuery.value.uid,
         renameValue.value.trim()
      );
   }
   else if (renameType.value === 'folder' && selectedFolder.value) {
      renameFolder({
         connectionUid: props.connectionUid,
         folderUid: selectedFolder.value.uid,
         name: renameValue.value.trim()
      });
   }

   closeRenameModal();
};

const closeRenameModal = () => {
   isRenameModal.value = false;
   renameValue.value = '';
   selectedQuery.value = null;
   selectedFolder.value = null;
};

const duplicateSelectedQuery = () => {
   if (selectedQuery.value) {
      duplicateQuery({
         connectionUid: props.connectionUid,
         queryUid: selectedQuery.value.uid
      });
   }
   closeContext();
};

const moveQueryToFolder = (folderId: string | null) => {
   if (selectedQuery.value && selectedQuery.value.folderId !== folderId) {
      moveQuery({
         connectionUid: props.connectionUid,
         queryUid: selectedQuery.value.uid,
         folderId
      });
   }
   closeContext();
};

const confirmDeleteQuery = () => {
   deleteType.value = 'query';
   deleteContents.value = false;
   closeContext(false);
   isDeleteModal.value = true;
};

const confirmDeleteFolder = () => {
   deleteType.value = 'folder';
   deleteContents.value = false;
   closeContext(false);
   isDeleteModal.value = true;
};

const confirmDelete = () => {
   if (deleteType.value === 'query' && selectedQuery.value) {
      closeTabForQuery(props.connectionUid, selectedQuery.value.uid);
      deleteQuery({
         connectionUid: props.connectionUid,
         queryUid: selectedQuery.value.uid
      });
   }
   else if (deleteType.value === 'folder' && selectedFolder.value) {
      deleteFolder({
         connectionUid: props.connectionUid,
         folderUid: selectedFolder.value.uid,
         deleteContents: deleteContents.value
      });
   }

   closeDeleteModal();
};

const closeDeleteModal = () => {
   isDeleteModal.value = false;
   selectedQuery.value = null;
   selectedFolder.value = null;
   deleteContents.value = false;
};

defineExpose({
   openQuery,
   runQuery
});
</script>

<style lang="scss" scoped>
.workspace-saved-queries {

   .saved-queries-header {
      display: flex;
      align-items: center;
      padding: 0.25rem 0.4rem;
      cursor: pointer;
      user-select: none;

      &:hover {
         background: var(--bg-color-light-dark);
      }

      .icon {
         transition: transform 0.2s;
         min-width: 18px;
      }

      .saved-queries-title {
         font-weight: 600;
         font-size: 0.7rem;
         text-transform: uppercase;
      }

      .saved-queries-count {
         font-size: 0.65rem;
         opacity: 0.7;
         margin-left: 0.25rem;
      }

      .saved-queries-tools {
         margin-left: auto;
         display: flex;
         align-items: center;
         opacity: 0;
         transition: opacity 0.2s;

         svg {
            opacity: 0.6;
            transition: opacity 0.2s;

            &:hover {
               opacity: 1;
            }
         }
      }

      &:hover .saved-queries-tools {
         opacity: 1;
      }
   }

   .accordion[open] > .saved-queries-header .icon {
      transform: rotate(90deg);
   }

   .empty-state {
      padding: 0.5rem 1rem;
      opacity: 0.6;
      font-style: italic;
   }

   .saved-queries-list {
      padding-left: 0.25rem;
   }
}

.context-element-submenu {
   .submenu-arrow {
      margin-left: auto;
   }
}
</style>
