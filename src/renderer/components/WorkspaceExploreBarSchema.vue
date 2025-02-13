<template>
   <details ref="schemaAccordion" class="accordion workspace-explorebar-database">
      <summary
         class="accordion-header database-name"
         :class="{'text-bold': breadcrumbs.schema === database.name}"
         @click="selectSchema(database.name)"
         @contextmenu.prevent="showSchemaContext($event, database.name)"
      >
         <div v-if="isLoading" class="icon loading" />
         <BaseIcon
            v-else
            class="icon"
            icon-name="mdiChevronRight"
            :size="18"
         />
         <BaseIcon
            class="database-icon mr-1"
            icon-name="mdiDatabase"
            :size="18"
         />
         <div class="">
            <span v-html="highlightWord(database.name, 'schemas')" />
            <div
               v-if="database.size"
               class="schema-size tooltip tooltip-left mr-1"
               :data-tooltip="formatBytes(database.size)"
            >
               <BaseIcon
                  class="mr-2"
                  icon-name="mdiInformationOutline"
                  :size="18"
               />
            </div>
         </div>
      </summary>
      <div class="accordion-body">
         <div class="database-tables">
            <ul class="menu menu-nav pt-0">
               <li
                  v-for="table of filteredTables"
                  :key="table.name"
                  class="menu-item"
                  :class="{'selected': breadcrumbs.schema === database.name && [breadcrumbs.table, breadcrumbs.view].includes(table.name)}"
                  @mousedown.left="selectTable({schema: database.name, table})"
                  @dblclick="openDataTab({schema: database.name, table})"
                  @contextmenu.prevent="showTableContext($event, table)"
               >
                  <a class="table-name">
                     <div v-if="checkLoadingStatus(table.name, 'table')" class="icon loading mr-1" />
                     <BaseIcon
                        v-else
                        class="table-icon mr-1"
                        :icon-name="table.type === 'view' ? 'mdiTableEye' : 'mdiTable'"
                        :size="18"
                        :style="`min-width: 18px`"
                     />
                     <span v-html="highlightWord(table.name)" />
                  </a>
                  <div
                     v-if="table.type === 'table' && table.size !== false && !isNaN(table.size)"
                     class="table-size  tooltip tooltip-left mr-1"
                     :data-tooltip="formatBytes(table.size)"
                  >
                     <div class="pie" :style="piePercentage(table.size)" />
                  </div>
               </li>
            </ul>
         </div>

         <div v-if="filteredViews.length" class="database-misc">
            <details class="accordion">
               <summary
                  class="accordion-header misc-name"
                  :class="{'text-bold': breadcrumbs.schema === database.name && breadcrumbs.trigger}"
                  @contextmenu.prevent="showMiscFolderContext($event, 'view')"
               >
                  <BaseIcon
                     class="misc-icon mr-1"
                     icon-name="mdiFolderEye"
                     :size="18"
                  />
                  <BaseIcon
                     class="misc-icon open-folder mr-1"
                     icon-name="mdiFolderOpen"
                     :size="18"
                  />
                  {{ t('database.view', 2) }}
               </summary>
               <div class="accordion-body">
                  <div>
                     <ul class="menu menu-nav pt-0">
                        <li
                           v-for="view of filteredViews"
                           :key="view.name"
                           class="menu-item"
                           :class="{'selected': breadcrumbs.schema === database.name && breadcrumbs.view === view.name}"
                           @mousedown.left="selectTable({schema: database.name, table: view})"
                           @dblclick="openDataTab({schema: database.name, table: view})"
                           @contextmenu.prevent="showTableContext($event, view)"
                        >
                           <a class="table-name">
                              <div v-if="checkLoadingStatus(view.name, 'table')" class="icon loading mr-1" />
                              <BaseIcon
                                 v-else
                                 class="table-icon mr-1"
                                 icon-name="mdiTableEye"
                                 :size="18"
                                 :style="`min-width: 18px`"
                              />
                              <span v-html="highlightWord(view.name)" />
                           </a>
                        </li>
                     </ul>
                  </div>
               </div>
            </details>
         </div>

         <div v-if="filteredMatViews.length && customizations.materializedViews" class="database-misc">
            <details class="accordion">
               <summary
                  class="accordion-header misc-name"
                  :class="{'text-bold': breadcrumbs.schema === database.name && breadcrumbs.trigger}"
                  @contextmenu.prevent="showMiscFolderContext($event, 'materializedView')"
               >
                  <BaseIcon
                     class="misc-icon mr-1"
                     icon-name="mdiFolderEye"
                     :size="18"
                  />
                  <BaseIcon
                     class="misc-icon open-folder mr-1"
                     icon-name="mdiFolderOpen"
                     :size="18"
                  />
                  {{ t('database.materializedView', 2) }}
               </summary>
               <div class="accordion-body">
                  <div>
                     <ul class="menu menu-nav pt-0">
                        <li
                           v-for="view of filteredMatViews"
                           :key="view.name"
                           class="menu-item"
                           :class="{'selected': breadcrumbs.schema === database.name && breadcrumbs.view === view.name}"
                           @mousedown.left="selectTable({schema: database.name, table: view})"
                           @dblclick="openDataTab({schema: database.name, table: view})"
                           @contextmenu.prevent="showTableContext($event, view)"
                        >
                           <a class="table-name">
                              <div v-if="checkLoadingStatus(view.name, 'table')" class="icon loading mr-1" />
                              <BaseIcon
                                 v-else
                                 class="table-icon mr-1"
                                 icon-name="mdiTableEye"
                                 :size="18"
                                 :style="`min-width: 18px`"
                              />
                              <span v-html="highlightWord(view.name)" />
                           </a>
                        </li>
                     </ul>
                  </div>
               </div>
            </details>
         </div>

         <div v-if="filteredTriggers.length && customizations.triggers" class="database-misc">
            <details class="accordion">
               <summary
                  class="accordion-header misc-name"
                  :class="{'text-bold': breadcrumbs.schema === database.name && breadcrumbs.trigger}"
                  @contextmenu.prevent="showMiscFolderContext($event, 'trigger')"
               >
                  <BaseIcon
                     class="misc-icon mr-1"
                     icon-name="mdiFolderCog"
                     :size="18"
                  />
                  <BaseIcon
                     class="misc-icon open-folder mr-1"
                     icon-name="mdiFolderOpen"
                     :size="18"
                  />
                  {{ t('database.trigger', 2) }}
               </summary>
               <div class="accordion-body">
                  <div>
                     <ul class="menu menu-nav pt-0">
                        <li
                           v-for="trigger of filteredTriggers"
                           :key="trigger.name"
                           class="menu-item"
                           :class="{'selected': breadcrumbs.schema === database.name && breadcrumbs.trigger === trigger.name}"
                           @mousedown.left="selectMisc({schema: database.name, misc: trigger, type: 'trigger'})"
                           @dblclick="openMiscPermanentTab({schema: database.name, misc: trigger, type: 'trigger'})"
                           @contextmenu.prevent="showMiscContext($event, {...trigger, type: 'trigger'})"
                        >
                           <a class="table-name">
                              <div v-if="checkLoadingStatus(trigger.name, 'trigger')" class="icon loading mr-1" />
                              <BaseIcon
                                 v-else
                                 class="table-icon mr-1"
                                 icon-name="mdiTableCog"
                                 :size="18"
                                 :style="`min-width: 18px`"
                              />
                              <span v-html="highlightWord(trigger.name)" />
                           </a>
                           <div
                              v-if="trigger.enabled === false"
                              class="tooltip tooltip-left disabled-indicator"
                              :data-tooltip="t('general.disabled')"
                           >
                              <BaseIcon
                                 class="table-icon mr-1"
                                 icon-name="mdiPause"
                                 :size="18"
                              />
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
                  <BaseIcon
                     class="misc-icon mr-1"
                     icon-name="mdiFolderSync"
                     :size="18"
                  />
                  <BaseIcon
                     class="misc-icon open-folder mr-1"
                     icon-name="mdiFolderOpen"
                     :size="18"
                  />
                  {{ t('database.storedRoutine', 2) }}
               </summary>
               <div class="accordion-body">
                  <div>
                     <ul class="menu menu-nav pt-0">
                        <li
                           v-for="(routine, i) of filteredProcedures"
                           :key="`${routine.name}-${i}`"
                           class="menu-item"
                           :class="{'selected': breadcrumbs.schema === database.name && breadcrumbs.routine === routine.name}"
                           @mousedown.left="selectMisc({schema: database.name, misc: routine, type: 'routine'})"
                           @dblclick="openMiscPermanentTab({schema: database.name, misc: routine, type: 'routine'})"
                           @contextmenu.prevent="showMiscContext($event, {...routine, type: 'routine'})"
                        >
                           <a class="table-name">
                              <BaseIcon
                                 class="table-icon mr-1"
                                 icon-name="mdiSyncCircle"
                                 :size="18"
                                 :style="`min-width: 18px`"
                              />
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
                  <BaseIcon
                     class="misc-icon mr-1"
                     icon-name="mdiFolderRefresh"
                     :size="18"
                     :style="`min-width: 18px`"
                  />
                  <BaseIcon
                     class="misc-icon open-folder mr-1"
                     icon-name="mdiFolderOpen"
                     :size="18"
                  />
                  {{ t('database.triggerFunction', 2) }}
               </summary>
               <div class="accordion-body">
                  <div>
                     <ul class="menu menu-nav pt-0">
                        <li
                           v-for="(func, i) of filteredTriggerFunctions"
                           :key="`${func.name}-${i}`"
                           class="menu-item"
                           :class="{'selected': breadcrumbs.schema === database.name && breadcrumbs.triggerFunction === func.name}"
                           @mousedown.left="selectMisc({schema: database.name, misc: func, type: 'triggerFunction'})"
                           @dblclick="openMiscPermanentTab({schema: database.name, misc: func, type: 'triggerFunction'})"
                           @contextmenu.prevent="showMiscContext($event, {...func, type: 'triggerFunction'})"
                        >
                           <a class="table-name">
                              <BaseIcon
                                 class="misc-icon mr-1"
                                 icon-name="mdiCogClockwise"
                                 :size="18"
                              />
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
                  <BaseIcon
                     class="misc-icon mr-1"
                     icon-name="mdiFolderMove"
                     :size="18"
                  />
                  <BaseIcon
                     class="misc-icon open-folder mr-1"
                     icon-name="mdiFolderOpen"
                     :size="18"
                  />
                  {{ t('database.function', 2) }}
               </summary>
               <div class="accordion-body">
                  <div>
                     <ul class="menu menu-nav pt-0">
                        <li
                           v-for="(func, i) of filteredFunctions"
                           :key="`${func.name}-${i}`"
                           class="menu-item"
                           :class="{'selected': breadcrumbs.schema === database.name && breadcrumbs.function === func.name}"
                           @mousedown.left="selectMisc({schema: database.name, misc: func, type: 'function'})"
                           @dblclick="openMiscPermanentTab({schema: database.name, misc: func, type: 'function'})"
                           @contextmenu.prevent="showMiscContext($event, {...func, type: 'function'})"
                        >
                           <a class="table-name">
                              <BaseIcon
                                 class="misc-icon mr-1"
                                 icon-name="mdiArrowRightBoldBox"
                                 :size="18"
                                 :style="`min-width: 18px`"
                              />
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
                  <BaseIcon
                     class="misc-icon mr-1"
                     icon-name="mdiFolderClock"
                     :size="18"
                  />
                  <BaseIcon
                     class="misc-icon open-folder mr-1"
                     icon-name="mdiFolderOpen"
                     :size="18"
                  />
                  {{ t('database.scheduler', 2) }}
               </summary>
               <div class="accordion-body">
                  <div>
                     <ul class="menu menu-nav pt-0">
                        <li
                           v-for="scheduler of filteredSchedulers"
                           :key="scheduler.name"
                           class="menu-item"
                           :class="{'selected': breadcrumbs.schema === database.name && breadcrumbs.scheduler === scheduler.name}"
                           @mousedown.left="selectMisc({schema: database.name, misc: scheduler, type: 'scheduler'})"
                           @dblclick="openMiscPermanentTab({schema: database.name, misc: scheduler, type: 'scheduler'})"
                           @contextmenu.prevent="showMiscContext($event, {...scheduler, type: 'scheduler'})"
                        >
                           <a class="table-name">
                              <div v-if="checkLoadingStatus(scheduler.name, 'scheduler')" class="icon loading mr-1" />
                              <BaseIcon
                                 class="misc-icon mr-1"
                                 icon-name="mdiCalendarClock"
                                 :size="18"
                                 :style="`min-width: 18px`"
                              />
                              <span v-html="highlightWord(scheduler.name)" />
                           </a>
                           <div
                              v-if="scheduler.enabled === false"
                              class="tooltip tooltip-left disabled-indicator"
                              :data-tooltip="t('general.disabled')"
                           >
                              <BaseIcon
                                 class="misc-icon mr-1"
                                 icon-name="mdiPause"
                                 :size="18"
                              />
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
import { EventInfos, FunctionInfos, RoutineInfos, TableInfos, TriggerFunctionInfos, TriggerInfos } from 'common/interfaces/antares';
import { formatBytes } from 'common/libs/formatBytes';
import { storeToRefs } from 'pinia';
import { computed, Prop, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import { useSettingsStore } from '@/stores/settings';
import { Breadcrumb, useWorkspacesStore, WorkspaceStructure } from '@/stores/workspaces';

const { t } = useI18n();

const props = defineProps({
   database: Object as Prop<WorkspaceStructure>,
   connection: Object,
   searchMethod: String as Prop<'elements' | 'schemas'>
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
const isLoading = ref(false);

const searchTerm = computed(() => {
   return getSearchTerm(props.connection.uid);
});

const filteredTables = computed(() => {
   if (props.searchMethod === 'elements') {
      const searchTermLower = searchTerm.value.toLowerCase();
      return props.database.tables.filter(table =>
         table.name.toLowerCase().includes(searchTermLower) && table.type === 'table'
      );
   }
   else
      return props.database.tables;
});

const filteredViews = computed(() => {
   if (props.searchMethod === 'elements')
      return props.database.tables.filter(table => table.name.search(searchTerm.value) >= 0 && table.type === 'view');
   else
      return props.database.tables.filter(table => table.type === 'view');
});

const filteredMatViews = computed(() => {
   if (props.searchMethod === 'elements')
      return props.database.tables.filter(table => table.name.search(searchTerm.value) >= 0 && table.type === 'materializedView');
   else
      return props.database.tables.filter(table => table.type === 'materializedView');
});

const filteredTriggers = computed(() => {
   if (props.searchMethod === 'elements')
      return props.database.triggers.filter(trigger => trigger.name.search(searchTerm.value) >= 0);
   else
      return props.database.triggers;
});

const filteredProcedures = computed(() => {
   if (props.searchMethod === 'elements')
      return props.database.procedures.filter(procedure => procedure.name.search(searchTerm.value) >= 0);
   else
      return props.database.procedures;
});

const filteredFunctions = computed(() => {
   if (props.searchMethod === 'elements')
      return props.database.functions.filter(func => func.name.search(searchTerm.value) >= 0);
   else
      return props.database.functions;
});

const filteredTriggerFunctions = computed(() => {
   if (props.searchMethod === 'elements') {
      return props.database.triggerFunctions
         ? props.database.triggerFunctions.filter(func => func.name.search(searchTerm.value) >= 0)
         : [];
   }
   else {
      return props.database.triggerFunctions
         ? props.database.triggerFunctions
         : [];
   }
});

const filteredSchedulers = computed(() => {
   if (props.searchMethod === 'elements')
      return props.database.schedulers.filter(scheduler => scheduler.name.search(searchTerm.value) >= 0);
   else
      return props.database.schedulers;
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
         const element = document.querySelector<HTMLElement>('.workspace-explorebar-database .selected');

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
      }, 100);
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
   newTab({
      uid: props.connection.uid,
      elementName: table.name,
      schema: props.database.name,
      type: 'data',
      elementType: table.type
   });
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

const highlightWord = (string: string, type = 'elements') => {
   string = string.replaceAll('<', '&lt;').replaceAll('>', '&gt;');

   if (searchTerm.value && props.searchMethod === type) {
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

    .open-folder {
      display: none;
    }

    .accordion[open] .accordion-header {
       > .misc-icon {
          display: none;
          &.open-folder {
             display: initial;
          }
      }
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
    opacity: 0.4;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
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
