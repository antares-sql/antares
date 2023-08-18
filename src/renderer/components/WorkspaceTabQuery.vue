<template>
   <div
      v-show="isSelected"
      class="workspace-query-tab column col-12 columns col-gapless no-outline p-0"
      tabindex="0"
   >
      <div class="workspace-query-runner column col-12">
         <QueryEditor
            v-show="isSelected"
            id="query-editor"
            ref="queryEditor"
            v-model="query"
            :auto-focus="true"
            :workspace="workspace"
            :schema="breadcrumbsSchema"
            :is-selected="isSelected"
            :height="editorHeight"
         />
         <div ref="resizer" class="query-area-resizer" />
         <div ref="queryAreaFooter" class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <div @mouseenter="setCancelButtonVisibility(true)" @mouseleave="setCancelButtonVisibility(false)">
                  <button
                     v-if="showCancel && isQuering"
                     class="btn btn-primary btn-sm cancellable"
                     :disabled="!query"
                     :title="t('general.cancel')"
                     @click="killTabQuery()"
                  >
                     <i class="mdi mdi-24px mdi-window-close" />
                     <span class="d-invisible pr-1">{{ t('general.run') }}</span>
                  </button>
                  <button
                     v-else
                     class="btn btn-primary btn-sm"
                     :class="{'loading':isQuering}"
                     :disabled="!query"
                     @click="runQuery(query)"
                  >
                     <i class="mdi mdi-24px mdi-play pr-1" />
                     <span>{{ t('general.run') }}</span>
                  </button>
               </div>
               <button
                  v-if="!autocommit"
                  class="btn btn-dark btn-sm"
                  :class="{'loading':isQuering}"
                  @click="commitTab()"
               >
                  <i class="mdi mdi-24px mdi-cube-send pr-1" />
                  <span>{{ t('database.commit') }}</span>
               </button>
               <button
                  v-if="!autocommit"
                  class="btn btn-dark btn-sm"
                  :class="{'loading':isQuering}"
                  @click="rollbackTab()"
               >
                  <i class="mdi mdi-24px mdi-undo-variant pr-1" />
                  <span>{{ t('database.rollback') }}</span>
               </button>
               <button
                  class="btn btn-link btn-sm mr-0"
                  :disabled="!query || isQuering"
                  @click="clear()"
               >
                  <i class="mdi mdi-24px mdi-delete-sweep pr-1" />
                  <span>{{ t('general.clear') }}</span>
               </button>

               <div class="divider-vert py-3" />

               <button
                  class="btn btn-dark btn-sm"
                  :disabled="!query || isQuering"
                  @click="beautify()"
               >
                  <i class="mdi mdi-24px mdi-brush pr-1" />
                  <span>{{ t('general.format') }}</span>
               </button>
               <button
                  class="btn btn-dark btn-sm"
                  :disabled="isQuering"
                  @click="openHistoryModal()"
               >
                  <i class="mdi mdi-24px mdi-history pr-1" />
                  <span>{{ t('general.history') }}</span>
               </button>
               <div class="dropdown table-dropdown pr-2">
                  <button
                     :disabled="!hasResults || isQuering"
                     class="btn btn-dark btn-sm dropdown-toggle mr-0 pr-0"
                     tabindex="0"
                  >
                     <i class="mdi mdi-24px mdi-file-export mr-1" />
                     <span>{{ t('database.export') }}</span>
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
                        <a class="c-hand" @click="downloadTable('php')">{{ t('application.phpArray') }}</a>
                     </li>
                     <li class="menu-item">
                        <a class="c-hand" @click="downloadTable('sql')">SQL INSERT</a>
                     </li>
                  </ul>
               </div>
               <div class="input-group pr-2" :title="t('database.commitMode')">
                  <i class="input-group-addon addon-sm mdi mdi-24px mdi-source-commit p-0" />
                  <BaseSelect
                     v-model="autocommit"
                     :options="[{value: true, label: t('database.autoCommit')}, {value: false, label: t('database.manualCommit')}]"
                     :option-label="(opt: any) => opt.label"
                     :option-track-by="(opt: any) => opt.value"
                     class="form-select select-sm text-bold"
                  />
               </div>
            </div>
            <div class="workspace-query-info">
               <div
                  v-if="results.length"
                  class="d-flex"
                  :title="t('database.queryDuration')"
               >
                  <i class="mdi mdi-timer-sand mdi-rotate-180 pr-1" /> <b>{{ durationsCount / 1000 }}s</b>
               </div>
               <div
                  v-if="resultsCount"
                  class="d-flex"
                  :title="t('general.results')"
               >
                  <i class="mdi mdi-equal pr-1" /> <b>{{ resultsCount.toLocaleString() }}</b>
               </div>
               <div
                  v-if="hasAffected"
                  class="d-flex"
                  :title="t('database.affectedRows')"
               >
                  <i class="mdi mdi-target pr-1" /> <b>{{ affectedCount }}</b>
               </div>
               <div class="input-group" :title="t('database.schema')">
                  <i class="input-group-addon addon-sm mdi mdi-24px mdi-database" />

                  <BaseSelect
                     v-model="selectedSchema"
                     :options="[{value: null, label: t('database.noSchema')}, ...databaseSchemas.map(el => ({label: el, value: el}))]"
                     class="form-select select-sm text-bold"
                  />
               </div>
            </div>
         </div>
      </div>
      <WorkspaceTabQueryEmptyState v-if="!results.length && !isQuering" :customizations="workspace.customizations" />
      <div class="workspace-query-results p-relative column col-12">
         <BaseLoader v-if="isQuering" />
         <WorkspaceTabQueryTable
            v-if="results"
            v-show="!isQuering"
            ref="queryTable"
            :results="results"
            :tab-uid="tab.uid"
            :conn-uid="connection.uid"
            :is-selected="isSelected"
            mode="query"
            @update-field="updateField"
            @delete-selected="deleteSelected"
         />
      </div>
      <ModalHistory
         v-if="isHistoryOpen"
         :connection="connection"
         @select-query="selectQuery"
         @close="isHistoryOpen = false"
      />
   </div>
