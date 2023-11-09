<template>
   <div class="column col-auto p-relative">
      <div ref="resizer" class="workspace-explorebar-resizer" />
      <div
         ref="explorebar"
         class="workspace-explorebar column"
         :style="{width: localWidth ? localWidth+'px' : ''}"
         tabindex="0"
         @keypress="explorebarSearch"
         @keydown="explorebarSearch"
      >
         <div class="workspace-explorebar-header">
            <div
               v-if="customizations.database && databases.length"
               class="workspace-explorebar-database-switch"
               :title="t('database.switchDatabase')"
            >
               <BaseSelect
                  v-model="selectedDatabase"
                  :options="databases"
                  class="form-select select-sm text-bold my-0"
               />
            </div>
            <span v-else class="workspace-explorebar-title">{{ connectionName }}</span>
            <span v-if="workspace.connectionStatus === 'connected'" class="workspace-explorebar-tools">
               <div :title="t('database.createNewSchema')">
                  <BaseIcon
                     v-if="customizations.schemas"
                     icon-name="mdiDatabasePlus"
                     :size="18"
                     class="c-hand mr-2"
                     @click="showNewDBModal"
                  />
               </div>
               <div :title="t('general.refresh')">
                  <BaseIcon
                     v-if="customizations.schemas"
                     icon-name="mdiRefresh"
                     :size="18"
                     class="c-hand mr-2"
                     :class="{'rotate':isRefreshing}"
                     @click="refresh"
                  />
               </div>
               <div :title="t('connection.disconnect')">
                  <BaseIcon
                     icon-name="mdiPower"
                     :size="18"
                     class="c-hand"
                     @click="disconnectWorkspace(connection.uid)"
                  />
               </div>
            </span>
         </div>
         <div class="workspace-explorebar-search">
            <div v-if="workspace.connectionStatus === 'connected'" class="input-group has-icon-right">
               <div
                  class="input-group-addon px-1 py-0 p-vcentered c-hand"
                  :title="t('application.switchSearchMethod')"
                  @click="toggleSearchMethod"
               >
                  <BaseIcon :icon-name="searchMethod === 'elements' ? 'mdiShape' : 'mdiDatabase'" :size="18" />
               </div>
               <input
                  ref="searchInput"
                  v-model="searchTerm"
                  class="form-input input-sm"
                  type="text"
                  :placeholder="searchMethod === 'elements' ? t('database.searchForElements') : t('database.searchForSchemas')"
               >
               <BaseIcon
                  v-if="!searchTerm"
                  class="form-icon"
                  icon-name="mdiMagnify"
                  :size="18"
               />
               <BaseIcon
                  v-else
                  class="form-icon c-hand pr-1"
                  icon-name="mdiBackspace"
                  :size="18"
                  @click="searchTerm = ''"
               />
            </div>
         </div>
         <div class="workspace-explorebar-body" @click="explorebar.focus()">
            <WorkspaceExploreBarSchema
               v-for="db of filteredSchemas"
               :key="db.name"
               ref="schema"
               :database="db"
               :connection="connection"
               :search-method="searchMethod"
               @show-schema-context="openSchemaContext"
               @show-table-context="openTableContext"
               @show-misc-context="openMiscContext"
               @show-misc-folder-context="openMiscFolderContext"
            />
         </div>
      </div>
      <ModalNewSchema
         v-if="isNewDBModal"
         @close="hideNewDBModal"
         @reload="refresh"
      />
      <DatabaseContext
         v-if="isDatabaseContext"
         :selected-schema="selectedSchema"
         :context-event="databaseContextEvent"
         @close-context="closeDatabaseContext"
         @open-create-table-tab="openCreateElementTab('table')"
         @open-create-view-tab="openCreateElementTab('view')"
         @open-create-trigger-tab="openCreateElementTab('trigger')"
         @open-create-routine-tab="openCreateElementTab('routine')"
         @open-create-function-tab="openCreateElementTab('function')"
         @open-create-trigger-function-tab="openCreateElementTab('trigger-function')"
         @open-create-scheduler-tab="openCreateElementTab('scheduler')"
         @reload="refresh"
      />
      <TableContext
         v-if="isTableContext"
         :selected-schema="selectedSchema"
         :selected-table="selectedTable"
         :context-event="tableContextEvent"
         @delete-table="deleteTable"
         @duplicate-table="duplicateTable"
         @close-context="closeTableContext"
         @reload="refresh"
      />
      <MiscContext
         v-if="isMiscContext"
         :selected-misc="selectedMisc"
         :selected-schema="selectedSchema"
         :context-event="miscContextEvent"
         @close-context="closeMiscContext"
         @reload="refresh"
      />
      <MiscFolderContext
         v-if="isMiscFolderContext"
         :selected-misc="selectedMisc"
         :selected-schema="selectedSchema"
         :context-event="miscContextEvent"
         @open-create-trigger-tab="openCreateElementTab('trigger')"
         @open-create-routine-tab="openCreateElementTab('routine')"
         @open-create-function-tab="openCreateElementTab('function')"
         @open-create-trigger-function-tab="openCreateElementTab('trigger-function')"
         @open-create-scheduler-tab="openCreateElementTab('scheduler')"
         @close-context="closeMiscFolderContext"
         @reload="refresh"
      />
   </div>
