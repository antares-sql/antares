<template>
   <details class="accordion workspace-explorebar-database">
      <summary
         class="accordion-header database-name"
         :class="{'text-bold': breadcrumbs.schema === database.name}"
         @click="changeBreadcrumbs({schema: database.name, table: null})"
         @contextmenu.prevent="showDatabaseContext($event, database.name)"
      >
         <i class="icon mdi mdi-18px mdi-chevron-right" />
         <i class="database-icon mdi mdi-18px mdi-database mr-1" />
         <span>{{ database.name }}</span>
      </summary>
      <div class="accordion-body">
         <div class="database-tables">
            <ul class="menu menu-nav pt-0">
               <li
                  v-for="table of database.tables"
                  :key="table.name"
                  class="menu-item"
                  :class="{'text-bold': breadcrumbs.schema === database.name && [breadcrumbs.table, breadcrumbs.view].includes(table.name)}"
                  @click="setBreadcrumbs({schema: database.name, [table.type]: table.name})"
                  @contextmenu.prevent="showTableContext($event, table)"
               >
                  <a class="table-name">
                     <i class="table-icon mdi mdi-18px mr-1" :class="table.type === 'view' ? 'mdi-table-eye' : 'mdi-table'" />
                     <span>{{ table.name }}</span>
                  </a>
                  <div class="table-size  tooltip tooltip-left mr-1" :data-tooltip="formatBytes(table.size)">
                     <div class="pie" :style="piePercentage(table.size)" />
                  </div>
               </li>
            </ul>
         </div>
      </div>
   </details>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { formatBytes } from 'common/libs/formatBytes';

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
      },
      maxSize () {
         return this.database.tables.reduce((acc, curr) => {
            if (curr.size > acc) acc = curr.size;
            return acc;
         }, 0);
      },
      totalSize () {
         return this.database.tables.reduce((acc, curr) => acc + curr.size, 0);
      }
   },
   methods: {
      ...mapActions({
         changeBreadcrumbs: 'workspaces/changeBreadcrumbs'
      }),
      formatBytes,
      showDatabaseContext (event, database) {
         this.$emit('show-database-context', { event, database });
      },
      showTableContext (event, table) {
         this.$emit('show-table-context', { event, table });
      },
      piePercentage (val) {
         const perc = val / this.maxSize * 100;
         return { background: `conic-gradient(lime ${perc}%, white 0)` };
      },
      setBreadcrumbs (payload) {
         if (this.breadcrumbs.schema === payload.schema && this.breadcrumbs.table === payload.table) return;
         this.changeBreadcrumbs(payload);
      }
   }
};
</script>

<style lang="scss">
.workspace-explorebar-database {
  .database-name,
  a.table-name {
    display: flex;
    align-items: center;
    padding: 0.1rem 1rem 0.1rem 0.1rem;
    cursor: pointer;
    font-size: 0.7rem;

    > span {
      overflow: hidden;
      white-space: nowrap;
      display: block;
      text-overflow: ellipsis;
    }

    .database-icon,
    .table-icon {
      opacity: 0.7;
    }
  }

  .database-name {
    &:hover {
      color: $body-font-color;
      background: rgba($color: #fff, $alpha: 0.05);
      border-radius: 2px;
    }
  }

  a.table-name {
    &:hover {
      color: inherit;
      background: inherit;
    }
  }

  .menu-item {
    line-height: 1.2;
    position: relative;

    &:hover {
      color: $body-font-color;
      background: rgba($color: #fff, $alpha: 0.05);
      border-radius: 2px;
    }
  }

  .database-tables {
    margin-left: 1.2rem;
  }

  .table-size {
    position: absolute;
    right: 0;
    top: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    height: 100%;
    opacity: 0.2;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }

    &::after {
      font-weight: 400;
      font-size: 0.5rem;
    }

    .pie {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
}
</style>
