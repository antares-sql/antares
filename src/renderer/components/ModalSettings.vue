<template>
   <Teleport to="#window-content">
      <div id="settings" class="modal active">
         <a class="modal-overlay c-hand" @click="closeModal" />
         <div class="modal-container">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <i class="mdi mdi-24px mdi-cog mr-1" />
                     <span class="cut-text">{{ t('word.settings') }}</span>
                  </div>
               </div>
               <a class="btn btn-clear c-hand" @click="closeModal" />
            </div>
            <div class="modal-body p-0">
               <div class="panel">
                  <div class="panel-nav">
                     <ul class="tab tab-block">
                        <li
                           class="tab-item c-hand"
                           :class="{'active': selectedTab === 'general'}"
                           @click="selectTab('general')"
                        >
                           <a class="tab-link">{{ t('word.general') }}</a>
                        </li>
                        <li
                           class="tab-item c-hand"
                           :class="{'active': selectedTab === 'themes'}"
                           @click="selectTab('themes')"
                        >
                           <a class="tab-link">{{ t('word.themes') }}</a>
                        </li>
                        <li
                           v-if="updateStatus !== 'disabled'"
                           class="tab-item c-hand"
                           :class="{'active': selectedTab === 'update'}"
                           @click="selectTab('update')"
                        >
                           <a class="tab-link" :class="{'badge badge-update': hasUpdates}">{{ t('word.update') }}</a>
                        </li>
                        <li
                           class="tab-item c-hand"
                           :class="{'active': selectedTab === 'changelog'}"
                           @click="selectTab('changelog')"
                        >
                           <a class="tab-link">{{ t('word.changelog') }}</a>
                        </li>
                        <li
                           class="tab-item c-hand"
                           :class="{'active': selectedTab === 'about'}"
                           @click="selectTab('about')"
                        >
                           <a class="tab-link">{{ t('word.about') }}</a>
                        </li>
                     </ul>
                  </div>
                  <div v-show="selectedTab === 'general'" class="panel-body py-4">
                     <div class="container">
                        <form class="form-horizontal columns">
                           <div class="column col-12 h6 text-uppercase mb-1">
                              {{ t('word.application') }}
                           </div>
                           <div class="column col-12 col-sm-12 mb-2 columns">
                              <div class="form-group column col-12">
                                 <div class="col-5 col-sm-12">
                                    <label class="form-label">
                                       <i class="mdi mdi-18px mdi-translate mr-1" />
                                       {{ t('word.language') }}
                                    </label>
                                 </div>
                                 <div class="col-3 col-sm-12">
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
                                 <div class="col-4 col-sm-12 px-2 p-vcentered">
                                    <small class="d-block" style="line-height:1.1; font-size:70%;">
                                       {{ t('message.missingOrIncompleteTranslation') }}<br>
                                       <a class="text-bold c-hand" @click="openOutside('https://github.com/antares-sql/antares/wiki/Translate-Antares')">{{ t('message.findOutHowToContribute') }}</a>
                                    </small>
                                 </div>
                              </div>
                              <div class="form-group column col-12">
                                 <div class="col-5 col-sm-12">
                                    <label class="form-label">
                                       {{ t('message.dataTabPageSize') }}
                                    </label>
                                 </div>
                                 <div class="col-3 col-sm-12">
                                    <select
                                       v-model="localPageSize"
                                       class="form-select"
                                       @change="changePageSize(+localPageSize)"
                                    >
                                       <option
                                          v-for="size in pageSizes"
                                          :key="size"
                                       >
                                          {{ size }}
                                       </option>
                                    </select>
                                 </div>
                              </div>
                              <div class="form-group column col-12 mb-0">
                                 <div class="col-5 col-sm-12">
                                    <label class="form-label">
                                       {{ t('message.restorePreviourSession') }}
                                    </label>
                                 </div>
                                 <div class="col-3 col-sm-12">
                                    <label class="form-switch d-inline-block" @click.prevent="toggleRestoreSession">
                                       <input type="checkbox" :checked="restoreTabs">
                                       <i class="form-icon" />
                                    </label>
                                 </div>
                              </div>
                              <div class="form-group column col-12 mb-0">
                                 <div class="col-5 col-sm-12">
                                    <label class="form-label">
                                       {{ t('message.disableBlur') }}
                                    </label>
                                 </div>
                                 <div class="col-3 col-sm-12">
                                    <label class="form-switch d-inline-block" @click.prevent="toggleDisableBlur">
                                       <input type="checkbox" :checked="disableBlur">
                                       <i class="form-icon" />
                                    </label>
                                 </div>
                              </div>
                              <div class="form-group column col-12">
                                 <div class="col-5 col-sm-12">
                                    <label class="form-label">
                                       {{ t('message.notificationsTimeout') }}
                                    </label>
                                 </div>
                                 <div class="col-3 col-sm-12">
                                    <div class="input-group">
                                       <input
                                          v-model="localTimeout"
                                          class="form-input"
                                          type="number"
                                          min="1"
                                          @focusout="checkNotificationsTimeout"
                                       >
                                       <span class="input-group-addon">{{ t('word.seconds') }}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                           <div class="column col-12 h6 mt-4 text-uppercase mb-1">
                              {{ t('word.editor') }}
                           </div>
                           <div class="column col-12 col-sm-12 columns">
                              <div class="form-group column col-12 mb-0">
                                 <div class="col-5 col-sm-12">
                                    <label class="form-label">
                                       {{ t('word.autoCompletion') }}
                                    </label>
                                 </div>
                                 <div class="col-3 col-sm-12">
                                    <label class="form-switch d-inline-block" @click.prevent="toggleAutoComplete">
                                       <input type="checkbox" :checked="selectedAutoComplete">
                                       <i class="form-icon" />
                                    </label>
                                 </div>
                              </div>
                              <div class="form-group column col-12 mb-0">
                                 <div class="col-5 col-sm-12">
                                    <label class="form-label">
                                       {{ t('message.wrapLongLines') }}
                                    </label>
                                 </div>
                                 <div class="col-3 col-sm-12">
                                    <label class="form-switch d-inline-block" @click.prevent="toggleLineWrap">
                                       <input type="checkbox" :checked="selectedLineWrap">
                                       <i class="form-icon" />
                                    </label>
                                 </div>
                              </div>
                           </div>
                        </form>
                     </div>
                  </div>

                  <div v-show="selectedTab === 'themes'" class="panel-body py-4">
                     <div class="container">
                        <div class="columns">
                           <div class="column col-12 h6 text-uppercase mb-2">
                              {{ t('message.applicationTheme') }}
                           </div>
                           <div
                              class="column col-6 c-hand theme-block"
                              :class="{'selected': applicationTheme === 'dark'}"
                              @click="changeApplicationTheme('dark')"
                           >
                              <img :src="darkPreview" class="img-responsive img-fit-cover s-rounded">
                              <div class="theme-name text-light">
                                 <i class="mdi mdi-moon-waning-crescent mdi-48px" />
                                 <div class="h6 mt-4">
                                    {{ t('word.dark') }}
                                 </div>
                              </div>
                           </div>
                           <div
                              class="column col-6 c-hand theme-block"
                              :class="{'selected': applicationTheme === 'light'}"
                              @click="changeApplicationTheme('light')"
                           >
                              <img :src="lightPreview" class="img-responsive img-fit-cover s-rounded">
                              <div class="theme-name text-dark">
                                 <i class="mdi mdi-white-balance-sunny mdi-48px" />
                                 <div class="h6 mt-4">
                                    {{ t('word.light') }}
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div class="columns mt-4">
                           <div class="column col-12 h6 text-uppercase mb-2 mt-4">
                              {{ t('message.editorTheme') }}
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
                           <div class="column col-6 mb-4">
                              <div class="btn-group btn-group-block">
                                 <button
                                    class="btn btn-dark cut-text"
                                    :class="{'active': editorFontSize === 'small'}"
                                    @click="changeEditorFontSize('small')"
                                 >
                                    {{ t('word.small') }}
                                 </button>
                                 <button
                                    class="btn btn-dark cut-text"
                                    :class="{'active': editorFontSize === 'medium'}"
                                    @click="changeEditorFontSize('medium')"
                                 >
                                    {{ t('word.medium') }}
                                 </button>
                                 <button
                                    class="btn btn-dark cut-text"
                                    :class="{'active': editorFontSize === 'large'}"
                                    @click="changeEditorFontSize('large')"
                                 >
                                    {{ t('word.large') }}
                                 </button>
                              </div>
                           </div>
                           <div class="column col-12">
                              <BaseTextEditor
                                 :model-value="exampleQuery"
                                 mode="sql"
                                 :workspace="workspace"
                                 :read-only="true"
                                 :height="270"
                              />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div v-show="selectedTab === 'update'" class="panel-body py-4">
                     <ModalSettingsUpdate />
                  </div>
                  <div v-show="selectedTab === 'changelog'" class="panel-body py-4">
                     <ModalSettingsChangelog />
                  </div>

                  <div v-show="selectedTab === 'about'" class="panel-body py-4">
                     <div class="text-center">
                        <img :src="appLogo" width="128">
                        <h4>{{ appName }}</h4>
                        <p class="mb-2">
                           {{ t('word.version') }} {{ appVersion }}<br>
                           <a class="c-hand" @click="openOutside('https://github.com/antares-sql/antares')"><i class="mdi mdi-github d-inline" /> GitHub</a> • <a class="c-hand" @click="openOutside('https://twitter.com/AntaresSQL')"><i class="mdi mdi-twitter d-inline" /> Twitter</a> • <a class="c-hand" @click="openOutside('https://antares-sql.app/')"><i class="mdi mdi-web d-inline" /> Website</a><br>
                           <small>{{ t('word.author') }} <a class="c-hand" @click="openOutside('https://github.com/Fabio286')">{{ appAuthor }}</a></small><br>
                        </p>
                        <div class="mb-2">
                           <small class="d-block text-uppercase">{{ t('word.contributors') }}:</small>
                           <div class="d-block py-1">
                              <small v-for="(contributor, i) in otherContributors" :key="i">{{ i !== 0 ? ', ' : '' }}{{ contributor }}</small>
                           </div>
                           <small>{{ t('message.madeWithJS') }}</small>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, Ref, ref } from 'vue';