</template>

<script setup lang="ts">
import { ConnectionParams } from 'common/interfaces/antares';
import { storeToRefs } from 'pinia';
import { Component, computed, onMounted, Prop, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import ModalNewSchema from '@/components/ModalNewSchema.vue';
import MiscContext from '@/components/WorkspaceExploreBarMiscContext.vue';
import MiscFolderContext from '@/components/WorkspaceExploreBarMiscFolderContext.vue';
import WorkspaceExploreBarSchema from '@/components/WorkspaceExploreBarSchema.vue';
import DatabaseContext from '@/components/WorkspaceExploreBarSchemaContext.vue';
import TableContext from '@/components/WorkspaceExploreBarTableContext.vue';
import Databases from '@/ipc-api/Databases';
import Tables from '@/ipc-api/Tables';
import Views from '@/ipc-api/Views';
import { useConnectionsStore } from '@/stores/connections';
import { useNotificationsStore } from '@/stores/notifications';
import { useSettingsStore } from '@/stores/settings';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

const props = defineProps({
   connection: Object as Prop<ConnectionParams>,
   isSelected: Boolean
});

const { getConnectionName } = useConnectionsStore();
const { addNotification } = useNotificationsStore();
const settingsStore = useSettingsStore();
const workspacesStore = useWorkspacesStore();

const { explorebarSize } = storeToRefs(settingsStore);

const { changeExplorebarSize } = settingsStore;
const {
   getWorkspace,
   switchConnection,
   removeConnected: disconnectWorkspace,
   refreshStructure,
   newTab,
   removeTabs,
   setSearchTerm,
   setDatabase,
   addLoadingElement,
   removeLoadingElement
} = workspacesStore;

const searchInput: Ref<HTMLInputElement> = ref(null);
const explorebar: Ref<HTMLInputElement> = ref(null);
const resizer: Ref<HTMLInputElement> = ref(null);
const databases: Ref<string[]> = ref([]);
const schema: Ref<Component & { selectSchema: (name: string) => void; $refs: {schemaAccordion: HTMLDetailsElement} }[]> = ref(null);
const isRefreshing = ref(false);
const isNewDBModal = ref(false);
const localWidth = ref(null);
const explorebarWidthInterval = ref(null);
const searchTermInterval = ref(null);
const isDatabaseContext = ref(false);
const isTableContext = ref(false);
const isMiscContext = ref(false);
const isMiscFolderContext = ref(false);
const databaseContextEvent = ref(null);
const tableContextEvent = ref(null);
const miscContextEvent = ref(null);
const selectedDatabase = ref(props.connection.database);
const selectedSchema = ref('');
const selectedTable = ref(null);
const selectedMisc = ref(null);
const searchTerm = ref('');
const searchMethod: Ref<'elements' | 'schemas'> = ref('elements');

const workspace = computed(() => {
   return getWorkspace(props.connection.uid);
});

const connectionName = computed(() => {
   return getConnectionName(props.connection.uid);
});

const customizations = computed(() => {
   return workspace.value.customizations;
});

const filteredSchemas = computed(() => {
   if (searchMethod.value === 'schemas')
      return workspace.value.structure.filter(schema => schema.name.search(searchTerm.value) >= 0);
   else
      return workspace.value.structure;
});

watch(localWidth, (val: number) => {
   clearTimeout(explorebarWidthInterval.value);

   explorebarWidthInterval.value = setTimeout(() => {
      changeExplorebarSize(val);
   }, 500);
});

watch(() => props.isSelected, (val: boolean) => {
   if (val) localWidth.value = explorebarSize.value;
});

watch(searchTerm, () => {
   clearTimeout(searchTermInterval.value);

   searchTermInterval.value = setTimeout(() => {
      setSearchTerm(searchTerm.value);
   }, 200);
});

watch(selectedDatabase, (val, oldVal) => {
   if (oldVal)
      switchConnection({ ...props.connection, database: selectedDatabase.value });
});

localWidth.value = explorebarSize.value;

onMounted(async () => {
   resizer.value.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();

      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResize);
   });

   if (workspace.value.structure.length === 1) { // Auto-open if just one schema
      schema.value[0].selectSchema(workspace.value.structure[0].name);
      schema.value[0].$refs.schemaAccordion.open = true;
   }

   if (customizations.value.database) {
      try {
         const { status, response } = await Databases.getDatabases(props.connection.uid);
         if (status === 'success') {
            databases.value = response;
            if (selectedDatabase.value === '') {
               selectedDatabase.value = response[0];
               setDatabase(selectedDatabase.value);
            }
         }
         else
            addNotification({ status: 'error', message: response });
      }
      catch (err) {
         addNotification({ status: 'error', message: err.stack });
      }
   }
});

