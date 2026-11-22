<template>
   <ConfirmModal
      size="large"
      :hide-footer="true"
      @hide="emit('close')"
   >
      <template #header>
         <div class="p-vcentered">
            <BaseIcon
               icon-name="palette"
               class="mr-1"
               :size="24"
            />
            <span>{{ t('application.themeGallery') }}</span>
         </div>
      </template>
      <template #body>
         <div class="gallery-toolbar p-vcentered mb-2">
            <div class="btn-group">
               <button
                  v-for="filter in appearanceFilters"
                  :key="filter"
                  class="btn btn-dark btn-sm"
                  :class="{ active: appearanceFilter === filter }"
                  @click="appearanceFilter = filter"
               >
                  {{ filter === 'all' ? t('general.all') : t(`application.${filter}`) }}
               </button>
            </div>
            <input
               v-model="search"
               class="form-input input-sm gallery-search"
               type="search"
               :placeholder="t('general.search')"
            >
            <button class="btn btn-link btn-sm p-vcentered" @click="openOutside(themeGalleryRepository)">
               <BaseIcon
                  icon-name="brand:github"
                  class="mr-1"
                  :size="18"
               />
               <span>{{ t('application.publishTheme') }}</span>
            </button>
         </div>

         <div v-if="status === 'loading'" class="empty">
            <div class="loading loading-lg" />
         </div>
         <div v-else-if="status === 'error'" class="empty">
            <BaseIcon
               icon-name="cloud+off"
               class="empty-icon"
               :size="48"
            />
            <p class="empty-title h5">
               {{ t('application.themeGalleryUnavailable') }}
            </p>
            <p class="empty-subtitle">
               {{ errorMessage }}
            </p>
            <div class="empty-action">
               <button class="btn btn-dark btn-sm" @click="load">
                  {{ t('application.retry') }}
               </button>
            </div>
         </div>
         <div v-else class="columns gallery-list">
            <div
               v-for="entry in filteredThemes"
               :key="entry.id"
               class="column col-4 mb-3"
            >
               <div class="gallery-card">
                  <img
                     v-if="entry.preview"
                     :src="entry.preview"
                     :alt="entry.name"
                     class="img-responsive gallery-preview"
                     loading="lazy"
                  >
                  <div class="gallery-card-footer p-vcentered">
                     <BaseIcon
                        :icon-name="entry.appearance === 'dark' ? 'moon' : 'sun'"
                        class="mr-1"
                        :size="16"
                     />
                     <div class="gallery-card-name cut-text" :title="entry.description">
                        <span>{{ entry.name }}</span>
                        <small v-if="entry.author" class="text-gray">{{ entry.author }}</small>
                     </div>
                     <button
                        class="btn btn-sm p-vcentered"
                        :class="isInstalled(entry.id) ? 'btn-link' : 'btn-primary'"
                        :disabled="installing === entry.id"
                        @click="install(entry)"
                     >
                        <BaseIcon
                           :icon-name="isInstalled(entry.id) ? 'refresh' : 'download'"
                           class="mr-1"
                           :size="16"
                        />
                        <span>{{ isInstalled(entry.id) ? t('application.updateTheme') : t('application.installTheme') }}</span>
                     </button>
                  </div>
               </div>
            </div>
            <div v-if="!filteredThemes.length" class="column col-12 empty">
               <p class="empty-subtitle">
                  {{ t('database.noResultsPresent') }}
               </p>
            </div>
         </div>
      </template>
   </ConfirmModal>
</template>

<script setup lang="ts">
import { shell } from 'electron';
import { storeToRefs } from 'pinia';
import { computed, Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import { useNotificationsStore } from '@/stores/notifications';
import { GalleryTheme, themeGalleryRepository, useThemesStore } from '@/stores/themes';

const { t } = useI18n();
const emit = defineEmits(['close']);

const themesStore = useThemesStore();
const { installed } = storeToRefs(themesStore);
const { addNotification } = useNotificationsStore();

const appearanceFilters = ['all', 'dark', 'light'] as const;
const appearanceFilter: Ref<typeof appearanceFilters[number]> = ref('all');
const search = ref('');
const status: Ref<'loading' | 'ready' | 'error'> = ref('loading');
const errorMessage = ref('');
const themes: Ref<GalleryTheme[]> = ref([]);
const installing: Ref<string> = ref(null);

const filteredThemes = computed(() => {
   const term = search.value.trim().toLowerCase();
   return themes.value.filter(entry =>
      (appearanceFilter.value === 'all' || entry.appearance === appearanceFilter.value) &&
      (!term || `${entry.name} ${entry.author ?? ''} ${entry.tags.join(' ')}`.toLowerCase().includes(term))
   );
});

const isInstalled = (id: string) => installed.value.some(theme => theme.id === id);

const openOutside = (link: string) => shell.openExternal(link);

const load = async () => {
   status.value = 'loading';
   try {
      themes.value = await themesStore.fetchGallery();
      status.value = 'ready';
   }
   catch (err) {
      errorMessage.value = (err as Error).message;
      status.value = 'error';
   }
};

const install = async (entry: GalleryTheme) => {
   installing.value = entry.id;
   const result = await themesStore.installFromGallery(entry);
   installing.value = null;
   if (result.status === 'success')
      addNotification({ status: 'success', message: t('application.themeImported', { name: result.theme.name }) });
   else if (result.status === 'error')
      addNotification({ status: 'error', message: t('application.themeImportError', { error: result.errors.join('; ') }) });
};

load();
</script>

<style lang="scss" scoped>
.gallery-toolbar {
  gap: 0.4rem;

  .gallery-search {
    max-width: 12rem;
    margin-left: auto;
  }
}

.gallery-list {
  max-height: 60vh;
  overflow: auto;
}

.gallery-card {
  border-radius: var(--radius);
  padding: 4px;

  &:hover {
    box-shadow: 0 0 0 var(--border-width-lg) var(--border);
  }

  .gallery-preview {
    border-radius: var(--radius);
    aspect-ratio: 1024 / 800;
    object-fit: cover;
    background: var(--bg-panel);
  }

  .gallery-card-footer {
    margin-top: 4px;
  }

  .gallery-card-name {
    flex: 1;
    font-size: 0.7rem;
    line-height: 1.1;

    span,
    small {
      display: block;
    }

    small {
      font-size: 0.6rem;
    }
  }
}
</style>
