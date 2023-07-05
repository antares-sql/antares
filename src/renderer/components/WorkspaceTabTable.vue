<template>
   <div v-show="isSelected" class="workspace-query-tab column col-12 columns col-gapless no-outline p-0">
      <div class="workspace-query-runner column col-12">
         <div class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <div class="dropdown">
                  <div class="btn-group">
                     <button
                        class="btn btn-dark btn-sm mr-0 pr-1"
                        :class="{'loading':isQuering}"
                        :title="`${t('word.refresh')}`"
                        @click="reloadTable"
                     >
                        <i v-if="!+autorefreshTimer" class="mdi mdi-24px mdi-refresh mr-1" />
                        <i v-else class="mdi mdi-24px mdi-history mdi-flip-h mr-1" />
                     </button>
                     <div class="btn btn-dark btn-sm dropdown-toggle pl-0 pr-0" tabindex="0">
                        <i class="mdi mdi-24px mdi-menu-down" />
                     </div>
                     <div class="menu px-3">
                        <span>{{ t('word.autoRefresh') }}: <b>{{ +autorefreshTimer ? `${autorefreshTimer}s` : 'OFF' }}</b></span>
                        <input
                           v-model="autorefreshTimer"
                           class="slider no-border"
                           type="range"
                           min="0"
                           max="30"
                           step="1"
                           @change="setRefreshInterval"
                        >
                     </div>
                  </div>
               </div>
               <div class="btn-group">
                  <button
                     class="btn btn-dark btn-sm mr-0"
                     :disabled="isQuering || page === 1"
                     :title="t('message.previousResultsPage')"
                     @click="pageChange('prev')"
                  >
                     <i class="mdi mdi-24px mdi-skip-previous" />
                  </button>
                  <div class="dropdown" :class="{'active': isPageMenu}">
                     <div @click="openPageMenu">
                        <div class="btn btn-dark btn-sm mr-0 no-radius dropdown-toggle text-bold px-3">
                           {{ page }}
                        </div>
                        <div class="menu px-3">
                           <span>{{ t('message.pageNumber') }}</span>
                           <input
                              ref="pageSelect"
                              v-model="pageProxy"
                              type="number"
                              min="1"
                              class="form-input"
                              @blur="setPageNumber"
                           >
                        </div>
                     </div>
                  </div>
                  <button
                     class="btn btn-dark btn-sm mr-0"
                     :disabled="isQuering || (results.length && results[0].rows.length < limit)"
                     :title="t('message.nextResultsPage')"
                     @click="pageChange('next')"
                  >
                     <i class="mdi mdi-24px mdi-skip-next" />
                  </button>
               </div>

               <div class="divider-vert py-3" />

               <button
                  class="btn btn-sm"
                  :title="t('word.filter')"
                  :disabled="isQuering"
                  :class="{'btn-primary': isSearch, 'btn-dark': !isSearch}"
                  @click="isSearch = !isSearch"
               >
                  <i class="mdi mdi-24px mdi-magnify" />
               </button>
               <button
                  v-if="isTable"
                  class="btn btn-dark btn-sm"
                  :disabled="isQuering"
                  @click="showFakerModal()"
               >
                  <i class="mdi mdi-24px mdi-playlist-plus mr-1" />
                  <span>{{ t('message.insertRow', 2) }}</span>
               </button>

               <div class="dropdown table-dropdown">
                  <button
                     :disabled="isQuering"
                     class="btn btn-dark btn-sm dropdown-toggle mr-0 pr-0"
                     tabindex="0"
                  >
                     <i class="mdi mdi-24px mdi-file-export mr-1" />
                     <span>{{ t('word.export') }}</span>
                     <i class="mdi mdi-24px mdi-menu-down" />
                  </button>
                  <ul class="menu text-left">
                     <li class="menu-item">
                        <a class="c-hand" @click="downloadTable('json')">JSON</a>
                     </li>
                     <li class="menu-item">
                        <a class="c-hand" @click="downloadTable('csv')">CSV</a>
                     </li>
                     <li class="menu-item">
                        <a class="c-hand" @click="downloadTable('php')">{{ t('message.phpArray') }}</a>
                     </li>
                     <li class="menu-item">
                        <a class="c-hand" @click="downloadTable('sql')">SQL INSERT</a>
                     </li>
                  </ul>
               </div>

               <div class="divider-vert py-3" />

               <button
                  v-if="isTable"
                  class="btn btn-dark btn-sm"
                  :disabled="isQuering"
                  :title="t('word.settings')"
                  @click="openTableSettingTab()"
               >
                  <i class="mdi mdi-24px mdi-cog" />
                  <!-- <span>{{ t('word.settings') }}</span> -->
               </button>
            </div>
            <div class="workspace-query-info">
               <div
                  v-if="results.length"
                  class="d-flex"
                  :title="t('message.queryDuration')"
               >
                  <i class="mdi mdi-timer-sand mdi-rotate-180 pr-1" /> <b>{{ results[0].duration / 1000 }}s</b>
               </div>
               <div v-if="results.length && results[0].rows">
                  {{ t('word.results') }}: <b>{{ localeString(results[0].rows.length) }}</b>
               </div>
               <div v-if="hasApproximately || (page > 1 && approximateCount)">
                  {{ t('word.total') }}: <b
                     :title="!customizations.tableRealCount ? t('word.approximately') : ''"
                  >
                     <span v-if="!customizations.tableRealCount">≈</span>
                     {{ localeString(approximateCount) }}
                  </b>
               </div>
               <div class="d-flex" :title="t('word.schema')">
                  <i class="mdi mdi-18px mdi-database mr-1" /><b>{{ schema }}</b>
               </div>
            </div>
         </div>
      </div>
      <WorkspaceTabTableFilters
         v-if="isSearch"
         :fields="fields"
         :conn-client="connection.client"
         @filter="updateFilters"
         @filter-change="onFilterChange"
      />
      <div class="workspace-query-results p-relative column col-12">
         <BaseLoader v-if="isQuering" />
         <div v-if="!isQuering && !results[0]?.rows.length" class="empty">
            <div class="empty-icon">
               <i class="mdi mdi-48px mdi-island" />
            </div>
            <p class="h4 empty-subtitle">
               {{ t('message.noResultsPresent') }}
            </p>
         </div>
         <WorkspaceTabQueryTable
            v-if="results"
            ref="queryTable"
            :results="results"
            :tab-uid="tabUid"
            :conn-uid="connection.uid"
            :is-selected="isSelected"
            mode="table"
            :element-type="elementType"
            @update-field="updateField"
            @delete-selected="deleteSelected"
            @duplicate-row="showFakerModal"
            @hard-sort="hardSort"
         />
      </div>
      <ModalFakerRows
         v-if="isFakerModal"
         :fields="fields"
         :row-to-duplicate="rowToDuplicate"
         :key-usage="keyUsage"
         :tab-uid="tabUid"
         :schema="schema"
         :table="table"
         @hide="hideFakerModal"
         @reload="reloadTable"
      />
   </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, Prop, ref, Ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import Tables from '@/ipc-api/Tables';