const refresh = async () => {
   if (!isRefreshing.value) {
      isRefreshing.value = true;
      await refreshStructure(props.connection.uid);
      isRefreshing.value = false;
   }
};

const explorebarSearch = (event: KeyboardEvent) => {
   const isLetter = (event.key >= 'a' && event.key <= 'z');
   const isNumber = (event.key >= '0' && event.key <= '9');
   if (isLetter || isNumber)
      searchInput.value.focus();
};

const resize = (e: MouseEvent) => {
   const el = explorebar.value;
   let explorebarWidth = e.pageX - el.getBoundingClientRect().left;
   if (explorebarWidth > 500) explorebarWidth = 500;
   if (explorebarWidth < 150) explorebarWidth = 150;
   localWidth.value = explorebarWidth;
};

const stopResize = () => {
   window.removeEventListener('mousemove', resize);
};

const showNewDBModal = () => {
   isNewDBModal.value = true;
};

const hideNewDBModal = () => {
   isNewDBModal.value = false;
};

const openCreateElementTab = (element: string) => {
   closeDatabaseContext();
   closeMiscFolderContext();

   newTab({
      uid: workspace.value.uid,
      schema: selectedSchema.value,
      elementName: '',
      elementType: element,
      type: `new-${element}`
   });
};

const openSchemaContext = (payload: { schema: string; event: PointerEvent }) => {
   selectedSchema.value = payload.schema;
   databaseContextEvent.value = payload.event;
   isDatabaseContext.value = true;
};

const closeDatabaseContext = () => {
   isDatabaseContext.value = false;
};

const openTableContext = (payload: { schema: string; table: string; event: PointerEvent }) => {
   selectedTable.value = payload.table;
   selectedSchema.value = payload.schema;
   tableContextEvent.value = payload.event;
   isTableContext.value = true;
};

const closeTableContext = () => {
   isTableContext.value = false;
};

const openMiscContext = (payload: { schema: string; misc: string; event: PointerEvent }) => {
   selectedMisc.value = payload.misc;
   selectedSchema.value = payload.schema;
   miscContextEvent.value = payload.event;
   isMiscContext.value = true;
};

const openMiscFolderContext = (payload: { schema: string; type: string; event: PointerEvent }) => {
   selectedMisc.value = payload.type;
   selectedSchema.value = payload.schema;
   miscContextEvent.value = payload.event;
   isMiscFolderContext.value = true;
};

