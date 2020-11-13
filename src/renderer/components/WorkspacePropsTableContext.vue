<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="closeContext"
   >
      <div class="context-element" @click="deleteField">
         <span class="d-flex"><i class="mdi mdi-18px mdi-delete text-light pr-1" /> {{ $t('message.deleteField') }}</span>
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
      selectedField: String
   },
   data () {
      return {
         isConfirmModal: false
      };
   },
   computed: {
   },
   methods: {
      closeContext () {
         this.$emit('close-context');
      },
      deleteField () {
         this.$emit('delete-selected');
         this.closeContext();
      }
   }
};
</script>
