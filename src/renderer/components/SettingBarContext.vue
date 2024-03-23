<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="$emit('close-context')"
   >
      <div
         v-if="isConnected"
         class="context-element"
         @click="disconnect"
      >
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiPower"
               :size="18"
            /> {{ t('connection.disconnect') }}</span>
      </div>
      <div v-if="!contextConnection.isFolder" class="context-element">
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiFolderMove"
               :size="18"
            /> {{ t('general.moveTo') }}</span>
         <BaseIcon
            class="text-light ml-1"
            icon-name="mdiChevronRight"
            :size="18"
         />
         <div class="context-submenu">
            <div class="context-element" @click.stop="moveToFolder(null)">
               <span class="d-flex">
                  <BaseIcon
                     class="text-light mt-1 mr-1"
                     icon-name="mdiFolderPlus"
                     :size="18"
                  /> {{ t('application.newFolder') }}</span>
            </div>
            <div
               v-for="folder in parsedFolders"
               :key="folder.uid"
               class="context-element"
               @click.stop="moveToFolder(folder.uid)"
            >
               <span class="d-flex">
                  <BaseIcon
                     class="text-light mt-1 mr-1"
                     icon-name="mdiFolder"
                     :size="18"
                     :style="`color: ${folder.color}!important`"
                  /> {{ folder.name || t('general.folder') }}</span>
            </div>
         </div>
      </div>
      <div class="context-element" @click.stop="showAppearanceModal">
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiBrushVariant"
               :size="18"
            /> {{ t('application.appearance') }}</span>
      </div>
      <div
         v-if="!contextConnection.isFolder"
         class="context-element"
         @click="duplicateConnection"
      >
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiContentDuplicate"
               :size="18"
            /> {{ t('general.duplicate') }}</span>
      </div>
      <div class="context-element" @click="showConfirmModal">
         <span class="d-flex">
            <BaseIcon
               class="text-light mt-1 mr-1"
               icon-name="mdiDelete"
               :size="18"
            /> {{ t('general.delete') }}</span>
      </div>

      <ConfirmModal
         v-if="isConfirmModal"
         @confirm="confirmDeleteConnection"
         @hide="hideConfirmModal"
      >
         <template #header>
            <div class="d-flex">
               <BaseIcon
                  class="text-light mr-1"
                  :icon-name="contextConnection.isFolder ? 'mdiFolderRemove' : 'mdiServerRemove'"
                  :size="24"
               /> {{ t(contextConnection.isFolder ? 'application.deleteFolder' : 'connection.deleteConnection') }}
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ t('general.deleteConfirm') }} <b>{{ connectionName }}</b>?
            </div>
         </template>
      </ConfirmModal>
      <ModalFolderAppearance
         v-if="isFolderEdit"
         :folder="contextConnection"
         @close="hideAppearanceModal"
      />
      <ModalConnectionAppearance
         v-if="isConnectionEdit"
         :connection="contextConnection"
         @close="hideAppearanceModal"
      />
   </BaseContextMenu>
</template>

<script setup lang="ts">
import { uidGen } from 'common/libs/uidGen';
import { storeToRefs } from 'pinia';
import { computed, Prop, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseContextMenu from '@/components/BaseContextMenu.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import ModalConnectionAppearance from '@/components/ModalConnectionAppearance.vue';
import ModalFolderAppearance from '@/components/ModalFolderAppearance.vue';
import { SidebarElement, useConnectionsStore } from '@/stores/connections';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

const connectionsStore = useConnectionsStore();

const {
   getConnectionByUid,
   getConnectionName,
   addConnection,
   deleteConnection,
   addFolder
} = connectionsStore;

const { getFolders: folders } = storeToRefs(connectionsStore);

const workspacesStore = useWorkspacesStore();

const {
   removeConnected: disconnectWorkspace,
   getWorkspace
} = workspacesStore;

const props = defineProps({
   contextEvent: MouseEvent,
   contextConnection: Object as Prop<SidebarElement>
});

const emit = defineEmits(['close-context']);

const isConfirmModal = ref(false);
const isFolderEdit = ref(false);
const isConnectionEdit = ref(false);

const connectionName = computed(() => props.contextConnection.name || getConnectionName(props.contextConnection.uid) || t('general.folder', 1));
const isConnected = computed(() => getWorkspace(props.contextConnection.uid)?.connectionStatus === 'connected');
const parsedFolders = computed(() => folders.value.filter(f => !f.connections.includes(props.contextConnection.uid)));

const confirmDeleteConnection = () => {
   if (isConnected.value)
      disconnectWorkspace(props.contextConnection.uid);
   deleteConnection(props.contextConnection);
   closeContext();
};

const moveToFolder = (folderUid?: string) => {
   if (!folderUid) {
      addFolder({
         connections: [props.contextConnection.uid]
      });
   }

   closeContext();
};

const duplicateConnection = () => {
   let connectionCopy = getConnectionByUid(props.contextConnection.uid);
   connectionCopy = {
      ...connectionCopy,
      uid: uidGen('C'),
      name: connectionCopy.name ? `${connectionCopy?.name}_copy` : ''
   };

   addConnection(connectionCopy);
   closeContext();
};

const showAppearanceModal = () => {
   if (props.contextConnection.isFolder)
      isFolderEdit.value = true;
   else
      isConnectionEdit.value = true;
};

const hideAppearanceModal = () => {
   isConnectionEdit.value = false;
   isFolderEdit.value = false;
   closeContext();
};

const showConfirmModal = () => {
   isConfirmModal.value = true;
};

const hideConfirmModal = () => {
   isConfirmModal.value = false;
   closeContext();
};

const disconnect = () => {
   disconnectWorkspace(props.contextConnection.uid);
   closeContext();
};

const closeContext = () => {
   emit('close-context');
};
</script>
