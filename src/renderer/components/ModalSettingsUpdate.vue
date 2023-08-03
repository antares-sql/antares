<template>
   <div class="empty">
      <div class="empty-icon">
         <i class="mdi mdi-48px mdi-cloud-download" />
      </div>
      <p class="empty-title h5">
         {{ updateMessage }}
      </p>
      <div v-if="updateStatus === 'downloading'">
         <progress
            class="progress"
            :value="downloadPercentage"
            max="100"
         />
         <p class="empty-subtitle">
            {{ downloadPercentage }}%
         </p>
      </div>
      <div v-if="updateStatus === 'available'">
         <progress class="progress" max="100" />
      </div>
      <div class="empty-action">
         <button
            v-if="['noupdate', 'checking', 'nocheck'].includes(updateStatus)"
            class="btn btn-primary"
            :class="{'loading': updateStatus === 'checking'}"
            @click="checkForUpdates"
         >
            {{ t('application.checkForUpdates') }}
         </button>
         <button
            v-else-if="updateStatus === 'downloaded'"
            class="btn btn-primary"
            @click="restartToUpdate"
         >
            {{ t('application.restartToInstall') }}
         </button>
         <button
            v-else-if="updateStatus === 'link'"
            class="btn btn-primary"
            @click="openOutside('https://antares-sql.app/download.html')"
         >
            {{ t('application.goToDownloadPage') }}
         </button>
      </div>
      <div class="form-group mt-4">
         <label class="form-switch d-inline-block" @click.prevent="toggleAllowPrerelease">
            <input type="checkbox" :checked="allowPrerelease">
            <i class="form-icon" /> {{ t('application.includeBetaUpdates') }}
         </label>
      </div>
   </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ipcRenderer, shell } from 'electron';
import { storeToRefs } from 'pinia';
import { useApplicationStore } from '@/stores/application';
import { useSettingsStore } from '@/stores/settings';

const { t } = useI18n();

const applicationStore = useApplicationStore();
const settingsStore = useSettingsStore();

const {
   updateStatus,
   getDownloadProgress: downloadPercentage
} = storeToRefs(applicationStore);
const { allowPrerelease } = storeToRefs(settingsStore);

const { changeAllowPrerelease } = settingsStore;

const updateMessage = computed(() => {
   switch (updateStatus.value) {
      case 'noupdate':
         return t('application.noUpdatesAvailable');
      case 'checking':
         return t('application.checkingForUpdate');
      case 'nocheck':
         return t('application.checkFailure');
      case 'available':
         return t('application.updateAvailable');
      case 'downloading':
         return t('application.downloadingUpdate');
      case 'downloaded':
         return t('application.updateDownloaded');
      case 'link':
         return t('application.updateAvailable');
      default:
         return updateStatus.value;
   }
});

const openOutside = (link: string) => {
   shell.openExternal(link);
};

const checkForUpdates = () => {
   ipcRenderer.send('check-for-updates');
};

const restartToUpdate = () => {
   ipcRenderer.send('restart-to-update');
};

const toggleAllowPrerelease = () => {
   changeAllowPrerelease(!allowPrerelease.value);
};
</script>
