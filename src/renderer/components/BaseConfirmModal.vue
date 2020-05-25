<template>
   <div class="modal modal-sm active">
      <a class="modal-overlay" @click="hideModal" />
      <div class="modal-container">
         <div v-if="hasHeader" class="modal-header text-light">
            <div class="modal-title h6">
               <slot name="header" />
            </div>
            <a class="btn btn-clear float-right" @click="hideModal" />
         </div>
         <div v-if="hasDefault" class="modal-header">
            <div class="modal-title h6">
               <slot />
            </div>
            <a class="btn btn-clear float-right" @click="hideModal" />
         </div>
         <div v-if="hasBody" class="modal-body">
            <a
               v-if="!hasHeader && !hasDefault"
               class="btn btn-clear float-right"
               @click="hideModal"
            />
            <div class="content">
               <slot name="body" />
            </div>
         </div>
         <div class="modal-footer">
            <button
               class="btn btn-primary mr-2"
               @click="confirmModal"
            >
               {{ $t('word.confirm') }}
            </button>
            <button
               class="btn btn-link"
               @click="hideModal"
            >
               {{ $t('word.cancel') }}
            </button>
         </div>
      </div>
   </div>
</template>

<script>
export default {
   name: 'BaseConfirmModal',
   computed: {
      hasHeader () {
         return !!this.$slots.header;
      },
      hasBody () {
         return !!this.$slots.body;
      },
      hasDefault () {
         return !!this.$slots.default;
      }
   },
   methods: {
      confirmModal () {
         this.$emit('confirm');
         this.hideModal();
      },

      hideModal () {
         this.$emit('hide');
      }
   }
};
</script>

<style scoped>
   .modal.modal-sm .modal-container{
      padding: 0;
   }
</style>
