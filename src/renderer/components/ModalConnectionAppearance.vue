<template>
   <Teleport to="#window-content">
      <div class="modal active">
         <a class="modal-overlay" @click.stop="closeModal" />
         <div ref="trapRef" class="modal-container p-0">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <i class="mdi mdi-24px mdi-brush-variant mr-1" />
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
                              class="icon-box"
                              :title="icon.name"
                              :class="[icon.code ? `mdi ${icon.code} mdi-36px` : `dbi dbi-${connection.client}`, {'selected': localConnection.icon === icon.code}]"
                              @click="localConnection.icon = icon.code"
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
   connection: {
      type: Object as PropType<SidebarElement>,
      required: true
   }
});

const emit = defineEmits(['close']);

const { updateConnectionOrder, getConnectionName } = connectionsStore;

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
            outline: 2px solid $primary-color;
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
