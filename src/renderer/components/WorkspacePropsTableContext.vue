<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="closeContext"
   >
      <div class="context-element">
         <span class="d-flex"><i class="mdi mdi-18px mdi-key-plus text-light pr-1" /> {{ $t('message.createNewIndex') }}</span>
         <i class="mdi mdi-18px mdi-chevron-right text-light pl-1" />
         <div class="context-submenu">
            <div
               v-for="index in indexTypes"
               :key="index"
               class="context-element"
               :class="{'disabled': index === 'PRIMARY' && hasPrimary}"
               @click="addNewIndex(index)"
            >
               <span class="d-flex"><i class="mdi mdi-18px mdi-key column-key pr-1" :class="`key-${index}`" /> {{ index }}</span>
            </div>
         </div>
      </div>
      <div v-if="indexes.length" class="context-element">
         <span class="d-flex"><i class="mdi mdi-18px mdi-key-arrow-right text-light pr-1" /> {{ $t('message.addToIndex') }}</span>
         <i class="mdi mdi-18px mdi-chevron-right text-light pl-1" />
         <div class="context-submenu">
            <div
               v-for="index in indexes"
               :key="index.name"
               class="context-element"
               :class="{'disabled': index.fields.includes(selectedField.name)}"
               @click="addToIndex(index._id)"
            >
               <span class="d-flex"><i class="mdi mdi-18px mdi-key column-key pr-1" :class="`key-${index.type}`" /> {{ index.name }}</span>
            </div>
         </div>
      </div>
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
      indexes: Array,
      indexTypes: Array,
      selectedField: Object
   },
   computed: {
      hasPrimary () {
         return this.indexes.some(index => index.type === 'PRIMARY');
      }
   },
   methods: {
      closeContext () {
         this.$emit('close-context');
      },
      deleteField () {
         this.$emit('delete-selected');
         this.closeContext();
      },
      addNewIndex (index) {
         this.$emit('add-new-index', { field: this.selectedField.name, index });
         this.closeContext();
      },
      addToIndex (index) {
         this.$emit('add-to-index', { field: this.selectedField.name, index });
         this.closeContext();
      }
   }
};
</script>

<style lang="scss" scoped>
.disabled {
  pointer-events: none;
  filter: grayscale(100%);
  opacity: 0.5;
}
</style>
