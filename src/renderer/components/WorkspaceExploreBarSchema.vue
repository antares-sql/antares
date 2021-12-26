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
         <div class="">
            <span>{{ database.name }}</span>
            <div
               v-if="database.size"
               class="schema-size tooltip tooltip-left mr-1"
               :data-tooltip="formatBytes(database.size)"
            >
               <i class="mdi mdi-information-outline pr-2" />
            </div>
         </div>
      </summary>
      <div class="accordion-body">
         <div class="database-tables">
            <ul class="menu menu-nav pt-0">
               <li
                  v-for="table of filteredTables"
                  :ref="breadcrumbs.schema === database.name && [breadcrumbs.table, breadcrumbs.view].includes(table.name) ? 'explorebar-selected' : ''"
                  :key="table.name"
                  class="menu-item"
                  :class="{'selected': breadcrumbs.schema === database.name && [breadcrumbs.table, breadcrumbs.view].includes(table.name)}"
                  @mousedown.left="selectTable({schema: database.name, table})"
                  @dblclick="openDataTab({schema: database.name, table})"
                  @contextmenu.prevent="showTableContext($event, table)"
               >
                  <a class="table-name">
                     <div v-if="checkLoadingStatus(table.name, 'table')" class="icon loading mr-1" />
                     <i
                        v-else
                        class="table-icon mdi mdi-18px mr-1"
                        :class="table.type === 'view' ? 'mdi-table-eye' : 'mdi-table'"
                     />
                     <span v-html="highlightWord(table.name)" />
                  </a>
                  <div
                     v-if="table.type === 'table' && table.size !== false"
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
                           :ref="breadcrumbs.schema === database.name && breadcrumbs.trigger === trigger.name ? 'explorebar-selected' : ''"
                           class="menu-item"
                           :class="{'selected': breadcrumbs.schema === database.name && breadcrumbs.trigger === trigger.name}"
                           @mousedown.left="selectMisc({schema: database.name, misc: trigger, type: 'trigger'})"
                           @dblclick="openMiscPermanentTab({schema: database.name, misc: trigger, type: 'trigger'})"
                           @contextmenu.prevent="showMiscContext($event, {...trigger, type: 'trigger'})"
                        >
                           <a class="table-name">
                              <div v-if="checkLoadingStatus(trigger.name, 'trigger')" class="icon loading mr-1" />
                              <i v-else class="table-icon mdi mdi-table-cog mdi-18px mr-1" />
                              <span v-html="highlightWord(trigger.name)" />
                           </a>
                           <div
                              v-if="trigger.enabled === false"
                              class="tooltip tooltip-left disabled-indicator"
                              :data-tooltip="$t('word.disabled')"
                           >
                              <i class="table-icon mdi mdi-pause mdi-18px mr-1" />
                           </div>
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
                  :class="{'text-bold': breadcrumbs.schema === database.name && breadcrumbs.routine}"
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
                           :ref="breadcrumbs.schema === database.name && breadcrumbs.routine === procedure.name ? 'explorebar-selected' : ''"
                           class="menu-item"
                           :class="{'selected': breadcrumbs.schema === database.name && breadcrumbs.routine === procedure.name}"
                           @mousedown.left="selectMisc({schema: database.name, misc: procedure, type: 'routine'})"
                           @dblclick="openMiscPermanentTab({schema: database.name, misc: procedure, type: 'routine'})"
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
                           :ref="breadcrumbs.schema === database.name && breadcrumbs.triggerFunction === func.name ? 'explorebar-selected' : ''"
                           class="menu-item"
                           :class="{'selected': breadcrumbs.schema === database.name && breadcrumbs.triggerFunction === func.name}"
                           @mousedown.left="selectMisc({schema: database.name, misc: func, type: 'triggerFunction'})"
                           @dblclick="openMiscPermanentTab({schema: database.name, misc: func, type: 'triggerFunction'})"
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
                           :ref="breadcrumbs.schema === database.name && breadcrumbs.function === func.name ? 'explorebar-selected' : ''"
                           class="menu-item"
                           :class="{'selected': breadcrumbs.schema === database.name && breadcrumbs.function === func.name}"
                           @mousedown.left="selectMisc({schema: database.name, misc: func, type: 'function'})"
                           @dblclick="openMiscPermanentTab({schema: database.name, misc: func, type: 'function'})"
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
                           :ref="breadcrumbs.schema === database.name && breadcrumbs.scheduler === scheduler.name ? 'explorebar-selected' : ''"
                           class="menu-item"
                           :class="{'selected': breadcrumbs.schema === database.name && breadcrumbs.scheduler === scheduler.name}"
                           @mousedown.left="selectMisc({schema: database.name, misc: scheduler, type: 'scheduler'})"
                           @dblclick="openMiscPermanentTab({schema: database.name, misc: scheduler, type: 'scheduler'})"
                           @contextmenu.prevent="showMiscContext($event, {...scheduler, type: 'scheduler'})"
                        >
                           <a class="table-name">
                              <div v-if="checkLoadingStatus(scheduler.name, 'scheduler')" class="icon loading mr-1" />
                              <i v-else class="table-icon mdi mdi-calendar-clock mdi-18px mr-1" />
                              <span v-html="highlightWord(scheduler.name)" />
                           </a>
                           <div
                              v-if="scheduler.enabled === false"
                              class="tooltip tooltip-left disabled-indicator"
                              :data-tooltip="$t('word.disabled')"
                           >
                              <i class="table-icon mdi mdi-pause mdi-18px mr-1" />
                           </div>
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
      workspace () {
         return this.getWorkspace(this.connection.uid);
      },
      breadcrumbs () {
         return this.workspace.breadcrumbs;
      },
      customizations () {
         return this.workspace.customizations;
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
   watch: {
      breadcrumbs (newVal, oldVal) {
         if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
            setTimeout(() => {
               const element = this.$refs['explorebar-selected'] ? this.$refs['explorebar-selected'][0] : null;
               if (element) {
                  const rect = element.getBoundingClientRect();
                  const elemTop = rect.top;
                  const elemBottom = rect.bottom;
                  const isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);

                  if (!isVisible) {
                     element.setAttribute('tabindex', '-1');
                     element.focus();
                     element.removeAttribute('tabindex');
                  }
               }
            }, 50);
         }
      }
   },
   methods: {
      ...mapActions({
         changeBreadcrumbs: 'workspaces/changeBreadcrumbs',
         addLoadedSchema: 'workspaces/addLoadedSchema',
         newTab: 'workspaces/newTab',
         refreshSchema: 'workspaces/refreshSchema'
      }),
      formatBytes,
      async selectSchema (schema) {
         if (!this.loadedSchemas.has(schema) && !this.isLoading) {
            this.isLoading = true;
            await this.refreshSchema({ uid: this.connection.uid, schema });
            this.addLoadedSchema(schema);
            this.isLoading = false;
         }
      },
      selectTable ({ schema, table }) {
         this.newTab({
            uid: this.connection.uid,
            elementName: table.name,
            schema: this.database.name,
            type: 'temp-data',
            elementType: table.type
         });

         this.setBreadcrumbs({ schema, [table.type]: table.name });
      },
      selectMisc ({ schema, misc, type }) {
         const miscTempTabs = {
            trigger: 'temp-trigger-props',
            triggerFunction: 'temp-trigger-function-props',
            function: 'temp-function-props',
            routine: 'temp-routine-props',
            scheduler: 'temp-scheduler-props'
         };

         this.newTab({
            uid: this.connection.uid,
            elementName: misc.name,
            schema: this.database.name,
            type: miscTempTabs[type],
            elementType: type
         });

         this.setBreadcrumbs({ schema, [type]: misc.name });
      },
      openDataTab ({ schema, table }) {
         this.newTab({ uid: this.connection.uid, elementName: table.name, schema: this.database.name, type: 'data', elementType: table.type });
         this.setBreadcrumbs({ schema, [table.type]: table.name });
      },
      openMiscPermanentTab ({ schema, misc, type }) {
         const miscTabs = {
            trigger: 'trigger-props',
            triggerFunction: 'trigger-function-props',
            function: 'function-props',
            routine: 'routine-props',
            scheduler: 'scheduler-props'
         };

         this.newTab({
            uid: this.connection.uid,
            elementName: misc.name,
            schema: this.database.name,
            type: miscTabs[type],
            elementType: type
         });
         this.setBreadcrumbs({ schema, [type]: misc.name });
      },
      showSchemaContext (event, schema) {
         this.$emit('show-schema-context', { event, schema });
      },
      showTableContext (event, table) {
         this.$emit('show-table-context', { event, schema: this.database.name, table });
      },
      showMiscContext (event, misc) {
         this.$emit('show-misc-context', { event, schema: this.database.name, misc });
      },
      showMiscFolderContext (event, type) {
         this.$emit('show-misc-folder-context', { event, schema: this.database.name, type });
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
      },
      checkLoadingStatus (name, type) {
         return this.workspace.loadingElements.some(el =>
            el.name === name &&
            el.type === type &&
            el.schema === this.database.name);
      }
   }
};
</script>

<style lang="scss">
.workspace-explorebar-database {
  .selected {
    font-weight: 700;
  }

  .database-name {
    position: sticky;
    top: 0;
    z-index: 2;

    .schema-size {
      visibility: hidden;
      width: 22.5px;
    }
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

      .schema-size {
        visibility: visible;
      }
    }
  }

  .menu-item {
    line-height: 1.2;
    position: relative;

    &:hover,
    &.selected {
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

  .schema-size,
  .table-size,
  .disabled-indicator {
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
