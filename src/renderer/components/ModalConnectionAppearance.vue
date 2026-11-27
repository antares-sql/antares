<template>
   <Teleport to="#window-content">
      <div class="modal active">
         <a class="modal-overlay" @click.stop="closeModal" />
         <div ref="trapRef" class="modal-container p-0">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <BaseIcon
                        icon-name="brush"
                        class="mr-1"
                        :size="24"
                     />
                     <span class="cut-text">{{ t('application.editConnectionAppearance') }}</span>
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
                           <label class="form-label">{{ t('application.label') }}</label>
                        </div>
                        <div class="col-9">
                           <input
                              ref="firstInput"
                              v-model="localConnection.name"
                              class="form-input"
                              type="text"
                              :placeholder="getConnectionName(localConnection.uid)"
                           >
                        </div>
                     </div>
                     <div class="form-group">
                        <div class="col-3">
                           <label class="form-label">{{ t('application.icon') }}</label>
                        </div>
                        <div class="col-9 icons-wrapper">
                           <div
                              v-for="icon in icons"
                              :key="icon.name"
                           >
                              <BaseIcon
                                 v-if="icon.code"
                                 :icon-name="icon.code"
                                 :stroke-width="THIN_STROKE"
                                 :size="36"
                                 class="icon-box"
                                 :title="icon.name"
                                 :class="[{'selected': resolveIconName(localConnection.icon) === icon.code}]"
                                 @click="setIcon(icon.code)"
                              />
                              <BaseIcon
                                 v-else
                                 :icon-name="customizations[connection.client]?.connectionIcon"
                                 :stroke-width="THIN_STROKE"
                                 :size="36"
                                 class="icon-box"
                                 :title="icon.name"
                                 :class="[{'selected': localConnection.icon === null}]"
                                 @click="setIcon(null)"
                              />
                           </div>
                        </div>
                     </div>
                     <div class="form-group">
                        <div class="col-3">
                           <label class="form-label">{{ t('application.customIcon') }}</label>
                        </div>
                        <div class="col-9 icons-wrapper">
                           <div
                              v-for="icon in customIcons"
                              :key="icon.uid"
                           >
                              <BaseIcon
                                 v-if="icon.uid"
                                 :icon-name="icon.uid"
                                 type="custom"
                                 :size="36"
                                 class="icon-box"
                                 :class="[{'selected': localConnection.icon === icon.uid}]"
                                 @click="setIcon(icon.uid, 'custom')"
                                 @contextmenu.prevent="contextMenu($event, icon.uid)"
                              />
                           </div>
                           <BaseIcon
                              :icon-name="'plus'"
                              :size="36"
                              class="icon-box"
                              @click="openFile"
                           />
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
      <BaseContextMenu
         v-if="isContext"
         :context-event="contextEvent"
         @close-context="isContext = false"
      >
         <div class="context-element" @click="removeIconHandler">
            <span class="d-flex">
               <BaseIcon
                  class="text-light mt-1 mr-1"
                  icon-name="trash"
                  :size="18"
               /> {{ t('general.delete') }}</span>
         </div>
      </BaseContextMenu>
   </Teleport>
</template>