import { shell } from 'electron';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useApplicationStore } from '@/stores/application';
import { useSettingsStore } from '@/stores/settings';
import { useWorkspacesStore } from '@/stores/workspaces';
import { localesNames } from '@/i18n/supported-locales';
import ModalSettingsUpdate from '@/components/ModalSettingsUpdate.vue';
import ModalSettingsChangelog from '@/components/ModalSettingsChangelog.vue';
import BaseTextEditor from '@/components/BaseTextEditor.vue';
import { computed } from '@vue/reactivity';

const { t, availableLocales } = useI18n();

const applicationStore = useApplicationStore();
const settingsStore = useSettingsStore();
const workspacesStore = useWorkspacesStore();

const {
   selectedSettingTab,
   updateStatus
} = storeToRefs(applicationStore);
const {
   locale: selectedLocale,
   dataTabLimit: pageSize,
   autoComplete: selectedAutoComplete,
   lineWrap: selectedLineWrap,
   notificationsTimeout,
   restoreTabs,
   disableBlur,
   applicationTheme,
   editorTheme,
   editorFontSize
} = storeToRefs(settingsStore);

const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

const {
   changeLocale,
   changePageSize,
   changeRestoreTabs,
   changeDisableBlur,
   changeAutoComplete,
   changeLineWrap,
   changeApplicationTheme,
   changeEditorTheme,
   changeEditorFontSize,
   updateNotificationsTimeout
} = settingsStore;
const {
   hideSettingModal: closeModal,
   appName,
   appVersion
} = applicationStore;
const { getWorkspace } = workspacesStore;

