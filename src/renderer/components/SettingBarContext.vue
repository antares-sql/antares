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
         <span class="d-flex"><i class="mdi mdi-18px mdi-power text-light pr-1" /> {{ t('word.disconnect') }}</span>
      </div>
      <div
         v-if="!contextConnection.isFolder"
         class="context-element"
         @click="duplicateConnection"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-content-duplicate text-light pr-1" /> {{ t('word.duplicate') }}</span>
      </div>
      <div class="context-element" @click.stop="showAppearanceModal">
         <span class="d-flex"><i class="mdi mdi-18px mdi-brush-variant text-light pr-1" /> {{ t('word.appearance') }}</span>
      </div>
      <div class="context-element" @click="showConfirmModal">
         <span class="d-flex"><i class="mdi mdi-18px mdi-delete text-light pr-1" /> {{ t('word.delete') }}</span>
      </div>

      <ConfirmModal
         v-if="isConfirmModal"
         @confirm="confirmDeleteConnection"
         @hide="hideConfirmModal"
      >
         <template #header>
            <div class="d-flex">
               <i class="mdi mdi-24px mr-1" :class="[contextConnection.isFolder ? 'mdi-folder-remove' : 'mdi-server-remove']" /> {{ t(contextConnection.isFolder ? 'message.deleteFolder' : 'message.deleteConnection') }}
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ t('message.deleteConfirm') }} <b>{{ connectionName }}</b>?
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
import { computed, Prop, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { uidGen } from 'common/libs/uidGen';
import { useI18n } from 'vue-i18n';
import { SidebarElement, useConnectionsStore } from '@/stores/connections';
import { useWorkspacesStore } from '@/stores/workspaces';
import BaseContextMenu from '@/components/BaseContextMenu.vue';
import ConfirmModal from '@/components/BaseConfirmModal.vue';
import ModalFolderAppearance from '@/components/ModalFolderAppearance.vue';
import ModalConnectionAppearance from '@/components/ModalConnectionAppearance.vue';

const { t } = useI18n();

const connectionsStore = useConnectionsStore();

const {
   getConnectionByUid,
   getConnectionName,
   addConnection,
   deleteConnection
} = connectionsStore;

const workspacesStore = useWorkspacesStore();
const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

const {
   selectWorkspace,
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

const connectionName = computed(() => props.contextConnection.name || getConnectionName(props.contextConnection.uid) || t('word.folder', 1));
const isConnected = computed(() => getWorkspace(props.contextConnection.uid)?.connectionStatus === 'connected');

const confirmDeleteConnection = () => {
   if (selectedWorkspace.value === props.contextConnection.uid)
      selectWorkspace(null);
   deleteConnection(props.contextConnection);
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
