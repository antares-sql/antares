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

<script>
import { ipcRenderer, shell } from 'electron';
import { storeToRefs } from 'pinia';
import { useApplicationStore } from '@/stores/application';
import { useSettingsStore } from '@/stores/settings';

export default {
   name: 'ModalSettingsUpdate',
   setup () {
      const applicationStore = useApplicationStore();
      const settingsStore = useSettingsStore();

      const {
         updateStatus,
         getDownloadProgress
      } = storeToRefs(applicationStore);
      const { allowPrerelease } = storeToRefs(settingsStore);

      const { changeAllowPrerelease } = settingsStore;

      return {
         updateStatus,
         downloadPercentage: getDownloadProgress,
         allowPrerelease,
         changeAllowPrerelease
      };
   },
   computed: {
      updateMessage () {
         switch (this.updateStatus) {
            case 'noupdate':
               return this.$t('message.noUpdatesAvailable');
            case 'checking':
               return this.$t('message.checkingForUpdate');
            case 'nocheck':
               return this.$t('message.checkFailure');
            case 'available':
               return this.$t('message.updateAvailable');
            case 'downloading':
               return this.$t('message.downloadingUpdate');
            case 'downloaded':
               return this.$t('message.updateDownloaded');
            case 'link':
               return this.$t('message.updateAvailable');
            default:
               return this.updateStatus;
         }
      }
   },
   methods: {
      openOutside (link) {
         shell.openExternal(link);
      },
      checkForUpdates () {
         ipcRenderer.send('check-for-updates');
      },
      restartToUpdate () {
         ipcRenderer.send('restart-to-update');
      },
      toggleAllowPrerelease () {
         this.changeAllowPrerelease(!this.allowPrerelease);
      }
   }
};
</script>
