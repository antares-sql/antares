<template>
   <Teleport to="#window-content">
      <div class="modal active">
         <a class="modal-overlay" @click.stop="closeModal" />
         <div ref="trapRef" class="modal-container p-0">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <BaseIcon
                        icon-name="mdiBrushVariant"
                        class="mr-1"
                        :size="24"
                     />
                     <span class="cut-text">{{ t('application.editConnectionAppearance') }}</span>
                  </div>
               </div>
               <a class="btn btn-clear c-hand" @click.stop="closeModal" />
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
                                 :icon-name="camelize(icon.code)"
                                 :size="36"
                                 class="icon-box"
                                 :title="icon.name"
                                 :class="[{'selected': localConnection.icon === icon.code}]"
                                 @click="setIcon(icon.code)"
                              />
                              <div
                                 v-else
                                 class="icon-box"
                                 :title="icon.name"
                                 :class="[`dbi dbi-${connection.client}`, {'selected': localConnection.icon === null}]"
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
                              :icon-name="'mdiPlus'"
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
                  icon-name="mdiDelete"
                  :size="18"
               /> {{ t('general.delete') }}</span>
         </div>
      </BaseContextMenu>
   </Teleport>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onBeforeUnmount, PropType, Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseContextMenu from '@/components/BaseContextMenu.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import { useFocusTrap } from '@/composables/useFocusTrap';
import Application from '@/ipc-api/Application';
import { camelize } from '@/libs/camelize';
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
   { name: 'account-group', code: 'mdi-account-group-outline' },
   { name: 'cloud', code: 'mdi-cloud-outline' },
   { name: 'key-chain', code: 'mdi-key-chain-variant' },
   { name: 'lightning-bolt', code: 'mdi-lightning-bolt' },
   { name: 'map-marker', code: 'mdi-map-marker-radius-outline' },
   { name: 'api', code: 'mdi-api' },
   { name: 'chart-line', code: 'mdi-chart-line' },
   { name: 'chat', code: 'mdi-chat-outline' },
   { name: 'bug', code: 'mdi-bug-outline' },
   { name: 'shield', code: 'mdi-shield-outline' },
   { name: 'cart', code: 'mdi-cart-variant' },
   { name: 'bank', code: 'mdi-bank-outline' },
   { name: 'receipt', code: 'mdi-receipt-text-outline' },
   { name: 'raspberry-pi', code: 'mdi-raspberry-pi' },
   { name: 'book', code: 'mdi-book-outline' },
   { name: 'web', code: 'mdi-web' },
   { name: 'multimedia', code: 'mdi-multimedia' },
   { name: 'qr-code', code: 'mdi-qrcode' },
   { name: 'flask', code: 'mdi-flask-outline' },
   { name: 'memory', code: 'mdi-memory' },
   { name: 'cube', code: 'mdi-cube-outline' },
   { name: 'weather', code: 'mdi-weather-partly-snowy-rainy' },
   { name: 'controller', code: 'mdi-controller' },
   { name: 'home-group', code: 'mdi-home-group' },

   // Vehicles
   { name: 'truck', code: 'mdi-truck-outline' },
   { name: 'car', code: 'mdi-car' },
   { name: 'motorbike', code: 'mdi-atv' },
   { name: 'train', code: 'mdi-train' },
   { name: 'airplane', code: 'mdi-airplane' },
   { name: 'ferry', code: 'mdi-ferry' },

   // Brand
   { name: 'docker', code: 'mdi-docker' },
   { name: 'open-source', code: 'mdi-open-source-initiative' },
   { name: 'aws', code: 'mdi-aws' },
   { name: 'google-cloud', code: 'mdi-google-cloud' },
   { name: 'microsoft-azure', code: 'mdi-microsoft-azure' },
   { name: 'linux', code: 'mdi-linux' },
   { name: 'microsoft-windows', code: 'mdi-microsoft-windows' },
   { name: 'apple', code: 'mdi-apple' },
   { name: 'android', code: 'mdi-android' }
];

const { trapRef } = useFocusTrap();

const firstInput: Ref<HTMLInputElement> = ref(null);
const localConnection: Ref<SidebarElement> = ref(unproxify(props.connection));

const editFolderAppearance = () => {
   updateConnectionOrder(localConnection.value);
   closeModal();
};

const setIcon = (code: string, type?: 'mdi' | 'custom') => {
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
         border-radius: 4px;
         display: flex;
         align-items: center;
         justify-content: center;
         cursor: pointer;

         &.selected {
            outline: 2px solid var(--primary-color);
            border-radius: 8px;
         }
     }
  }

  .theme-light {
      .icons-wrapper {
         .dbi {
            filter: invert(100%) opacity(.8);

            &.selected {
               outline-color: #1c96d6;
            }
         }
      }
  }
</style>