</template>

<script setup lang="ts">
import { Ace } from 'ace-builds';
import { ConnectionParams } from 'common/interfaces/antares';
import { ipcRenderer } from 'electron';
import { storeToRefs } from 'pinia';
import { format } from 'sql-formatter';
import { Component, computed, onBeforeUnmount, onMounted, Prop, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseLoader from '@/components/BaseLoader.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import ModalHistory from '@/components/ModalHistory.vue';
import QueryEditor from '@/components/QueryEditor.vue';
import WorkspaceTabQueryEmptyState from '@/components/WorkspaceTabQueryEmptyState.vue';
import WorkspaceTabQueryTable from '@/components/WorkspaceTabQueryTable.vue';
import { useResultTables } from '@/composables/useResultTables';
import Schema from '@/ipc-api/Schema';
import { useConsoleStore } from '@/stores/console';
import { useHistoryStore } from '@/stores/history';
import { useNotificationsStore } from '@/stores/notifications';
import { useSettingsStore } from '@/stores/settings';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

const props = defineProps({
   tabUid: String,
   connection: Object as Prop<ConnectionParams>,
   tab: Object,
   isSelected: Boolean
});

const reloadTable = () => runQuery(lastQuery.value);

const {
   queryTable,
   isQuering,
   updateField,
   deleteSelected
} = useResultTables(props.connection.uid, reloadTable);

const { saveHistory } = useHistoryStore();
const { addNotification } = useNotificationsStore();
const workspacesStore = useWorkspacesStore();

const { consoleHeight } = storeToRefs(useConsoleStore());
const { executeSelected } = storeToRefs(useSettingsStore());

const {
   getWorkspace,
   changeBreadcrumbs,
   updateTabContent,
   setUnsavedChanges
} = workspacesStore;

const queryEditor: Ref<Component & { editor: Ace.Editor; $el: HTMLElement }> = ref(null);
const queryAreaFooter: Ref<HTMLDivElement> = ref(null);
const resizer: Ref<HTMLDivElement> = ref(null);
const query = ref('');
const lastQuery = ref('');
const isCancelling = ref(false);
const showCancel = ref(false);
const autocommit = ref(true);
const results = ref([]);
const selectedSchema = ref(null);
const resultsCount = ref(0);
const durationsCount = ref(0);
const affectedCount = ref(null);
const editorHeight = ref(200);
const isHistoryOpen = ref(false);
const debounceTimeout = ref(null);

const workspace = computed(() => getWorkspace(props.connection.uid));
const breadcrumbsSchema = computed(() => workspace.value.breadcrumbs.schema || null);
const databaseSchemas = computed(() => {
   return workspace.value.structure.reduce((acc, curr) => {
      acc.push(curr.name);
      return acc;
   }, []);
});
const hasResults = computed(() => results.value.length && results.value[0].rows);
const hasAffected = computed(() => affectedCount.value || (!resultsCount.value && affectedCount.value !== null));

watch(query, (val) => {
   clearTimeout(debounceTimeout.value);

   debounceTimeout.value = setTimeout(() => {
      updateTabContent({
         uid: props.connection.uid,
         tab: props.tab.uid,
         type: 'query',
         schema: selectedSchema.value,
         content: val
      });
   }, 200);
});

watch(() => props.isSelected, (val) => {
   if (val) {
      changeBreadcrumbs({ schema: selectedSchema.value, query: `Query #${props.tab.index}` });
      setTimeout(() => {
         if (queryEditor.value)
            queryEditor.value.editor.focus();
      }, 0);
   }
});

watch(selectedSchema, () => {
   changeBreadcrumbs({ schema: selectedSchema.value, query: `Query #${props.tab.index}` });
});

watch(databaseSchemas, () => {
   if (!databaseSchemas.value.includes(selectedSchema.value))
      selectedSchema.value = null;
}, { deep: true });

const runQuery = async (query: string) => {
   if (!query || isQuering.value) return;
   isQuering.value = true;

   if (executeSelected.value) {
      const selectedQuery = queryEditor.value.editor.getSelectedText();
      if (selectedQuery) query = selectedQuery;
   }

   clearTabData();
   queryTable.value.resetSort();

   try { // Query Data
      const params = {
         uid: props.connection.uid,
         schema: selectedSchema.value,
         tabUid: props.tab.uid,
         autocommit: autocommit.value,
         query
      };

      const { status, response } = await Schema.rawQuery(params);

      if (status === 'success') {
         results.value = Array.isArray(response) ? response : [response];
         resultsCount.value = results.value.reduce((acc, curr) => acc + (curr.rows ? curr.rows.length : 0), 0);
         durationsCount.value = results.value.reduce((acc, curr) => acc + curr.duration, 0);
         affectedCount.value = results.value
            .filter(result => result.report !== null)
            .reduce((acc, curr) => {
               if (acc === null) acc = 0;
               return acc + (curr.report ? curr.report.affectedRows : 0);
            }, null);

         saveHistory(params);
         if (!autocommit.value)
            setUnsavedChanges({ uid: props.connection.uid, tUid: props.tabUid, isChanged: true });
      }
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   isQuering.value = false;
   lastQuery.value = query;
};

const killTabQuery = async () => {
   if (isCancelling.value) return;

   isCancelling.value = true;

   try {
      const params = {
         uid: props.connection.uid,
         tabUid: props.tab.uid
      };

      await Schema.killTabQuery(params);
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   isCancelling.value = false;
};

const setCancelButtonVisibility = (val: boolean) => {
   if (workspace.value.customizations.cancelQueries)
      showCancel.value = val;
};

const clearTabData = () => {
   results.value = [];
   resultsCount.value = 0;
   durationsCount.value = 0;
   affectedCount.value = null;
};

const resize = (e: MouseEvent) => {
   const el = queryEditor.value.$el;
   const queryFooterHeight = queryAreaFooter.value.clientHeight;
   const bottom = e.pageY || resizer.value.getBoundingClientRect().bottom;
   const maxHeight = window.innerHeight - 100 - queryFooterHeight - consoleHeight.value;
   let localEditorHeight = bottom - el.getBoundingClientRect().top;
   if (localEditorHeight > maxHeight) localEditorHeight = maxHeight;
   if (localEditorHeight < 50) localEditorHeight = 50;
   editorHeight.value = localEditorHeight;
};

const resizeResults = () => queryTable.value.resizeResults();

const onWindowResize = (e: MouseEvent) => {
   if (!queryEditor.value) return;
   const el = queryEditor.value.$el;
   const queryFooterHeight = queryAreaFooter.value.clientHeight;
   const bottom = e.pageY || resizer.value.getBoundingClientRect().bottom;
   const maxHeight = window.innerHeight - 100 - queryFooterHeight;
   const localEditorHeight = bottom - el.getBoundingClientRect().top;

   if (localEditorHeight > maxHeight)
      editorHeight.value = maxHeight;
};

const stopResize = () => {
   window.removeEventListener('mousemove', resize);
   if (queryTable.value && results.value.length)
      resizeResults();

   if (queryEditor.value)
      queryEditor.value.editor.resize();
};

const beautify = () => {
   if (queryEditor.value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let language: any = 'sql';

      switch (workspace.value.client) {
         case 'mysql':
            language = 'mysql';
            break;
         case 'maria':
            language = 'mariadb';
            break;
         case 'pg':
            language = 'postgresql';
            break;
      }

      const formattedQuery = format(query.value, {
         language,
         uppercase: true
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      queryEditor.value.editor.session.setValue(formattedQuery);
   }
};

const openHistoryModal = () => {
   isHistoryOpen.value = true;
};

const selectQuery = (sql: string) => {
   if (queryEditor.value)
      queryEditor.value.editor.session.setValue(sql);

   isHistoryOpen.value = false;
};

const clear = () => {
   if (queryEditor.value)
      queryEditor.value.editor.session.setValue('');
   clearTabData();
};

const downloadTable = (format: 'csv' | 'json' | 'sql' | 'php') => {
   queryTable.value.downloadTable(format, `${props.tab.type}-${props.tab.index}`);
};

const commitTab = async () => {
   isQuering.value = true;
   try {
      const params = {
         uid: props.connection.uid,
         tabUid: props.tab.uid
      };

      await Schema.commitTab(params);
      setUnsavedChanges({ uid: props.connection.uid, tUid: props.tabUid, isChanged: false });
      addNotification({ status: 'success', message: t('general.actionSuccessful', { action: 'COMMIT' }) });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   isQuering.value = false;
};

const rollbackTab = async () => {
   isQuering.value = true;
   try {
      const params = {
         uid: props.connection.uid,
         tabUid: props.tab.uid
      };

      await Schema.rollbackTab(params);
      setUnsavedChanges({ uid: props.connection.uid, tUid: props.tabUid, isChanged: false });
      addNotification({ status: 'success', message: t('general.actionSuccessful', { action: 'ROLLBACK' }) });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   isQuering.value = false;
};

defineExpose({ resizeResults });

query.value = props.tab.content as string;
selectedSchema.value = props.tab.schema || breadcrumbsSchema.value;

window.addEventListener('resize', onWindowResize);

const reloadListener = () => {
   const hasModalOpen = !!document.querySelectorAll('.modal.active').length;
   if (props.isSelected && !hasModalOpen)
      runQuery(query.value);
};

const formatListener = () => {
   const hasModalOpen = !!document.querySelectorAll('.modal.active').length;
   if (props.isSelected && !hasModalOpen)
      beautify();
};

const killQueryListener = () => {
   const hasModalOpen = !!document.querySelectorAll('.modal.active').length;
   if (props.isSelected && !hasModalOpen)
      killTabQuery();
};

const clearQueryListener = () => {
   const hasModalOpen = !!document.querySelectorAll('.modal.active').length;
   if (props.isSelected && !hasModalOpen)
      clear();
};

const historyListener = () => {
   const hasModalOpen = !!document.querySelectorAll('.modal.active').length;
   if (props.isSelected && !hasModalOpen)
      openHistoryModal();
};

onMounted(() => {
   const localResizer = resizer.value;

   ipcRenderer.on('run-or-reload', reloadListener);
   ipcRenderer.on('format-query', formatListener);
   ipcRenderer.on('kill-query', killQueryListener);
   ipcRenderer.on('clear-query', clearQueryListener);
   ipcRenderer.on('query-history', historyListener);

   localResizer.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();

      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResize);
   });

   if (props.tab.autorun)
      runQuery(query.value);
});

onBeforeUnmount(() => {
   window.removeEventListener('resize', onWindowResize);
   const params = {
      uid: props.connection.uid,
      tabUid: props.tab.uid
   };
   Schema.destroyConnectionToCommit(params);

   ipcRenderer.removeListener('run-or-reload', reloadListener);
   ipcRenderer.removeListener('format-query', formatListener);
   ipcRenderer.removeListener('kill-query', killQueryListener);
   ipcRenderer.removeListener('clear-query', clearQueryListener);
   ipcRenderer.removeListener('query-history', historyListener);
});
</script>

<style lang="scss">
.workspace-tabs {
  align-content: baseline;

  .workspace-query-runner {
    position: relative;

    .query-area-resizer {
      height: 4px;
      margin-top: -2px;
      width: 100%;
      cursor: ns-resize;
      z-index: 99;
      transition: background 0.2s;

      &:hover {
        background: rgba($primary-color, 50%);
      }
    }

    .workspace-query-runner-footer {
      display: flex;
      flex-wrap: wrap;
      row-gap: 0.4rem;
      justify-content: space-between;
      padding: 0.3rem 0.6rem 0.4rem;
      align-items: center;
      min-height: 42px;

      .workspace-query-buttons,
      .workspace-query-info {
        display: flex;
        align-items: center;

        .btn {
          display: flex;
          align-self: center;
          margin-right: 0.4rem;
        }
      }

      .workspace-query-info {
        overflow: visible;

        > div + div {
          padding-left: 0.6rem;
        }
      }
    }
  }

  .workspace-query-results {
    min-height: 200px;
  }
}
</style>