import { useResultTables } from '@/composables/useResultTables';
import { useNotificationsStore } from '@/stores/notifications';
import { useSettingsStore } from '@/stores/settings';
import { useWorkspacesStore } from '@/stores/workspaces';
import BaseLoader from '@/components/BaseLoader.vue';
import WorkspaceTabQueryTable from '@/components/WorkspaceTabQueryTable.vue';
import WorkspaceTabTableFilters from '@/components/WorkspaceTabTableFilters.vue';
import ModalFakerRows from '@/components/ModalFakerRows.vue';
import { ConnectionParams } from 'common/interfaces/antares';
import { TableFilterClausole } from 'common/interfaces/tableApis';
import { useFilters } from '@/composables/useFilters';
import { ipcRenderer } from 'electron';
import { table } from 'console';

const { localeString } = useFilters();

const { t } = useI18n();

const props = defineProps({
   connection: Object as Prop<ConnectionParams>,
   isSelected: Boolean,
   table: String,
   schema: String,
   elementType: String
});

const reloadTable = () => getTableData();

const {
   queryTable,
   isQuering,
   updateField,
   deleteSelected
} = useResultTables(props.connection.uid, reloadTable);

const { addNotification } = useNotificationsStore();
const settingsStore = useSettingsStore();
const workspacesStore = useWorkspacesStore();

