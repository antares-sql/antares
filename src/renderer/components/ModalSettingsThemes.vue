<template>
   <div class="container">
      <div class="columns">
         <div class="column col-12 p-vcentered mb-2 themes-toolbar">
            <div class="h6 text-uppercase mr-2">
               {{ t('application.applicationTheme') }}
            </div>
            <div class="p-vcentered">
               <button class="btn btn-dark btn-sm p-vcentered mr-2" @click="importTheme">
                  <BaseIcon
                     icon-name="mdiFileImport"
                     class="mr-1"
                     :size="18"
                  />
                  <span>{{ t('application.importTheme') }}</span>
               </button>
               <button class="btn btn-link btn-sm p-vcentered" @click="openOutside(galleryUrl)">
                  <BaseIcon
                     icon-name="mdiPaletteSwatch"
                     class="mr-1"
                     :size="18"
                  />
                  <span>{{ t('application.themeGallery') }}</span>
               </button>
            </div>
         </div>
         <div class="column col-12 text-gray mb-2">
            {{ t('application.themesHint') }}
         </div>

         <div
            v-for="theme in allThemes"
            :key="theme.id"
            class="column col-4 mb-3"
         >
            <div
               class="theme-card c-hand"
               :class="{ selected: theme.id === activeTheme.id }"
               :title="theme.description || theme.name"
               @click="changeApplicationTheme(theme.id)"
            >
               <ThemePreview :theme="theme" />
               <div class="theme-card-footer">
                  <BaseIcon
                     :icon-name="theme.appearance === 'dark' ? 'mdiMoonWaningCrescent' : 'mdiWhiteBalanceSunny'"
                     class="mr-1"
                     :size="16"
                  />
                  <div class="theme-card-name cut-text">
                     {{ isBuiltin(theme.id) ? t(`application.${theme.id}`) : theme.name }}
                     <small v-if="theme.author" class="text-gray">{{ theme.author }}</small>
                  </div>
                  <div class="theme-card-actions" @click.stop>
                     <button
                        class="btn btn-clear btn-sm p-vcentered"
                        :title="t('application.exportTheme')"
                        @click="exportTheme(theme.id)"
                     >
                        <BaseIcon icon-name="mdiExport" :size="16" />
                     </button>
                     <button
                        v-if="!isBuiltin(theme.id)"
                        class="btn btn-clear btn-sm p-vcentered"
                        :title="t('application.removeTheme')"
                        @click="themeToRemove = theme"
                     >
                        <BaseIcon icon-name="mdiDelete" :size="16" />
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div class="columns mt-2">
         <div class="column col-12 h6 text-uppercase mb-2">
            {{ t('application.interfaceFontSize') }}
         </div>
         <div class="column col-12 mb-4">
            <div class="btn-group btn-group-block">
               <button
                  v-for="(px, size) in uiFontSizes"
                  :key="size"
                  class="btn btn-dark cut-text"
                  :class="{'active': uiFontSize === size}"
                  @click="changeUiFontSize(size)"
               >
                  {{ Math.round(px / uiFontSizes.medium * 100) }}%
               </button>
            </div>
         </div>
      </div>

      <div class="columns mt-2">
         <div class="column col-12 h6 text-uppercase mb-2">
            {{ t('application.codeEditor') }}
         </div>
         <div class="column col-12 mb-4">
            <div class="btn-group btn-group-block">
               <button
                  v-for="(px, size) in editorFontSizes"
                  :key="size"
                  class="btn btn-dark cut-text"
                  :class="{'active': editorFontSize === size}"
                  @click="changeEditorFontSize(size)"
               >
                  {{ px }}
               </button>
            </div>
         </div>
         <div class="column col-12">
            <BaseTextEditor
               :model-value="exampleQuery"
               :mode="workspace?.customizations?.sqlDialect ?? 'sql'"
               :read-only="true"
               :height="220"
            />
         </div>
      </div>

      <ConfirmModal
         v-if="themeToRemove"
         @confirm="removeTheme(themeToRemove.id)"
         @hide="themeToRemove = null"
      >
         <template #header>
            <div class="p-vcentered">
               <BaseIcon
                  icon-name="mdiDelete"
                  class="mr-1"
                  :size="24"
               />
               <span>{{ t('application.removeTheme') }}</span>
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ t('general.deleteConfirm') }} <b>{{ themeToRemove.name }}</b>?
            </div>
         </template>
      </ConfirmModal>
   </div>
