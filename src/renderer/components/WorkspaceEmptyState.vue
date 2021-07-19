<template>
   <div class="column col-12 empty">
      <div class="empty-icon">
         <img :src="require(`@/images/logo-${applicationTheme}.svg`).default" width="200">
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
   computed: {
      ...mapGetters({
         applicationTheme: 'settings/getApplicationTheme'
      })
   },
   created () {
      this.changeBreadcrumbs({});
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
