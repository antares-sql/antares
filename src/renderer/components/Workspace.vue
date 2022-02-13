<template>
   <div v-show="isSelected" class="workspace column columns col-gapless">
      <WorkspaceExploreBar
         v-if="workspace.connectionStatus === 'connected'"
         :connection="connection"
         :is-selected="isSelected"
      />
      <div v-if="workspace.connectionStatus === 'connected'" class="workspace-tabs column columns col-gapless">
         <Draggable
            ref="tabWrap"
            v-model="draggableTabs"
            tag="ul"
            group="tabs"
            class="tab tab-block column col-12"
            draggable=".tab-draggable"
            @mouseover.native="addWheelEvent"
         >
            <li
               v-for="(tab, i) of draggableTabs"
               :key="i"
               class="tab-item tab-draggable"
               draggable="true"
               :class="{'active': selectedTab === tab.uid}"
               @mousedown.left="selectTab({uid: workspace.uid, tab: tab.uid})"
               @mouseup.middle="closeTab(tab)"
            >
               <a
                  v-if="tab.type === 'query'"
                  class="tab-link"
                  :class="{'badge': tab.isChanged}"
               >
                  <i class="mdi mdi-18px mdi-code-tags mr-1" />
                  <span>
                     <span>{{ tab.content || 'Query' | cutText }} #{{ tab.index }}</span>
                     <span
                        class="btn btn-clear"
                        :title="$t('word.close')"
                        @mousedown.left.stop
                        @click.stop="closeTab(tab)"
                     />
                  </span>
               </a>

               <a
                  v-else-if="tab.type === 'temp-data'"
                  class="tab-link"
                  @dblclick="openAsPermanentTab(tab)"
               >
                  <i class="mdi mdi-18px mr-1" :class="tab.elementType === 'view' ? 'mdi-table-eye' : 'mdi-table'" />
                  <span :title="`${$t('word.data').toUpperCase()}: ${$tc(`word.${tab.elementType}`)}`">
                     <span class=" text-italic">{{ tab.elementName | cutText }}</span>
                     <span
                        class="btn btn-clear"
                        :title="$t('word.close')"
                        @mousedown.left.stop
                        @click.stop="closeTab(tab)"
                     />
                  </span>
               </a>

               <a v-else-if="tab.type === 'data'" class="tab-link">
                  <i class="mdi mdi-18px mr-1" :class="tab.elementType === 'view' ? 'mdi-table-eye' : 'mdi-table'" />
                  <span :title="`${$t('word.data').toUpperCase()}: ${$tc(`word.${tab.elementType}`)}`">
                     {{ tab.elementName | cutText }}
                     <span
                        class="btn btn-clear"
                        :title="$t('word.close')"
                        @mousedown.left.stop
                        @click.stop="closeTab(tab)"
                     />
                  </span>
               </a>

               <a
                  v-else-if="tab.type === 'new-table'"
                  class="tab-link"
                  :class="{'badge': tab.isChanged}"
               >
                  <i class="mdi mdi-shape-square-plus mdi-18px mr-1" />
                  <span :title="`${$t('word.new').toUpperCase()}: ${$tc(`word.${tab.elementType}`)}`">
                     {{ $t('message.newTable') }}
                     <span
                        class="btn btn-clear"
                        :title="$t('word.close')"
                        @mousedown.left.stop
                        @click.stop="closeTab(tab)"
                     />
                  </span>
               </a>

               <a
                  v-else-if="tab.type === 'table-props'"
                  class="tab-link"
                  :class="{'badge': tab.isChanged}"
               >
                  <i class="mdi mdi-tune-vertical-variant mdi-18px mr-1" />
                  <span :title="`${$t('word.settings').toUpperCase()}: ${$tc(`word.${tab.elementType}`)}`">
                     {{ tab.elementName | cutText }}
                     <span
                        class="btn btn-clear"
                        :title="$t('word.close')"
                        @mousedown.left.stop
                        @click.stop="closeTab(tab)"
                     />
                  </span>
               </a>

               <a
                  v-else-if="tab.type === 'view-props'"
                  class="tab-link"
                  :class="{'badge': tab.isChanged}"
               >
                  <i class="mdi mdi-tune-vertical-variant mdi-18px mr-1" />
                  <span :title="`${$t('word.settings').toUpperCase()}: ${$tc(`word.view`)}`">
                     {{ tab.elementName | cutText }}
                     <span
                        class="btn btn-clear"
                        :title="$t('word.close')"
                        @mousedown.left.stop
                        @click.stop="closeTab(tab)"
                     />
                  </span>
               </a>

               <a
                  v-else-if="tab.type === 'new-view'"
                  class="tab-link"
                  :class="{'badge': tab.isChanged}"
               >
                  <i class="mdi mdi-shape-square-plus mdi-18px mr-1" />
                  <span :title="`${$t('word.new').toUpperCase()}: ${$tc(`word.${tab.elementType}`)}`">
                     {{ $t('message.newView') }}
                     <span
                        class="btn btn-clear"
                        :title="$t('word.close')"
                        @mousedown.left.stop
                        @click.stop="closeTab(tab)"
                     />
                  </span>
               </a>

               <a
                  v-else-if="tab.type === 'new-trigger'"
                  class="tab-link"
                  :class="{'badge': tab.isChanged}"
               >
                  <i class="mdi mdi-shape-square-plus mdi-18px mr-1" />
                  <span :title="`${$t('word.new').toUpperCase()}: ${$tc(`word.${tab.elementType}`)}`">
                     {{ $t('message.newTrigger') }}
                     <span
                        class="btn btn-clear"
                        :title="$t('word.close')"
                        @mousedown.left.stop
                        @click.stop="closeTab(tab)"
                     />
                  </span>
               </a>

               <a
                  v-else-if="tab.type === 'new-routine'"
                  class="tab-link"
                  :class="{'badge': tab.isChanged}"
               >
                  <i class="mdi mdi-shape-square-plus mdi-18px mr-1" />
                  <span :title="`${$t('word.new').toUpperCase()}: ${$tc(`word.${tab.elementType}`)}`">
                     {{ $t('message.newRoutine') }}
                     <span
                        class="btn btn-clear"
                        :title="$t('word.close')"
                        @mousedown.left.stop
                        @click.stop="closeTab(tab)"
                     />
                  </span>
               </a>

               <a
                  v-else-if="tab.type === 'new-function'"
                  class="tab-link"
                  :class="{'badge': tab.isChanged}"
               >
                  <i class="mdi mdi-shape-square-plus mdi-18px mr-1" />
                  <span :title="`${$t('word.new').toUpperCase()}: ${$tc(`word.${tab.elementType}`)}`">
                     {{ $t('message.newFunction') }}
                     <span
                        class="btn btn-clear"
                        :title="$t('word.close')"
                        @mousedown.left.stop
                        @click.stop="closeTab(tab)"
                     />
                  </span>
               </a>

               <a
                  v-else-if="tab.type === 'new-trigger-function'"
                  class="tab-link"
                  :class="{'badge': tab.isChanged}"
               >
                  <i class="mdi mdi-shape-square-plus mdi-18px mr-1" />
                  <span :title="`${$t('word.new').toUpperCase()}: ${$tc(`word.${tab.elementType}`)}`">
                     {{ $t('message.newTriggerFunction') }}
                     <span
                        class="btn btn-clear"
                        :title="$t('word.close')"
                        @mousedown.left.stop
                        @click.stop="closeTab(tab)"
                     />
                  </span>
               </a>

               <a
                  v-else-if="tab.type === 'new-scheduler'"
                  class="tab-link"
                  :class="{'badge': tab.isChanged}"
               >
                  <i class="mdi mdi-shape-square-plus mdi-18px mr-1" />
                  <span :title="`${$t('word.new').toUpperCase()}: ${$tc(`word.${tab.elementType}`)}`">
                     {{ $t('message.newScheduler') }}
                     <span
                        class="btn btn-clear"
                        :title="$t('word.close')"
                        @mousedown.left.stop
                        @click.stop="closeTab(tab)"
                     />
                  </span>
               </a>

               <a
                  v-else-if="tab.type.includes('temp-')"
                  class="tab-link"
                  :class="{'badge': tab.isChanged}"
                  @dblclick="openAsPermanentTab(tab)"
               >
                  <i class="mdi mdi-18px mdi-tune-vertical-variant mr-1" />
                  <span :title="`${$t('word.settings').toUpperCase()}: ${$tc(`word.${tab.elementType}`)}`">
                     <span class=" text-italic">{{ tab.elementName | cutText }}</span>
                     <span
                        class="btn btn-clear"
                        :title="$t('word.close')"
                        @mousedown.left.stop
                        @click.stop="closeTab(tab)"
                     />
                  </span>
               </a>

               <a
                  v-else
                  class="tab-link"
                  :class="{'badge': tab.isChanged}"
               >
                  <i class="mdi mdi-18px mdi-tune-vertical-variant mr-1" />
                  <span :title="`${$t('word.settings').toUpperCase()}: ${$tc(`word.${tab.elementType}`)}`">
                     {{ tab.elementName | cutText }}
                     <span
                        class="btn btn-clear"
                        :title="$t('word.close')"
                        @mousedown.left.stop
                        @click.stop="closeTab(tab)"
                     />
                  </span>
               </a>
            </li>
            <template #header>
               <li
                  v-if="workspace.customizations.processesList"
                  class="tab-item dropdown tools-dropdown"
               >
                  <a
                     class="tab-link workspace-tools-link dropdown-toggle"
                     tabindex="0"
                     :title="$t('word.tools')"
                  >
                     <i class="mdi mdi-24px mdi-tools" />
                  </a>
                  <ul v-if="hasTools" class="menu text-left text-uppercase">
                     <li class="menu-item">
                        <a class="c-hand p-vcentered" @click="showProcessesModal">
                           <i class="mdi mdi-memory mr-1 tool-icon" />
                           <span>{{ $t('message.processesList') }}</span>
                        </a>
                     </li>
                     <li
                        v-if="workspace.customizations.variables"
                        class="menu-item"
                        title="Coming..."
                     >
                        <a class="c-hand p-vcentered disabled">
                           <i class="mdi mdi-shape mr-1 tool-icon" />
                           <span>{{ $t('word.variables') }}</span>
                        </a>
                     </li>
                     <li
                        v-if="workspace.customizations.usersManagement"
                        class="menu-item"
                        title="Coming..."
                     >
                        <a class="c-hand p-vcentered disabled">
                           <i class="mdi mdi-account-group mr-1 tool-icon" />
                           <span>{{ $t('message.manageUsers') }}</span>
                        </a>
                     </li>
                  </ul>
               </li>
            </template>
            <template #footer>
               <li class="tab-item">
                  <a
                     class="tab-add"
                     :title="$t('message.openNewTab')"
                     @click="addQueryTab"
                  >
                     <i class="mdi mdi-24px mdi-plus" />
                  </a>
               </li>
            </template>
         </Draggable>
         <WorkspaceEmptyState v-if="!workspace.tabs.length" @new-tab="addQueryTab" />
         <template v-for="tab of workspace.tabs">
            <WorkspaceTabQuery
               v-if="tab.type==='query'"
               :key="tab.uid"
               :tab="tab"
               :is-selected="selectedTab === tab.uid"
               :connection="connection"
            />
            <WorkspaceTabTable
               v-else-if="['temp-data', 'data'].includes(tab.type)"
               :key="tab.uid"
               :connection="connection"
               :is-selected="selectedTab === tab.uid"
               :table="tab.elementName"
               :schema="tab.schema"
               :element-type="tab.elementType"
            />
            <WorkspaceTabNewTable
               v-else-if="tab.type === 'new-table'"
               :key="tab.uid"
               :tab="tab"
               :connection="connection"
               :is-selected="selectedTab === tab.uid"
               :schema="tab.schema"
            />
            <WorkspaceTabPropsTable
               v-else-if="tab.type === 'table-props'"
               :key="tab.uid"
               :connection="connection"
               :is-selected="selectedTab === tab.uid"
               :table="tab.elementName"
               :schema="tab.schema"
            />
            <WorkspaceTabNewView
               v-else-if="tab.type === 'new-view'"
               :key="tab.uid"
               :tab="tab"
               :connection="connection"
               :is-selected="selectedTab === tab.uid"
               :schema="tab.schema"
            />
            <WorkspaceTabPropsView
               v-else-if="tab.type === 'view-props'"
               :key="tab.uid"
               :is-selected="selectedTab === tab.uid"
               :connection="connection"
               :view="tab.elementName"
               :schema="tab.schema"
            />
            <WorkspaceTabNewTrigger
               v-else-if="tab.type === 'new-trigger'"
               :key="tab.uid"
               :tab="tab"
               :connection="connection"
               :is-selected="selectedTab === tab.uid"
               :trigger="tab.elementName"
               :schema="tab.schema"
            />
            <WorkspaceTabPropsTrigger
               v-else-if="['temp-trigger-props', 'trigger-props'].includes(tab.type)"
               :key="tab.uid"
               :connection="connection"
               :is-selected="selectedTab === tab.uid"
               :trigger="tab.elementName"
               :schema="tab.schema"
            />
            <WorkspaceTabNewTriggerFunction
               v-else-if="tab.type === 'new-trigger-function'"
               :key="tab.uid"
               :tab="tab"
               :connection="connection"
               :is-selected="selectedTab === tab.uid"
               :trigger="tab.elementName"
               :schema="tab.schema"
            />
            <WorkspaceTabPropsTriggerFunction
               v-else-if="['temp-trigger-function-props', 'trigger-function-props'].includes(tab.type)"
               :key="tab.uid"
               :connection="connection"
               :is-selected="selectedTab === tab.uid"
               :function="tab.elementName"
               :schema="tab.schema"
            />
            <WorkspaceTabNewRoutine
               v-else-if="tab.type === 'new-routine'"
               :key="tab.uid"
               :tab="tab"
               :connection="connection"
               :is-selected="selectedTab === tab.uid"
               :trigger="tab.elementName"
               :schema="tab.schema"
            />
            <WorkspaceTabPropsRoutine
               v-else-if="['temp-routine-props', 'routine-props'].includes(tab.type)"
               :key="tab.uid"
               :connection="connection"
               :is-selected="selectedTab === tab.uid"
               :routine="tab.elementName"
               :schema="tab.schema"
            />
            <WorkspaceTabNewFunction
               v-else-if="tab.type === 'new-function'"
               :key="tab.uid"
               :tab="tab"
               :connection="connection"
               :is-selected="selectedTab === tab.uid"
               :trigger="tab.elementName"
               :schema="tab.schema"
            />
            <WorkspaceTabPropsFunction
               v-else-if="['temp-function-props', 'function-props'].includes(tab.type)"
               :key="tab.uid"
               :connection="connection"
               :is-selected="selectedTab === tab.uid"
               :function="tab.elementName"
               :schema="tab.schema"
            />
            <WorkspaceTabNewScheduler
               v-else-if="tab.type === 'new-scheduler'"
               :key="tab.uid"
               :tab="tab"
               :connection="connection"
               :is-selected="selectedTab === tab.uid"
               :trigger="tab.elementName"
               :schema="tab.schema"
            />
            <WorkspaceTabPropsScheduler
               v-else-if="['temp-scheduler-props', 'scheduler-props'].includes(tab.type)"
               :key="tab.uid"
               :connection="connection"
               :is-selected="selectedTab === tab.uid"
               :scheduler="tab.elementName"
               :schema="tab.schema"
            />
         </template>
      </div>
      <WorkspaceEditConnectionPanel v-else :connection="connection" />
      <ModalProcessesList
         v-if="isProcessesModal"
         :connection="connection"
         @close="hideProcessesModal"
      />

      <ModalDiscardChanges
         v-if="unsavedTab"
         @confirm="closeTab(unsavedTab, true)"
         @close="unsavedTab = null"
      />
   </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import Draggable from 'vuedraggable';
