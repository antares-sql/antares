<template>
   <details class="accordion workspace-explorebar-database">
      <summary class="accordion-header database-name pb-0">
         <i class="icon material-icons md-18 mr-1">navigate_next</i>
         <i class="material-icons md-18 mr-1">view_agenda</i>
         <span>{{ database.dbName }}</span>
      </summary>
      <div class="accordion-body">
         <div class="database-bables">
            <ul class="menu menu-nav pt-0">
               <li
                  v-for="table of database.tables"
                  :key="table.TABLE_NAME"
                  class="menu-item"
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
export default {
   name: 'WorkspaceExploreBarDatabase',
   props: {
      database: Object
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
      }

      .database-bables{
         margin-left: 1.2rem;
      }
   }
</style>
