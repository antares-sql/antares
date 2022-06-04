<template>
   <div
      v-show="isSelected"
      class="workspace-query-tab column col-12 columns col-gapless no-outline p-0"
      tabindex="0"
      @keydown.f5="runQuery(query)"
      @keydown.k="killTabQuery"
      @keydown.ctrl.alt.w="clear"
      @keydown.ctrl.b="beautify"
      @keydown.ctrl.g="openHistoryModal"
   >
      <div class="workspace-query-runner column col-12">
         <QueryEditor
            v-show="isSelected"
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
                     :title="$t('word.cancel')"
                     @click="killTabQuery()"
                  >
                     <i class="mdi mdi-24px mdi-window-close" />
                     <span class="d-invisible pr-1">{{ $t('word.run') }}</span>
                  </button>
                  <button
                     v-else
                     class="btn btn-primary btn-sm"
                     :class="{'loading':isQuering}"
                     :disabled="!query"
                     title="F5"
                     @click="runQuery(query)"
                  >
                     <i class="mdi mdi-24px mdi-play pr-1" />
                     <span>{{ $t('word.run') }}</span>
                  </button>
               </div>
               <button
                  v-if="!autocommit"
                  class="btn btn-dark btn-sm"
                  :class="{'loading':isQuering}"
                  @click="commitTab()"
               >
                  <i class="mdi mdi-24px mdi-cube-send pr-1" />
                  <span>{{ $t('word.commit') }}</span>
               </button>
               <button
                  v-if="!autocommit"
                  class="btn btn-dark btn-sm"
                  :class="{'loading':isQuering}"
                  @click="rollbackTab()"
               >
                  <i class="mdi mdi-24px mdi-undo-variant pr-1" />
                  <span>{{ $t('word.rollback') }}</span>
               </button>
               <button
                  class="btn btn-link btn-sm mr-0"
                  :disabled="!query || isQuering"
                  title="CTRL+W"
                  @click="clear()"
               >
                  <i class="mdi mdi-24px mdi-delete-sweep pr-1" />
                  <span>{{ $t('word.clear') }}</span>
               </button>

               <div class="divider-vert py-3" />

               <button
                  class="btn btn-dark btn-sm"
                  :disabled="!query || isQuering"
                  title="CTRL+B"
                  @click="beautify()"
               >
                  <i class="mdi mdi-24px mdi-brush pr-1" />
                  <span>{{ $t('word.format') }}</span>
               </button>
               <button
                  class="btn btn-dark btn-sm"
                  :disabled="isQuering"
                  title="CTRL+G"
                  @click="openHistoryModal()"
               >
                  <i class="mdi mdi-24px mdi-history pr-1" />
                  <span>{{ $t('word.history') }}</span>
               </button>
               <div class="dropdown table-dropdown pr-2">
                  <button
                     :disabled="!hasResults || isQuering"
                     class="btn btn-dark btn-sm dropdown-toggle mr-0 pr-0"
                     tabindex="0"
                  >
                     <i class="mdi mdi-24px mdi-file-export mr-1" />
                     <span>{{ $t('word.export') }}</span>
                     <i class="mdi mdi-24px mdi-menu-down" />
                  </button>
                  <ul class="menu text-left">
                     <li class="menu-item">
                        <a class="c-hand" @click="downloadTable('json')">JSON</a>
                     </li>
                     <li class="menu-item">
                        <a class="c-hand" @click="downloadTable('csv')">CSV</a>
                     </li>
                  </ul>
               </div>
               <div class="input-group pr-2" :title="$t('message.commitMode')">
                  <i class="input-group-addon addon-sm mdi mdi-24px mdi-source-commit p-0" />
                  <BaseSelect
                     v-model="autocommit"
                     :options="[{value: true, label: $t('message.autoCommit')}, {value: false, label: $t('message.manualCommit')}]"
                     :option-label="opt => opt.label"
                     :option-track-by="opt => opt.value"
                     class="form-select select-sm text-bold"
                  />
               </div>
            </div>
            <div class="workspace-query-info">
               <div
                  v-if="results.length"
                  class="d-flex"
                  :title="$t('message.queryDuration')"
               >
                  <i class="mdi mdi-timer-sand mdi-rotate-180 pr-1" /> <b>{{ durationsCount / 1000 }}s</b>
               </div>
               <div
                  v-if="resultsCount"
                  class="d-flex"
                  :title="$t('word.results')"
               >
                  <i class="mdi mdi-equal pr-1" /> <b>{{ resultsCount.toLocaleString() }}</b>
               </div>
               <div
                  v-if="hasAffected"
                  class="d-flex"
                  :title="$t('message.affectedRows')"
               >
                  <i class="mdi mdi-target pr-1" /> <b>{{ affectedCount }}</b>
               </div>
               <div class="input-group" :title="$t('word.schema')">
                  <i class="input-group-addon addon-sm mdi mdi-24px mdi-database" />

                  <BaseSelect
                     v-model="selectedSchema"
                     :options="[{value: null, label: $t('message.noSchema')}, ...databaseSchemas.map(el => ({label: el, value: el}))]"
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