<script setup lang="ts">
import customizations from 'common/customizations';
import { storeToRefs } from 'pinia';
import { onBeforeUnmount, PropType, Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseContextMenu from '@/components/BaseContextMenu.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import { useFocusTrap } from '@/composables/useFocusTrap';
import Application from '@/ipc-api/Application';
import { resolveIconName, THIN_STROKE } from '@/libs/icons';
import { unproxify } from '@/libs/unproxify';
import { SidebarElement, useConnectionsStore } from '@/stores/connections';
import { useNotificationsStore } from '@/stores/notifications';

const connectionsStore = useConnectionsStore();
const { addNotification } = useNotificationsStore();

const { addIcon, removeIcon, updateConnectionOrder, getConnectionName } = connectionsStore;
const { customIcons } = storeToRefs(connectionsStore);

const isContext = ref(false);
const contextContent: Ref<string> = ref(null);
const contextEvent: Ref<MouseEvent> = ref(null);

const { t } = useI18n();

const props = defineProps({
   connection: {
      type: Object as PropType<SidebarElement>,
      required: true
   }
});

const emit = defineEmits(['close']);

const icons = [
   { name: 'default', code: null },

   // Symbols
   { name: 'account-group', code: 'users' },
   { name: 'cloud', code: 'cloud' },
   { name: 'key-chain', code: 'key' },
   { name: 'lightning-bolt', code: 'bolt' },
   { name: 'map-marker', code: 'map-pin' },
   { name: 'api', code: 'api' },
   { name: 'chart-line', code: 'chart' },
   { name: 'chat', code: 'chat' },
   { name: 'bug', code: 'bug' },
   { name: 'shield', code: 'shield' },
   { name: 'cart', code: 'cart' },
   { name: 'bank', code: 'bank' },
   { name: 'receipt', code: 'receipt' },
   { name: 'raspberry-pi', code: 'brand:raspberry-pi' },
   { name: 'book', code: 'book' },
   { name: 'web', code: 'globe' },
   { name: 'multimedia', code: 'media' },
   { name: 'qr-code', code: 'qrcode' },
   { name: 'flask', code: 'flask' },
   { name: 'memory', code: 'chip' },
   { name: 'cube', code: 'box' },
   { name: 'weather', code: 'weather' },
   { name: 'controller', code: 'gamepad' },
   { name: 'home-group', code: 'home' },

   // Vehicles
   { name: 'truck', code: 'truck' },
   { name: 'car', code: 'car' },
   { name: 'motorbike', code: 'motorbike' },
   { name: 'train', code: 'train' },
   { name: 'airplane', code: 'airplane' },
   { name: 'ferry', code: 'ship' },

   // Brand
   { name: 'docker', code: 'brand:docker' },
   { name: 'open-source', code: 'brand:osi' },
   { name: 'aws', code: 'brand:aws' },
   { name: 'google-cloud', code: 'brand:google-cloud' },
   { name: 'microsoft-azure', code: 'brand:azure' },
   { name: 'linux', code: 'brand:linux' },
   { name: 'microsoft-windows', code: 'brand:windows' },
   { name: 'apple', code: 'brand:apple' },
   { name: 'android', code: 'brand:android' }
];

const { trapRef } = useFocusTrap();

const firstInput: Ref<HTMLInputElement> = ref(null);
const localConnection: Ref<SidebarElement> = ref(unproxify(props.connection));

const editFolderAppearance = () => {
   updateConnectionOrder(localConnection.value);
   closeModal();
};

const setIcon = (code: string, type?: 'icon' | 'custom') => {
   localConnection.value.icon = code;
   localConnection.value.hasCustomIcon = type === 'custom';
};

const removeIconHandler = () => {
   if (localConnection.value.icon === contextContent.value) {
      setIcon(null);
      updateConnectionOrder(localConnection.value);
   }
   removeIcon(contextContent.value);
   isContext.value = false;
};

const adjustSVGContent = (svgContent: string) => {
   try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');

      const parseError = doc.querySelector('parsererror');
      if (parseError) {
         addNotification({ status: 'error', message: parseError.textContent });
         return null;
      }

      const svg = doc.documentElement;
      if (svg.tagName.toLowerCase() !== 'svg') {
         addNotification({ status: 'error', message: t('application.invalidFIle') });
         return null;
      }

      if (!svg.hasAttribute('viewBox')) {
         const width = svg.getAttribute('width') || '36';
         const height = svg.getAttribute('height') || '36';
         svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }

      svg.removeAttribute('width');
      svg.removeAttribute('height');

      const serializer = new XMLSerializer();
      return serializer.serializeToString(svg);
   }
   catch (error) {
      addNotification({ status: 'error', message: error.stack });
      return null;
   }
};

const openFile = async () => {
   const result = await Application.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: '"SVG"', extensions: ['svg'] }]
   });

   if (result && !result.canceled) {
      const file = result.filePaths[0];
      let content = await Application.readFile({ filePath: file, encoding: 'utf-8' });

      content = adjustSVGContent(content);

      const base64Content = Buffer.from(content).toString('base64');

      addIcon(base64Content);
   }
};

const contextMenu = (event: MouseEvent, iconUid: string) => {
   contextEvent.value = event;
   contextContent.value = iconUid;
   isContext.value = true;
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

  .icons-wrapper{
      display: grid;
      grid-template-columns: repeat(auto-fill, 40px);
      gap: 5px;

     .icon-box {
         height: 40px;
         width: 40px;
         border-radius: calc(var(--radius) / 2);
         display: flex;
         align-items: center;
         justify-content: center;
         cursor: pointer;

         &.selected {
            outline: var(--border-width-lg) solid var(--primary-color);
            border-radius: var(--radius);
         }
     }
  }
</style>
