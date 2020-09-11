<template>
   <div class="columns">
      <div class="column col-12 empty text-light">
         <div class="empty-icon">
            <i class="mdi mdi-48px mdi-power-plug-off" />
         </div>
         <p class="empty-title h5">
            {{ isConnecting ? $t('word.connecting') : $t('word.disconnected') }}
         </p>
         <div class="empty-action">
            <button
               class="btn btn-success"
               :class="{'loading': isConnecting}"
               @click="startConnection"
            >
               {{ $t('word.connect') }}
            </button>
         </div>
      </div>
      <ModalAskCredentials
         v-if="isAsking"
         @close-asking="closeAsking"
         @credentials="continueTest"
      />
   </div>
</template>

<script>
import { mapActions } from 'vuex';
import ModalAskCredentials from '@/components/ModalAskCredentials';

export default {
   name: 'WorkspaceConnectPanel',
   components: {
      ModalAskCredentials
   },
   props: {
      connection: Object
   },
   data () {
      return {
         isConnecting: false,
         isAsking: false
      };
   },
   methods: {
      ...mapActions({
         connectWorkspace: 'workspaces/connectWorkspace'
      }),
      async startConnection () {
         this.isConnecting = true;

         if (this.connection.ask)
            this.isAsking = true;
         else {
            await this.connectWorkspace(this.connection);
            this.isConnecting = false;
         }
      },
      async continueTest (credentials) { // if "Ask for credentials" is true
         this.isAsking = false;
         const params = Object.assign({}, this.connection, credentials);
         await this.connectWorkspace(params);
         this.isConnecting = false;
      },
      closeAsking () {
         this.isAsking = false;
         this.isConnecting = false;
      }
   }
};
</script>

<style scoped>
  .empty {
    height: 100%;
    border-radius: 0;
    background: transparent;
    display: flex;
    flex-direction: column;
  }
</style>
