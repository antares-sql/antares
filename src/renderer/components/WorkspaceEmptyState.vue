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
import { mapGetters, mapActions } from 'vuex';
export default {
   name: 'WorkspaceEmptyState',
   emits: ['new-tab'],
   computed: {
      ...mapGetters({
         applicationTheme: 'settings/getApplicationTheme',
         getWorkspace: 'workspaces/getWorkspace',
         selectedWorkspace: 'workspaces/getSelected'
      }),
      workspace () {
         return this.getWorkspace(this.selectedWorkspace);
      }
   },
   created () {
      this.changeBreadcrumbs({ schema: this.workspace.breadcrumbs.schema });
   },
   methods: {
      ...mapActions({
         changeBreadcrumbs: 'workspaces/changeBreadcrumbs'
      })
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
