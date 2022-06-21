<template>
   <details ref="schemaAccordion" class="accordion workspace-explorebar-database">
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
                  :ref="breadcrumbs.schema === database.name && [breadcrumbs.table, breadcrumbs.view].includes(table.name) ? 'explorebarSelected' : ''"
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
                  {{ t('word.trigger', 2) }}
               </summary>
               <div class="accordion-body">
                  <div>
                     <ul class="menu menu-nav pt-0">
                        <li
                           v-for="trigger of filteredTriggers"
                           :key="trigger.name"
                           :ref="breadcrumbs.schema === database.name && breadcrumbs.trigger === trigger.name ? 'explorebarSelected' : ''"
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
                              :data-tooltip="t('word.disabled')"
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
                  @contextmenu.prevent="showMiscFolderContext($event, 'routine')"
               >
                  <i class="misc-icon mdi mdi-18px mdi-folder-sync mr-1" />
                  {{ t('word.storedRoutine', 2) }}
               </summary>
               <div class="accordion-body">
                  <div>
                     <ul class="menu menu-nav pt-0">
                        <li
                           v-for="(routine, i) of filteredProcedures"
                           :key="`${routine.name}-${i}`"
                           :ref="breadcrumbs.schema === database.name && breadcrumbs.routine === routine.name ? 'explorebarSelected' : ''"
                           class="menu-item"
                           :class="{'selected': breadcrumbs.schema === database.name && breadcrumbs.routine === routine.name}"
                           @mousedown.left="selectMisc({schema: database.name, misc: routine, type: 'routine'})"
                           @dblclick="openMiscPermanentTab({schema: database.name, misc: routine, type: 'routine'})"
                           @contextmenu.prevent="showMiscContext($event, {...routine, type: 'routine'})"
                        >
                           <a class="table-name">
                              <i class="table-icon mdi mdi-sync-circle mdi-18px mr-1" />
                              <span v-html="highlightWord(routine.name)" />
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
                  {{ t('word.triggerFunction', 2) }}
               </summary>
               <div class="accordion-body">
                  <div>
                     <ul class="menu menu-nav pt-0">
                        <li
                           v-for="(func, i) of filteredTriggerFunctions"
                           :key="`${func.name}-${i}`"
                           :ref="breadcrumbs.schema === database.name && breadcrumbs.triggerFunction === func.name ? 'explorebarSelected' : ''"
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
                  {{ t('word.function', 2) }}
               </summary>
               <div class="accordion-body">
                  <div>
                     <ul class="menu menu-nav pt-0">
                        <li
                           v-for="(func, i) of filteredFunctions"
                           :key="`${func.name}-${i}`"
                           :ref="breadcrumbs.schema === database.name && breadcrumbs.function === func.name ? 'explorebarSelected' : ''"
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
                  {{ t('word.scheduler', 2) }}
               </summary>
               <div class="accordion-body">
                  <div>
                     <ul class="menu menu-nav pt-0">
                        <li
                           v-for="scheduler of filteredSchedulers"
                           :key="scheduler.name"
                           :ref="breadcrumbs.schema === database.name && breadcrumbs.scheduler === scheduler.name ? 'explorebarSelected' : ''"
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
                              :data-tooltip="t('word.disabled')"
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

