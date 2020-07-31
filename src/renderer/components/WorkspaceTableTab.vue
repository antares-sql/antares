<template>
   <div class="workspace-query-tab column col-12 columns col-gapless">
      <div class="workspace-query-runner column col-12">
         <div class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <button
                  class="btn btn-link btn-sm"
                  :class="{'loading':isQuering}"
                  @click="getTableData"
               >
                  <span>{{ $t('word.refresh') }}</span>
                  <i class="material-icons ml-1">refresh</i>
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
               <div v-if="workspace.breadcrumbs.database">
                  {{ $t('word.schema') }}: <b>{{ workspace.breadcrumbs.database }}</b>
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
import Tables from '@/ipc-api/Tables';
import WorkspaceQueryTable from '@/components/WorkspaceQueryTable';
import { mapGetters, mapActions } from 'vuex';
import tableTabs from '@/mixins/tableTabs';

export default {
   name: 'WorkspaceTableTab',
   components: {
      WorkspaceQueryTable
   },
   mixins: [tableTabs],
   props: {
      connection: Object,
      table: String
   },
   data () {
      return {
         isQuering: false,
         results: {},
         fields: [],
         lastTable: null
      };
   },
   computed: {
      ...mapGetters({
         getWorkspace: 'workspaces/getWorkspace'
      }),
      workspace () {
         return this.getWorkspace(this.connection.uid);
      },
      isSelected () {
         return this.workspace.selected_tab === 1;
      },
      resultsFields () {
         return this.fields.map(field => { // TODO: move to main process
            return {
               name: field.COLUMN_NAME,
               key: field.COLUMN_KEY.toLowerCase(),
               type: field.DATA_TYPE,
               precision: field.DATETIME_PRECISION
            };
         });
      }
   },
   watch: {
      table () {
         if (this.isSelected) {
            this.getTableData();
            this.lastTable = this.table;
         }
      },
      isSelected (val) {
         if (val && this.lastTable !== this.table) {
            this.getTableData();
            this.lastTable = this.table;
         }
      }
   },
   created () {
      this.getTableData();
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification'
      }),
      async getTableData () {
         if (!this.table) return;
         this.isQuering = true;
         this.results = {};

         const params = {
            uid: this.connection.uid,
            schema: this.workspace.breadcrumbs.schema,
            table: this.workspace.breadcrumbs.table
         };

         try {
            const { status, response } = await Tables.getTableColumns(params);
            if (status === 'success')
               this.fields = response.rows;
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         try {
            const { status, response } = await Tables.getTableData(params);

            if (status === 'success')
               this.results = response;
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
