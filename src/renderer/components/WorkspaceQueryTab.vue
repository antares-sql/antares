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
                  @click="runQuery"
               >
                  <span>{{ $t('word.run') }}</span>
                  <i class="material-icons text-success">play_arrow</i>
               </button>
               <!-- <button class="btn btn-link btn-sm">
                  <span>{{ $t('word.save') }}</span>
                  <i class="material-icons ml-1">save</i>
               </button> -->
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
            ref="queryTable"
            :results="results"
            :fields="resultsFields"
            @updateField="updateField"
            @deleteSelected="deleteSelected"
         />
      </div>
   </div>
</template>

<script>
import Connection from '@/ipc-api/Connection';
import Structure from '@/ipc-api/Structure';
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
      connection: Object
   },
   data () {
      return {
         query: '',
         isQuering: false,
         results: {},
         fields: []
      };
   },
   computed: {
      ...mapGetters({
         getWorkspace: 'workspaces/getWorkspace'
      }),
      workspace () {
         return this.getWorkspace(this.connection.uid);
      },
      resultsFields () {
         if (this.results) {
            return this.fields.map(field => { // TODO: move to main process
               return {
                  name: field.COLUMN_NAME,
                  key: field.COLUMN_KEY.toLowerCase(),
                  type: field.DATA_TYPE,
                  precision: field.DATETIME_PRECISION
               };
            }).filter(field => {
               if (this.results.fields) {
                  const queryFields = this.results.fields.map(field => field.name);
                  if (queryFields.includes(field.name)) return field;
               }
            });
         }
         else
            return [];
      },
      table () {
         if (this.results.fields.length)
            return this.results.fields[0].orgTable;
         return '';
      }
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification'
      }),
      async runQuery () {
         if (!this.query) return;
         this.isQuering = true;
         this.results = {};

         try {
            const params = {
               uid: this.connection.uid,
               query: this.query,
               schema: this.workspace.breadcrumbs.schema
            };

            const { status, response } = await Connection.rawQuery(params);
            if (status === 'success')
               this.results = response;
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         try {
            const params = {
               uid: this.connection.uid,
               schema: this.workspace.breadcrumbs.schema,
               table: this.table
            };

            const { status, response } = await Structure.getTableColumns(params);
            if (status === 'success')
               this.fields = response.rows;
            else
               this.addNotification({ status: 'error', message: response });
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
.workspace-tabs{
   align-content: baseline;

   .workspace-query-runner{

      .workspace-query-runner-footer{
         display: flex;
         justify-content: space-between;
         padding: .3rem .6rem .4rem;
         align-items: center;

         .workspace-query-buttons{
            display: flex;

            .btn{
               display: flex;
               align-self: center;
               color: $body-font-color;
               margin-right: .4rem;
            }
         }

         .workspace-query-info{
            display: flex;

            > div + div{
               padding-left: .6rem;
            }
         }
      }
   }
}

</style>
