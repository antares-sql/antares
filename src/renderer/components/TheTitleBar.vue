<template>
   <div id="titlebar">
      <div class="titlebar-resizer" />
      <div class="titlebar-elements">
         <img class="titlebar-logo" :src="require('@/images/logo.svg').default">
      </div>
      <div class="titlebar-elements">
         <!--  -->
      </div>
      <div class="titlebar-elements">
         <div
            v-if="isDevelopment"
            class="titlebar-element"
            @click="openDevTools"
         >
            <i class="material-icons">code</i>
         </div>
         <div
            v-if="isDevelopment"
            class="titlebar-element"
            @click="reload"
         >
            <i class="material-icons">refresh</i>
         </div>
         <div class="titlebar-element" @click="minimizeApp">
            <i class="material-icons">remove</i>
         </div>
         <div class="titlebar-element" @click="toggleFullScreen">
            <i v-if="isMaximized" class="material-icons">fullscreen_exit</i>
            <i v-else class="material-icons">fullscreen</i>
         </div>
         <div class="titlebar-element close-button" @click="closeApp">
            <i class="material-icons">close</i>
         </div>
      </div>
   </div>
</template>

<script>
import { remote } from 'electron';

export default {
   name: 'TheTitleBar',
   data () {
      return {
         w: remote.getCurrentWindow(),
         isMaximized: remote.getCurrentWindow().isMaximized(),
         isDevelopment: process.env.NODE_ENV === 'development'
      };
   },
   created () {
      window.addEventListener('resize', this.onResize);
   },
   destroyed () {
      window.removeEventListener('resize', this.onResize);
   },
   methods: {
      closeApp () {
         this.w.close();
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
   #titlebar{
      display: flex;
      position: relative;
      justify-content: space-between;
      background: $bg-color-light;
      align-items: center;
      height: $titlebar-height;
      -webkit-app-region: drag;
      user-select: none;
      box-shadow: 0 0 1px 0px #000;
      z-index: 9999;

      .titlebar-resizer{
         position: absolute;
         top: 0;
         width: 100%;
         height: 4px;
         z-index: 999;
         -webkit-app-region: no-drag;
      }

      .titlebar-elements{
         display: flex;
         align-items: center;

         .titlebar-logo{
            height: $titlebar-height;
            padding: 0 .4rem;
         }

         .titlebar-element{
            display: flex;
            align-items: center;
            height: $titlebar-height;
            line-height: 0;
            padding: 0 .7rem;
            opacity: .7;
            transition: opacity .2s;
            -webkit-app-region: no-drag;

            &:hover{
               opacity: 1;
               background: rgba($color: #fff, $alpha: .2);
            }

            &.close-button:hover{
               background: red;
            }
         }
      }
   }
</style>
