<template>
   <div id="footer" class="text-light">
      <div class="footer-left-elements">
         <ul class="footer-elements">
            <li class="footer-element">
               <i class="material-icons md-18 mr-1">memory</i>
               <small>{{ appVersion }}</small>
            </li>
         </ul>
      </div>

      <div class="footer-right-elements">
         <ul class="footer-elements">
            <li class="footer-element footer-link" @click="openOutside('https://www.patreon.com/fabio286')">
               <i class="material-icons md-18 mr-1">favorite</i>
               <small>{{ $t('word.donate') }}</small>
            </li>
            <li class="footer-element footer-link" @click="openOutside('https://github.com/EStarium/antares/issues')">
               <i class="material-icons md-18">bug_report</i>
            </li>
            <li class="footer-element footer-link" @click="showSettingModal('about')">
               <i class="material-icons md-18">info_outline</i>
            </li>
         </ul>
      </div>
   </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
const { shell } = require('electron');

export default {
   name: 'TheFooter',
   computed: {
      ...mapGetters({
         appName: 'application/appName',
         appVersion: 'application/appVersion'
      })
   },
   methods: {
      ...mapActions({
         showSettingModal: 'application/showSettingModal'
      }),
      openOutside (link) {
         shell.openExternal(link);
      }
   }
};
</script>

<style lang="scss">
   #footer{
      height: $footer-height;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: $primary-color;
      padding: 0 .2rem;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      box-shadow: 0 0 1px 0px #000;

      .footer-elements{
         list-style: none;
         margin: 0;
         display: flex;
         align-items: center;

         .footer-element{
            height: $footer-height;
            display: flex;
            align-items: center;
            padding: 0 .4rem;
            margin: 0;

            &.footer-link{
               cursor: pointer;
               transition: background .2s;

               &:hover{
                  background: rgba($color: #fff, $alpha: .1);
               }
            }
         }
      }
   }
</style>
