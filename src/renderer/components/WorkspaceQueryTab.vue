<template>
   <div class="workspace-query-tab column col-12 columns col-gapless">
      <div class="workspace-query-runner column col-12">
         <QueryEditor v-model="query" />
         <div class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <i class="material-icons text-success" @click="runQuery">play_arrow</i>
            </div>
            <div>
               Schema: <b>{{ workspace.breadcrumbs.database }}</b>
            </div>
         </div>
      </div>
      <div ref="resultTable" class="workspace-query-results column col-12">
         <table v-if="results.length" class="table table-hover">
            <thead>
               <tr>
                  <th v-for="field in fields" :key="field">
                     {{ field }}
                  </th>
               </tr>
            </thead>
            <tbody>
               <tr v-for="(row, rKey) in results" :key="rKey">
                  <td v-for="(col, cKey) in row" :key="cKey">
                     {{ col }}
                  </td>
               </tr>
            </tbody>
         </table>
      </div>
   </div>
</template>

<script>
import { ipcRenderer } from 'electron';
import QueryEditor from '@/components/QueryEditor';
import { mapGetters, mapActions } from 'vuex';

export default {
   name: 'WorkspaceQueryTab',
   components: {
      QueryEditor
   },
   props: {
      connection: Object
   },
   data () {
      return {
         query: '',
         results: []
      };
   },
   computed: {
      ...mapGetters({
         getWorkspace: 'workspaces/getWorkspace'
      }),
      workspace () {
         return this.getWorkspace(this.connection.uid);
      },
      fields () {
         return Object.keys(this.results[0]);
      }
   },
   mounted () {
      window.addEventListener('resize', this.resizeResults);
   },
   destroyed () {
      window.removeEventListener('resize', this.resizeResults);
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification'
      }),
      async runQuery () {
         this.results = [];
         this.resizeResults();

         const params = {
            connection: this.connection,
            query: this.query,
            database: this.workspace.breadcrumbs.database
         };

         try {
            ipcRenderer.send('runQuery', params);

            ipcRenderer.on('row', (event, row) => {
               this.results.push(row);
            });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }
      },
      resizeResults (e) {
         const el = this.$refs.resultTable;
         const footer = document.getElementById('footer');

         if (el) {
            const size = window.innerHeight - el.getBoundingClientRect().top - footer.offsetHeight;
            el.style.height = size + 'px';
         }
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
         padding: .2rem .6rem;
         align-items: center;

         .workspace-query-buttons{
            display: flex;
         }
      }
   }

   .workspace-query-results{
      overflow: auto;
      white-space: nowrap;

      th{
         position: sticky;
         top: 0;
         background: $bg-color;
         border-color: $bg-color-light;
      }

      td{
         border-color: $bg-color-light;
         padding: 0 .4rem;
      }
   }
}

</style>
