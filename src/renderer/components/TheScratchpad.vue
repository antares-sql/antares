<template>
   <Teleport to="#window-content">
      <div class="modal active">
         <a class="modal-overlay" @click.stop="hideScratchpad" />
         <div ref="trapRef" class="modal-container p-0 pb-4">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <BaseIcon
                        icon-name="mdiNotebookOutline"
                        class="mr-1"
                        :size="24"
                     />
                     <span>{{ t('application.note', 2) }}</span>
                  </div>
               </div>
               <a class="btn btn-clear c-hand" @click.stop="hideScratchpad" />
            </div>
            <div class="modal-body p-0 workspace-query-results">
               <div
                  ref="noteFilters"
                  class="d-flex p-vcentered p-2"
                  style="gap: 0 10px"
               >
                  <div style="flex: 1;">
                     <BaseSelect
                        v-model="localConnection"
                        class="form-select"
                        :options="connectionOptions"
                        option-track-by="code"
                        option-label="name"
                        @change="null"
                     />
                  </div>
                  <div class="btn-group btn-group-block text-uppercase">
                     <div
                        v-for="tag in [{ code: 'all', name: t('general.all') }, ...noteTags]"
                        :key="tag.code"
                        class="btn"
                        :class="[selectedTag === tag.code ? 'btn-primary': 'btn-dark']"
                        @click="setTag(tag.code)"
                     >
                        {{ tag.name }}
                     </div>
                  </div>
                  <div class="">
                     <div
                        class="btn px-1 tooltip tooltip-left s-rounded archived-button"
                        :class="[showArchived ? 'btn-primary' : 'btn-link']"
                        :data-tooltip="showArchived ? t('application.hideArchivedNotes') : t('application.showArchivedNotes')"
                        @click="showArchived = !showArchived"
                     >
                        <BaseIcon
                           :icon-name="!showArchived ? 'mdiArchiveEyeOutline' : 'mdiArchiveCancelOutline'"
                           class=""
                           :size="24"
                        />
                     </div>
                  </div>
               </div>
               <div>
                  <div
                     v-show="filteredNotes.length || searchTerm.length"
                     ref="searchForm"
                     class="form-group has-icon-right m-0 p-2"
                  >
                     <input
                        v-model="searchTerm"
                        class="form-input"
                        type="text"
                        :placeholder="t('general.search')"
                     >
                     <BaseIcon
                        v-if="!searchTerm"
                        icon-name="mdiMagnify"
                        class="form-icon pr-2"
                        :size="18"
                     />
                     <BaseIcon
                        v-else
                        icon-name="mdiBackspace"
                        class="form-icon c-hand pr-2"
                        :size="18"
                        @click="searchTerm = ''"
                     />
                  </div>
               </div>

               <div
                  v-if="filteredNotes.length"
                  ref="tableWrapper"
                  class="vscroll px-2"
                  :style="{'height': resultsSize+'px'}"
               >
                  <div ref="table">
                     <BaseVirtualScroll
                        ref="resultTable"
                        :items="filteredNotes"
                        :item-height="83"
                        :visible-height="resultsSize"
                        :scroll-element="scrollElement"
                     >
                        <template #default="{ items }">
                           <ScratchpadNote
                              v-for="note in items"
                              :key="note.uid"
                              :search-term="searchTerm"
                              :note="note"
                              :selected-note="selectedNote"
                              @select-note="selectedNote = note.uid"
                              @toggle-note="toggleNote"
                              @edit-note="startEditNote(note)"
                              @delete-note="deleteNote"
                              @archive-note="archiveNote"
                              @restore-note="restoreNote"
                           />
                        </template>
                     </BaseVirtualScroll>
                  </div>
               </div>
               <div v-else class="empty">
                  <div class="empty-icon">
                     <BaseIcon icon-name="mdiNoteSearch" :size="48" />
                  </div>
                  <p class="empty-title h5">
                     {{ t('application.thereAreNoNotesYet') }}
                  </p>
               </div>
               <div
                  class="btn btn-primary p-0 add-button tooltip tooltip-left"
                  :data-tooltip="t('application.addNote')"
                  @click="isAddModal = true"
               >
                  <BaseIcon
                     icon-name="mdiPlus"
                     :size="48"
                  />
               </div>
            </div>
         </div>
      </div>
   </Teleport>
   <ModalNoteNew v-if="isAddModal" @hide="isAddModal = false" />
   <ModalNoteEdit
      v-if="isEditModal"
      :note="noteToEdit"
      @hide="closeEditModal"
   />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import {
   Component,
   computed,
   ComputedRef,
   onBeforeUnmount,
   onMounted,
   onUpdated,
   provide,
   Ref,
   ref,
   watch
} from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import BaseVirtualScroll from '@/components/BaseVirtualScroll.vue';
import ModalNoteEdit from '@/components/ModalNoteEdit.vue';
import ModalNoteNew from '@/components/ModalNoteNew.vue';
import ScratchpadNote from '@/components/ScratchpadNote.vue';
import { useApplicationStore } from '@/stores/application';
import { useConnectionsStore } from '@/stores/connections';
import { ConnectionNote, TagCode, useScratchpadStore } from '@/stores/scratchpad';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