import Connection from '@/ipc-api/Connection';
import WorkspaceEmptyState from '@/components/WorkspaceEmptyState';
import WorkspaceExploreBar from '@/components/WorkspaceExploreBar';
import WorkspaceEditConnectionPanel from '@/components/WorkspaceEditConnectionPanel';
import WorkspaceTabQuery from '@/components/WorkspaceTabQuery';
import WorkspaceTabTable from '@/components/WorkspaceTabTable';

import WorkspaceTabNewTable from '@/components/WorkspaceTabNewTable';
import WorkspaceTabNewView from '@/components/WorkspaceTabNewView';
import WorkspaceTabNewTrigger from '@/components/WorkspaceTabNewTrigger';
import WorkspaceTabNewRoutine from '@/components/WorkspaceTabNewRoutine';
import WorkspaceTabNewFunction from '@/components/WorkspaceTabNewFunction';
import WorkspaceTabNewScheduler from '@/components/WorkspaceTabNewScheduler';
import WorkspaceTabNewTriggerFunction from '@/components/WorkspaceTabNewTriggerFunction';

import WorkspaceTabPropsTable from '@/components/WorkspaceTabPropsTable';
import WorkspaceTabPropsView from '@/components/WorkspaceTabPropsView';
import WorkspaceTabPropsTrigger from '@/components/WorkspaceTabPropsTrigger';
import WorkspaceTabPropsTriggerFunction from '@/components/WorkspaceTabPropsTriggerFunction';
import WorkspaceTabPropsRoutine from '@/components/WorkspaceTabPropsRoutine';
import WorkspaceTabPropsFunction from '@/components/WorkspaceTabPropsFunction';
import WorkspaceTabPropsScheduler from '@/components/WorkspaceTabPropsScheduler';
import ModalProcessesList from '@/components/ModalProcessesList';
import ModalDiscardChanges from '@/components/ModalDiscardChanges';