const closeMiscContext = () => {
   isMiscContext.value = false;
};

const closeMiscFolderContext = () => {
   isMiscFolderContext.value = false;
};

const deleteTable = async (payload: { schema: string; table: { name: string; type: string }; event: PointerEvent }) => {
   closeTableContext();

   addLoadingElement({
      name: payload.table.name,
      schema: payload.schema,
      type: 'table'
   });

   try {
      let res;

      if (payload.table.type === 'table') {
         res = await Tables.dropTable({
            uid: props.connection.uid,
            table: payload.table.name,
            schema: payload.schema
         });
      }
      else if (payload.table.type === 'view') {
         res = await Views.dropView({
            uid: props.connection.uid,
            view: payload.table.name,
            schema: payload.schema
         });
      }

      const { status, response } = res;

      if (status === 'success') {
         refresh();

         removeTabs({
            uid: props.connection.uid as string,
            elementName: payload.table.name as string,
            elementType: payload.table.type,
            schema: payload.schema as string
         });
      }
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   removeLoadingElement({
      name: payload.table.name,
      schema: payload.schema,
      type: 'table'
   });
};

const duplicateTable = async (payload: { schema: string; table: { name: string }; event: PointerEvent }) => {
   closeTableContext();

   addLoadingElement({
      name: payload.table.name,
      schema: payload.schema,
      type: 'table'
   });

   try {
      const { status, response } = await Tables.duplicateTable({
         uid: props.connection.uid,
         table: payload.table.name,
         schema: payload.schema
      });

      if (status === 'success')
         refresh();
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   removeLoadingElement({
      name: payload.table.name,
      schema: payload.schema,
      type: 'table'
   });
};

const toggleSearchMethod = () => {
   searchTerm.value = '';
   setSearchTerm(searchTerm.value);

   if (searchMethod.value === 'elements')
      searchMethod.value = 'schemas';
   else
      searchMethod.value = 'elements';
};
</script>

<style lang="scss">
  .workspace-explorebar-resizer {
    position: absolute;
    width: 4px;
    right: -2px;
    top: 0;
    height: calc(100vh - #{$excluding-size});
    cursor: ew-resize;
    z-index: 99;
    transition: background 0.2s;

    &:hover {
      background: rgba($primary-color, 50%);
    }
  }

  .workspace-explorebar {
    width: $explorebar-width;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    text-align: left;
    z-index: 8;
    flex: initial;
    position: relative;
    padding: 0;

    &:focus {
      outline: none;
    }

    .workspace-explorebar-header {
      width: 100%;
      padding: 0.3rem;
      display: flex;
      justify-content: space-between;
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;

      .workspace-explorebar-title {
        width: 80%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
        align-items: center;
      }

      .workspace-explorebar-tools {
        display: flex;
        align-items: center;

         svg {
          opacity: 0.6;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;

          &:hover {
            opacity: 1;
          }
        }
      }
    }

    .workspace-explorebar-database-switch {
      width: 100%;
      display: flex;
      justify-content: space-between;
      z-index: 20;
      margin-right: 5px;
      margin-left: -4px;
      margin-top: -3px;
      margin-bottom: -0.5rem;
      height: 24px;

      .form-select.select-sm {
         font-size: 0.6rem;
         height: 1.2rem;
         line-height: 1rem;
      }
    }

    .workspace-explorebar-search {
      width: 100%;
      display: flex;
      justify-content: space-between;
      font-size: 0.6rem;
      height: 28px;
      margin: 0 0 5px 0;
      z-index: 10;

      .has-icon-right {
        width: 100%;
        padding: 0.1rem;

        .form-icon {
          opacity: 0.5;
          transition: opacity 0.2s;
        }

        .form-input {
          height: 1.2rem;
          padding-left: 0.2rem;
          border-radius:0 $border-radius $border-radius 0;

          &:focus + .form-icon {
            opacity: 0.9;
          }

          &::placeholder {
            opacity: 0.6;
          }
        }
      }
    }

    .workspace-explorebar-body {
      width: 100%;
      height: calc((100vh - 63px) - #{$excluding-size});
      overflow: overlay;
      padding: 0 0.1rem;
    }
  }
</style>
