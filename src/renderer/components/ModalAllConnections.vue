<template>
   <Teleport to="#window-content">
      <div class="modal active">
         <a class="modal-overlay" @click.stop="closeModal" />
         <div ref="trapRef" class="modal-container p-0 pb-4">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <i class="mdi mdi-24px mdi-apps mr-1" />
                     <span class="cut-text">{{ t('connection.allConnections') }}</span>
                  </div>
               </div>
               <a class="btn btn-clear c-hand" @click.stop="closeModal" />
            </div>
            <div class="modal-body py-0">
               <div class="columns">
                  <div class="connections-search column col-12 columns col-gapless">
                     <div class="column col-12 mt-2">
                        <div ref="searchForm" class="form-group has-icon-right p-2 m-0">
                           <input
                              v-model="searchTerm"
                              class="form-input"
                              type="text"
                              :placeholder="t('connection.searchForConnections')"
                              @keypress.esc="searchTerm = ''"
                           >
                           <i v-if="!searchTerm" class="form-icon mdi mdi-magnify mdi-18px pr-4" />
                           <i
                              v-else
                              class="form-icon c-hand mdi mdi-backspace mdi-18px pr-4"
                              @click="searchTerm = ''"
                           />
                        </div>
                     </div>
                  </div>
                  <TransitionGroup name="fade" :duration="{ enter: 200, leave: 200 }">
                     <div
                        v-for="connection in filteredConnections"
                        :key="connection.uid"
                        class="connection-block column col-md-6 col-lg-4 col-3 p-3"
                        tabindex="0"
                        @click.stop="selectConnection(connection.uid)"
                        @keypress.stop.enter="selectConnection(connection.uid)"
                        @mouseover="connectionHover = connection.uid"
                        @mouseleave="connectionHover = null"
                     >
                        <div class="panel">
                           <div class="panel-header p-2 text-center p-relative">
                              <figure class="avatar avatar-lg pt-1 mb-1">
                                 <i class="settingbar-element-icon dbi" :class="[`dbi-${connection.client}`]" />
                              </figure>
                              <div class="panel-title h6 text-ellipsis">
                                 {{ getConnectionName(connection.uid) }}
                              </div>
                              <div class="panel-subtitle">
                                 {{ clients.get(connection.client) || connection.client }}
                              </div>
                              <div class="all-connections-buttons p-absolute d-flex" :style="'top: 0; right: 0;'">
                                 <i
                                    class="all-connections-delete mdi mdi-delete mdi-18px ml-2"
                                    :title="t('general.delete')"
                                    @click.stop="askToDelete(connection)"
                                 />
                              </div>
                           </div>
                           <div class="panel-body text-center">
                              <div v-if="connection.databasePath">
                                 <div class="text-ellipsis" :title="connection.databasePath">
                                    <i class="mdi mdi-database d-inline" /> <span class="text-bold">{{
                                       connection.databasePath
                                    }}</span>
                                 </div>
                              </div>
                              <div v-else>
                                 <div class="text-ellipsis" :title="`${connection.host}:${connection.port}`">
                                    <i class="mdi mdi-server d-inline" /> <span class="text-bold">{{ connection.host
                                    }}:{{ connection.port }}</span>
                                 </div>
                              </div>
                              <div v-if="connection.user">
                                 <div class="text-ellipsis">
                                    <i class="mdi mdi-account d-inline" /> <span class="text-bold">{{ connection.user
                                    }}</span>
                                 </div>
                              </div>
                              <div v-if="connection.schema">
                                 <div class="text-ellipsis">
                                    <i class="mdi mdi-database d-inline" /> <span class="text-bold">{{ connection.schema
                                    }}</span>
                                 </div>
                              </div>
                              <div v-if="connection.database">
                                 <div class="text-ellipsis">
                                    <i class="mdi mdi-database d-inline" /> <span class="text-bold">{{
                                       connection.database
                                    }}</span>
                                 </div>
                              </div>
                           </div>
                           <div class="panel-footer text-center py-0">
                              <div v-if="connection.ssl" class="chip bg-success mt-2">
                                 <i class="mdi mdi-shield-key mdi-18px mr-1" />
                                 SSL
                              </div>
                              <div v-if="connection.ssh" class="chip bg-success mt-2">
                                 <i class="mdi mdi-console-network mdi-18px mr-1" />
                                 SSH
                              </div>
                           </div>
                        </div>
                     </div>
                     <input
                        key="trick"
                        readonly
                        class="p-absolute"
                        :style="'width: 1px; height: 1px; opacity: 0;'"
                        type="text"
                     >
                     <!-- workaround for useFocusTrap $lastFocusable -->
                  </TransitionGroup>
               </div>
            </div>
         </div>
      </div>

      <ConfirmModal
         v-if="isConfirmModal"
         @confirm="confirmDeleteConnection"
         @hide="isConfirmModal = false"
      >
         <template #header>
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-server-remove mr-1" /> {{ t('connection.deleteConnection') }}
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ t('general.deleteConfirm') }} <b>{{ selectedConnectionName }}</b>?
            </div>
         </template>
      </ConfirmModal>
   </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, Ref, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useFocusTrap } from '@/composables/useFocusTrap';
