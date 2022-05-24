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
            {{ $t('message.checkForUpdates') }}
         </button>
         <button
            v-else-if="updateStatus === 'downloaded'"
            class="btn btn-primary"
            @click="restartToUpdate"
         >
            {{ $t('message.restartToInstall') }}
         </button>
         <button
            v-else-if="updateStatus === 'link'"
            class="btn btn-primary"
            @click="openOutside('https://antares-sql.app/download.html')"
         >
            {{ $t('message.goToDownloadPage') }}
         </button>
      </div>
      <div class="form-group mt-4">
         <label class="form-switch d-inline-block disabled" @click.prevent="toggleAllowPrerelease">
            <input type="checkbox" :checked="allowPrerelease">
            <i class="form-icon" /> {{ $t('message.includeBetaUpdates') }}
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
         return t('message.noUpdatesAvailable');
      case 'checking':
         return t('message.checkingForUpdate');
      case 'nocheck':
         return t('message.checkFailure');
      case 'available':
         return t('message.updateAvailable');
      case 'downloading':
         return t('message.downloadingUpdate');
      case 'downloaded':
         return t('message.updateDownloaded');
      case 'link':
         return t('message.updateAvailable');
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
