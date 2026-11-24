<template>
   <div class="empty-state">
      <dl class="shortcut-list">
         <template v-for="shortcut in essentialShortcuts" :key="shortcut.event">
            <dt>{{ t(shortcutEvents[shortcut.event].i18n) }}</dt>
            <dd v-html="parseKeys([shortcut.key])" />
         </template>
      </dl>
   </div>
</template>

<script setup lang="ts">
import { shortcutEvents } from 'common/shortcuts';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useFilters } from '@/composables/useFilters';
import { useSettingsStore } from '@/stores/settings';

/** Only the essentials: the full list lives in Settings → Shortcuts */
const ESSENTIAL_EVENTS = [
   'run-or-reload',
   'run-query-at-cursor',
   'format-query',
   'query-history',
   'open-new-tab',
   'close-tab'
];

const { parseKeys } = useFilters();
const { t } = useI18n();

const settingsStore = useSettingsStore();
const { shortcuts } = storeToRefs(settingsStore);

const essentialShortcuts = computed(() => {
   return ESSENTIAL_EVENTS.reduce((acc, event) => {
      const shortcut = shortcuts.value.find(s => s.event === event && s.keys.length);
      if (shortcut) acc.push({ event, key: shortcut.keys[0] as string });
      return acc;
   }, [] as { event: string; key: string }[]);
});
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  justify-content: center;
  width: 100%;
  padding-top: 12vh;
  opacity: 0.6;
}

.shortcut-list {
  display: grid;
  grid-template-columns: auto auto;
  column-gap: 1rem;
  row-gap: 0.4rem;
  margin: 0;
  font-size: 0.7rem;

  dt {
    font-weight: normal;
    text-align: right;
  }

  dd {
    margin: 0;
  }
}
</style>
