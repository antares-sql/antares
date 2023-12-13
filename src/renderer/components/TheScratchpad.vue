<template>
   <ConfirmModal
      :confirm-text="t('application.update')"
      :cancel-text="t('general.close')"
      size="medium"
      :hide-footer="true"
      :disable-autofocus="true"
      @hide="hideScratchpad"
   >
      <template #header>
         <div class="d-flex">
            <BaseIcon
               icon-name="mdiNotebookOutline"
               class="mr-1"
               :size="24"
            /> {{ t('application.note', 2) }}
         </div>
      </template>
      <template #body>
         <div class="p-relative">
            <div class="d-flex p-vcentered" style="gap: 0 10px">
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
                     :class="[selectedTab === tag.code ? 'btn-primary': 'btn-dark']"
                     @click="selectedTab = tag.code"
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
                  v-if="filteredNotes.length"
                  ref="searchForm"
                  class="form-group has-icon-right m-0"
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
               v-if="connectionNotes.length"
               ref="tableWrapper"
               class="vscroll px-1"
               :style="{'height': resultsSize+'px'}"
            >
               <div ref="table">
                  <BaseVirtualScroll
                     ref="resultTable"
                     :items="filteredNotes"
                     :item-height="66"
                     :visible-height="resultsSize"
                     :scroll-element="scrollElement"
                  >
                     <template #default="{ items }">
                        <div
                           v-for="note in items"
                           :key="note.uid"
                           class="tile my-2"
                           tabindex="0"
                        >
                           <div class="tile-icon">
                              <BaseIcon
                                 icon-name="mdiCodeTags"
                                 class="pr-1"
                                 :size="24"
                              />
                           </div>
                           <div class="tile-content">
                              <div class="tile-title">
                                 <code
                                    class="cut-text"
                                    :title="note.note"
                                    v-html="highlightWord(note.note)"
                                 />
                              </div>
                              <div class="tile-bottom-content">
                                 <!-- <small class="tile-subtitle">{{ query.schema }} · {{ formatDate(query.date) }}</small>
                                 <div class="tile-history-buttons">
                                    <button class="btn btn-link pl-1" @click.stop="$emit('select-query', query.sql)">
                                       <BaseIcon
                                          icon-name="mdiOpenInApp"
                                          class="pr-1"
                                          :size="22"
                                       /> {{ t('general.select') }}
                                    </button>
                                    <button class="btn btn-link pl-1" @click="copyQuery(query.sql)">
                                       <BaseIcon
                                          icon-name="mdiContentCopy"
                                          class="pr-1"
                                          :size="22"
                                       /> {{ t('general.copy') }}
                                    </button>
                                    <button class="btn btn-link pl-1" @click="deleteQuery(query)">
                                       <BaseIcon
                                          icon-name="mdiDeleteForever"
                                          class="pr-1"
                                          :size="22"
                                       /> {{ t('general.delete') }}
                                    </button>
                                 </div> -->
                              </div>
                           </div>
                        </div>
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
               class="btn btn-primary p-0 add-button p-absolute tooltip tooltip-left"
               :data-tooltip="t('application.addNote')"
               @click="isAddModal = true"
            >
               <BaseIcon
                  icon-name="mdiPlus"
                  :size="48"
               />
            </div>
         </div>
      </template>
   </ConfirmModal>
   <ModalNewNote v-if="isAddModal" @hide="isAddModal = false" />
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
   ref
} from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import BaseVirtualScroll from '@/components/BaseVirtualScroll.vue';
import ModalNewNote from '@/components/ModalNewNote.vue';
import { useApplicationStore } from '@/stores/application';
import { useConnectionsStore } from '@/stores/connections';
import { TagCode, useScratchpadStore } from '@/stores/scratchpad';

const { t } = useI18n();

const applicationStore = useApplicationStore();
const scratchpadStore = useScratchpadStore();

const { connectionNotes } = storeToRefs(scratchpadStore);
const { changeNotes } = scratchpadStore;
const { hideScratchpad } = applicationStore;
const { getConnectionName } = useConnectionsStore();
const { connections } = storeToRefs(useConnectionsStore());

const localConnection = ref(null);
const table: Ref<HTMLDivElement> = ref(null);
const resultTable: Ref<Component & { updateWindow: () => void }> = ref(null);
const tableWrapper: Ref<HTMLDivElement> = ref(null);
const searchForm: Ref<HTMLInputElement> = ref(null);
const resultsSize = ref(1000);
const localNotes = ref(connectionNotes.value);
const searchTermInterval: Ref<NodeJS.Timeout> = ref(null);
const scrollElement: Ref<HTMLDivElement> = ref(null);
const searchTerm = ref('');
const localSearchTerm = ref('');
const showArchived = ref(false);
const isAddModal = ref(false);
const isEditModal = ref(false);
const selectedTab = ref('all');

const noteTags: ComputedRef<{code: TagCode; name: string}[]> = computed(() => [
   { code: 'note', name: t('application.note') },
   { code: 'todo', name: 'TODO' },
   { code: 'query', name: 'Query' }
]);
const filteredNotes = computed(() => localNotes.value);
const connectionOptions = computed(() => {
   return [
      { code: null, name: t('general.all') },
      ...connections.value.map(c => ({ code: c.uid, name: getConnectionName(c.uid) }))
   ];
});

provide('noteTags', noteTags);
provide('connectionOptions', connectionOptions);

const resizeResults = () => {
   if (resultTable.value) {
      const el = tableWrapper.value.parentElement;

      if (el)
         resultsSize.value = el.offsetHeight - searchForm.value.offsetHeight;

      resultTable.value.updateWindow();
   }
};

const refreshScroller = () => resizeResults();

const highlightWord = (string: string) => {
   string = string.replaceAll('<', '&lt;').replaceAll('>', '&gt;');

   if (searchTerm.value) {
      const regexp = new RegExp(`(${searchTerm.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return string.replace(regexp, '<span class="text-primary text-bold">$1</span>');
   }
   else
      return string;
};

onUpdated(() => {
   if (table.value)
      refreshScroller();

   if (tableWrapper.value)
      scrollElement.value = tableWrapper.value;
});

onMounted(() => {
   resizeResults();
   window.addEventListener('resize', resizeResults);
});

onBeforeUnmount(() => {
   window.removeEventListener('resize', resizeResults);
   clearInterval(searchTermInterval.value);
});

</script>

<style lang="scss" scoped>
.add-button{
   bottom: 15px;
   right: 0;
   border: none;
   height: 48px;
   width: 48px;
   border-radius: 50%;
}
.archived-button {
   border-radius: 50%;
   width: 36px;
   height: 36px;
}
</style>