</template>

<script setup lang="ts">
import { AntaresTheme } from 'common/themes/theme';
import { shell } from 'electron';
import { storeToRefs } from 'pinia';
import { computed, Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import BaseTextEditor from '@/components/BaseTextEditor.vue';
import ThemePreview from '@/components/ThemePreview.vue';
import { useNotificationsStore } from '@/stores/notifications';
import { EditorFontSize, uiFontSizes, useSettingsStore } from '@/stores/settings';
import { useThemesStore } from '@/stores/themes';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

const galleryUrl = 'https://github.com/antares-sql/themes';
const editorFontSizes: Record<EditorFontSize, string> = {
   xsmall: '10px',
   small: '12px',
   medium: '14px',
   large: '16px',
   xlarge: '18px',
   xxlarge: '20px'
};
const exampleQuery = `-- This is an example
SELECT
    employee.id,
    employee.first_name,
    SUM(DATEDIFF("SECOND", call.start, call.end)) AS call_duration
FROM call
INNER JOIN employee ON call.employee_id = employee.id
WHERE call.start > '2024-01-01' AND call.rating >= 4
GROUP BY employee.id, employee.first_name
ORDER BY employee.id ASC;
`;

const settingsStore = useSettingsStore();
const themesStore = useThemesStore();
const workspacesStore = useWorkspacesStore();
const { addNotification } = useNotificationsStore();

const { editorFontSize, uiFontSize } = storeToRefs(settingsStore);
const { allThemes, activeTheme } = storeToRefs(themesStore);
const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);
const { changeApplicationTheme, changeEditorFontSize, changeUiFontSize } = settingsStore;
const { isBuiltin, removeTheme } = themesStore;

const themeToRemove: Ref<AntaresTheme> = ref(null);

const workspace = computed(() => workspacesStore.getWorkspace(selectedWorkspace.value));

const openOutside = (link: string) => shell.openExternal(link);

const importTheme = async () => {
   const result = await themesStore.importThemeFromFile();
   if (result.status === 'success') {
      addNotification({
         status: 'success',
         message: result.warnings.length
            ? t('application.themeImportedWithWarnings', { name: result.theme.name, count: result.warnings.length })
            : t('application.themeImported', { name: result.theme.name })
      });
      // The ignored values are listed in the console, for theme authors
      for (const warning of result.warnings) console.warn(`[theme ${result.theme.id}] ${warning}`);
   }
   else if (result.status === 'error')
      addNotification({ status: 'error', message: t('application.themeImportError', { error: result.errors.join('; ') }) });
};

const exportTheme = async (id: string) => {
   if (await themesStore.exportTheme(id))
      addNotification({ status: 'success', message: t('application.themeExported') });
};
</script>

<style lang="scss" scoped>
.themes-toolbar {
  justify-content: space-between;
}

.theme-card {
  border-radius: var(--radius);
  padding: 4px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 0 0 var(--border-width-lg) var(--border);
  }

  &.selected {
    box-shadow: 0 0 0 var(--border-width-lg) var(--primary-color);
  }

  .theme-card-footer {
    display: flex;
    align-items: center;
    margin-top: 4px;
    min-height: 22px;
  }

  .theme-card-name {
    flex: 1;
    font-size: 0.7rem;
    line-height: 1.1;

    small {
      display: block;
      font-size: 0.6rem;
    }
  }

  .theme-card-actions {
    display: flex;
    opacity: 0;
    transition: opacity 0.2s;

    .btn {
      height: auto;
      padding: 1px;
    }
  }

  &:hover .theme-card-actions {
    opacity: 1;
  }
}
</style>
