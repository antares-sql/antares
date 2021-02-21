<template>
   <div class="modal active" :class="modalSizeClass">
      <a class="modal-overlay" @click="hideModal" />
      <div class="modal-container">
         <div v-if="hasHeader" class="modal-header pl-2">
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
         <div class="modal-footer pt-0">
            <button
               class="btn btn-primary mr-2"
               @click.stop="confirmModal"
            >
               {{ confirmText || $t('word.confirm') }}
            </button>
            <button
               class="btn btn-link"
               @click="hideModal"
            >
               {{ cancelText || $t('word.cancel') }}
            </button>
         </div>
      </div>
   </div>
</template>

<script>
export default {
   name: 'BaseConfirmModal',
   props: {
      size: {
         type: String,
         validator: prop => ['small', 'medium', '400', 'large'].includes(prop),
         default: 'small'
      },
      confirmText: String,
      cancelText: String
   },
   computed: {
      hasHeader () {
         return !!this.$slots.header;
      },
      hasBody () {
         return !!this.$slots.body;
      },
      hasDefault () {
         return !!this.$slots.default;
      },
      modalSizeClass () {
         if (this.size === 'small')
            return 'modal-sm';
         if (this.size === '400')
            return 'modal-400';
         else if (this.size === 'large')
            return 'modal-lg';
         else return '';
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
.modal-400 .modal-container {
  max-width: 400px;
}

.modal.modal-sm .modal-container {
  padding: 0;
}

</style>