export default {
   name: 'Workspace',
   components: {
      Draggable,
      WorkspaceEmptyState,
      WorkspaceExploreBar,
      WorkspaceEditConnectionPanel,
      WorkspaceTabQuery,
      WorkspaceTabTable,
      WorkspaceTabNewTable,
      WorkspaceTabPropsTable,
      WorkspaceTabNewView,
      WorkspaceTabPropsView,
      WorkspaceTabNewTrigger,
      WorkspaceTabPropsTrigger,
      WorkspaceTabNewTriggerFunction,
      WorkspaceTabPropsTriggerFunction,
      WorkspaceTabNewRoutine,
      WorkspaceTabNewFunction,
      WorkspaceTabPropsRoutine,
      WorkspaceTabPropsFunction,
      WorkspaceTabNewScheduler,
      WorkspaceTabPropsScheduler,
      ModalProcessesList,
      ModalDiscardChanges
   },
   filters: {
      cutText (string) {
         const limit = 20;
         const escapedString = string.replace(/\s{2,}/g, ' ');
         if (escapedString.length > limit)
            return `${escapedString.substr(0, limit)}...`;
         return escapedString;
      }
   },
   props: {
      connection: Object
   },
   data () {
      return {
         hasWheelEvent: false,
         isProcessesModal: false,
         unsavedTab: null
      };
   },
   computed: {
      ...mapGetters({
         selectedWorkspace: 'workspaces/getSelected',
         getWorkspace: 'workspaces/getWorkspace'
      }),
      workspace () {
         return this.getWorkspace(this.connection.uid);
      },
      draggableTabs: {
         get () {
            return this.workspace.tabs;
         },
         set (val) {
            this.updateTabs({ uid: this.connection.uid, tabs: val });
         }
      },
      isSelected () {
         return this.selectedWorkspace === this.connection.uid;
      },
      isSettingSupported () {
         if (this.workspace.breadcrumbs.table && this.workspace.customizations.tableSettings) return true;
         if (this.workspace.breadcrumbs.view && this.workspace.customizations.viewSettings) return true;
         if (this.workspace.breadcrumbs.trigger && this.workspace.customizations.triggerSettings) return true;
         if (this.workspace.breadcrumbs.procedure && this.workspace.customizations.routineSettings) return true;
         if (this.workspace.breadcrumbs.function && this.workspace.customizations.functionSettings) return true;
         if (this.workspace.breadcrumbs.triggerFunction && this.workspace.customizations.functionSettings) return true;
         if (this.workspace.breadcrumbs.scheduler && this.workspace.customizations.schedulerSettings) return true;
         return false;
      },
      selectedTab () {
         return this.workspace ? this.workspace.selectedTab : null;
      },
      queryTabs () {
         return this.workspace ? this.workspace.tabs.filter(tab => tab.type === 'query') : [];
      },
      schemaChild () {
         for (const key in this.workspace.breadcrumbs) {
            if (key === 'schema') continue;
            if (this.workspace.breadcrumbs[key]) return this.workspace.breadcrumbs[key];
         }
         return false;
      },
      hasTools () {
         return this.workspace.customizations.processesList ||
            this.workspace.customizations.usersManagement ||
            this.workspace.customizations.variables;
      }
   },
   watch: {
      queryTabs: function (newVal, oldVal) {
         if (newVal.length > oldVal.length) {
            setTimeout(() => {
               const scroller = this.$refs.tabWrap;
               if (scroller) scroller.$el.scrollLeft = scroller.$el.scrollWidth;
            }, 0);
         }
      }
   },
   async created () {
      window.addEventListener('keydown', this.onKey);
      await this.addWorkspace(this.connection.uid);
      const isInitiated = await Connection.checkConnection(this.connection.uid);
      if (isInitiated)
         this.connectWorkspace(this.connection);
   },
   beforeDestroy () {
      window.removeEventListener('keydown', this.onKey);
   },
   methods: {
      ...mapActions({
         addWorkspace: 'workspaces/addWorkspace',
         connectWorkspace: 'workspaces/connectWorkspace',
         removeConnected: 'workspaces/removeConnected',
         selectTab: 'workspaces/selectTab',
         newTab: 'workspaces/newTab',
         removeTab: 'workspaces/removeTab',
         updateTabs: 'workspaces/updateTabs'
      }),
      addQueryTab () {
         this.newTab({ uid: this.connection.uid, type: 'query' });
      },
      getSelectedTab () {
         return this.workspace.tabs.find(tab => tab.uid === this.selectedTab);
      },
      onKey (e) {
         e.stopPropagation();

         if (!this.isSelected)
            return;

         if ((e.ctrlKey || e.metaKey) && e.keyCode === 84 && !e.altKey) { // CTRL|Command + t
            this.addQueryTab();
         }

         if ((e.ctrlKey || e.metaKey) && e.keyCode === 87 && !e.altKey) { // CTRL|Command + w
            const currentTab = this.getSelectedTab();
            if (currentTab)
               this.closeTab(currentTab);
         }
      },
      openAsPermanentTab (tab) {
         const permanentTabs = {
            table: 'data',
            view: 'data',
            trigger: 'trigger-props',
            triggerFunction: 'trigger-function-props',
            function: 'function-props',
            routine: 'routine-props',
            scheduler: 'scheduler-props'
         };

         this.newTab({
            uid: this.connection.uid,
            schema: tab.schema,
            elementName: tab.elementName,
            type: permanentTabs[tab.elementType],
            elementType: tab.elementType
         });
      },
      closeTab (tab, force) {
         this.unsavedTab = null;
         // if (tab.type === 'query' && this.queryTabs.length === 1) return;
         if (!force && tab.isChanged) {
            this.unsavedTab = tab;
            return;
         }

         this.removeTab({ uid: this.connection.uid, tab: tab.uid });
      },
      showProcessesModal () {
         this.isProcessesModal = true;
      },
      hideProcessesModal () {
         this.isProcessesModal = false;
      },
      addWheelEvent () {
         if (!this.hasWheelEvent) {
            this.$refs.tabWrap.$el.addEventListener('wheel', e => {
               if (e.deltaY > 0) this.$refs.tabWrap.$el.scrollLeft += 50;
               else this.$refs.tabWrap.$el.scrollLeft -= 50;
            });
            this.hasWheelEvent = true;
         }
      }
   }
};
</script>

