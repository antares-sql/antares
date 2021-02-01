<template>
   <div id="footer" class="text-light">
      <div class="footer-left-elements">
         <ul class="footer-elements">
            <li class="footer-element">
               <i class="mdi mdi-18px mdi-database mr-1" />
               <small>{{ versionString }}</small>
            </li>
         </ul>
      </div>

      <div class="footer-right-elements">
         <ul class="footer-elements">
            <li class="footer-element footer-link" @click="openOutside('https://github.com/sponsors/Fabio286')">
               <i class="mdi mdi-18px mdi-coffee mr-1" />
               <small>{{ $t('word.donate') }}</small>
            </li>
            <li class="footer-element footer-link" @click="openOutside('https://github.com/Fabio286/antares/issues')">
               <i class="mdi mdi-18px mdi-bug" />
            </li>
            <li class="footer-element footer-link" @click="showSettingModal('about')">
               <i class="mdi mdi-18px mdi-information-outline" />
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
         workspace: 'workspaces/getSelected',
         getWorkspace: 'workspaces/getWorkspace',
         appVersion: 'application/appVersion'
      }),
      version () {
         return this.getWorkspace(this.workspace) ? this.getWorkspace(this.workspace).version : null;
      },
      versionString () {
         if (this.version)
            return `${this.version.name} ${this.version.number} (${this.version.arch} ${this.version.os})`;
         return '';
      }
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
  #footer {
    height: $footer-height;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: $primary-color;
    padding: 0 0.2rem;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    box-shadow: 0 0 1px 0 #000;

    .footer-elements {
      list-style: none;
      margin: 0;
      display: flex;
      align-items: center;

      .footer-element {
        height: $footer-height;
        display: flex;
        align-items: center;
        padding: 0 0.4rem;
        margin: 0;

        &.footer-link {
          cursor: pointer;
          transition: background 0.2s;

          &:hover {
            background: rgba($color: #fff, $alpha: 0.1);
          }
        }
      }
    }
  }
</style>
