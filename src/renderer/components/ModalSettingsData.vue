<template>
   <div class="container">
      <div class="columns">
         <div class="column col-12 h6 text-uppercase mb-2">
            {{ t('application.exportData') }}
         </div>
         <div class="column col-12">
            {{ t('application.exportDataExplanation') }}
         </div>
         <div class="column col-12 text-right">
            <button
               class="btn btn-primary d-inline-flex"
               @click="isExportModal=true"
            >
               <BaseIcon
                  icon-name="mdiTrayArrowUp"
                  class="mr-2"
                  :size="24"
               />
               <span>{{ t('application.exportData') }}</span>
            </button>
         </div>
      </div>

      <div class="columns mt-4 mb-2">
         <div class="column col-12 h6 text-uppercase mb-2 mt-4">
            {{ t('application.importData') }}
         </div>
         <div class="column col-12">
            {{ t('application.importDataExplanation') }}
         </div>
         <div class="column col-12 text-right">
            <button
               class="btn btn-dark d-inline-flex ml-auto"
               @click="isImportModal=true"
            >
               <BaseIcon
                  icon-name="mdiTrayArrowDown"
                  class="mr-2"
                  :size="24"
               />
               <span>{{ t('application.importData') }}</span>
            </button>
         </div>
      </div>
      <ModalSettingsDataExport
         v-if="isExportModal"
         @close="isExportModal = false"
      />
      <ModalSettingsDataImport
         v-if="isImportModal"
         @close="isImportModal = false"
      />
   </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import ModalSettingsDataExport from '@/components/ModalSettingsDataExport.vue';
import ModalSettingsDataImport from '@/components/ModalSettingsDataImport.vue';

const { t } = useI18n();

const isExportModal = ref(false);
const isImportModal = ref(false);

</script>
