<template>
   <Teleport to="#window-content">
      <div id="settings" class="modal active">
         <a class="modal-overlay c-hand" @click="closeModal" />
         <div ref="trapRef" class="modal-container">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <BaseIcon
                        icon-name="mdiCog"
                        class="mr-1"
                        :size="24"
                     />
                     <span class="cut-text">{{ t('application.settings') }}</span>
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
                           <a class="tab-link">{{ t('application.general') }}</a>
                        </li>
                        <li
                           class="tab-item c-hand"
                           :class="{'active': selectedTab === 'themes'}"
                           @click="selectTab('themes')"
                        >
                           <a class="tab-link">{{ t('application.themes') }}</a>
                        </li>
                        <li
                           class="tab-item c-hand"
                           :class="{'active': selectedTab === 'shortcuts'}"
                           @click="selectTab('shortcuts')"
                        >
                           <a class="tab-link">{{ t('application.shortcuts') }}</a>
                        </li>
                        <li
                           class="tab-item c-hand"
                           :class="{'active': selectedTab === 'data'}"
                           @click="selectTab('data')"
                        >
                           <a class="tab-link">{{ t('application.data') }}</a>
                        </li>
                        <li
                           v-if="updateStatus !== 'disabled'"
                           class="tab-item c-hand"
                           :class="{'active': selectedTab === 'update'}"
                           @click="selectTab('update')"
                        >
                           <a class="tab-link" :class="{'badge badge-update': hasUpdates}">{{ t('application.update') }}</a>
                        </li>
                        <li
                           class="tab-item c-hand"
                           :class="{'active': selectedTab === 'changelog'}"
                           @click="selectTab('changelog')"
                        >
                           <a class="tab-link">{{ t('application.changelog') }}</a>
                        </li>
                        <li
                           class="tab-item c-hand"
                           :class="{'active': selectedTab === 'about'}"
                           @click="selectTab('about')"
                        >
                           <a class="tab-link">{{ t('application.about') }}</a>
                        </li>
                     </ul>
                  </div>
                  <div v-show="selectedTab === 'general'" class="panel-body py-4">
                     <div class="container">
                        <form class="form-horizontal columns">
                           <div class="column col-12 h6 text-uppercase mb-1">
                              {{ t('application.application') }}
                           </div>
                           <div class="column col-12 col-sm-12 mb-2 columns">
                              <div class="form-group column col-12">
                                 <div class="col-5 col-sm-12">
                                    <label class="form-label">
                                       <BaseIcon
                                          icon-name="mdiTranslate"
                                          class="mr-1"
                                          :size="18"
                                       />
                                       {{ t('application.language') }}
                                    </label>
                                 </div>
                                 <div class="col-3 col-sm-12">
                                    <BaseSelect
                                       v-model="localLocale"
                                       class="form-select"
                                       :options="locales"
                                       option-track-by="code"
                                       option-label="name"
                                       @change="changeLocale(localLocale)"
                                    />
                                 </div>
                                 <div class="col-4 col-sm-12 px-2 p-vcentered">
                                    <small class="d-block" :style="'line-height: 1.1; font-size: 70%;'">
                                       {{ t('application.missingOrIncompleteTranslation') }}<br>
                                       <a class="text-bold c-hand" @click="openOutside('https://github.com/antares-sql/antares/wiki/Translate-Antares')">{{ t('application.findOutHowToContribute') }}</a>
                                    </small>
                                 </div>
                              </div>
                              <div class="form-group column col-12">
                                 <div class="col-5 col-sm-12">
                                    <label class="form-label">
                                       {{ t('application.dataTabPageSize') }}
                                    </label>
                                 </div>
                                 <div class="col-3 col-sm-12">
                                    <BaseSelect
                                       v-model="localPageSize"
                                       class="form-select"
                                       :options="pageSizes"
                                       @change="changePageSize(+localPageSize)"
                                    />
                                 </div>
                              </div>
                              <div class="form-group column col-12 mb-0">
                                 <div class="col-5 col-sm-12">
                                    <label class="form-label">
                                       {{ t('application.restorePreviousSession') }}
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
                                       {{ t('application.showTableSize') }}
                                    </label>
                                 </div>
                                 <div class="col-1 col-sm-12">
                                    <label class="form-switch d-inline-block" @click.prevent="toggleShowTableSize">
                                       <input type="checkbox" :checked="showTableSize">
                                       <i class="form-icon" />
                                    </label>
                                 </div>
                                 <div class="col-6 col-sm-12 px-2 p-vcentered">
                                    <small class="d-block" :style="'line-height: 1.1; font-size: 70%;'">
                                       {{ t('application.showTableSizeDescription') }}
                                    </small>
                                 </div>
                              </div>
                              <div class="form-group column col-12 mb-0">
                                 <div class="col-5 col-sm-12">
                                    <label class="form-label">
                                       {{ t('application.disableBlur') }}
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
                                       {{ t('application.notificationsTimeout') }}
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
                                       <span class="input-group-addon">{{ t('general.seconds') }}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                           <div class="column col-12 h6 mt-4 text-uppercase mb-1">
                              {{ t('application.editor') }}
                           </div>
                           <div class="column col-12 col-sm-12 columns">
                              <div class="form-group column col-12 mb-0">
                                 <div class="col-5 col-sm-12">
                                    <label class="form-label">
                                       {{ t('application.autoCompletion') }}
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
                                       {{ t('application.wrapLongLines') }}
                                    </label>
                                 </div>
                                 <div class="col-3 col-sm-12">
                                    <label class="form-switch d-inline-block" @click.prevent="toggleLineWrap">
                                       <input type="checkbox" :checked="selectedLineWrap">
                                       <i class="form-icon" />
                                    </label>
                                 </div>
                              </div>
                              <div class="form-group column col-12 mb-0">
                                 <div class="col-5 col-sm-12">
                                    <label class="form-label">
                                       {{ t('database.executeSelectedQuery') }}
                                    </label>
                                 </div>
                                 <div class="col-3 col-sm-12">
                                    <label class="form-switch d-inline-block" @click.prevent="toggleExecuteSelected">
                                       <input type="checkbox" :checked="selectedExecuteSelected">
                                       <i class="form-icon" />
                                    </label>
                                 </div>
                              </div>
                           </div>
                           <div class="column col-12 h6 mt-4 text-uppercase mb-1">
                              {{ t('database.resultsTable') }}
                           </div>
                           <div class="column col-12 col-sm-12 columns">
                              <div class="form-group column col-12">
                                 <div class="col-5 col-sm-12">
                                    <label class="form-label">
                                       {{ t('application.defaultCopyType') }}
                                    </label>
                                 </div>
                                 <div class="col-3 col-sm-12">
                                    <BaseSelect
                                       v-model="defaultCopyType"
                                       class="form-select"
                                       :options="copyTypes"
                                       option-track-by="code"
                                       option-label="name"
                                       @change="changeDefaultCopyType(defaultCopyType)"
                                    />
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
                              {{ t('application.applicationTheme') }}
                           </div>
                           <div
                              class="column col-6 c-hand theme-block"
                              :class="{'selected': applicationTheme === 'dark'}"
                              @click="changeApplicationTheme('dark')"
                           >
                              <img :src="darkPreview" class="img-responsive img-fit-cover s-rounded">
                              <div class="theme-name text-light">
                                 <BaseIcon
                                    icon-name="mdiMoonWaningCrescent"
                                    class="mr-1"
                                    :size="48"
                                 />
                                 <div class="h6 mt-4">
                                    {{ t('application.dark') }}
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
                                 <BaseIcon
                                    icon-name="mdiWhiteBalanceSunny"
                                    class="mr-1"
                                    :size="48"
                                 />
                                 <div class="h6 mt-4">
                                    {{ t('application.light') }}
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div class="columns mt-4">
                           <div class="column col-12 h6 text-uppercase mb-2 mt-4">
                              {{ t('application.editorTheme') }}
                           </div>
                           <div class="column col-5 h5 mb-4">
                              <BaseSelect
                                 v-model="localEditorTheme"
                                 class="form-select"
                                 :options="editorThemes"
                                 option-label="name"
                                 option-track-by="code"
                                 group-label="group"
                                 group-values="themes"
                                 @change="changeEditorTheme(localEditorTheme)"
                              />
                           </div>
                           <div class="column col-7 mb-4">
                              <div class="btn-group btn-group-block">
                                 <button
                                    class="btn btn-dark cut-text"
                                    :class="{'active': editorFontSize === 'xsmall'}"
                                    @click="changeEditorFontSize('xsmall')"
                                 >
                                    10px
                                 </button>
                                 <button
                                    class="btn btn-dark cut-text"
                                    :class="{'active': editorFontSize === 'small'}"
                                    @click="changeEditorFontSize('small')"
                                 >
                                    12px
                                 </button>
                                 <button
                                    class="btn btn-dark cut-text"
                                    :class="{'active': editorFontSize === 'medium'}"
                                    @click="changeEditorFontSize('medium')"
                                 >
                                    14px
                                 </button>
                                 <button
                                    class="btn btn-dark cut-text"
                                    :class="{'active': editorFontSize === 'large'}"
                                    @click="changeEditorFontSize('large')"
                                 >
                                    16px
                                 </button>
                                 <button
                                    class="btn btn-dark cut-text"
                                    :class="{'active': editorFontSize === 'xlarge'}"
                                    @click="changeEditorFontSize('xlarge')"
                                 >
                                    18px
                                 </button>
                                 <button
                                    class="btn btn-dark cut-text"
                                    :class="{'active': editorFontSize === 'xxlarge'}"
                                    @click="changeEditorFontSize('xxlarge')"
                                 >
                                    20px
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

                  <div v-show="selectedTab === 'shortcuts'" class="panel-body py-4">
                     <ModalSettingsShortcuts />
                  </div>
                  <div v-show="selectedTab === 'data'" class="panel-body py-4">
                     <ModalSettingsData />
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
                           {{ t('general.version') }} {{ appVersion }}<br>
                           <a
                              class="c-hand"
                              :style="'align-items: center; display: inline-flex;'"
                              @click="openOutside('https://github.com/antares-sql/antares')"
                           ><BaseIcon
                              icon-name="mdiGithub"
                              class="d-inline mr-1"
                              :size="16"
                           /> GitHub</a> • <a
                              class="c-hand"
                              :style="'align-items: center; display: inline-flex;'"
                              @click="openOutside('https://fosstodon.org/@AntaresSQL')"
                           ><BaseIcon
                              icon-name="mdiMastodon"
                              class="d-inline mr-1"
                              :size="16"
                           /> Mastodon</a> • <a
                              class="c-hand"
                              :style="'align-items: center; display: inline-flex;'"
                              @click="openOutside('https://antares-sql.app/')"
                           ><BaseIcon
                              icon-name="mdiWeb"
                              class="d-inline mr-1"
                              :size="16"
                           /> Website</a><br>
                           <small>{{ t('general.author') }} <a class="c-hand" @click="openOutside('https://github.com/Fabio286')">{{ appAuthor }}</a></small><br>
                        </p>
                        <div class="mb-2">
                           <small class="d-block text-uppercase">{{ t('general.contributors') }}:</small>
                           <div class="d-block py-1">
                              <small v-for="(contributor, i) in otherContributors" :key="i">{{ i !== 0 ? ', ' : '' }}{{ contributor }}</small>
                           </div>
                           <small>{{ t('application.madeWithJS') }}</small>
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
import { shell } from 'electron';
import { storeToRefs } from 'pinia';
import { computed, onBeforeUnmount, Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import BaseTextEditor from '@/components/BaseTextEditor.vue';
import ModalSettingsChangelog from '@/components/ModalSettingsChangelog.vue';
import ModalSettingsData from '@/components/ModalSettingsData.vue';
import ModalSettingsShortcuts from '@/components/ModalSettingsShortcuts.vue';
import ModalSettingsUpdate from '@/components/ModalSettingsUpdate.vue';
import { useFocusTrap } from '@/composables/useFocusTrap';
import { AvailableLocale } from '@/i18n';
import { localesNames } from '@/i18n/supported-locales';
import { useApplicationStore } from '@/stores/application';
import { useSettingsStore } from '@/stores/settings';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

const applicationStore = useApplicationStore();
const settingsStore = useSettingsStore();
const workspacesStore = useWorkspacesStore();

const { trapRef } = useFocusTrap({ disableAutofocus: true });

const {
   selectedSettingTab,
   updateStatus
} = storeToRefs(applicationStore);
const {
   locale: selectedLocale,
   dataTabLimit: pageSize,
   autoComplete: selectedAutoComplete,
   lineWrap: selectedLineWrap,
   executeSelected: selectedExecuteSelected,
   defaultCopyType: selectedCopyType,
   notificationsTimeout,
   restoreTabs,
   showTableSize,
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
   changeExecuteSelected,
   changeApplicationTheme,
   changeEditorTheme,
   changeEditorFontSize,
   updateNotificationsTimeout,
   changeDefaultCopyType,
   changeShowTableSize
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

const localLocale: Ref<AvailableLocale> = ref(null);
const defaultCopyType: Ref<string> = ref(null);
const localPageSize: Ref<number> = ref(null);
const localTimeout: Ref<number> = ref(null);
const localEditorTheme: Ref<string> = ref(null);
const selectedTab: Ref<string> = ref('general');

const editorThemes = computed(() => [
   {
      group: t('application.light'),
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
      group: t('application.dark'),
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
]);

const locales = computed(() => {
   const locales = [];
   for (const locale of Object.keys(localesNames))
      locales.push({ code: locale, name: localesNames[locale] });

   return locales.sort((a, b) => (a.name.localeCompare(b.name)));
});

const copyTypes = computed(() => [
   { code: 'cell', name: t('database.cell') },
   { code: 'html', name: t('database.table') },
   { code: 'json', name: 'JSON' },
   { code: 'csv', name: 'CSV' },
   { code: 'sql', name: 'SQL insert' }
]);

const hasUpdates = computed(() => ['available', 'downloading', 'downloaded', 'link'].includes(updateStatus.value));

const workspace = computed(() => {
   return getWorkspace(selectedWorkspace.value);
});

const otherContributors = computed(() => {
   return contributors
      .split(',')
      .filter(c => !c.includes(appAuthor))
      .sort((a, b) => a.toLowerCase().trim().localeCompare(b.toLowerCase()));
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

const toggleShowTableSize = () => {
   changeShowTableSize(!showTableSize.value);
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

const toggleExecuteSelected = () => {
   changeExecuteSelected(!selectedExecuteSelected.value);
};

localLocale.value = selectedLocale.value;
defaultCopyType.value = selectedCopyType.value;
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

      .tab-item {
         max-width: 20%;

         .tab-link {
           overflow: hidden;
           white-space: nowrap;
           text-overflow: ellipsis;
         }
      }

      .panel-body {
        min-height: calc(25vh - 70px);
        max-height: 65vh;
        overflow: auto;

        .theme-block {
          position: relative;
          text-align: center;

          &.selected {
            img {
              box-shadow: 0 0 0 3px var(--primary-color);
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
        background: var(--primary-color);
      }

      .form-label {
        display: flex;
        align-items: center;
      }
    }
  }
}
</style>
