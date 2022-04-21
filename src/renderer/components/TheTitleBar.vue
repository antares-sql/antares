<template>
   <div id="titlebar" @dblclick="toggleFullScreen">
      <div class="titlebar-resizer" />
      <div class="titlebar-elements">
         <img
            v-if="!isMacOS"
            class="titlebar-logo"
            src="@/images/logo.svg"
         >
      </div>
      <div class="titlebar-elements titlebar-title">
         {{ windowTitle }}
      </div>
      <div class="titlebar-elements">
         <div
            v-if="isDevelopment"
            class="titlebar-element"
            @click="openDevTools"
         >
            <i class="mdi mdi-24px mdi-code-tags" />
         </div>
         <div
            v-if="isDevelopment"
            class="titlebar-element"
            @click="reload"
         >
            <i class="mdi mdi-24px mdi-refresh" />
         </div>
         <div
            v-if="!isMacOS"
            class="titlebar-element"
            @click="minimizeApp"
         >
            <i class="mdi mdi-24px mdi-minus" />
         </div>
         <div
            v-if="!isMacOS"
            class="titlebar-element"
            @click="toggleFullScreen"
         >
            <i v-if="isMaximized" class="mdi mdi-24px mdi-fullscreen-exit" />
            <i v-else class="mdi mdi-24px mdi-fullscreen" />
         </div>
         <div
            v-if="!isMacOS"
            class="titlebar-element close-button"
            @click="closeApp"
         >
            <i class="mdi mdi-24px mdi-close" />
         </div>
      </div>
   </div>
</template>

<script>
import { ipcRenderer } from 'electron';
import { getCurrentWindow } from '@electron/remote';
import { mapGetters } from 'vuex';

export default {
   name: 'TheTitleBar',
   data () {
      return {
         w: getCurrentWindow(),
         isMaximized: getCurrentWindow().isMaximized(),
         isDevelopment: process.env.NODE_ENV === 'development',
         isMacOS: process.platform === 'darwin'
      };
   },
   computed: {
      ...mapGetters({
         getConnectionName: 'connections/getConnectionName',
         selectedWorkspace: 'workspaces/getSelected',
         getWorkspace: 'workspaces/getWorkspace'
      }),
      windowTitle () {
         if (!this.selectedWorkspace) return '';
         if (this.selectedWorkspace === 'NEW') return this.$t('message.createNewConnection');

         const connectionName = this.getConnectionName(this.selectedWorkspace);
         const workspace = this.getWorkspace(this.selectedWorkspace);
         const breadcrumbs = Object.values(workspace.breadcrumbs).filter(breadcrumb => breadcrumb);

         return [connectionName, ...breadcrumbs].join(' • ');
      }
   },
   created () {
      window.addEventListener('resize', this.onResize);
   },
   unmounted () {
      window.removeEventListener('resize', this.onResize);
   },
   methods: {
      closeApp () {
         ipcRenderer.send('close-app');
      },
      minimizeApp () {
         this.w.minimize();
      },
      toggleFullScreen () {
         if (this.isMaximized)
            this.w.unmaximize();
         else
            this.w.maximize();
      },
      openDevTools () {
         this.w.openDevTools();
      },
      reload () {
         this.w.reload();
      },
      onResize () {
         this.isMaximized = this.w.isMaximized();
      }
   }
};
</script>

<style lang="scss">
  #titlebar {
    display: flex;
    position: relative;
    justify-content: space-between;
    align-items: center;
    height: $titlebar-height;
    -webkit-app-region: drag;
    user-select: none;
    z-index: 9999;

    .titlebar-resizer {
      position: absolute;
      top: 0;
      width: 100%;
      height: 4px;
      z-index: 999;
      -webkit-app-region: no-drag;
    }

    .titlebar-elements {
      display: flex;
      align-items: center;

      &.titlebar-title {
        position: absolute;
        left: 0;
        right: 0;
        text-align: center;
        display: block;
        pointer-events: none;
      }

      .titlebar-logo {
        height: $titlebar-height;
        padding: 0.3rem 0.4rem;
      }

      .titlebar-element {
        display: flex;
        align-items: center;
        height: $titlebar-height;
        line-height: 0;
        padding: 0 0.7rem;
        opacity: 0.7;
        transition: opacity 0.2s;
        -webkit-app-region: no-drag;

        &:hover {
          opacity: 1;
        }
      }
    }
  }
</style>
