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
                        <a class="c-hand" :class="{'badge badge-update': hasUpdates}">{{ $t('word.update') }}</a>
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
                  <div class="container">
                     <div class="columns">
                        <div class="column col-12 h5 mb-2 ">
                           {{ $t('message.applicationTheme') }}
                        </div>
                        <div class="column col-6 c-hand theme-block" :class="{'selected': applicationTheme === 'dark'}">
                           <img :src="require('@/images/dark.png').default" class="img-responsive img-fit-cover s-rounded">
                           <div class="theme-name">
                              <i class="mdi mdi-moon-waning-crescent mdi-48px" />
                              <div class="h6 mt-4">
                                 {{ $t('word.dark') }}
                              </div>
                           </div>
                        </div>
                        <div class="column col-6 theme-block disabled" :class="{'selected': applicationTheme === 'light'}">
                           <div class="theme-name">
                              <i class="mdi mdi-white-balance-sunny mdi-48px" />
                              <div class="h6 mt-4">
                                 {{ $t('word.light') }} (Coming)
                              </div>
                           </div>
                        </div>
                     </div>

                     <div class="columns mt-4">
                        <div class="column col-12 h5 mb-2">
                           {{ $t('message.editorTheme') }}
                        </div>
                        <div class="column col-6 h5 mb-4">
                           <select
                              v-model="localEditorTheme"
                              class="form-select"
                              @change="changeEditorTheme(localEditorTheme)"
                           >
                              <optgroup
                                 v-for="group in editorThemes"
                                 :key="group.group"
                                 :label="group.group"
                              >
                                 <option
                                    v-for="theme in group.themes"
                                    :key="theme.name"
                                    :value="theme.code"
                                    :selected="editorTheme === theme.code"
                                 >
                                    {{ theme.name }}
                                 </option>
                              </optgroup>
                           </select>
                        </div>
                        <div class="column col-12">
                           <QueryEditor
                              :value="exampleQuery"
                              :workspace="workspace"
                              :read-only="true"
                              :height="270"
                           />
                        </div>
                     </div>
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
                        <a class="c-hand" @click="openOutside('https://github.com/Fabio286/antares')">GitHub</a><br>
                        <small>{{ $t('word.author') }}: <a class="c-hand" @click="openOutside('https://github.com/Fabio286')">Fabio Di Stasio</a></small><br>
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
import QueryEditor from '@/components/QueryEditor';
const { shell } = require('electron');

