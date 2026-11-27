<template>
   <Teleport to="#window-content">
      <div class="modal active">
         <a class="modal-overlay" @click.stop="closeModal" />
         <div ref="trapRef" class="modal-container p-0">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <BaseIcon
                        icon-name="folder+pencil"
                        class="mr-1"
                        :size="24"
                     />
                     <span class="cut-text">{{ t('application.editFolder') }}</span>
                  </div>
               </div>
               <a
                  v-button="t('general.close')"
                  class="btn btn-clear c-hand"
                  @click.stop="closeModal"
               />
            </div>
            <div class="modal-body pb-0">
               <div class="content">
                  <form class="form-horizontal">
                     <div class="form-group mb-4">
                        <div class="col-3">
                           <label class="form-label">{{ t('general.name') }}</label>
                        </div>
                        <div class="col-9">
                           <input
                              ref="firstInput"
                              v-model="localFolder.name"
                              class="form-input"
                              type="text"
                              required
                              :placeholder="t('application.folderName')"
                           >
                        </div>
                     </div>
                     <div class="form-group">
                        <div class="col-3">
                           <label class="form-label">{{ t('application.color') }}</label>
                        </div>
                        <div v-radiogroup="t('application.color')" class="col-9 color-wrapper">
                           <div
                              v-for="color in folderPalette"
                              :key="color.name"
                              class="color-box"
                              role="radio"
                              :aria-checked="localFolder.color?.toLowerCase() === color.hex.toLowerCase()"
                              :aria-label="color.name"
                              :title="color.name"
                              :style="`background-color: ${color.color}; color: ${readableTextOn(color.color)}`"
                              @click="localFolder.color = color.hex"
                           >
                              <BaseIcon
                                 v-if="localFolder.color?.toLowerCase() === color.hex.toLowerCase()"
                                 icon-name="check"
                                 :size="16"
                              />
                           </div>
                        </div>
                     </div>
                  </form>
               </div>
            </div>
            <div class="modal-footer">
               <button class="btn btn-primary mr-2" @click.stop="editFolderAppearance">
                  {{ t('application.update') }}
               </button>
               <button class="btn btn-link" @click.stop="closeModal">
                  {{ t('general.close') }}
               </button>
            </div>
         </div>
      </div>
   </Teleport>
</template>

<script setup lang="ts">
import { readableTextOn } from 'common/libs/colorContrast';
import { storeToRefs } from 'pinia';
import { onBeforeUnmount, PropType, Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import { useFocusTrap } from '@/composables/useFocusTrap';
import { unproxify } from '@/libs/unproxify';
import { SidebarElement, useConnectionsStore } from '@/stores/connections';
import { useThemesStore } from '@/stores/themes';

const connectionsStore = useConnectionsStore();

const { t } = useI18n();

const props = defineProps({
   folder: {
      type: Object as PropType<SidebarElement>,
      required: true
   }
});

const emit = defineEmits(['close']);

const { updateConnectionOrder } = connectionsStore;

// The folder stores the default hex of the slot; the theme decides the color shown
const { folderPalette } = storeToRefs(useThemesStore());

const { trapRef } = useFocusTrap();

const firstInput: Ref<HTMLInputElement> = ref(null);
const localFolder: Ref<SidebarElement> = ref(unproxify(props.folder));

const editFolderAppearance = () => {
   updateConnectionOrder(localFolder.value);
   closeModal();
};

const closeModal = () => emit('close');

const onKey =(e: KeyboardEvent) => {
   e.stopPropagation();
   if (e.key === 'Escape')
      closeModal();
};

window.addEventListener('keydown', onKey);

onBeforeUnmount(() => {
   window.removeEventListener('keydown', onKey);
});

</script>

<style scoped lang="scss">
  .modal-container {
    max-width: 360px;
  }

  .color-wrapper{
      display: grid;
      grid-template-columns: repeat(auto-fill, 20px);
      gap: 5px;

     .color-box {
         height: 20px;
         width: 20px;
         border-radius: calc(var(--radius) / 2);
         display: flex;
         align-items: center;
         justify-content: center;
         cursor: pointer;
     }
  }
</style>