const { dataTabLimit: limit } = storeToRefs(settingsStore);

const { changeBreadcrumbs, getWorkspace, newTab } = workspacesStore;

const pageSelect: Ref<HTMLInputElement> = ref(null);
const tabUid = ref('data');
const isPageMenu = ref(false);
const isSearch = ref(false);
const results = ref([]);
const lastTable = ref(null);
const isFakerModal = ref(false);
const autorefreshTimer = ref(0);
const refreshInterval = ref(null);
const sortParams = ref({} as { field: string; dir: 'asc' | 'desc'});
const filters = ref([]);
const page = ref(1);
const pageProxy = ref(1);
const approximateCount = ref(0);
const rowToDuplicate = ref(null);

const workspace = computed(() => {
   return getWorkspace(props.connection.uid);
});

const customizations = computed(() => {
   return workspace.value.customizations;
});

const isTable = computed(() => {
   return !workspace.value.breadcrumbs.view;
});

const fields = computed(() => {
   return results.value.length ? results.value[0].fields : [];
});

const keyUsage = computed(() => {
   return results.value.length ? results.value[0].keys : [];
});

const getTableData = async () => {
   if (!props.table || !props.isSelected || isQuering.value) return;
   isQuering.value = true;

   // if table changes clear cached values
   if (lastTable.value !== props.table)
      results.value = [];

   lastTable.value = props.table;

   const params = {
      uid: props.connection.uid,
      schema: props.schema,
      table: props.table,
      limit: limit.value,
      page: page.value,
      sortParams: { ...sortParams.value },
      where: [...filters.value] || []
   };

   try { // Table data
      const { status, response } = await Tables.getTableData(params);

      if (status === 'success')
         results.value = [response];
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   if (results.value.length && results.value[0].rows.length === limit.value) {
      try { // Table approximate count
         const { status, response } = await Tables.getTableApproximateCount(params);

         if (status === 'success')
            approximateCount.value = response;
         else
            addNotification({ status: 'error', message: response as unknown as string });
      }
      catch (err) {
         addNotification({ status: 'error', message: err.stack });
      }
   }

   isQuering.value = false;
};

const hardSort = (params: { field: string; dir: 'asc' | 'desc'}) => {
   sortParams.value = params;
   getTableData();
};

const openPageMenu = () => {
   if (isQuering.value || (results.value.length && results.value[0].rows.length < limit.value && page.value === 1)) return;

   isPageMenu.value = true;
   if (isPageMenu.value)
      setTimeout(() => pageSelect.value.focus(), 20);
};

const setPageNumber = () => {
   isPageMenu.value = false;

   if (pageProxy.value > 0)
      page.value = pageProxy.value;
   else
      pageProxy.value = page.value;
};

const pageChange = (direction: 'prev' | 'next') => {
   if (isQuering.value) return;

   if (direction === 'next' && (results.value.length && results.value[0].rows.length === limit.value)) {
      if (!page.value)
         page.value = 2;
      else
         page.value++;
   }
   else if (direction === 'prev' && page.value > 1)
      page.value--;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const showFakerModal = (row?: any) => {
   if (isQuering.value) return;
   isFakerModal.value = true;
   rowToDuplicate.value = row;
};

const hideFakerModal = () => {
   isFakerModal.value = false;
   rowToDuplicate.value = null;
};

const setRefreshInterval = () => {
   if (refreshInterval.value)
      clearInterval(refreshInterval.value);

   if (+autorefreshTimer.value) {
      refreshInterval.value = setInterval(() => {
         if (!isQuering.value)
            reloadTable();
      }, autorefreshTimer.value * 1000);
   }
};

const downloadTable = (format: 'csv' | 'json' | 'sql' | 'php') => {
   queryTable.value.downloadTable(format, props.table);
};

const onFilterChange = (clausoles: TableFilterClausole[]) => {
   resizeScroller();
   if (clausoles.length === 0)
      isSearch.value = false;
};

const resizeScroller = () => {
   setTimeout(() => queryTable.value.refreshScroller(), 1);
};

const updateFilters = (clausoles: TableFilterClausole[]) => {
   filters.value = clausoles;
   results.value = [];
   getTableData();
};

const reloadListener = () => {
   const hasModalOpen = !!document.querySelectorAll('.modal.active').length;
   if (props.isSelected && !hasModalOpen)
      reloadTable();
};

const openFilterListener = () => {
   const hasModalOpen = !!document.querySelectorAll('.modal.active').length;
   if (props.isSelected && !hasModalOpen)
      isSearch.value = !isSearch.value;
};

const nextPageListener = () => {
   const hasModalOpen = !!document.querySelectorAll('.modal.active').length;
   if (props.isSelected && !hasModalOpen)
      pageChange('next');
};

const prevPageListener = () => {
   const hasModalOpen = !!document.querySelectorAll('.modal.active').length;
   if (props.isSelected && !hasModalOpen)
      pageChange('prev');
};

const hasApproximately = computed(() => {
   return results.value.length &&
      results.value[0].rows &&
      results.value[0].rows.length === limit.value &&
      results.value[0].rows.length < approximateCount.value;
});

const openTableSettingTab = () => {
   newTab({
      uid: workspace.value.uid,
      elementName: props.table,
      schema: props.schema,
      type: 'table-props',
      elementType: 'table'
   });

   changeBreadcrumbs({
      schema: props.schema,
      table: props.table
   });
};

watch(() => props.schema, () => {
   if (props.isSelected) {
      page.value = 1;
      approximateCount.value = 0;
      sortParams.value = {} as { field: string; dir: 'asc' | 'desc'};
      getTableData();
      lastTable.value = props.table;
      queryTable.value.resetSort();
   }
});

watch(() => props.table, () => {
   if (props.isSelected) {
      page.value = 1;
      filters.value = [];
      isSearch.value = false;
      approximateCount.value = 0;
      sortParams.value = {} as { field: string; dir: 'asc' | 'desc'};
      getTableData();
      lastTable.value = props.table;
      queryTable.value.resetSort();
   }
});

watch(page, (val, oldVal) => {
   if (val && val > 0 && val !== oldVal) {
      pageProxy.value = page.value;
      getTableData();
   }
});

watch(() => props.isSelected, (val) => {
   if (val) {
      changeBreadcrumbs({ schema: props.schema, [props.elementType]: props.table });

      if (lastTable.value !== props.table)
         getTableData();
   }
});

watch(isSearch, (val) => {
   if (filters.value.length > 0 && !val) {
      filters.value = [];
      getTableData();
   }
   resizeScroller();
});

getTableData();

ipcRenderer.on('run-or-reload', reloadListener);
ipcRenderer.on('open-filter', openFilterListener);
ipcRenderer.on('next-page', nextPageListener);
ipcRenderer.on('prev-page', prevPageListener);

onBeforeUnmount(() => {
   clearInterval(refreshInterval.value);
   ipcRenderer.removeListener('run-or-reload', reloadListener);
   ipcRenderer.removeListener('open-filter', openFilterListener);
   ipcRenderer.removeListener('next-page', nextPageListener);
   ipcRenderer.removeListener('prev-page', prevPageListener);
});
</script>
