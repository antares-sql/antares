<template>
   <div class="p-relative">
      <div class="shortcuts-tools pb-2 px-2">
         <button class="btn btn-dark btn-sm d-flex ml-2" @click="showAddModal">
            <BaseIcon
               icon-name="mdiPlus"
               class="mr-1"
               :size="24"
            /><span>{{ t('application.addShortcut') }}</span>
         </button>
         <button class="btn btn-dark btn-sm d-flex ml-2" @click="isConfirmRestoreModal = true">
            <BaseIcon
               icon-name="mdiUndo"
               class="mr-1"
               :size="24"
            /><span>{{ t('application.restoreDefaults') }}</span>
         </button>
      </div>
      <div class="container workspace-query-results">
         <div class="table table-hover">
            <div class="thead">
               <div class="tr text-uppercase">
                  <div class="th no-border">
                     <div>
                        {{ t('application.event') }}
                     </div>
                  </div>
                  <div class="th no-border" style="width: 100%;">
                     <div>
                        {{ t('application.key', 2) }}
                     </div>
                  </div>
                  <div class="th no-border" />
               </div>
            </div>

            <div class="tbody">
               <div
                  v-for="(shortcut, i) in shortcuts"
                  :key="i"
                  class="tr"
                  tabindex="0"
               >
                  <div class="td py-1">
                     {{ t(shortcutEvents[shortcut.event].i18n, {param: shortcutEvents[shortcut.event].i18nParam}) }}
                  </div>
                  <div
                     class="td py-1"
                     style="border-right: 0;"
                     v-html="parseKeys(shortcut.keys)"
                  />
                  <div class="td py-1 pr-2">
                     <button class="shortcut-button btn btn-link btn-sm d-flex p-0 px-1 mr-2" @click="showEditModal({...shortcut, index: i})">
                        <span>{{ t('general.edit') }}</span>
                        <BaseIcon
                           icon-name="mdiPencil"
                           class="ml-1"
                           :size="16"
                        />
                     </button>
                     <button class="shortcut-button btn btn-link btn-sm d-flex p-0 px-1" @click="showDeleteModal(shortcut)">
                        <span>{{ t('general.delete') }}</span>
                        <BaseIcon
                           icon-name="mdiDeleteOutline"
                           class="ml-1"
                           :size="16"
                        />
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </div>
   <Teleport to="#window-content">
      <ConfirmModal
         v-if="isConfirmAddModal"
         :disable-autofocus="true"
         :confirm-text="t('general.save')"
         :close-on-confirm="false"
         @confirm="addShortcut"
         @hide="closeAddModal"
      >
         <template #header>
            <div class="d-flex">
               <BaseIcon
                  icon-name="mdiPlus"
                  class="mr-1"
                  :size="24"
               /> {{ t('application.addShortcut') }}
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               <div class="form-group">
                  <label class="form-label">{{ t('application.event') }}</label>
                  <BaseSelect
                     v-model="shortcutToAdd.event"
                     class="form-select"
                     :options="eventOptions"
                  />
               </div>
            </div>
            <div class="mb-2">
               <div class="form-group">
                  <label class="form-label">{{ t('application.key', 2) }}</label>
                  <KeyPressDetector v-model="typedShortcut" />
               </div>
            </div>
            <small v-if="doesShortcutExists" class="text-warning">{{ t('application.shortcutAlreadyExists') }}</small>
         </template>
      </ConfirmModal>

      <ConfirmModal
         v-if="isConfirmEditModal"
         :disable-autofocus="true"
         :confirm-text="t('general.save')"
         :close-on-confirm="false"
         @confirm="editShortcut"
         @hide="closeEditModal"
      >
         <template #header>
            <div class="d-flex">
               <BaseIcon
                  icon-name="mdiPencil"
                  class="mr-1"
                  :size="24"
               /> {{ t('application.editShortcut') }}
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               <div class="form-group">
                  <label class="form-label">{{ t('application.event') }}</label>
                  <BaseSelect
                     v-model="shortcutToEdit.event"
                     class="form-select"
                     :options="eventOptions"
                     :disabled="true"
                  />
               </div>
            </div>
            <div class="mb-2">
               <div class="form-group">
                  <label class="form-label">{{ t('application.key', 2) }}</label>
                  <KeyPressDetector v-model="shortcutToEdit.keys[0]" />
               </div>
            </div>
            <small v-if="doesShortcutExists" class="text-warning">{{ t('application.shortcutAlreadyExists') }}</small>
         </template>
      </ConfirmModal>

      <ConfirmModal
         v-if="isConfirmDeleteModal"
         :disable-autofocus="true"
         @confirm="deleteShortcut"
         @hide="isConfirmDeleteModal = false"
      >
         <template #header>
            <div class="d-flex">
               <BaseIcon
                  icon-name="mdiDelete"
                  class="mr-1"
                  :size="24"
               /> {{ t('application.deleteShortcut') }}
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ t('general.deleteConfirm') }} <b>{{ t(shortcutEvents[shortcutToDelete.event].i18n, {param: shortcutEvents[shortcutToDelete.event].i18nParam}) }} (<span v-html="parseKeys(shortcutToDelete.keys)" />)</b>?
            </div>
         </template>
      </ConfirmModal>

      <ConfirmModal
         v-if="isConfirmRestoreModal"
         :disable-autofocus="true"
         @confirm="restoreDefaults"
         @hide="isConfirmRestoreModal = false"
      >
         <template #header>
            <div class="d-flex">
               <BaseIcon
                  icon-name="mdiUndo"
                  class="mr-1"
                  :size="24"
               /> {{ t('application.restoreDefaults') }}
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ t('application.restoreDefaultsQuestion') }}
            </div>
         </template>
      </ConfirmModal>
   </Teleport>
