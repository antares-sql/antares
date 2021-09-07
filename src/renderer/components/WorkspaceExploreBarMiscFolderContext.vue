<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="closeContext"
   >
      <div
         v-if="selectedMisc === 'trigger'"
         class="context-element"
         @click="$emit('open-create-trigger-tab')"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-table-cog text-light pr-1" /> {{ $t('message.createNewTrigger') }}</span>
      </div>
      <div
         v-if="selectedMisc === 'procedure'"
         class="context-element"
         @click="$emit('open-create-routine-tab')"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-sync-circle text-light pr-1" /> {{ $t('message.createNewRoutine') }}</span>
      </div>
      <div
         v-if="selectedMisc === 'function'"
         class="context-element"
         @click="$emit('open-create-function-tab')"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-arrow-right-bold-box text-light pr-1" /> {{ $t('message.createNewFunction') }}</span>
      </div>
      <div
         v-if="selectedMisc === 'triggerFunction'"
         class="context-element"
         @click="$emit('show-create-trigger-function-modal')"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-cog-clockwise text-light pr-1" /> {{ $t('message.createNewFunction') }}</span>
      </div>
      <div
         v-if="selectedMisc === 'scheduler'"
         class="context-element"
         @click="$emit('show-create-scheduler-modal')"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-calendar-clock text-light pr-1" /> {{ $t('message.createNewScheduler') }}</span>
      </div>
   </BaseContextMenu>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import BaseContextMenu from '@/components/BaseContextMenu';

export default {
   name: 'WorkspaceExploreBarMiscContext',
   components: {
      BaseContextMenu
   },
   props: {
      contextEvent: MouseEvent,
      selectedMisc: String,
      selectedSchema: String
   },
   data () {
      return {
         localElement: {}
      };
   },
   computed: {
      ...mapGetters({
         selectedWorkspace: 'workspaces/getSelected',
         getWorkspace: 'workspaces/getWorkspace'
      }),
      workspace () {
         return this.getWorkspace(this.selectedWorkspace);
      }
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification',
         changeBreadcrumbs: 'workspaces/changeBreadcrumbs'
      }),
      showDeleteModal () {
         this.isDeleteModal = true;
      },
      hideDeleteModal () {
         this.isDeleteModal = false;
      },
      showAskParamsModal () {
         this.isAskingParameters = true;
      },
      hideAskParamsModal () {
         this.isAskingParameters = false;
         this.closeContext();
      },
      closeContext () {
         this.$emit('close-context');
      }
   }
};
</script>