export default {
   name: 'ModalSettings',
   components: {
      ModalSettingsUpdate,
      QueryEditor
   },
   data () {
      return {
         localLocale: null,
         localTimeout: null,
         localEditorTheme: null,
         selectedTab: 'general',
         editorThemes: [
            {
               group: this.$t('word.light'),
               themes: [
                  { code: 'chrome', name: 'Chrome' },
                  { code: 'clouds', name: 'Clouds' },
                  { code: 'crimson_editor', name: 'Crimson Editor' },
                  { code: 'dawn', name: 'Dawn' },
                  { code: 'dreamweaver', name: 'Dreamweaver' },
                  { code: 'eclupse', name: 'Eclipse' },
                  { code: 'github', name: 'GitHub' },
                  { code: 'iplastic', name: 'IPlastic' },
                  { code: 'solarized_light', name: 'Solarized Light' },
                  { code: 'textmate', name: 'TextMate' },
                  { code: 'tomorrow', name: 'Tomorrow' },
                  { code: 'xcode', name: 'Xcode' },
                  { code: 'kuroir', name: 'Kuroir' },
                  { code: 'katzenmilch', name: 'KatzenMilch' },
                  { code: 'sqlserver', name: 'SQL Server' }
               ]
            },
            {
               group: this.$t('word.dark'),
               themes: [
                  { code: 'ambiance', name: 'Ambiance' },
                  { code: 'chaos', name: 'Chaos' },
                  { code: 'clouds_midnight', name: 'Clouds Midnight' },
                  { code: 'dracula', name: 'Dracula' },
                  { code: 'cobalt', name: 'Cobalt' },
                  { code: 'gruvbox', name: 'Gruvbox' },
                  { code: 'gob', name: 'Green on Black' },
                  { code: 'idle_fingers', name: 'Idle Fingers' },
                  { code: 'kr_theme', name: 'krTheme' },
                  { code: 'merbivore', name: 'Merbivore' },
                  { code: 'mono_industrial', name: 'Mono Industrial' },
                  { code: 'monokai', name: 'Monokai' },
                  { code: 'nord_dark', name: 'Nord Dark' },
                  { code: 'pastel_on_dark', name: 'Pastel on Dark' },
                  { code: 'solarized_dark', name: 'Solarized Dark' },
                  { code: 'terminal', name: 'Terminal' },
                  { code: 'tomorrow_night', name: 'Tomorrow Night' },
                  { code: 'tomorrow_night_blue', name: 'Tomorrow Night Blue' },
                  { code: 'tomorrow_night_bright', name: 'Tomorrow Night Bright' },
                  { code: 'tomorrow_night_eighties', name: 'Tomorrow Night 80s' },
                  { code: 'twilight', name: 'Twilight' },
                  { code: 'vibrant_ink', name: 'Vibrant Ink' }
               ]
            }
         ]
      };
   },
   computed: {
      ...mapGetters({
         appName: 'application/appName',
         appVersion: 'application/appVersion',
         selectedSettingTab: 'application/selectedSettingTab',
         selectedLocale: 'settings/getLocale',
         notificationsTimeout: 'settings/getNotificationsTimeout',
         applicationTheme: 'settings/getApplicationTheme',
         editorTheme: 'settings/getEditorTheme',
         updateStatus: 'application/getUpdateStatus',
         selectedWorkspace: 'workspaces/getSelected',
         getWorkspace: 'workspaces/getWorkspace'
      }),
      locales () {
         const locales = [];
         for (const locale of this.$i18n.availableLocales)
            locales.push({ code: locale, name: localesNames[locale] });

         return locales;
      },
      hasUpdates () {
         return ['available', 'downloading', 'downloaded'].includes(this.updateStatus);
      },
      workspace () {
         return this.getWorkspace(this.selectedWorkspace);
      },
      exampleQuery () {
         return `-- This is an example
SELECT 
    employee.id,
    employee.first_name,
    employee.last_name,
    SUM(DATEDIFF("SECOND", call.start, call.end)) AS call_duration
FROM call
INNER JOIN employee ON call.employee_id = employee.id
GROUP BY
    employee.id,
    employee.first_name,
    employee.last_name
ORDER BY
    employee.id ASC;
`;
      }
   },
   created () {
      this.localLocale = this.selectedLocale;
      this.localTimeout = this.notificationsTimeout;
      this.localEditorTheme = this.editorTheme;
      this.selectedTab = this.selectedSettingTab;
      window.addEventListener('keydown', this.onKey);
   },
   beforeDestroy () {
      window.removeEventListener('keydown', this.onKey);
   },
   methods: {
      ...mapActions({
         closeModal: 'application/hideSettingModal',
         changeLocale: 'settings/changeLocale',
         changeEditorTheme: 'settings/changeEditorTheme',
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
      },
      onKey (e) {
         e.stopPropagation();
         if (e.key === 'Escape')
            this.closeModal();
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

      .theme-block {
        position: relative;
        text-align: center;

        &.selected {
          img {
            box-shadow: 0 0 0 3px $primary-color;
          }
        }

        &.disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .theme-name {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          top: 0;
          height: 100%;
          width: 100%;
          text-shadow: 0 0 8px #000;
        }
      }
    }

    .badge::after {
      background: #32b643;
    }

    .badge-update::after {
      bottom: initial;
      background: $primary-color;
    }

    .form-label {
      display: flex;
      align-items: center;
    }
  }
}
</style>
