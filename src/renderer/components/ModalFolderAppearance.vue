<template>
   <Teleport to="#window-content">
      <div class="modal active">
         <a class="modal-overlay" @click.stop="closeModal" />
         <div ref="trapRef" class="modal-container p-0">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <i class="mdi mdi-24px mdi-folder-edit mr-1" />
                     <span class="cut-text">{{ t('application.editFolder') }}</span>
                  </div>
               </div>
               <a class="btn btn-clear c-hand" @click.stop="closeModal" />
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
                        <div class="col-9 color-wrapper">
                           <div
                              v-for="color in colorPalette"
                              :key="color.name"
                              class="color-box"
                              :title="color.name"
                              :style="`background-color: ${color.hex}`"
                              @click="localFolder.color = color.hex"
                           >
                              <i v-if="localFolder.color === color.hex" class="mdi mdi-check" />
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
import { onBeforeUnmount, PropType, Ref, ref } from 'vue';
import { useFocusTrap } from '@/composables/useFocusTrap';
import { useI18n } from 'vue-i18n';
import { SidebarElement, useConnectionsStore } from '@/stores/connections';
import { unproxify } from '@/libs/unproxify';

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

const colorPalette = [
   { name: 'default', hex: '#E36929' },
   { name: 'grape-fruit', hex: '#ED5565' },
   { name: 'rose', hex: '#E3242B' },
   { name: 'fire', hex: '#FDA50F' },
   { name: 'sunflower', hex: '#FFCE54' },
   { name: 'moss', hex: '#8A985E' },
   { name: 'grass', hex: '#6DCD05' },
   { name: 'emerald', hex: '#038835' },
   { name: 'mint', hex: '#48CFAD' },
   { name: 'aqua', hex: '#4FC1E9' },
   { name: 'royal-lblue', hex: '#4169E1' },
   { name: 'blue-jeans', hex: '#5D9CEC' },
   { name: 'stone', hex: '#59788E' },
   { name: 'lavander', hex: '#AC92EC' },
   { name: 'pink-rose', hex: '#EC87C0' },
   { name: 'smoke', hex: '#BEBDB8' },
   { name: 'slate', hex: '#757C88' }
];

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
         border-radius: 4px;
         display: flex;
         align-items: center;
         justify-content: center;
         cursor: pointer;
     }
  }
</style>
