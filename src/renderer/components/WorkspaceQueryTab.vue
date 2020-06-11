<template>
   <div class="workspace-query-tab column col-12 columns col-gapless">
      <div class="workspace-query-runner column col-12">
         <QueryEditor v-model="query" />
         <div class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <button
                  class="btn btn-link btn-sm"
                  :class="{'loading':isQuering}"
                  @click="runQuery"
               >
                  <span>{{ $t('word.run') }}</span>
                  <i class="material-icons text-success">play_arrow</i>
               </button>
               <button class="btn btn-link btn-sm">
                  <span>{{ $t('word.save') }}</span>
                  <i class="material-icons ml-1">save</i>
               </button>
            </div>
            <div v-if="workspace.breadcrumbs.database">
               {{ $t('word.schema') }}: <b>{{ workspace.breadcrumbs.database }}</b>
            </div>
         </div>
      </div>
      <div class="workspace-query-results column col-12">
         <WorkspaceQueryTable v-if="results" :results="results" />
      </div>
   </div>
</template>

<script>
import Connection from '@/ipc-api/Connection';
import QueryEditor from '@/components/QueryEditor';
import WorkspaceQueryTable from '@/components/WorkspaceQueryTable';
import { mapGetters, mapActions } from 'vuex';

export default {
   name: 'WorkspaceQueryTab',
   components: {
      QueryEditor,
      WorkspaceQueryTable
   },
   props: {
      connection: Object
   },
   data () {
      return {
         query: '',
         isQuering: false,
         results: {}
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
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification'
      }),
      async runQuery () {
         if (!this.query) return;
         this.isQuering = true;
         this.results = {};

         const params = {
            uid: this.connection.uid,
            query: this.query,
            database: this.workspace.breadcrumbs.database
         };

         try {
            const { status, response } = await Connection.rawQuery(params);
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
      }
   }

   .workspace-query-results{
      overflow: auto;
      white-space: nowrap;

      .table{
         width: auto;

         .tr:focus{
            background: rgba($color: #000000, $alpha: .3);
         }

         .th{
            position: sticky;
            top: 0;
            background: $bg-color;
            border-color: $bg-color-light;
            padding: .1rem .4rem;
            font-weight: 400;
         }

         .td{
            border-left: 1px solid;
            border-color: $bg-color-light;
            padding: 0 .4rem;
            text-overflow: ellipsis;
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;

            &:first-child{
               border-left: none;
            }
         }
      }
   }
}

</style>
