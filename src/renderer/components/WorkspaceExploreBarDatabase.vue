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
                  <div
                     v-if="table.type === 'table'"
                     class="table-size  tooltip tooltip-left mr-1"
                     :data-tooltip="formatBytes(table.size)"
                  >
                     <div class="pie" :style="piePercentage(table.size)" />
                  </div>
               </li>
            </ul>
         </div>

         <div v-if="database.triggers.length" class="database-misc">
            <details class="accordion">
               <summary class="accordion-header misc-name" :class="{'text-bold': breadcrumbs.schema === database.name && breadcrumbs.trigger}">
                  <i class="misc-icon mdi mdi-18px mdi-folder-cog mr-1" />
                  {{ $tc('word.trigger', 2) }}
               </summary>
               <div class="accordion-body">
                  <div>
                     <ul class="menu menu-nav pt-0">
                        <li
                           v-for="trigger of database.triggers"
                           :key="trigger.name"
                           class="menu-item"
                           :class="{'text-bold': breadcrumbs.schema === database.name && breadcrumbs.trigger === trigger.name}"
                           @click="setBreadcrumbs({schema: database.name, trigger: trigger.name})"
                           @contextmenu.prevent="showTableContext($event, trigger)"
                        >
                           <a class="table-name">
                              <i class="table-icon mdi mdi-table-cog mdi-18px mr-1" />
                              <span>{{ trigger.name }}</span>
                           </a>
                        </li>
                     </ul>
                  </div>
               </div>
            </details>
         </div>

         <div v-if="database.procedures.length" class="database-misc">
            <details class="accordion">
               <summary class="accordion-header misc-name" :class="{'text-bold': breadcrumbs.schema === database.name && breadcrumbs.procedure}">
                  <i class="misc-icon mdi mdi-18px mdi-folder-move mr-1" />
                  {{ $tc('word.storedRoutine', 2) }}
               </summary>
               <div class="accordion-body">
                  <div>
                     <ul class="menu menu-nav pt-0">
                        <li
                           v-for="procedure of database.procedures"
                           :key="procedure.name"
                           class="menu-item"
                           :class="{'text-bold': breadcrumbs.schema === database.name && breadcrumbs.procedure === procedure.name}"
                           @click="setBreadcrumbs({schema: database.name, procedure: procedure.name})"
                           @contextmenu.prevent="showTableContext($event, procedure)"
                        >
                           <a class="table-name">
                              <i class="table-icon mdi mdi-arrow-right-bold-box mdi-18px mr-1" />
                              <span>{{ procedure.name }}</span>
                           </a>
                        </li>
                     </ul>
                  </div>
               </div>
            </details>
         </div>

         <div v-if="database.schedulers.length" class="database-misc">
            <details class="accordion">
               <summary class="accordion-header misc-name" :class="{'text-bold': breadcrumbs.schema === database.name && breadcrumbs.scheduler}">
                  <i class="misc-icon mdi mdi-18px mdi-folder-clock mr-1" />
                  {{ $tc('word.scheduler', 2) }}
               </summary>
               <div class="accordion-body">
                  <div>
                     <ul class="menu menu-nav pt-0">
                        <li
                           v-for="scheduler of database.schedulers"
                           :key="scheduler.name"
                           class="menu-item"
                           :class="{'text-bold': breadcrumbs.schema === database.name && breadcrumbs.scheduler === scheduler.name}"
                           @click="setBreadcrumbs({schema: database.name, scheduler: scheduler.name})"
                           @contextmenu.prevent="showTableContext($event, scheduler)"
                        >
                           <a class="table-name">
                              <i class="table-icon mdi mdi-calendar-clock mdi-18px mr-1" />
                              <span>{{ scheduler.name }}</span>
                           </a>
                        </li>
                     </ul>
                  </div>
               </div>
            </details>
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
         this.changeBreadcrumbs({ schema: database, table: null });
         this.$emit('show-database-context', { event, database });
      },
      showTableContext (event, table) {
         this.setBreadcrumbs({ schema: this.database.name, [table.type]: table.name });
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
  .misc-name,
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
    .table-icon,
    .misc-icon {
      opacity: 0.7;
    }
  }

  .misc-name {
    line-height: 1;
    padding: 0.1rem 1rem 0.1rem 0.1rem;
    position: relative;
  }

  .database-name,
  .misc-name {
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

  .database-misc {
    margin-left: 1.6rem;

    .accordion[open] .accordion-header > .misc-icon:first-child::before {
      content: "\F0770";
    }

    .accordion-body {
      margin-bottom: 0.2rem;
    }
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
