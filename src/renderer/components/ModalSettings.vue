<template>
   <div id="settings" class="modal active">
      <a class="modal-overlay c-hand" @click="closeModal" />
      <div class="modal-container">
         <div class="modal-header">
            <div class="modal-title h5">
               {{ $t('word.settings') }}
            </div>
            <a class="btn btn-clear c-hand" @click="closeModal" />
         </div>
         <div class="modal-body p-0">
            <div class="panel">
               <div class="panel-nav">
                  <ul class="tab tab-block">
                     <li
                        class="tab-item"
                        :class="{'active': selectedTab === 'general'}"
                        @click="selectTab('general')"
                     >
                        <a class="c-hand">{{ $t('word.general') }}</a>
                     </li>
                     <li
                        class="tab-item"
                        :class="{'active': selectedTab === 'themes'}"
                        @click="selectTab('themes')"
                     >
                        <a class="c-hand">{{ $t('word.themes') }}</a>
                     </li>
                     <li
                        class="tab-item"
                        :class="{'active': selectedTab === 'update'}"
                        @click="selectTab('update')"
                     >
                        <a class="c-hand" :class="{'badge': isUpdate}">{{ $t('word.update') }}</a>
                     </li>
                     <li
                        class="tab-item"
                        :class="{'active': selectedTab === 'about'}"
                        @click="selectTab('about')"
                     >
                        <a class="c-hand">{{ $t('word.about') }}</a>
                     </li>
                  </ul>
               </div>
               <div v-if="selectedTab === 'general'" class="panel-body py-4">
                  <form class="form-horizontal">
                     <div class="col-6 col-sm-12">
                        <div class="form-group">
                           <div class="col-6 col-sm-12">
                              <label class="form-label">
                                 <i class="material-icons md-18 mr-1">translate</i>
                                 {{ $t('word.language') }}:
                              </label>
                           </div>
                           <div class="col-6 col-sm-12">
                              <select
                                 v-model="localLocale"
                                 class="form-select"
                                 @change="changeLocale(localLocale)"
                              >
                                 <option
                                    v-for="(locale, key) in locales"
                                    :key="key"
                                    :value="locale.code"
                                 >
                                    {{ locale.name }}
                                 </option>
                              </select>
                           </div>
                        </div>
                     </div>
                  </form>
               </div>
               <div v-if="selectedTab === 'themes'" class="panel-body py-4">
                  <!--  -->
               </div>
               <div v-if="selectedTab === 'update'" class="panel-body py-4">
                  <!--  -->
               </div>
               <div v-if="selectedTab === 'about'" class="panel-body py-4">
                  <div class="text-center">
                     <img :src="require('@/images/logo.svg').default" width="128">
                     <h4>{{ appName }}</h4>
                     <p>
                        {{ $t('word.version') }}: {{ appVersion }}<br>
                        <a class="c-hand" @click="openOutside('https://github.com/Fabio286/antares')">GitHub</a>
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import localesNames from '@/i18n/supported-locales';
const { shell } = require('electron');

export default {
   name: 'ModalSettings',
   data () {
      return {
         isUpdate: false,
         localLocale: null,
         selectedTab: 'general'
      };
   },
   computed: {
      ...mapGetters({
         appName: 'application/appName',
         appVersion: 'application/appVersion',
         selectedSettingTab: 'application/selectedSettingTab',
         selectedLocale: 'settings/getLocale'
      }),
      locales () {
         const locales = [];
         for (const locale of this.$i18n.availableLocales)
            locales.push({ code: locale, name: localesNames[locale] });

         return locales;
      }
   },
   created () {
      this.localLocale = this.selectedLocale;
      this.selectedTab = this.selectedSettingTab;
   },
   methods: {
      ...mapActions({
         closeModal: 'application/hideSettingModal',
         changeLocale: 'settings/changeLocale'
      }),
      selectTab (tab) {
         this.selectedTab = tab;
      },
      openOutside (link) {
         shell.openExternal(link);
      }
   }
};
</script>

<style lang="scss">
#settings{
   .modal-body{
      overflow: hidden;

      .panel-body{
         height: calc(70vh - 70px);
         overflow: auto;
      }

      .badge::after{
         background: #32b643;
      }

      .form-label{
         display: flex;
         align-items: center;
      }
   }

}
</style>