<script setup lang="ts">
import { computed, Prop, Ref, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings';
import { Breadcrumb, useWorkspacesStore, WorkspaceStructure } from '@/stores/workspaces';
import { formatBytes } from 'common/libs/formatBytes';
import { EventInfos, FunctionInfos, RoutineInfos, TableInfos, TriggerFunctionInfos, TriggerInfos } from 'common/interfaces/antares';

const { t } = useI18n();

const props = defineProps({
   database: Object as Prop<WorkspaceStructure>,
   connection: Object
});

const emit = defineEmits([
   'show-schema-context',
   'show-table-context',
   'show-misc-context',
   'show-misc-folder-context'
]);

const settingsStore = useSettingsStore();
const workspacesStore = useWorkspacesStore();

const { applicationTheme } = storeToRefs(settingsStore);

const {
   getLoadedSchemas,
   getWorkspace,
   getSearchTerm,
   changeBreadcrumbs,
   addLoadedSchema,
   newTab,
   refreshSchema
} = workspacesStore;

const schemaAccordion: Ref<HTMLDetailsElement> = ref(null);
const explorebarSelected: Ref<HTMLElement[]> = ref(null);
const isLoading = ref(false);

const searchTerm = computed(() => {
   return getSearchTerm(props.connection.uid);
});

const filteredTables = computed(() => {
   return props.database.tables.filter(table => table.name.search(searchTerm.value) >= 0);
});

const filteredTriggers = computed(() => {
   return props.database.triggers.filter(trigger => trigger.name.search(searchTerm.value) >= 0);
});

const filteredProcedures = computed(() => {
   return props.database.procedures.filter(procedure => procedure.name.search(searchTerm.value) >= 0);
});

const filteredFunctions = computed(() => {
   return props.database.functions.filter(func => func.name.search(searchTerm.value) >= 0);
});

const filteredTriggerFunctions = computed(() => {
   return props.database.triggerFunctions
      ? props.database.triggerFunctions.filter(func => func.name.search(searchTerm.value) >= 0)
      : [];
});

const filteredSchedulers = computed(() => {
   return props.database.schedulers.filter(scheduler => scheduler.name.search(searchTerm.value) >= 0);
});

const workspace = computed(() => {
   return getWorkspace(props.connection.uid);
});

const breadcrumbs = computed(() => {
   return workspace.value.breadcrumbs;
});

const customizations = computed(() => {
   return workspace.value.customizations;
});

const loadedSchemas = computed(() => {
   return getLoadedSchemas(props.connection.uid);
});

const maxSize = computed(() => {
   return props.database.tables.reduce((acc: number, curr) => {
      if (curr.size && curr.size > acc) acc = curr.size;
      return acc;
   }, 0);
});

watch(breadcrumbs, (newVal, oldVal) => {
   if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
      setTimeout(() => {
         const element = explorebarSelected.value ? explorebarSelected.value[0] : null;
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
});

const selectSchema = async (schema: string) => {
   if (!loadedSchemas.value.has(schema) && !isLoading.value) {
      isLoading.value = true;
      setBreadcrumbs({ schema });
      await refreshSchema({ uid: props.connection.uid, schema });
      addLoadedSchema(schema);
      isLoading.value = false;
   }
};

const selectTable = ({ schema, table }: { schema: string; table: TableInfos }) => {
   newTab({
      uid: props.connection.uid,
      elementName: table.name,
      schema: props.database.name,
      type: 'temp-data',
      elementType: table.type
   });

   setBreadcrumbs({ schema, [table.type]: table.name });
};

const selectMisc = ({ schema, misc, type }: { schema: string; misc: { name: string }; type: 'trigger' | 'triggerFunction' | 'function' | 'routine' | 'scheduler' }) => {
   const miscTempTabs = {
      trigger: 'temp-trigger-props',
      triggerFunction: 'temp-trigger-function-props',
      function: 'temp-function-props',
      routine: 'temp-routine-props',
      scheduler: 'temp-scheduler-props'
   };

   newTab({
      uid: props.connection.uid,
      elementName: misc.name,
      schema: props.database.name,
      type: miscTempTabs[type],
      elementType: type
   });

   setBreadcrumbs({ schema, [type]: misc.name });
};

const openDataTab = ({ schema, table }: { schema: string; table: TableInfos }) => {
   newTab({ uid: props.connection.uid, elementName: table.name, schema: props.database.name, type: 'data', elementType: table.type });
   setBreadcrumbs({ schema, [table.type]: table.name });
};

const openMiscPermanentTab = ({ schema, misc, type }: { schema: string; misc: { name: string }; type: 'trigger' | 'triggerFunction' | 'function' | 'routine' | 'scheduler' }) => {
   const miscTabs = {
      trigger: 'trigger-props',
      triggerFunction: 'trigger-function-props',
      function: 'function-props',
      routine: 'routine-props',
      scheduler: 'scheduler-props'
   };

   newTab({
      uid: props.connection.uid,
      elementName: misc.name,
      schema: props.database.name,
      type: miscTabs[type],
      elementType: type
   });
   setBreadcrumbs({ schema, [type]: misc.name });
};

const showSchemaContext = (event: MouseEvent, schema: string) => {
   emit('show-schema-context', { event, schema });
};

const showTableContext = (event: MouseEvent, table: TableInfos) => {
   emit('show-table-context', { event, schema: props.database.name, table });
};

const showMiscContext = (event: MouseEvent, misc: TriggerInfos | TriggerFunctionInfos | RoutineInfos | FunctionInfos | EventInfos) => {
   emit('show-misc-context', { event, schema: props.database.name, misc });
};

const showMiscFolderContext = (event: MouseEvent, type: string) => {
   emit('show-misc-folder-context', { event, schema: props.database.name, type });
};

const piePercentage = (val: number) => {
   const perc = val / maxSize.value * 100;
   if (applicationTheme.value === 'dark')
      return { background: `conic-gradient(lime ${perc}%, white 0)` };
   else
      return { background: `conic-gradient(teal ${perc}%, silver 0)` };
};

const setBreadcrumbs = (payload: Breadcrumb) => {
   if (breadcrumbs.value.schema === payload.schema && breadcrumbs.value.table === payload.table) return;
   changeBreadcrumbs(payload);
};

const highlightWord = (string: string) => {
   string = string.replaceAll('<', '&lt;').replaceAll('>', '&gt;');

   if (searchTerm.value) {
      const regexp = new RegExp(`(${searchTerm.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return string.replace(regexp, '<span class="text-primary">$1</span>');
   }
   else
      return string;
};

const checkLoadingStatus = (name: string, type: string) => {
   return workspace.value.loadingElements.some(el =>
      el.name === name &&
      el.type === type &&
      el.schema === props.database.name);
};

defineExpose({ selectSchema, schemaAccordion });
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