<style lang="scss">
.workspace {
  padding: 0;
  margin: 0;

  .workspace-tabs {
    overflow: hidden;
    height: calc(100vh - #{$excluding-size});

    .tab-block {
      margin-top: 0;
      flex-direction: row;
      align-items: flex-start;
      flex-wrap: nowrap;
      overflow: auto;
      margin-bottom: 0;

      &::-webkit-scrollbar {
        width: 2px;
        height: 2px;
      }

      .tab-item {
        width: fit-content;
        flex: initial;

        > a {
          padding: 0.2rem 0.6rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          opacity: 0.7;
          transition: opacity 0.2s;

          &.badge::after {
            position: absolute;
            right: 35px;
            top: 25px;
          }

          .btn-clear {
            margin-left: 0.5rem;
            opacity: 0;
            transition: opacity 0.2s;
          }

          &:hover {
            opacity: 1;

            .btn-clear {
              opacity: 1;
            }
          }

          &.tab-add {
            padding: 0.2rem 0.4rem;
            margin-top: 2px;
            border: 0;
          }

          > span {
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            padding: 0 0.2rem;
          }
        }

        &.active a {
          opacity: 1;

          .btn-clear {
            opacity: 1;
          }
        }

        &.tools-dropdown {
          height: 34px;

          .tab-link:focus {
            opacity: 1;
            outline: 0;
            box-shadow: none;
          }

          .menu {
            min-width: 100%;

            .menu-item a {
              border-radius: $border-radius;
              color: inherit;
              display: block;
              margin: 0 -0.4rem;
              padding: 0.2rem 0.4rem;
              text-decoration: none;
              white-space: nowrap;
              border: 0;

              .tool-icon {
                line-height: 1;
                display: inline-block;
                font-size: 20px;
              }
            }
          }

          z-index: 9;
          position: absolute;
        }

        &.tools-dropdown + .tab-item {
          margin-left: 56px;
        }

        .workspace-tools-link {
          padding-bottom: 0;
          padding-top: 0.3rem;
        }
      }
    }
  }

  .workspace-query-results {
    overflow: auto;
    white-space: nowrap;

    .table {
      width: auto;
      border-collapse: separate;

      .th {
        position: sticky;
        top: 0;
        border: 2px solid;
        border-left: none;
        border-bottom-width: 2px;
        padding: 0;
        font-weight: 700;
        font-size: 0.7rem;
        z-index: 1;

        > div {
          padding: 0.1rem 0.2rem;
          min-width: -webkit-fill-available;
        }
      }

      .td {
        border-right: 2px solid;
        border-bottom: 2px solid;
        padding: 0 0.2rem;
        text-overflow: ellipsis;
        max-width: 200px;
        white-space: nowrap;
        overflow: hidden;
        font-size: 0.7rem;
        position: relative;

        &:focus {
          outline: none;
        }
      }
    }
  }
}
</style>