</template>
<script setup lang="ts">
import { computed } from '@vue/reactivity';
import { shortcutEvents, ShortcutRecord } from 'common/shortcuts';
import { storeToRefs } from 'pinia';
import { Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import { useFilters } from '@/composables/useFilters';
import Application from '@/ipc-api/Application';
import { useSettingsStore } from '@/stores/settings';

import KeyPressDetector from './KeyPressDetector.vue';

const { parseKeys } = useFilters();

const { t } = useI18n();

const isMacOS = process.platform === 'darwin';

const isConfirmRestoreModal = ref(false);
const isConfirmAddModal = ref(false);
const isConfirmEditModal = ref(false);
const isConfirmDeleteModal = ref(false);
const doesShortcutExists = ref(false);
const shortcutToAdd: Ref<ShortcutRecord> = ref({ event: undefined, keys: [], os: [process.platform] });
const shortcutToEdit: Ref<ShortcutRecord & { index: number }> = ref(null);
const shortcutToDelete: Ref<ShortcutRecord> = ref(null);
const typedShortcut = ref('');

const settingsStore = useSettingsStore();
const { shortcuts } = storeToRefs(settingsStore);

const eventOptions = computed(() => {
   return Object.keys(shortcutEvents)
      .map(key => {
         return { value: key, label: t(shortcutEvents[key].i18n, { param: shortcutEvents[key].i18nParam }) };
      })
      .sort((a, b) => {
         if (a.label < b.label) return -1;
         if (a.label > b.label) return 1;
         return 0;
      });
});

const restoreDefaults = () => {
   isConfirmRestoreModal.value = false;
   return Application.restoreDefaultShortcuts();
};

const showAddModal = () => {
   shortcutToAdd.value.event = eventOptions.value[0].value;
   isConfirmAddModal.value = true;
};

const closeAddModal = () => {
   typedShortcut.value = '';
   doesShortcutExists.value = false;
   shortcutToAdd.value = { event: undefined, keys: [], os: [process.platform] };
   isConfirmAddModal.value = false;
};

const showEditModal = (shortcut: ShortcutRecord & { index: number }) => {
   shortcut = {
      ...shortcut,
      keys: [shortcut.keys[0].replaceAll('CommandOrControl', isMacOS ? 'Command' : 'Control')]
   };
   shortcutToEdit.value = shortcut;
   isConfirmEditModal.value = true;
};

const editShortcut = () => {
   const index = shortcutToEdit.value.index;
   delete shortcutToEdit.value.index;
   shortcutToEdit.value.index = undefined;

   shortcuts.value[index] = shortcutToEdit.value;

   isConfirmEditModal.value = false;
   return Application.updateShortcuts(shortcuts.value);
};

const closeEditModal = () => {
   typedShortcut.value = '';
   doesShortcutExists.value = false;
   shortcutToEdit.value = null;
   isConfirmEditModal.value = false;
};

const addShortcut = () => {
   if (!typedShortcut.value.length || doesShortcutExists.value) return;
   shortcutToAdd.value.keys = [typedShortcut.value.replaceAll(isMacOS ? 'Command' : 'Control', 'CommandOrControl')];
   const filteredShortcuts = [shortcutToAdd.value, ...shortcuts.value];

   isConfirmAddModal.value = false;
   return Application.updateShortcuts(filteredShortcuts);
};

const showDeleteModal = (shortcut: ShortcutRecord) => {
   isConfirmDeleteModal.value = true;
   shortcutToDelete.value = shortcut;
};

const deleteShortcut = () => {
   const filteredShortcuts = shortcuts.value.filter(s => (
      shortcutToDelete.value.keys.toString() !== s.keys.toString()
   ));

   isConfirmDeleteModal.value = false;
   return Application.updateShortcuts(filteredShortcuts);
};

watch(typedShortcut, () => {
   doesShortcutExists.value = shortcuts.value.some(s => (
      s.keys.some(k => (
         k.replaceAll('CommandOrControl', isMacOS ? 'Command' : 'Control') === typedShortcut.value
      ))
   ));
});
</script>
<style lang="scss" scoped>
  .table {
    .tr {
      .td {
        border-right: 3px solid;
        border-bottom: 3px solid;
      }

      &:hover {
        .shortcut-button {
          opacity: 1;
        }
      }

      .shortcut-button {
        font-size: 0.7rem;
        height: 1rem;
        line-height: 1rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
      }
    }
  }

  .shortcuts-tools {
    display: flex;
    justify-content: flex-end;
  }
</style>
