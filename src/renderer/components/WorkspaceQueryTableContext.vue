<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="closeContext"
   >
      <div
         v-if="selectedRows.length === 1"
         class="context-element"
         @click="setNull"
      >
         <span class="d-flex">
            <i class="mdi mdi-18px mdi-null text-light pr-1" /> {{ $t('message.setNull') }}
         </span>
      </div>
      <div class="context-element" @click="showConfirmModal">
         <span class="d-flex">
            <i class="mdi mdi-18px mdi-delete text-light pr-1" /> {{ $tc('message.deleteRows', selectedRows.length) }}
         </span>
      </div>
   </BaseContextMenu>
</template>

<script>
import BaseContextMenu from '@/components/BaseContextMenu';

export default {
   name: 'WorkspaceQueryTableContext',
   components: {
      BaseContextMenu
   },
   props: {
      contextEvent: MouseEvent,
      selectedRows: Array
   },
   computed: {
   },
   methods: {
      showConfirmModal () {
         this.$emit('show-delete-modal');
      },
      closeContext () {
         this.$emit('close-context');
      },
      setNull () {
         this.$emit('set-null');
         this.closeContext();
      }
   }
};
</script>
