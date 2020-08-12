<template>
   <div id="settings" class="modal active">
      <a class="modal-overlay c-hand" @click="closeModal" />
      <div class="modal-container">
         <div class="modal-header pl-2">
            <div class="modal-title h6">
               <div class="d-flex">
                  <i class="mdi mdi-24px mdi-cog mr-1" />
                  {{ $t('word.settings') }}
               </div>
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
                     <div class="col-8 col-sm-12">
                        <div class="form-group mb-4">
                           <div class="col-6 col-sm-12">
                              <label class="form-label">
                                 <i class="mdi mdi-18px mdi-translate mr-1" />
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
                        <div class="form-group">
                           <div class="col-6 col-sm-12">
                              <label class="form-label">
                                 {{ $t('message.notificationsTimeout') }}:
                              </label>
                           </div>
                           <div class="col-6 col-sm-12">
                              <div class="input-group">
                                 <input
                                    v-model="localTimeout"
                                    class="form-input"
                                    type="number"
                                    min="1"
                                    @focusout="checkNotificationsTimeout"
                                 >
                                 <span class="input-group-addon">{{ $t('word.seconds') }}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </form>
               </div>

               <div v-if="selectedTab === 'themes'" class="panel-body py-4">
                  <div class="text-center">
                     <p>In future releases</p>
                  </div>
               </div>

               <div v-if="selectedTab === 'update'" class="panel-body py-4">
                  <ModalSettingsUpdate />
               </div>

               <div v-if="selectedTab === 'about'" class="panel-body py-4">
                  <div class="text-center">
                     <img :src="require('@/images/logo.svg').default" width="128">
                     <h4>{{ appName }}</h4>
                     <p>
                        {{ $t('word.version') }}: {{ appVersion }}<br>
                        <a class="c-hand" @click="openOutside('https://github.com/EStarium/antares')">GitHub</a><br>
                        <small>{{ $t('message.madeWithJS') }}</small>
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
import ModalSettingsUpdate from '@/components/ModalSettingsUpdate';
const { shell } = require('electron');

export default {
   name: 'ModalSettings',
   components: {
      ModalSettingsUpdate
   },
   data () {
      return {
         isUpdate: false,
         localLocale: null,
         localTimeout: null,
         selectedTab: 'general'
      };
   },
   computed: {
      ...mapGetters({
         appName: 'application/appName',
         appVersion: 'application/appVersion',
         selectedSettingTab: 'application/selectedSettingTab',
         selectedLocale: 'settings/getLocale',
         notificationsTimeout: 'settings/getNotificationsTimeout'
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
      this.localTimeout = this.notificationsTimeout;
      this.selectedTab = this.selectedSettingTab;
   },
   methods: {
      ...mapActions({
         closeModal: 'application/hideSettingModal',
         changeLocale: 'settings/changeLocale',
         updateNotificationsTimeout: 'settings/updateNotificationsTimeout'
      }),
      selectTab (tab) {
         this.selectedTab = tab;
      },
      openOutside (link) {
         shell.openExternal(link);
      },
      checkNotificationsTimeout () {
         if (!this.localTimeout)
            this.localTimeout = 10;

         this.updateNotificationsTimeout(+this.localTimeout);
      }
   }
};
</script>

<style lang="scss">
#settings {
  .modal-body {
    overflow: hidden;

    .panel-body {
      height: calc(70vh - 70px);
      overflow: auto;
    }

    .badge::after {
      background: #32b643;
    }

    .form-label {
      display: flex;
      align-items: center;
    }
  }
}
</style>
