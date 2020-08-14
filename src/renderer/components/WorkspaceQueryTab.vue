<template>
   <div class="workspace-query-tab column col-12 columns col-gapless">
      <div class="workspace-query-runner column col-12">
         <QueryEditor v-model="query" />
         <div class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <button
                  class="btn btn-link btn-sm"
                  :class="{'loading':isQuering}"
                  :disabled="!query"
                  @click="runQuery(query)"
               >
                  <span>{{ $t('word.run') }}</span>
                  <i class="mdi mdi-24px mdi-play text-success" />
               </button>
            </div>
            <div class="workspace-query-info">
               <div v-if="results.rows">
                  {{ $t('word.results') }}: <b>{{ results.rows.length }}</b>
               </div>
               <div v-if="workspace.breadcrumbs.schema">
                  {{ $t('word.schema') }}: <b>{{ workspace.breadcrumbs.schema }}</b>
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
            @updateField="updateField"
            @deleteSelected="deleteSelected"
         />
      </div>
   </div>
</template>

<script>
import Connection from '@/ipc-api/Connection';
import Tables from '@/ipc-api/Tables';
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
      tabUid: String
   },
   data () {
      return {
         query: '',
         lastQuery: '',
         isQuering: false,
         results: {},
         selectedFields: []
      };
   },
   computed: {
      ...mapGetters({
         getWorkspace: 'workspaces/getWorkspace'
      }),
      workspace () {
         return this.getWorkspace(this.connection.uid);
      },
      table () {
         if ('fields' in this.results && this.results.fields.length)
            return this.results.fields[0].orgTable;
         return '';
      },
      schema () {
         if ('fields' in this.results && this.results.fields.length)
            return this.results.fields[0].db;
         return this.workspace.breadcrumbs.schema;
      }
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification',
         setTabFields: 'workspaces/setTabFields',
         setTabKeyUsage: 'workspaces/setTabKeyUsage'
      }),
      async runQuery (query) {
         if (!query) return;
         this.isQuering = true;
         this.results = {};
         this.setTabFields({ cUid: this.connection.uid, tUid: this.tabUid, fields: [] });

         try { // Query Data
            const params = {
               uid: this.connection.uid,
               schema: this.schema,
               query
            };

            const { status, response } = await Connection.rawQuery(params);
            if (status === 'success') {
               this.results = response;
               this.selectedFields = response.fields.map(field => field.orgName);
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         try { // Table data
            const params = {
               uid: this.connection.uid,
               schema: this.schema,
               table: this.table
            };

            const { status, response } = await Tables.getTableColumns(params);
            if (status === 'success') {
               const fields = response.filter(field => this.selectedFields.includes(field.name));
               this.setTabFields({ cUid: this.connection.uid, tUid: this.tabUid, fields });
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         try { // Key usage (foreign keys)
            const params = {
               uid: this.connection.uid,
               schema: this.schema,
               table: this.table
            };

            const { status, response } = await Tables.getKeyUsage(params);
            if (status === 'success')
               this.setTabKeyUsage({ cUid: this.connection.uid, tUid: this.tabUid, keyUsage: response });
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
