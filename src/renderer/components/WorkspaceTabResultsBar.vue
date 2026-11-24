<template>
   <div class="workspace-results-bar">
      <div class="workspace-results-info">
         <slot />
      </div>
      <div class="workspace-results-actions">
         <div class="dropdown dropdown-right table-dropdown">
            <button
               :disabled="disabled"
               class="btn btn-dark btn-sm dropdown-toggle"
               :title="t('general.copy')"
               tabindex="0"
            >
               <BaseIcon icon-name="copy" :size="20" />
               <span class="results-action-label">{{ t('general.copy') }}</span>
               <BaseIcon icon-name="caret-down" :size="20" />
            </button>
            <ul class="menu text-left">
               <li
                  v-for="format in formats"
                  :key="format.value"
                  class="menu-item"
               >
                  <a
                     v-button
                     role="menuitem"
                     tabindex="-1"
                     class="c-hand"
                     @click="emit('copy', format.value)"
                  >{{ format.label }}</a>
               </li>
            </ul>
         </div>
         <div class="dropdown dropdown-right table-dropdown">
            <button
               :disabled="disabled"
               class="btn btn-dark btn-sm dropdown-toggle"
               :title="t('database.export')"
               tabindex="0"
            >
               <BaseIcon icon-name="file+up" :size="20" />
               <span class="results-action-label">{{ t('database.export') }}</span>
               <BaseIcon icon-name="caret-down" :size="20" />
            </button>
            <ul class="menu text-left">
               <li
                  v-for="format in formats"
                  :key="format.value"
                  class="menu-item"
               >
                  <a
                     v-button
                     role="menuitem"
                     tabindex="-1"
                     class="c-hand"
                     @click="emit('export', format.value)"
                  >{{ format.label }}</a>
               </li>
            </ul>
         </div>
      </div>
   </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import { ExportFormat } from '@/libs/exportRows';

/**
 * Bar above a results grid (query and table data tabs): what describes or acts on the results
 * (duration, counts, pagination in the default slot; copy and export on the right)
 */
defineProps({
   disabled: { type: Boolean, default: false }
});

const emit = defineEmits<{
   copy: [format: ExportFormat];
   export: [format: ExportFormat];
}>();

const { t } = useI18n();

const formats = computed<{ value: ExportFormat; label: string }[]>(() => [
   { value: 'json', label: 'JSON' },
   { value: 'csv', label: 'CSV' },
   { value: 'php', label: t('application.phpArray') },
   { value: 'sql', label: 'SQL INSERT' },
   { value: 'md', label: 'Markdown' }
]);
</script>

<style lang="scss">
.workspace-results-bar {
  container-type: inline-size;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 34px;
  padding: 0.2rem 0.6rem;
  border-top: 1px solid var(--border);

  .workspace-results-info {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    min-width: 0;
    white-space: nowrap;

    .d-flex {
      align-items: center;
    }
  }

  .workspace-results-actions {
    display: flex;
    gap: 0.4rem;
    margin-left: auto;

    .btn {
      display: flex;
      align-items: center;
      gap: 0.2rem;
      padding-right: 0.1rem;
    }
  }

  // Narrow tab: icons only
  @container (max-width: 560px) {
    .results-action-label {
      display: none;
    }
  }
}
</style>
