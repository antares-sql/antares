<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="closeContext"
   >
      <div
         v-if="selectedTable && selectedTable.type === 'table' && customizations.tableSettings"
         class="context-element"
         @click="openTableSettingTab"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-tune-vertical-variant text-light pr-1" /> {{ $t('word.settings') }}</span>
      </div>
      <div
         v-if="selectedTable && selectedTable.type === 'view' && customizations.viewSettings"
         class="context-element"
         @click="openViewSettingTab"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-tune-vertical-variant text-light pr-1" /> {{ $t('word.settings') }}</span>
      </div>
      <div
         v-if="selectedTable && selectedTable.type === 'table'"
         class="context-element"
         @click="duplicateTable"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-table-multiple text-light pr-1" /> {{ $t('message.duplicateTable') }}</span>
      </div>
      <div
         v-if="selectedTable && selectedTable.type === 'table'"
         class="context-element"
         @click="showEmptyModal"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-table-off text-light pr-1" /> {{ $t('message.emptyTable') }}</span>
      </div>
      <div class="context-element" @click="showDeleteModal">
         <span class="d-flex"><i class="mdi mdi-18px mdi-table-remove text-light pr-1" /> {{ $t('word.delete') }}</span>
      </div>

      <ConfirmModal
         v-if="isEmptyModal"
         @confirm="emptyTable"
         @hide="hideEmptyModal"
      >
         <template slot="header">
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-table-off mr-1" /> <span class="cut-text">{{ $t('message.emptyTable') }}</span>
            </div>
         </template>
         <div slot="body">
            <div class="mb-2">
               {{ $t('message.emptyCorfirm') }} "<b>{{ selectedTable.name }}</b>"?
            </div>
         </div>
      </ConfirmModal>
      <ConfirmModal
         v-if="isDeleteModal"
         @confirm="deleteTable"
         @hide="hideDeleteModal"
      >
         <template slot="header">
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-table-remove mr-1" />
               <span class="cut-text">{{ selectedTable.type === 'table' ? $t('message.deleteTable') : $t('message.deleteView') }}</span>
            </div>
         </template>
         <div slot="body">
            <div class="mb-2">
               {{ $t('message.deleteCorfirm') }} "<b>{{ selectedTable.name }}</b>"?
            </div>
         </div>
      </ConfirmModal>
   </BaseContextMenu>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import BaseContextMenu from '@/components/BaseContextMenu';
import ConfirmModal from '@/components/BaseConfirmModal';
import Tables from '@/ipc-api/Tables';
import Views from '@/ipc-api/Views';

export default {
   name: 'WorkspaceExploreBarTableContext',
   components: {
      BaseContextMenu,
      ConfirmModal
   },
   props: {
      contextEvent: MouseEvent,
      selectedTable: Object,
      selectedSchema: String
   },
   data () {
      return {
         isDeleteModal: false,
         isEmptyModal: false
      };
   },
   computed: {
      ...mapGetters({
         selectedWorkspace: 'workspaces/getSelected',
         getWorkspace: 'workspaces/getWorkspace'
      }),
      workspace () {
         return this.getWorkspace(this.selectedWorkspace);
      },
      customizations () {
         return this.workspace ? this.workspace.customizations : {};
      }
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification',
         newTab: 'workspaces/newTab',
         removeTabs: 'workspaces/removeTabs',
         addLoadingElement: 'workspaces/addLoadingElement',
         removeLoadingElement: 'workspaces/removeLoadingElement',
         changeBreadcrumbs: 'workspaces/changeBreadcrumbs'
      }),
      showCreateTableModal () {
         this.$emit('show-create-table-modal');
      },
      showDeleteModal () {
         this.isDeleteModal = true;
      },
      hideDeleteModal () {
         this.isDeleteModal = false;
      },
      showEmptyModal () {
         this.isEmptyModal = true;
      },
      hideEmptyModal () {
         this.isEmptyModal = false;
      },
      closeContext () {
         this.$emit('close-context');
      },
      openTableSettingTab () {
         this.newTab({
            uid: this.selectedWorkspace,
            elementName: this.selectedTable.name,
            schema: this.selectedSchema,
            type: 'table-props',
            elementType: 'table'
         });

         this.changeBreadcrumbs({
            schema: this.selectedSchema,
            table: this.selectedTable.name
         });

         this.closeContext();
      },
      openViewSettingTab () {
         this.newTab({
            uid: this.selectedWorkspace,
            elementType: 'table',
            elementName: this.selectedTable.name,
            schema: this.selectedSchema,
            type: 'view-props'
         });

         this.changeBreadcrumbs({
            schema: this.selectedSchema,
            view: this.selectedTable.name
         });

         this.closeContext();
      },
      async duplicateTable () {
         this.closeContext();

         this.addLoadingElement({
            name: this.selectedTable.name,
            schema: this.selectedSchema,
            type: 'table'
         });

         try {
            const { status, response } = await Tables.duplicateTable({
               uid: this.selectedWorkspace,
               table: this.selectedTable.name,
               schema: this.selectedSchema
            });

            if (status === 'success')
               this.$emit('reload');
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.removeLoadingElement({
            name: this.selectedTable.name,
            schema: this.selectedSchema,
            type: 'table'
         });
      },
      async emptyTable () {
         this.closeContext();

         this.addLoadingElement({
            name: this.selectedTable.name,
            schema: this.selectedSchema,
            type: 'table'
         });

         try {
            const { status, response } = await Tables.truncateTable({
               uid: this.selectedWorkspace,
               table: this.selectedTable.name,
               schema: this.selectedSchema
            });

            if (status === 'success')
               this.$emit('reload');
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.removeLoadingElement({
            name: this.selectedTable.name,
            schema: this.selectedSchema,
            type: 'table'
         });
      },
      async deleteTable () {
         this.closeContext();

         this.addLoadingElement({
            name: this.selectedTable.name,
            schema: this.selectedSchema,
            type: 'table'
         });

         try {
            let res;

            if (this.selectedTable.type === 'table') {
               res = await Tables.dropTable({
                  uid: this.selectedWorkspace,
                  table: this.selectedTable.name,
                  schema: this.selectedSchema
               });
            }
            else if (this.selectedTable.type === 'view') {
               res = await Views.dropView({
                  uid: this.selectedWorkspace,
                  view: this.selectedTable.name,
                  schema: this.selectedSchema
               });
            }

            const { status, response } = res;

            if (status === 'success') {
               this.removeTabs({
                  uid: this.selectedWorkspace,
                  elementName: this.selectedTable.name,
                  elementType: this.selectedTable.type,
                  schema: this.selectedSchema
               });

               this.$emit('reload');
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.removeLoadingElement({
            name: this.selectedTable.name,
            schema: this.selectedSchema,
            type: 'table'
         });
      }
   }
};
</script>
