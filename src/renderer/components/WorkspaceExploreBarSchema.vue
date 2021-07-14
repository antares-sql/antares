<template>
   <details class="accordion workspace-explorebar-database">
      <summary
         class="accordion-header database-name"
         :class="{'text-bold': breadcrumbs.schema === database.name}"
         @click="selectSchema(database.name)"
         @contextmenu.prevent="showSchemaContext($event, database.name)"
      >
         <div v-if="isLoading" class="icon loading" />
         <i v-else class="icon mdi mdi-18px mdi-chevron-right" />
         <i class="database-icon mdi mdi-18px mdi-database mr-1" />
         <span>{{ database.name }}</span>
      </summary>
      <div class="accordion-body">
         <div class="database-tables">
            <ul class="menu menu-nav pt-0">
               <li
                  v-for="table of filteredTables"
                  :key="table.name"
                  class="menu-item"
                  :class="{'text-bold': breadcrumbs.schema === database.name && [breadcrumbs.table, breadcrumbs.view].includes(table.name)}"
                  @click="selectTable({schema: database.name, table})"
                  @dblclick="openDataTab({schema: database.name, table})"
                  @contextmenu.prevent="showTableContext($event, table)"
               >
                  <a class="table-name">
                     <i class="table-icon mdi mdi-18px mr-1" :class="table.type === 'view' ? 'mdi-table-eye' : 'mdi-table'" />
                     <span v-html="highlightWord(table.name)" />
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

         <div v-if="filteredTriggers.length && customizations.triggers" class="database-misc">
            <details class="accordion">
               <summary
                  class="accordion-header misc-name"
                  :class="{'text-bold': breadcrumbs.schema === database.name && breadcrumbs.trigger}"
                  @contextmenu.prevent="showMiscFolderContext($event, 'trigger')"
               >
                  <i class="misc-icon mdi mdi-18px mdi-folder-cog mr-1" />
                  {{ $tc('word.trigger', 2) }}
               </summary>
               <div class="accordion-body">
                  <div>
                     <ul class="menu menu-nav pt-0">
                        <li
                           v-for="trigger of filteredTriggers"
                           :key="trigger.name"
                           class="menu-item"
                           :class="{'text-bold': breadcrumbs.schema === database.name && breadcrumbs.trigger === trigger.name}"
                           @click="setBreadcrumbs({schema: database.name, trigger: trigger.name})"
                           @contextmenu.prevent="showMiscContext($event, {...trigger, type: 'trigger'})"
                        >
                           <a class="table-name">
                              <i class="table-icon mdi mdi-table-cog mdi-18px mr-1" />
                              <span v-html="highlightWord(trigger.name)" />
                           </a>
                        </li>
                     </ul>
                  </div>
               </div>
            </details>
         </div>

         <div v-if="filteredProcedures.length && customizations.routines" class="database-misc">
            <details class="accordion">
               <summary
                  class="accordion-header misc-name"
                  :class="{'text-bold': breadcrumbs.schema === database.name && breadcrumbs.procedure}"
                  @contextmenu.prevent="showMiscFolderContext($event, 'procedure')"
               >
                  <i class="misc-icon mdi mdi-18px mdi-folder-sync mr-1" />
                  {{ $tc('word.storedRoutine', 2) }}
               </summary>
               <div class="accordion-body">
                  <div>
                     <ul class="menu menu-nav pt-0">
                        <li
                           v-for="(procedure, i) of filteredProcedures"
                           :key="`${procedure.name}-${i}`"
                           class="menu-item"
                           :class="{'text-bold': breadcrumbs.schema === database.name && breadcrumbs.procedure === procedure.name}"
                           @click="setBreadcrumbs({schema: database.name, procedure: procedure.name})"
                           @contextmenu.prevent="showMiscContext($event, {...procedure, type: 'procedure'})"
                        >
                           <a class="table-name">
                              <i class="table-icon mdi mdi-sync-circle mdi-18px mr-1" />
                              <span v-html="highlightWord(procedure.name)" />
                           </a>
                        </li>
                     </ul>
                  </div>
               </div>
            </details>
         </div>

         <div v-if="filteredTriggerFunctions.length && customizations.triggerFunctions" class="database-misc">
            <details class="accordion">
               <summary
                  class="accordion-header misc-name"
                  :class="{'text-bold': breadcrumbs.schema === database.name && breadcrumbs.triggerFunction}"
                  @contextmenu.prevent="showMiscFolderContext($event, 'triggerFunction')"
               >
                  <i class="misc-icon mdi mdi-18px mdi-folder-refresh mr-1" />
                  {{ $tc('word.triggerFunction', 2) }}
               </summary>
               <div class="accordion-body">
                  <div>
                     <ul class="menu menu-nav pt-0">
                        <li
                           v-for="(func, i) of filteredTriggerFunctions"
                           :key="`${func.name}-${i}`"
                           class="menu-item"
                           :class="{'text-bold': breadcrumbs.schema === database.name && breadcrumbs.triggerFunction === func.name}"
                           @click="setBreadcrumbs({schema: database.name, triggerFunction: func.name})"
                           @contextmenu.prevent="showMiscContext($event, {...func, type: 'triggerFunction'})"
                        >
                           <a class="table-name">
                              <i class="table-icon mdi mdi-cog-clockwise mdi-18px mr-1" />
                              <span v-html="highlightWord(func.name)" />
                           </a>
                        </li>
                     </ul>
                  </div>
               </div>
            </details>
         </div>

         <div v-if="filteredFunctions.length && customizations.functions" class="database-misc">
            <details class="accordion">
               <summary
                  class="accordion-header misc-name"
                  :class="{'text-bold': breadcrumbs.schema === database.name && breadcrumbs.function}"
                  @contextmenu.prevent="showMiscFolderContext($event, 'function')"
               >
                  <i class="misc-icon mdi mdi-18px mdi-folder-move mr-1" />
                  {{ $tc('word.function', 2) }}
               </summary>
               <div class="accordion-body">
                  <div>
                     <ul class="menu menu-nav pt-0">
                        <li
                           v-for="(func, i) of filteredFunctions"
                           :key="`${func.name}-${i}`"
                           class="menu-item"
                           :class="{'text-bold': breadcrumbs.schema === database.name && breadcrumbs.function === func.name}"
                           @click="setBreadcrumbs({schema: database.name, function: func.name})"
                           @contextmenu.prevent="showMiscContext($event, {...func, type: 'function'})"
                        >
                           <a class="table-name">
                              <i class="table-icon mdi mdi-arrow-right-bold-box mdi-18px mr-1" />
                              <span v-html="highlightWord(func.name)" />
                           </a>
                        </li>
                     </ul>
                  </div>
               </div>
            </details>
         </div>

         <div v-if="filteredSchedulers.length && customizations.schedulers" class="database-misc">
            <details class="accordion">
               <summary
                  class="accordion-header misc-name"
                  :class="{'text-bold': breadcrumbs.schema === database.name && breadcrumbs.scheduler}"
                  @contextmenu.prevent="showMiscFolderContext($event, 'scheduler')"
               >
                  <i class="misc-icon mdi mdi-18px mdi-folder-clock mr-1" />
                  {{ $tc('word.scheduler', 2) }}
               </summary>
               <div class="accordion-body">
                  <div>
                     <ul class="menu menu-nav pt-0">
                        <li
                           v-for="scheduler of filteredSchedulers"
                           :key="scheduler.name"
                           class="menu-item"
                           :class="{'text-bold': breadcrumbs.schema === database.name && breadcrumbs.scheduler === scheduler.name}"
                           @click="setBreadcrumbs({schema: database.name, scheduler: scheduler.name})"
                           @contextmenu.prevent="showMiscContext($event, {...scheduler, type: 'scheduler'})"
                        >
                           <a class="table-name">
                              <i class="table-icon mdi mdi-calendar-clock mdi-18px mr-1" />
                              <span v-html="highlightWord(scheduler.name)" />
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
   name: 'WorkspaceExploreBarSchema',
   props: {
      database: Object,
      connection: Object
   },
   data () {
      return {
         isLoading: false
      };
   },
   computed: {
      ...mapGetters({
         getLoadedSchemas: 'workspaces/getLoadedSchemas',
         getWorkspace: 'workspaces/getWorkspace',
         getSearchTerm: 'workspaces/getSearchTerm',
         applicationTheme: 'settings/getApplicationTheme'
      }),
      searchTerm () {
         return this.getSearchTerm(this.connection.uid);
      },
      filteredTables () {
         return this.database.tables.filter(table => table.name.search(this.searchTerm) >= 0);
      },
      filteredTriggers () {
         return this.database.triggers.filter(trigger => trigger.name.search(this.searchTerm) >= 0);
      },
      filteredProcedures () {
         return this.database.procedures.filter(procedure => procedure.name.search(this.searchTerm) >= 0);
      },
      filteredFunctions () {
         return this.database.functions.filter(func => func.name.search(this.searchTerm) >= 0);
      },
      filteredTriggerFunctions () {
         return this.database.triggerFunctions
            ? this.database.triggerFunctions.filter(func => func.name.search(this.searchTerm) >= 0)
            : [];
      },
      filteredSchedulers () {
         return this.database.schedulers.filter(scheduler => scheduler.name.search(this.searchTerm) >= 0);
      },
      breadcrumbs () {
         return this.getWorkspace(this.connection.uid).breadcrumbs;
      },
      customizations () {
         return this.getWorkspace(this.connection.uid).customizations;
      },
      loadedSchemas () {
         return this.getLoadedSchemas(this.connection.uid);
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
         changeBreadcrumbs: 'workspaces/changeBreadcrumbs',
         newTab: 'workspaces/newTab',
         refreshSchema: 'workspaces/refreshSchema'
      }),
      formatBytes,
      async selectSchema (schema) {
         if (!this.loadedSchemas.has(schema) && !this.isLoading) {
            this.isLoading = true;
            await this.refreshSchema({ uid: this.connection.uid, schema });
            this.isLoading = false;
         }

         this.changeBreadcrumbs({ schema, table: null });
      },
      selectTable ({ schema, table }) {
         this.newTab({ uid: this.connection.uid, table: table.name, schema: this.database.name, type: 'temp-data', element: table.type });
         this.setBreadcrumbs({ schema, [table.type]: table.name });
      },
      openDataTab ({ schema, table }) {
         this.newTab({ uid: this.connection.uid, table: table.name, schema: this.database.name, type: 'data', element: table.type });
         this.setBreadcrumbs({ schema, [table.type]: table.name });
      },
      showSchemaContext (event, schema) {
         this.selectSchema(schema);
         this.$emit('show-schema-context', { event, schema });
      },
      showTableContext (event, table) {
         this.setBreadcrumbs({ schema: this.database.name, [table.type]: table.name });
         this.$emit('show-table-context', { event, table });
      },
      showMiscContext (event, misc) {
         this.setBreadcrumbs({ schema: this.database.name, [misc.type]: misc.name });
         this.$emit('show-misc-context', { event, misc });
      },
      showMiscFolderContext (event, type) {
         this.selectSchema(this.database.name);
         this.setBreadcrumbs({ schema: this.database.name, type });
         this.$emit('show-misc-folder-context', { event, type });
      },
      piePercentage (val) {
         const perc = val / this.maxSize * 100;
         if (this.applicationTheme === 'dark')
            return { background: `conic-gradient(lime ${perc}%, white 0)` };
         else
            return { background: `conic-gradient(teal ${perc}%, silver 0)` };
      },
      setBreadcrumbs (payload) {
         if (this.breadcrumbs.schema === payload.schema && this.breadcrumbs.table === payload.table) return;
         this.changeBreadcrumbs(payload);
      },
      highlightWord (string) {
         string = string.replaceAll('<', '&lt;').replaceAll('>', '&gt;');

         if (this.searchTerm) {
            const regexp = new RegExp(`(${this.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return string.replace(regexp, '<span class="text-primary">$1</span>');
         }
         else
            return string;
      }
   }
};
</script>

<style lang="scss">
.workspace-explorebar-database {
  .database-name {
    position: sticky;
    top: 0;
    z-index: 2;
  }

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

    .loading {
      height: 18px;
      width: 18px;

      &::after {
        height: 0.6rem;
        width: 0.6rem;
      }
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
      border-radius: $border-radius;
    }
  }

  .menu-item {
    line-height: 1.2;
    position: relative;

    &:hover {
      border-radius: $border-radius;
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
