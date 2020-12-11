<template>
   <div v-show="isSelected" class="workspace-query-tab column col-12 columns col-gapless">
      <div class="workspace-query-runner column col-12">
         <QueryEditor
            v-if="isSelected"
            :auto-focus="true"
            :value.sync="query"
         />
         <div class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <button
                  class="btn btn-primary btn-sm"
                  :class="{'loading':isQuering}"
                  :disabled="!query"
                  title="F9"
                  @click="runQuery(query)"
               >
                  <span>{{ $t('word.run') }}</span>
                  <i class="mdi mdi-24px mdi-play" />
               </button>
            </div>
            <div class="workspace-query-info">
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
      <div class="workspace-query-results column col-12">
         <WorkspaceQueryTable
            v-if="results"
            v-show="!isQuering"
            ref="queryTable"
            :results="results"
            :tab-uid="tabUid"
            :conn-uid="connection.uid"
            mode="query"
            @update-field="updateField"
            @delete-selected="deleteSelected"
         />
      </div>
   </div>
</template>

<script>
import Database from '@/ipc-api/Database';
import QueryEditor from '@/components/QueryEditor';
import WorkspaceQueryTable from '@/components/WorkspaceQueryTable';
import { mapGetters, mapActions } from 'vuex';
import tableTabs from '@/mixins/tableTabs';

export default {
   name: 'WorkspaceQueryTab',
   components: {
      QueryEditor,
      WorkspaceQueryTable
   },
   mixins: [tableTabs],
   props: {
      connection: Object,
      tabUid: String,
      isSelected: Boolean
   },
   data () {
      return {
         query: '',
         lastQuery: '',
         isQuering: false,
         results: [],
         resultsCount: 0,
         affectedCount: 0
      };
   },
   computed: {
      ...mapGetters({
         getWorkspace: 'workspaces/getWorkspace'
      }),
      workspace () {
         return this.getWorkspace(this.connection.uid);
      }
   },
   created () {
      window.addEventListener('keydown', this.onKey);
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

            const { status, response } = await Database.rawQuery(params);

            if (status === 'success') {
               this.results = Array.isArray(response) ? response : [response];
               this.resultsCount += this.results.reduce((acc, curr) => acc + (curr.rows ? curr.rows.length : 0), 0);
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
         this.affectedCount = 0;
      },
      onKey (e) {
         if (this.isSelected) {
            e.stopPropagation();
            if (e.key === 'F9')
               this.runQuery(this.query);
         }
      }
   }
};
</script>

<style lang="scss">
.workspace-tabs {
  align-content: baseline;

  .workspace-query-runner {
    .workspace-query-runner-footer {
      display: flex;
      justify-content: space-between;
      padding: 0.3rem 0.6rem 0.4rem;
      align-items: center;

      .workspace-query-buttons {
        display: flex;

        .btn {
          display: flex;
          align-self: center;
          color: $body-font-color;
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
}

</style>
