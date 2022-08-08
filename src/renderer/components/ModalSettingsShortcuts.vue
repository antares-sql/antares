<template>
   <div class="p-relative">
      <div class="container workspace-query-results">
         <div class="table table-hover">
            <div class="thead">
               <div class="tr text-uppercase">
                  <div class="th no-border">
                     <div>
                        {{ t('word.event') }}
                     </div>
                  </div>
                  <div class="th no-border" style="width: 100%">
                     <div>
                        {{ t('word.key', 2) }}
                     </div>
                  </div>
               </div>
            </div>

            <div class="tbody">
               <div
                  v-for="(shortcut, i) in shortcuts"
                  :key="i"
                  class="tr"
                  tabindex="0"
               >
                  <div class="td py-1">
                     {{ shortcut.description }}
                  </div>
                  <div class="td py-1" v-html="parseKeys(shortcut.keys)" />
               </div>
            </div>
         </div>
      </div>
   </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings';

const { t } = useI18n();

const isMacOS = process.platform === 'darwin';

const settingsStore = useSettingsStore();
const { shortcuts } = storeToRefs(settingsStore);

const parseKeys = (keys: {[key: number]: string}[]) => {
   return (keys as string[]).map(k => (
      k.split('+')
         .map(sk => (
            `<code class="text-bold">${sk}</code>`
         )))
      .join('+')
      .replaceAll('CommandOrControl', isMacOS ? 'CMD' : 'CTRL')
   ).join(', ');
};
</script>
<style scoped>
   .table .td {
      border-right: 3px solid;
      border-bottom: 3px solid;
   }
</style>
