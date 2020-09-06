<template>
   <div v-show="isSelected" class="workspace-query-tab column col-12 columns col-gapless">
      <div class="workspace-query-runner column col-12">
         <QueryEditor v-if="isSelected" :value.sync="query" />
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
               <div v-if="results[selectedResultsset] && results[selectedResultsset].rows">
                  {{ $t('word.results') }}: <b>{{ resultsCount }}</b>
               </div>
               <div v-if="results[selectedResultsset] && results[selectedResultsset].report">
                  {{ $t('message.affectedRows') }}: <b>{{ affectedCount }}</b>
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
            @update-field="updateField"
            @delete-selected="deleteSelected"
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
         affectedCount: 0,
         selectedResultsset: 0
      };
   },
   computed: {
      ...mapGetters({
         getWorkspace: 'workspaces/getWorkspace'
      }),
      workspace () {
         return this.getWorkspace(this.connection.uid);
      },
      schema () {
         if ('fields' in this.results && this.results[this.selectedResultsset].fields.length)
            return this.results[this.selectedResultsset].fields[0].db;
         return this.workspace.breadcrumbs.schema;
      }
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification',
         setTabFields: 'workspaces/setTabFields',
         setTabKeyUsage: 'workspaces/setTabKeyUsage'
      }),
      getTable (index) {
         if ('fields' in this.results[index] && this.results[index].fields.length)
            return this.results[index].fields[0].orgTable;
         return '';
      },
      async runQuery (query) {
         if (!query) return;
         this.isQuering = true;
         this.clearTabData();

         try { // Query Data
            const params = {
               uid: this.connection.uid,
               schema: this.schema,
               query
            };

            const { status, response } = await Connection.rawQuery(params);

            if (status === 'success') {
               this.results = Array.isArray(response) ? response : [response];

               let selectedFields = [];
               const fieldsArr = [];
               const keysArr = [];

               for (const [index, result] of this.results.entries()) {
                  if (result.rows) { // if is a select
                     selectedFields = result.fields.map(field => field.orgName);
                     this.resultsCount += result.rows.length;

                     try { // Table data
                        const params = {
                           uid: this.connection.uid,
                           schema: this.schema,
                           table: this.getTable(index)
                        };

                        const { status, response } = await Tables.getTableColumns(params);

                        if (status === 'success') {
                           let fields = response.filter(field => selectedFields.includes(field.name));
                           if (selectedFields.length) {
                              fields = fields.map((field, index) => {
                                 return { ...field, alias: result.fields[index].name };
                              });
                           }

                           fieldsArr.push(fields);
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
                           table: this.getTable(index)
                        };

                        const { status, response } = await Tables.getKeyUsage(params);
                        if (status === 'success')
                           keysArr.push(response);
                        else
                           this.addNotification({ status: 'error', message: response });
                     }
                     catch (err) {
                        this.addNotification({ status: 'error', message: err.stack });
                     }
                  }
                  else { // if is a query without results
                     this.affectedCount += result.report.affectedRows;
                  }
               }
               console.log(fieldsArr);
               this.setTabFields({ cUid: this.connection.uid, tUid: this.tabUid, fields: fieldsArr });
               this.setTabKeyUsage({ cUid: this.connection.uid, tUid: this.tabUid, keyUsage: keysArr });
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
         this.setTabFields({ cUid: this.connection.uid, tUid: this.tabUid, fields: [] });
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
