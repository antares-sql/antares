<template>
   <div class="column col-12 empty">
      <div class="empty-icon">
         <img :src="logos[applicationTheme]" width="200">
      </div>
      <p class="h6 empty-subtitle">
         {{ t('message.noOpenTabs') }}
      </p>
      <div class="empty-action">
         <button class="btn btn-primary d-flex" @click="emit('new-tab')">
            <i class="mdi mdi-24px mdi-tab-plus mr-2" />
            {{ t('message.openNewTab') }}
         </button>
      </div>
   </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '@/stores/settings';
import { useWorkspacesStore } from '@/stores/workspaces';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const emit = defineEmits(['new-tab']);

const logos = {
   light: require('../images/logo-light.svg') as string,
   dark: require('../images/logo-dark.svg') as string
};

const settingsStore = useSettingsStore();
const workspacesStore = useWorkspacesStore();

const { applicationTheme } = storeToRefs(settingsStore);
const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

const { getWorkspace, changeBreadcrumbs } = workspacesStore;

const workspace = computed(() => {
   return getWorkspace(selectedWorkspace.value);
});

changeBreadcrumbs({ schema: workspace.value.breadcrumbs.schema });
</script>

<style lang="scss" scoped>
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
