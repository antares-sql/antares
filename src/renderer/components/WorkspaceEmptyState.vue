<template>
   <div class="column col-12 empty">
      <div class="empty-icon">
         <img
            v-if="applicationTheme === 'dark'"
            src="../images/logo-dark.svg"
            width="200"
         >
         <img
            v-if="applicationTheme === 'light'"
            src="../images/logo-light.svg"
            width="200"
         >
      </div>
      <p class="h6 empty-subtitle">
         {{ $t('message.noOpenTabs') }}
      </p>
      <div class="empty-action">
         <button class="btn btn-gray d-flex" @click="$emit('new-tab')">
            <i class="mdi mdi-24px mdi-tab-plus mr-2" />
            {{ $t('message.openNewTab') }}
         </button>
      </div>
   </div>
</template>

<script>
import { useSettingsStore } from '@/stores/settings';
import { useWorkspacesStore } from '@/stores/workspaces';
import { storeToRefs } from 'pinia';
export default {
   name: 'WorkspaceEmptyState',
   emits: ['new-tab'],
   setup () {
      const settingsStore = useSettingsStore();
      const workspacesStore = useWorkspacesStore();

      const { applicationTheme } = storeToRefs(settingsStore);
      const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

      const { getWorkspace, changeBreadcrumbs } = workspacesStore;

      return {
         applicationTheme,
         selectedWorkspace,
         getWorkspace,
         changeBreadcrumbs
      };
   },
   computed: {
      workspace () {
         return this.getWorkspace(this.selectedWorkspace);
      }
   },
   created () {
      this.changeBreadcrumbs({ schema: this.workspace.breadcrumbs.schema });
   }
};
</script>

<style scoped>
  .empty {
    height: 100%;
    border-radius: 0;
    background: transparent;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-left: auto;
    margin-right: auto;
  }
</style>