const applicationStore = useApplicationStore();
const scratchpadStore = useScratchpadStore();

const { connectionNotes } = storeToRefs(scratchpadStore);
const { changeNotes } = scratchpadStore;
const { hideScratchpad } = applicationStore;
const { getConnectionName } = useConnectionsStore();
const { connections } = storeToRefs(useConnectionsStore());
const { getSelected: selectedWorkspace } = storeToRefs(useWorkspacesStore());

const localConnection = ref(null);
const table: Ref<HTMLDivElement> = ref(null);
const resultTable: Ref<Component & { updateWindow: () => void }> = ref(null);
const tableWrapper: Ref<HTMLDivElement> = ref(null);
const noteFilters: Ref<HTMLInputElement> = ref(null);
const searchForm: Ref<HTMLInputElement> = ref(null);
const resultsSize = ref(1000);
const searchTermInterval: Ref<NodeJS.Timeout> = ref(null);
const scrollElement: Ref<HTMLDivElement> = ref(null);
const searchTerm = ref('');
const localSearchTerm = ref('');
const showArchived = ref(false);
const isAddModal = ref(false);
const isEditModal = ref(false);
const noteToEdit: Ref<ConnectionNote> = ref(null);
const selectedTag = ref('all');
const selectedNote = ref(null);

const noteTags: ComputedRef<{code: TagCode; name: string}[]> = computed(() => [
   { code: 'note', name: t('application.note') },
   { code: 'todo', name: 'TODO' },
   { code: 'query', name: 'Query' }
]);
const filteredNotes = computed(() => connectionNotes.value.filter(n => (
   (n.type === selectedTag.value || selectedTag.value === 'all') &&
   (n.cUid === localConnection.value || localConnection.value === null) &&
   (!n.isArchived || showArchived.value) &&
   (n.note.toLowerCase().search(localSearchTerm.value.toLowerCase()) >= 0)
)));
const connectionOptions = computed(() => {
   return [
      { code: null, name: t('general.all') },
      ...connections.value.map(c => ({ code: c.uid, name: getConnectionName(c.uid) }))
   ];
});

provide('noteTags', noteTags);
provide('connectionOptions', connectionOptions);
provide('selectedConnection', localConnection);
provide('selectedTag', selectedTag);

const resizeResults = () => {
   if (resultTable.value) {
      const el = tableWrapper.value.parentElement;

      if (el)
         resultsSize.value = el.offsetHeight - searchForm.value.offsetHeight - noteFilters.value.offsetHeight;

      resultTable.value.updateWindow();
   }
};

const refreshScroller = () => resizeResults();

const setTag = (tag: string) => {
   selectedTag.value = tag;
};

const toggleNote = (uid: string) => {
   selectedNote.value = selectedNote.value !== uid ? uid : null;
};

const startEditNote = (note: ConnectionNote) => {
   isEditModal.value = true;
   noteToEdit.value = note;
};

const archiveNote = (uid: string) => {
   const remappedNotes = connectionNotes.value.map(n => {
      if (n.uid === uid)
         n.isArchived = true;
      return n;
   });
   changeNotes(remappedNotes);
};

const restoreNote = (uid: string) => {
   const remappedNotes = connectionNotes.value.map(n => {
      if (n.uid === uid)
         n.isArchived = false;
      return n;
   });
   changeNotes(remappedNotes);
};

const deleteNote = (uid: string) => {
   const otherNotes = connectionNotes.value.filter(n => n.uid !== uid);
   changeNotes(otherNotes);
};

const closeEditModal = () => {
   isEditModal.value = false;
   noteToEdit.value = null;
};

watch(searchTerm, () => {
   clearTimeout(searchTermInterval.value);

   searchTermInterval.value = setTimeout(() => {
      localSearchTerm.value = searchTerm.value;
   }, 200);
});

onUpdated(() => {
   if (table.value)
      refreshScroller();

   if (tableWrapper.value)
      scrollElement.value = tableWrapper.value;
});

onMounted(() => {
   resizeResults();
   window.addEventListener('resize', resizeResults);

   if (selectedWorkspace.value && selectedWorkspace.value !== 'NEW')
      localConnection.value = selectedWorkspace.value;
});

onBeforeUnmount(() => {
   window.removeEventListener('resize', resizeResults);
   clearInterval(searchTermInterval.value);
});

</script>

<style lang="scss" scoped>
.vscroll {
  height: 1000px;
  overflow: auto;
  overflow-anchor: none;
}

.add-button{
   border: none;
   height: 48px;
   width: 48px;
   border-radius: 50%;
   position: fixed;
   margin-top: -40px;
   margin-left: 580px;
   z-index: 9;
}
.archived-button {
   border-radius: 50%;
   width: 36px;
   height: 36px;
}
</style>