const appAuthor = 'Fabio Di Stasio';
const pageSizes = [30, 40, 100, 250, 500, 1000];
const contributors = process.env.APP_CONTRIBUTORS;
const appLogo = require('../images/logo.svg');
const darkPreview = require('../images/dark.png');
const lightPreview = require('../images/light.png');
const editorThemes= [
   {
      group: t('word.light'),
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
      group: t('word.dark'),
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
];
const exampleQuery = `-- This is an example
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

const localLocale: Ref<string> = ref(null);
const localPageSize: Ref<number> = ref(null);
const localTimeout: Ref<number> = ref(null);
const localEditorTheme: Ref<string> = ref(null);
const selectedTab: Ref<string> = ref('general');

const locales = computed(() => {
   const locales = [];
   for (const locale of availableLocales)
      locales.push({ code: locale, name: localesNames[locale] });

   return locales;
});

const hasUpdates = computed(() => ['available', 'downloading', 'downloaded', 'link'].includes(updateStatus.value));

const workspace = computed(() => {
   return getWorkspace(selectedWorkspace.value);
});

const otherContributors = computed(() => {
   return contributors
      .split(',')
      .filter(c => !c.includes(appAuthor))
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
});

const selectTab = (tab: string) => {
   selectedTab.value = tab;
};

const openOutside = (link: string) => {
   shell.openExternal(link);
};

const checkNotificationsTimeout = () => {
   if (!localTimeout.value)
      localTimeout.value = 10;

   updateNotificationsTimeout(+localTimeout.value);
};

const onKey = (e: KeyboardEvent) => {
   e.stopPropagation();
   if (e.key === 'Escape')
      closeModal();
};

const toggleRestoreSession = () => {
   changeRestoreTabs(!restoreTabs.value);
};

const toggleDisableBlur = () => {
   changeDisableBlur(!disableBlur.value);
};

const toggleAutoComplete = () => {
   changeAutoComplete(!selectedAutoComplete.value);
};

const toggleLineWrap = () => {
   changeLineWrap(!selectedLineWrap.value);
};

localLocale.value = selectedLocale.value as string;
localPageSize.value = pageSize.value as number;
localTimeout.value = notificationsTimeout.value as number;
localEditorTheme.value = editorTheme.value as string;
selectedTab.value = selectedSettingTab.value;
window.addEventListener('keydown', onKey);

onBeforeUnmount(() => {
   window.removeEventListener('keydown', onKey);
});
</script>

<style lang="scss">
#settings {
  .modal-container {
    position: absolute;
    top: 17.5vh;

    .modal-body {
      overflow: hidden;

      .panel-body {
        min-height: calc(25vh - 70px);
        max-height: 65vh;
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
}
</style>
