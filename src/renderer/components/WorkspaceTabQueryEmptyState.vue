<template>
   <div class="container">
      <div class="columns">
         <div class="column col-16 text-right">
            <div
               v-for="(shortcut, i) in tabShortcuts"
               :key="i"
               class="mb-4"
            >
               {{ t(shortcutEvents[shortcut.event].i18n, {param: shortcutEvents[shortcut.event].i18nParam}) }}
            </div>
         </div>
         <div class="column col-16">
            <div
               v-for="(shortcut, i) in tabShortcuts"
               :key="i"
               class="mb-4"
            >
               <span v-html="parseKeys(shortcut.keys)" />
            </div>
         </div>
      </div>
   </div>
</template>

<script setup lang="ts">
import { shortcutEvents } from 'common/shortcuts';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFilters } from '@/composables/useFilters';
import { useSettingsStore } from '@/stores/settings';

const { parseKeys } = useFilters();

const { t } = useI18n();

const settingsStore = useSettingsStore();
const { shortcuts } = storeToRefs(settingsStore);

const tabShortcuts = computed(() => {
   return shortcuts.value.filter(s => shortcutEvents[s.event].context === 'tab');
});
</script>

<style scoped>
.container {
  padding-top: 15vh;
  opacity: 0.6;
}
</style>