import { useConnectionsStore } from '@/stores/connections';
import { useWorkspacesStore } from '@/stores/workspaces';
import ConfirmModal from '@/components/BaseConfirmModal.vue';
import { ConnectionParams } from 'common/interfaces/antares';

const { t } = useI18n();

const connectionsStore = useConnectionsStore();
const workspacesStore = useWorkspacesStore();

const { connections,
   lastConnections
} = storeToRefs(connectionsStore);
const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

const {
   getConnectionName,
   deleteConnection
} = connectionsStore;
const { selectWorkspace } = workspacesStore;

const { trapRef } = useFocusTrap();

const emit = defineEmits(['close']);

const clients = new Map([
   ['mysql', 'MySQL'],
   ['maria', 'MariaDB'],
   ['pg', 'PostgreSQL'],
   ['sqlite', 'SQLite']
]);

const searchTerm = ref('');
const isConfirmModal = ref(false);
const connectionHover: Ref<string> = ref(null);
const selectedConnection: Ref<ConnectionParams> = ref(null);

const sortedConnections = computed(() => {
   return connections.value
      .map(c => {
         const connTime = lastConnections.value.find((lc) => lc.uid === c.uid)?.time || 0;
         return {
            ...c,
            time: connTime
         };
      })
      .sort((a, b) => {
         if (a.time < b.time) return 1;
         if (a.time > b.time) return -1;
         return 0;
      });
});

const filteredConnections = computed(() => {
   return sortedConnections.value.filter(connection => {
      return connection.name?.toLocaleLowerCase().includes(searchTerm.value.toLocaleLowerCase()) ||
         connection.host?.toLocaleLowerCase().includes(searchTerm.value.toLocaleLowerCase()) ||
         connection.database?.toLocaleLowerCase().includes(searchTerm.value.toLocaleLowerCase()) ||
         connection.databasePath?.toLocaleLowerCase().includes(searchTerm.value.toLocaleLowerCase()) ||
         connection.schema?.toLocaleLowerCase().includes(searchTerm.value.toLocaleLowerCase()) ||
         connection.user?.toLocaleLowerCase().includes(searchTerm.value.toLocaleLowerCase()) ||
         String(connection.port)?.includes(searchTerm.value);
   });
});

const selectedConnectionName = computed(() => getConnectionName(selectedConnection.value?.uid));

const closeModal = () => emit('close');

const selectConnection = (uid: string) => {
   selectWorkspace(uid);
   closeModal();
};

const askToDelete = (connection: ConnectionParams) => {
   selectedConnection.value = connection;
   isConfirmModal.value = true;
};

const confirmDeleteConnection = () => {
   if (selectedWorkspace.value === selectedConnection.value.uid)
      selectWorkspace(null);
   deleteConnection(selectedConnection.value);
};

const onKey = (e: KeyboardEvent) => {
   e.stopPropagation();
   if (e.key === 'Escape') {
      if ((e.target as HTMLInputElement).tagName === 'INPUT' && searchTerm.value.length > 0)
         searchTerm.value = '';
      else
         closeModal();
   }
};

window.addEventListener('keydown', onKey);

onBeforeUnmount(() => {
   window.removeEventListener('keydown', onKey);
});
</script>

<style lang="scss" scoped>
.vscroll {
  height: 1000px;
  overflow: auto;
  overflow-anchor: none;
}

.column-resizable {
  &:hover,
  &:active {
    resize: horizontal;
    overflow: hidden;
  }
}

.table-column-title {
  display: flex;
  align-items: center;
}

.sort-icon {
  font-size: 0.7rem;
  line-height: 1;
  margin-left: 0.2rem;
}

.modal {
  align-items: flex-start;

  .modal-container {
    max-width: 75vw;
    margin-top: 10vh;

    .modal-body {
      height: 80vh;
    }
  }
}

.connections-search {
  display: flex;
  justify-content: space-around;
}

.connection-block {
  cursor: pointer;
  transition: all 0.2s;
  border-radius: $border-radius;
  outline: none;

  &:focus {
    box-shadow: 0 0 3px 0.1rem rgba($primary-color, 80%);
  }

  &:hover {
    .all-connections-buttons {
      .all-connections-delete,
      .all-connections-pinned,
      .all-connections-pin {
        opacity: 0.5;
      }
    }
  }

  .all-connections-buttons {
    .all-connections-pinned {
      opacity: 0.3;
      transition: opacity 0.2s;

      &:hover {
        opacity: 1;
      }
    }

    .all-connections-delete,
    .all-connections-pin {
      opacity: 0;
      transition: opacity 0.2s;

      &:hover {
        opacity: 1;
      }
    }
  }
}
</style>
