<template>
   <div v-show="isSelected" class="workspace-query-tab column col-12 columns col-gapless">
      <div class="workspace-query-runner column col-12">
         <QueryEditor v-if="isSelected" :value.sync="query" />
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
               <div v-if="resultsCount !== false">
                  {{ $t('word.results') }}: <b>{{ resultsCount }}</b>
               </div>
               <div v-if="affectedCount !== false">
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
         resultsCount: false,
         affectedCount: false
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
         addNotification: 'notifications/addNotification',
         setTabFields: 'workspaces/setTabFields',
         setTabKeyUsage: 'workspaces/setTabKeyUsage'
      }),
      getResultParams (index) {
         const resultsWithRows = this.results.filter(result => result.rows);
         let cachedTable;

         if (resultsWithRows[index] && resultsWithRows[index].fields && resultsWithRows[index].fields.length) {
            return resultsWithRows[index].fields.map(field => {
               if (field.table) cachedTable = field.table;// Needed for some queries on information_schema
               return {
                  table: field.orgTable || cachedTable,
                  schema: field.schema || 'INFORMATION_SCHEMA'
               };
            }).filter((val, i, arr) => arr.findIndex(el => el.schema === val.schema && el.table === val.table) === i);
         }
         return [];
      },
      async runQuery (query) {
         if (!query || this.isQuering) return;
         this.isQuering = true;
         this.clearTabData();

         try { // Query Data
            const params = {
               uid: this.connection.uid,
               schema: this.schema,
               query
            };

            const { status, response } = await Database.rawQuery(params);

            if (status === 'success') {
               this.results = Array.isArray(response) ? response : [response];

               let selectedFields = [];
               const fieldsArr = [];
               const keysArr = [];
               let qI = 0;// queries index

               for (const result of this.results) { // cycle queries
                  if (result.rows) { // if is a select
                     const paramsArr = this.getResultParams(qI);

                     selectedFields = result.fields.map(field => field.orgName || field.name);
                     this.resultsCount += result.rows.length;

                     for (const paramObj of paramsArr) {
                        try { // Table data
                           const params = {
                              uid: this.connection.uid,
                              ...paramObj
                           };

                           const { status, response } = await Tables.getTableColumns(params);

                           if (status === 'success') {
                              let fields = response.length ? selectedFields.map(selField => {
                                 return response.find(field => field.name === selField);
                              }) : [];

                              if (selectedFields.length) {
                                 fields = fields.map(field => {
                                    const aliasObj = result.fields.find(resField => resField.orgName === field.name);
                                    return {
                                       ...field,
                                       alias: aliasObj.name || field.name,
                                       tableAlias: aliasObj.table || field.table
                                    };
                                 });
                              }

                              if (!fields.length) {
                                 fields = result.fields.map(field => {
                                    return { ...field, alias: field.name };
                                 });
                              }

                              fieldsArr[qI] = fieldsArr[qI] ? [...fieldsArr[qI], ...fields] : fields.length >= result.fields.length ? fields : result.fields;
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
                              ...paramObj
                           };

                           const { status, response } = await Tables.getKeyUsage(params);
                           if (status === 'success')
                              keysArr[qI] = keysArr[qI] ? [...keysArr[qI], ...response] : response;
                           else
                              this.addNotification({ status: 'error', message: response });
                        }
                        catch (err) {
                           this.addNotification({ status: 'error', message: err.stack });
                        }
                     }
                  }
                  else if (result.report) { // if is a query without output
                     this.affectedCount += result.report.affectedRows;
                  }

                  qI++;
               }

               this.setTabFields({
                  cUid: this.connection.uid,
                  tUid: this.tabUid,
                  fields: fieldsArr
               });
               this.setTabKeyUsage({
                  cUid: this.connection.uid,
                  tUid: this.tabUid,
                  keyUsage: keysArr
               });
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
         this.resultsCount = false;
         this.affectedCount = false;
         this.setTabFields({ cUid: this.connection.uid, tUid: this.tabUid, fields: [] });
      },
      onKey (e) {
         e.stopPropagation();
         if (e.key === 'F9')
            this.runQuery(this.query);
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