<script>
import { storeToRefs } from 'pinia';
import { format } from 'sql-formatter';
import { useHistoryStore } from '@/stores/history';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import Schema from '@/ipc-api/Schema';
import QueryEditor from '@/components/QueryEditor';
import BaseLoader from '@/components/BaseLoader';
import WorkspaceTabQueryTable from '@/components/WorkspaceTabQueryTable';
import WorkspaceTabQueryEmptyState from '@/components/WorkspaceTabQueryEmptyState';
import ModalHistory from '@/components/ModalHistory';
import tableTabs from '@/mixins/tableTabs';
import BaseSelect from '@/components/BaseSelect.vue';

export default {
   name: 'WorkspaceTabQuery',
   components: {
      BaseLoader,
      QueryEditor,
      WorkspaceTabQueryTable,
      WorkspaceTabQueryEmptyState,
      ModalHistory,
      BaseSelect
   },
   mixins: [tableTabs],
   props: {
      tabUid: String,
      connection: Object,
      tab: Object,
      isSelected: Boolean
   },
   setup () {
      const { getHistoryByWorkspace, saveHistory } = useHistoryStore();
      const { addNotification } = useNotificationsStore();
      const workspacesStore = useWorkspacesStore();

      const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

      const {
         getWorkspace,
         changeBreadcrumbs,
         updateTabContent,
         setUnsavedChanges
      } = workspacesStore;

      return {
         getHistoryByWorkspace,
         saveHistory,
         addNotification,
         selectedWorkspace,
         getWorkspace,
         changeBreadcrumbs,
         updateTabContent,
         setUnsavedChanges
      };
   },
   data () {
      return {
         query: '',
         lastQuery: '',
         isQuering: false,
         isCancelling: false,
         showCancel: false,
         autocommit: true,
         results: [],
         selectedSchema: null,
         resultsCount: 0,
         durationsCount: 0,
         affectedCount: null,
         editorHeight: 200,
         isHistoryOpen: false,
         debounceTimeout: null
      };
   },
   computed: {
      workspace () {
         return this.getWorkspace(this.connection.uid);
      },
      breadcrumbsSchema () {
         return this.workspace.breadcrumbs.schema || null;
      },
      databaseSchemas () {
         return this.workspace.structure.reduce((acc, curr) => {
            acc.push(curr.name);
            return acc;
         }, []);
      },
      isWorkspaceSelected () {
         return this.workspace.uid === this.selectedWorkspace;
      },
      history () {
         return this.getHistoryByWorkspace(this.connection.uid) || [];
      },
      hasResults () {
         return this.results.length && this.results[0].rows;
      },
      hasAffected () {
         return this.affectedCount || (!this.resultsCount && this.affectedCount !== null);
      }
   },
   watch: {
      query (val) {
         clearTimeout(this.debounceTimeout);

         this.debounceTimeout = setTimeout(() => {
            this.updateTabContent({
               uid: this.connection.uid,
               tab: this.tab.uid,
               type: 'query',
               schema: this.selectedSchema,
               content: val
            });
         }, 200);
      },
      isSelected (val) {
         if (val) {
            this.changeBreadcrumbs({ schema: this.selectedSchema, query: `Query #${this.tab.index}` });
            setTimeout(() => {
               if (this.$refs.queryEditor)
                  this.$refs.queryEditor.editor.focus();
            }, 0);
         }
      },
      selectedSchema () {
         this.changeBreadcrumbs({ schema: this.selectedSchema, query: `Query #${this.tab.index}` });
      }
   },
   created () {
      this.query = this.tab.content;
      this.selectedSchema = this.tab.schema || this.breadcrumbsSchema;

      if (!this.databaseSchemas.includes(this.selectedSchema))
         this.selectedSchema = null;

      window.addEventListener('keydown', this.onKey);
      window.addEventListener('resize', this.onWindowResize);
   },
   mounted () {
      const resizer = this.$refs.resizer;

      resizer.addEventListener('mousedown', e => {
         e.preventDefault();

         window.addEventListener('mousemove', this.resize);
         window.addEventListener('mouseup', this.stopResize);
      });

      if (this.tab.autorun)
         this.runQuery(this.query);
   },
   beforeUnmount () {
      window.removeEventListener('resize', this.onWindowResize);
      window.removeEventListener('keydown', this.onKey);
      const params = {
         uid: this.connection.uid,
         tabUid: this.tab.uid
      };
      Schema.destroyConnectionToCommit(params);
   },
   methods: {
      async runQuery (query) {
         if (!query || this.isQuering) return;
         this.isQuering = true;
         this.clearTabData();
         this.$refs.queryTable.resetSort();

         try { // Query Data
            const params = {
               uid: this.connection.uid,
               schema: this.selectedSchema,
               tabUid: this.tab.uid,
               autocommit: this.autocommit,
               query
            };

            const { status, response } = await Schema.rawQuery(params);

            if (status === 'success') {
               this.results = Array.isArray(response) ? response : [response];
               this.resultsCount = this.results.reduce((acc, curr) => acc + (curr.rows ? curr.rows.length : 0), 0);
               this.durationsCount = this.results.reduce((acc, curr) => acc + curr.duration, 0);
               this.affectedCount = this.results
                  .filter(result => result.report !== null)
                  .reduce((acc, curr) => {
                     if (acc === null) acc = 0;
                     return acc + (curr.report ? curr.report.affectedRows : 0);
                  }, null);

               this.saveHistory(params);
               if (!this.autocommit)
                  this.setUnsavedChanges({ uid: this.connection.uid, tUid: this.tabUid, isChanged: true });
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.isQuering = false;
         this.lastQuery = query;
      },
      async killTabQuery () {
         if (this.isCancelling) return;

         this.isCancelling = true;

         try {
            const params = {
               uid: this.connection.uid,
               tabUid: this.tab.uid
            };

            await Schema.killTabQuery(params);
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.isCancelling = false;
      },
      setCancelButtonVisibility (val) {
         if (this.workspace.customizations.cancelQueries)
            this.showCancel = val;
      },
      reloadTable () {
         this.runQuery(this.lastQuery);
      },
      clearTabData () {
         this.results = [];
         this.resultsCount = 0;
         this.durationsCount = 0;
         this.affectedCount = null;
      },
      resize (e) {
         const el = this.$refs.queryEditor.$el;
         const queryFooterHeight = this.$refs.queryAreaFooter.clientHeight;
         const bottom = e.pageY || this.$refs.resizer.getBoundingClientRect().bottom;
         const maxHeight = window.innerHeight - 100 - queryFooterHeight;
         let editorHeight = bottom - el.getBoundingClientRect().top;
         if (editorHeight > maxHeight) editorHeight = maxHeight;
         if (editorHeight < 50) editorHeight = 50;
         this.editorHeight = editorHeight;
      },
      onWindowResize (e) {
         const el = this.$refs.queryEditor.$el;
         const queryFooterHeight = this.$refs.queryAreaFooter.clientHeight;
         const bottom = e.pageY || this.$refs.resizer.getBoundingClientRect().bottom;
         const maxHeight = window.innerHeight - 100 - queryFooterHeight;
         const editorHeight = bottom - el.getBoundingClientRect().top;

         if (editorHeight > maxHeight)
            this.editorHeight = maxHeight;
      },
      stopResize () {
         window.removeEventListener('mousemove', this.resize);
         if (this.$refs.queryTable && this.results.length)
            this.$refs.queryTable.resizeResults();

         if (this.$refs.queryEditor)
            this.$refs.queryEditor.editor.resize();
      },
      beautify () {
         if (this.$refs.queryEditor) {
            let language = 'sql';

            switch (this.workspace.client) {
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

            const formattedQuery = format(this.query, {
               language,
               uppercase: true
            });
            this.$refs.queryEditor.editor.session.setValue(formattedQuery);
         }
      },
      openHistoryModal () {
         this.isHistoryOpen = true;
      },
      selectQuery (sql) {
         if (this.$refs.queryEditor)
            this.$refs.queryEditor.editor.session.setValue(sql);

         this.isHistoryOpen = false;
      },
      clear () {
         if (this.$refs.queryEditor)
            this.$refs.queryEditor.editor.session.setValue('');
         this.clearTabData();
      },
      downloadTable (format) {
         this.$refs.queryTable.downloadTable(format, `${this.tab.type}-${this.tab.index}`);
      },
      async commitTab () {
         this.isQuering = true;
         try {
            const params = {
               uid: this.connection.uid,
               tabUid: this.tab.uid
            };

            await Schema.commitTab(params);
            this.setUnsavedChanges({ uid: this.connection.uid, tUid: this.tabUid, isChanged: false });
            this.addNotification({ status: 'success', message: this.$t('message.actionSuccessful', { action: 'COMMIT' }) });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.isQuering = false;
      },
      async rollbackTab () {
         this.isQuering = true;
         try {
            const params = {
               uid: this.connection.uid,
               tabUid: this.tab.uid
            };

            await Schema.rollbackTab(params);
            this.setUnsavedChanges({ uid: this.connection.uid, tUid: this.tabUid, isChanged: false });
            this.addNotification({ status: 'success', message: this.$t('message.actionSuccessful', { action: 'ROLLBACK' }) });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.isQuering = false;
      }
   }
};
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
