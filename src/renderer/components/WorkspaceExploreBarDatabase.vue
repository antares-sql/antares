<template>
   <details class="accordion workspace-explorebar-database">
      <summary
         class="accordion-header database-name pb-0"
         :class="{'text-bold': breadcrumbs.database === database.name}"
         @click="changeBreadcrumbs({database: database.name, table:null})"
      >
         <i class="icon material-icons md-18 mr-1">navigate_next</i>
         <i class="material-icons md-18 mr-1">view_agenda</i>
         <span>{{ database.name }}</span>
      </summary>
      <div class="accordion-body">
         <div class="database-bables">
            <ul class="menu menu-nav pt-0">
               <li
                  v-for="table of database.tables"
                  :key="table.TABLE_NAME"
                  class="menu-item"
                  :class="{'text-bold': breadcrumbs.database === database.name && breadcrumbs.table === table.TABLE_NAME}"
                  @click="changeBreadcrumbs({database: database.name, table: table.TABLE_NAME})"
               >
                  <a class="table-name">
                     <i class="material-icons md-18 mr-1">grid_on</i>
                     <span>{{ table.TABLE_NAME }}</span>
                  </a>
               </li>
            </ul>
         </div>
      </div>
   </details>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
   name: 'WorkspaceExploreBarDatabase',
   props: {
      database: Object,
      connection: Object
   },
   computed: {
      ...mapGetters({
         getWorkspace: 'workspaces/getWorkspace'
      }),
      breadcrumbs () {
         return this.getWorkspace(this.connection.uid).breadcrumbs;
      }
   },
   methods: {
      ...mapActions({
         changeBreadcrumbs: 'workspaces/changeBreadcrumbs'
      })
   }
};
</script>

<style lang="scss">
   .workspace-explorebar-database{
      .database-name,
      a.table-name{
         display: flex;
         align-items: center;
         padding: .1rem;
         cursor: pointer;

         > span{
            overflow: hidden;
            white-space: nowrap;
            display: block;
            text-overflow: ellipsis;
         }

         &:hover{
            color: $body-font-color;
            background: rgba($color: #FFF, $alpha: .05);
            border-radius: 2px;
         }
      }

      .database-bables{
         margin-left: 1.2rem;
      }
   }
</style>
