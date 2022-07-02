<template>
   <Teleport to="#window-content">
      <div class="modal active">
         <a class="modal-overlay" @click.stop="closeModal" />
         <div ref="trapRef" class="modal-container p-0 pb-4">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <i class="mdi mdi-24px mdi-apps mr-1" />
                     <span class="cut-text">{{ $t('message.allConnections') }}</span>
                  </div>
               </div>
               <a class="btn btn-clear c-hand" @click.stop="closeModal" />
            </div>
            <div class="modal-body py-0">
               <div class="columns">
                  <div
                     v-for="connection in connections"
                     :key="connection.uid"
                     class="column col-md-6 col-lg-4 col-3 p-3"
                  >
                     <div class="panel">
                        <div class="panel-header text-center">
                           <figure class="avatar avatar-lg">
                              <i class="settingbar-element-icon dbi" :class="[`dbi-${connection.client}`]" />
                           </figure>
                           <div class="panel-title h6 mt-10">
                              {{ getConnectionName(connection.uid) }}
                           </div>
                           <div class="panel-subtitle">
                              {{ connection.client }}
                           </div>
                        </div>
                        <div class="panel-body text-center">
                           <div v-if="connection.databasePath">
                              <div class="pl-1 text-break">
                                 <span class="text-bold">PATH:</span> {{ connection.databasePath }}
                              </div>
                           </div>
                           <div v-else>
                              <div class="pl-1 text-break">
                                 <span class="text-bold">HOST:</span> {{ connection.host }}
                              </div>
                           </div>
                           <div v-if="connection.user">
                              <div class="pl-1 text-break">
                                 <span class="text-bold">USER:</span> {{ connection.user }}
                              </div>
                           </div>
                           <div v-if="connection.schema">
                              <div class="pl-1 text-break">
                                 <span class="text-bold">SCHEMA:</span> {{ connection.schema }}
                              </div>
                           </div>
                           <div v-if="connection.database">
                              <div class="pl-1 text-break">
                                 <span class="text-bold">DATABASE:</span> {{ connection.database }}
                              </div>
                           </div>
                        </div>
                        <div class="panel-footer text-center py-0">
                           <div v-if="connection.ssl" class="chip bg-success mt-2">
                              SSL
                           </div>
                           <div v-if="connection.ssh" class="chip bg-success mt-2">
                              SSH
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </Teleport>
</template>

<script setup lang="ts">
import { useFocusTrap } from '@/composables/useFocusTrap';
import { useConnectionsStore } from '@/stores/connections';
import { useWorkspacesStore } from '@/stores/workspaces';
import { storeToRefs } from 'pinia';

const connectionsStore = useConnectionsStore();
const workspacesStore = useWorkspacesStore();

const { connections } = storeToRefs(connectionsStore);
const { getConnectionName } = connectionsStore;
const { getWorkspace } = workspacesStore;

const { trapRef } = useFocusTrap();

const emit = defineEmits(['close']);

const closeModal = () => emit('close');

const onKey = (e:KeyboardEvent) => {
   e.stopPropagation();
   if (e.key === 'Escape')
      closeModal();
};

const getStatusBadge = (uid: string) => {
   if (getWorkspace(uid)) {
      const status = getWorkspace(uid).connectionStatus;

      switch (status) {
         case 'connected':
            return 'badge badge-connected';
         case 'connecting':
            return 'badge badge-connecting';
         case 'failed':
            return 'badge badge-failed';
         default:
            return '';
      }
   }
};

window.addEventListener('keydown', onKey, { capture: true });
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

.result-tabs {
  background: transparent !important;
  margin: 0;
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

.processes-toolbar {
  display: flex;
  justify-content: space-between;
}
</style>
