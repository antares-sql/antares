<template>
   <div v-show="isSelected" class="workspace column columns col-gapless">
      <WorkspaceExploreBar :connection="connection" :is-selected="isSelected" />
      <div v-if="workspace.connected" class="workspace-tabs column columns col-gapless">
         <ul ref="tabWrap" class="tab tab-block column col-12">
            <li
               v-if="workspace.breadcrumbs.table"
               class="tab-item"
               :class="{'active': selectedTab === 'prop'}"
               @click="selectTab({uid: workspace.uid, tab: 'prop'})"
            >
               <a class="tab-link">
                  <i class="mdi mdi-18px mdi-tune mr-1" />
                  <span :title="workspace.breadcrumbs.table">{{ $t('word.properties').toUpperCase() }}: {{ workspace.breadcrumbs.table }}</span>
               </a>
            </li>
            <li
               v-if="workspace.breadcrumbs.table"
               class="tab-item"
               :class="{'active': selectedTab === 'data'}"
               @click="selectTab({uid: workspace.uid, tab: 'data'})"
            >
               <a class="tab-link">
                  <i class="mdi mdi-18px mdi-table mr-1" />
                  <span :title="workspace.breadcrumbs.table">{{ $t('word.data').toUpperCase() }}: {{ workspace.breadcrumbs.table }}</span>
               </a>
            </li>
            <li
               v-for="tab of queryTabs"
               :key="tab.uid"
               class="tab-item"
               :class="{'active': selectedTab === tab.uid}"
               @click="selectTab({uid: workspace.uid, tab: tab.uid})"
               @mousedown.middle="closeTab(tab.uid)"
            >
               <a>
                  <span>
                     Query #{{ tab.index }}
                     <span
                        v-if="queryTabs.length > 1"
                        class="btn btn-clear"
                        :title="$t('word.close')"
                        @click.stop="closeTab(tab.uid)"
                     />
                  </span>
               </a>
            </li>
            <li class="tab-item">
               <a
                  class="tab-add"
                  :title="$t('message.openNewTab')"
                  @click="addTab"
               >
                  <i class="mdi mdi-24px mdi-plus" />
               </a>
            </li>
         </ul>
         <WorkspaceTableTab
            v-show="selectedTab === 'data'"
            :connection="connection"
            :table="workspace.breadcrumbs.table"
         />
         <WorkspaceQueryTab
            v-for="tab of queryTabs"
            :key="tab.uid"
            :tab-uid="tab.uid"
            :is-selected="selectedTab === tab.uid"
            :connection="connection"
         />
      </div>
   </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import Connection from '@/ipc-api/Connection';
import WorkspaceExploreBar from '@/components/WorkspaceExploreBar';
import WorkspaceQueryTab from '@/components/WorkspaceQueryTab';
import WorkspaceTableTab from '@/components/WorkspaceTableTab';

export default {
   name: 'Workspace',
   components: {
      WorkspaceExploreBar,
      WorkspaceQueryTab,
      WorkspaceTableTab
   },
   props: {
      connection: Object
   },
   computed: {
      ...mapGetters({
         selectedWorkspace: 'workspaces/getSelected',
         getWorkspace: 'workspaces/getWorkspace'
      }),
      workspace () {
         return this.getWorkspace(this.connection.uid);
      },
      isSelected () {
         return this.selectedWorkspace === this.connection.uid;
      },
      selectedTab () {
         return this.queryTabs.find(tab => tab.uid === this.workspace.selected_tab) || ['data', 'prop'].includes(this.workspace.selected_tab) ? this.workspace.selected_tab : this.queryTabs[0].uid;
      },
      queryTabs () {
         return this.workspace.tabs.filter(tab => tab.type === 'query');
      }
   },
   async created () {
      await this.addWorkspace(this.connection.uid);
      const isInitiated = await Connection.checkConnection(this.connection.uid);
      if (isInitiated)
         this.connectWorkspace(this.connection);
   },
   mounted () {
      if (this.$refs.tabWrap) {
         this.$refs.tabWrap.addEventListener('wheel', e => {
            if (e.deltaY > 0) this.$refs.tabWrap.scrollLeft += 50;
            else this.$refs.tabWrap.scrollLeft -= 50;
         });
      }
   },
   methods: {
      ...mapActions({
         addWorkspace: 'workspaces/addWorkspace',
         connectWorkspace: 'workspaces/connectWorkspace',
         removeConnected: 'workspaces/removeConnected',
         selectTab: 'workspaces/selectTab',
         newTab: 'workspaces/newTab',
         removeTab: 'workspaces/removeTab'
      }),
      addTab () {
         this.newTab(this.connection.uid);
      },
      closeTab (tUid) {
         if (this.queryTabs.length === 1) return;
         this.removeTab({ uid: this.connection.uid, tab: tUid });
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
      background: $bg-color-light;
      margin-top: 0;
      flex-direction: row;
      align-items: flex-start;
      flex-wrap: nowrap;
      overflow: auto;

      &::-webkit-scrollbar {
        width: 2px;
        height: 2px;
      }

      .tab-item {
        max-width: 12rem;
        width: fit-content;
        flex: initial;

        > a {
          padding: 0.2rem 0.8rem;
          color: $body-font-color;
          cursor: pointer;
          display: flex;
          align-items: center;
          opacity: 0.7;
          transition: opacity 0.2s;

          &:hover {
            opacity: 1;
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
        background: $bg-color;
        border: 1px solid;
        border-left: none;
        border-bottom-width: 2px;
        border-color: $bg-color-light;
        padding: 0;
        font-weight: 700;
        font-size: 0.7rem;
        z-index: 1;

        > div {
          padding: 0.1rem 0.4rem;
          min-width: -webkit-fill-available;
        }
      }

      .td {
        border-right: 1px solid;
        border-bottom: 1px solid;
        border-color: $bg-color-light;
        padding: 0 0.4rem;
        text-overflow: ellipsis;
        max-width: 200px;
        white-space: nowrap;
        overflow: hidden;
        font-size: 0.7rem;
        position: relative;

        &:focus {
          box-shadow: inset 0 0 0 1px $body-font-color;
          background: rgba($color: #000, $alpha: 0.3);
          outline: none;
        }
      }
    }
  }
}
</style>
