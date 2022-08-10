<template>
   <div class="p-relative">
      <KeyPressDetector />
      <div class="shortcuts-tools pb-2 px-2">
         <button class="btn btn-dark btn-sm d-flex ml-2">
            <i class="mdi mdi-24px mdi-plus mr-1" /><span>{{ t('message.addShortcut') }}</span>
         </button>
         <button class="btn btn-dark btn-sm d-flex ml-2" @click="isConfirmRestoreModal = true">
            <i class="mdi mdi-24px mdi-undo mr-1" /><span>{{ t('message.restoreDefaults') }}</span>
         </button>
      </div>
      <div class="container workspace-query-results">
         <div class="table table-hover">
            <div class="thead">
               <div class="tr text-uppercase">
                  <div class="th no-border">
                     <div>
                        {{ t('word.event') }}
                     </div>
                  </div>
                  <div class="th no-border" style="width: 100%;">
                     <div>
                        {{ t('word.key', 2) }}
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
                     {{ t(shortcutEvents[shortcut.event].l18n, {param: shortcutEvents[shortcut.event].l18nParam}) }}
                  </div>
                  <div
                     class="td py-1"
                     style="border-right: 0;"
                     v-html="parseKeys(shortcut.keys)"
                  />
                  <div class="td py-1 pr-2">
                     <button class="shortcut-button btn btn-link btn-sm d-flex p-0 px-1 mr-2">
                        <span>{{ t('word.edit') }}</span><i class="mdi mdi-pencil ml-1" />
                     </button>
                     <button class="shortcut-button btn btn-link btn-sm d-flex p-0 px-1" @click="showDeleteModal(shortcut)">
                        <span>{{ t('word.delete') }}</span><i class="mdi mdi-delete-outline ml-1" />
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </div>
   <Teleport to="#window-content">
      <ConfirmModal
         v-if="isConfirmDeleteModal"
         @confirm="deleteShortcut"
         @hide="isConfirmDeleteModal = false"
      >
         <template #header>
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-delete mr-1" /> {{ t('message.deleteShortcut') }}
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ t('message.deleteCorfirm') }} <b>{{ t(shortcutEvents[shortcutToDelete.event].l18n, {param: shortcutEvents[shortcutToDelete.event].l18nParam}) }} (<span v-html="parseKeys(shortcutToDelete.keys)" />)</b>?
            </div>
         </template>
      </ConfirmModal>
      <ConfirmModal
         v-if="isConfirmRestoreModal"
         @confirm="restoreDefaults"
         @hide="isConfirmRestoreModal = false"
      >
         <template #header>
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-undo mr-1" /> {{ t('message.restoreDefaults') }}
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ t('message.restoreDefaultsQuestion') }}
            </div>
         </template>
      </ConfirmModal>
   </Teleport>
</template>
<script setup lang="ts">
import { Ref, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings';
import KeyPressDetector from './KeyPressDetector.vue';
import Application from '@/ipc-api/Application';
import { shortcutEvents, ShortcutRecord } from 'common/shortcuts';
import ConfirmModal from '@/components/BaseConfirmModal.vue';

const { t } = useI18n();

const isMacOS = process.platform === 'darwin';

const isConfirmRestoreModal = ref(false);
const isConfirmDeleteModal = ref(false);
const shortcutToDelete: Ref<ShortcutRecord> = ref(null);

const settingsStore = useSettingsStore();
const { shortcuts } = storeToRefs(settingsStore);

const parseKeys = (keys: {[key: number]: string}[]) => {
   return (keys as string[]).map(k => (
      k.split('+')
         .map(sk => (
            `<code class="text-bold">${sk}</code>`
         )))
      .join('+')
      .replaceAll('CommandOrControl', isMacOS ? 'CMD' : 'CTRL')
   ).join(', ');
};

const restoreDefaults = () => {
   isConfirmRestoreModal.value = false;
   return Application.restoreDefaultShortcuts();
};

const showDeleteModal = (shortcut: ShortcutRecord) => {
   isConfirmDeleteModal.value = true;
   shortcutToDelete.value = shortcut;
};

const deleteShortcut = () => {
   const filteredShortcuts = shortcuts.value.filter(s => (
      shortcutToDelete.value.event !== s.event && shortcutToDelete.value.keys !== s.keys
   ));

   Application.updateShortcuts(filteredShortcuts);
};
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
