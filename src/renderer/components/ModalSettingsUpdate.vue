<template>
   <div class="empty">
      <div class="empty-icon">
         <i class="material-icons md-48">system_update_alt</i>
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
            v-if="updateStatus === 'downloaded'"
            class="btn btn-primary"
            @click="restartToUpdate"
         >
            {{ $t('message.restartToInstall') }}
         </button>
      </div>
   </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { ipcRenderer } from 'electron';

export default {
   name: 'ModalSettingsUpdate',
   computed: {
      ...mapGetters({
         updateStatus: 'application/getUpdateStatus',
         downloadPercentage: 'application/getDownloadProgress'
      }),
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
            default:
               return this.updateStatus;
         }
      }
   },
   methods: {
      checkForUpdates () {
         ipcRenderer.send('checkForUpdates');
      },
      restartToUpdate () {
         ipcRenderer.send('restartToUpdate');
      }
   }
};
</script>

<style lang="scss">
.empty {
  color: $body-font-color;
}
</style>
