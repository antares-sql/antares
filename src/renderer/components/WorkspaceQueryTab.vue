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
         <table v-if="results" class="table table-hover">
            <thead>
               <tr>
                  <th v-for="field in results.fields" :key="field.name">
                     {{ field.name }}
                  </th>
               </tr>
            </thead>
            <tbody>
               <tr v-for="(row, rKey) in results.rows" :key="rKey">
                  <td
                     v-for="(col, cKey) in row"
                     :key="cKey"
                     :class="fieldType(col)"
                  >
                     {{ col }}
                  </td>
               </tr>
            </tbody>
         </table>
      </div>
   </div>
</template>

<script>
import Connection from '@/ipc-api/Connection';
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
         if (!this.query) return;
         this.results = {};
         this.resizeResults();

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
      },
      resizeResults (e) {
         const el = this.$refs.resultTable;
         const footer = document.getElementById('footer');

         if (el) {
            const size = window.innerHeight - el.getBoundingClientRect().top - footer.offsetHeight;
            el.style.height = size + 'px';
         }
      },
      fieldType (col) {
         let type = typeof col;
         if (type === 'object')
            if (col instanceof Date) type = 'date';
         if (col instanceof Uint8Array) type = 'blob';
         if (col === null) type = 'null';

         return `type-${type}`;
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
         text-overflow: ellipsis;
         max-width: 200px;
         white-space: nowrap;
         overflow: hidden;

         &.type-string{
            color: seagreen;
         }
         &.type-number{
            color: cornflowerblue;
            text-align: right;
         }
         &.type-date{
            color: coral;
         }
         &.type-blob{
            color: darkorchid;
         }
         &.type-null{
            color: gray;
            &::after{
               content: 'NULL';
            }
         }
      }
   }
}

</style>
