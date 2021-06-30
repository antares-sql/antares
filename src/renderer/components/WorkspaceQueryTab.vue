<template>
   <div
      v-show="isSelected"
      class="workspace-query-tab column col-12 columns col-gapless no-outline"
      tabindex="0"
      @keydown.116="runQuery(query)"
      @keydown.ctrl.87="clear"
      @keydown.ctrl.119="beautify"
   >
      <div class="workspace-query-runner column col-12">
         <QueryEditor
            v-show="isSelected"
            ref="queryEditor"
            :auto-focus="true"
            :value.sync="query"
            :workspace="workspace"
            :schema="schema"
            :is-selected="isSelected"
            :height="editorHeight"
         />
         <div ref="resizer" class="query-area-resizer" />
         <div class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <button
                  class="btn btn-primary btn-sm"
                  :class="{'loading':isQuering}"
                  :disabled="!query"
                  title="F5"
                  @click="runQuery(query)"
               >
                  <span>{{ $t('word.run') }}</span>
                  <i class="mdi mdi-24px mdi-play" />
               </button>
               <button
                  class="btn btn-dark btn-sm"
                  :disabled="!query || isQuering"
                  title="CTRL+F8"
                  @click="beautify()"
               >
                  <span>{{ $t('word.format') }}</span>
                  <i class="mdi mdi-24px mdi-brush pl-1" />
               </button>
               <button
                  class="btn btn-link btn-sm"
                  :disabled="!query || isQuering"
                  title="CTRL+W"
                  @click="clear()"
               >
                  <span>{{ $t('word.clear') }}</span>
                  <i class="mdi mdi-24px mdi-delete-sweep pl-1" />
               </button>

               <div class="divider-vert py-3" />

               <div class="dropdown table-dropdown pr-2">
                  <button
                     :disabled="!results.length || isQuering"
                     class="btn btn-dark btn-sm dropdown-toggle mr-0 pr-0"
                     tabindex="0"
                  >
                     <span>{{ $t('word.export') }}</span>
                     <i class="mdi mdi-24px mdi-file-export ml-1" />
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
            </div>
            <div class="workspace-query-info">
               <div
                  v-if="results.length"
                  class="d-flex"
                  :title="$t('message.queryDuration')"
               >
                  <i class="mdi mdi-timer-sand mdi-rotate-180 pr-1" /> <b>{{ durationsCount / 1000 }}s</b>
               </div>
               <div v-if="resultsCount">
                  {{ $t('word.results') }}: <b>{{ resultsCount.toLocaleString() }}</b>
               </div>
               <div v-if="affectedCount">
                  {{ $t('message.affectedRows') }}: <b>{{ affectedCount }}</b>
               </div>
               <div
                  v-if="workspace.breadcrumbs.schema"
                  class="d-flex"
                  :title="$t('word.schema')"
               >
                  <i class="mdi mdi-18px mdi-database mr-1" /><b>{{ workspace.breadcrumbs.schema }}</b>
               </div>
            </div>
         </div>
      </div>
      <div class="workspace-query-results p-relative column col-12">
         <BaseLoader v-if="isQuering" />
         <WorkspaceQueryTable
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
   </div>
</template>

<script>
import { format } from 'sql-formatter';
import Schema from '@/ipc-api/Schema';
import QueryEditor from '@/components/QueryEditor';
import BaseLoader from '@/components/BaseLoader';
import WorkspaceQueryTable from '@/components/WorkspaceQueryTable';
import { mapGetters, mapActions } from 'vuex';
import tableTabs from '@/mixins/tableTabs';

export default {
   name: 'WorkspaceQueryTab',
   components: {
      BaseLoader,
      QueryEditor,
      WorkspaceQueryTable
   },
   mixins: [tableTabs],
   props: {
      connection: Object,
      tab: Object,
      isSelected: Boolean
   },
   data () {
      return {
         query: '',
         lastQuery: '',
         isQuering: false,
         results: [],
         resultsCount: 0,
         durationsCount: 0,
         affectedCount: 0,
         editorHeight: 200
      };
   },
   computed: {
      ...mapGetters({
         getWorkspace: 'workspaces/getWorkspace',
         selectedWorkspace: 'workspaces/getSelected'
      }),
      workspace () {
         return this.getWorkspace(this.connection.uid);
      },
      isWorkspaceSelected () {
         return this.workspace.uid === this.selectedWorkspace;
      }
   },
   created () {
      this.query = this.tab.content;

      window.addEventListener('keydown', this.onKey);
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
   beforeDestroy () {
      window.removeEventListener('keydown', this.onKey);
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification'
      }),
      async runQuery (query) {
         if (!query || this.isQuering) return;
         this.isQuering = true;
         this.clearTabData();
         this.$refs.queryTable.resetSort();

         try { // Query Data
            const params = {
               uid: this.connection.uid,
               schema: this.schema,
               query
            };

            const { status, response } = await Schema.rawQuery(params);

            if (status === 'success') {
               this.results = Array.isArray(response) ? response : [response];
               this.resultsCount += this.results.reduce((acc, curr) => acc + (curr.rows ? curr.rows.length : 0), 0);
               this.durationsCount += this.results.reduce((acc, curr) => acc + curr.duration, 0);
               this.affectedCount += this.results.reduce((acc, curr) => acc + (curr.report ? curr.report.affectedRows : 0), 0);
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
      reloadTable () {
         this.runQuery(this.lastQuery);
      },
      clearTabData () {
         this.results = [];
         this.resultsCount = 0;
         this.durationsCount = 0;
         this.affectedCount = 0;
      },
      resize (e) {
         const el = this.$refs.queryEditor.$el;
         let editorHeight = e.pageY - el.getBoundingClientRect().top;
         if (editorHeight > 400) editorHeight = 400;
         if (editorHeight < 50) editorHeight = 50;
         this.editorHeight = editorHeight;
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
      clear () {
         if (this.$refs.queryEditor)
            this.$refs.queryEditor.editor.session.setValue('');
         this.clearTabData();
      },
      downloadTable (format) {
         this.$refs.queryTable.downloadTable(format, `${this.tab.type}-${this.tab.index}`);
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
      position: absolute;
      height: 5px;
      bottom: 40px;
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
      justify-content: space-between;
      padding: 0.3rem 0.6rem 0.4rem;
      align-items: center;
      height: 42px;

      .workspace-query-buttons {
        display: flex;

        .btn {
          display: flex;
          align-self: center;
          margin-right: 0.4rem;
        }
      }

      .workspace-query-info {
        display: flex;

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
