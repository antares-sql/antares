<template>
   <ConfirmModal
      :confirm-text="$t('word.run')"
      :cancel-text="$t('word.cancel')"
      size="400"
      @confirm="runRoutine"
      @hide="closeModal"
   >
      <template slot="header">
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-play mr-1" /> {{ $t('word.parameters') }}: {{ localRoutine.name }}
         </div>
      </template>
      <div slot="body">
         <div class="content">
            <form class="form-horizontal">
               <div
                  v-for="(parameter, i) in localRoutine.parameters"
                  :key="parameter._id"
                  class="form-group"
               >
                  <div class="col-3">
                     <label class="form-label">{{ parameter.name }}</label>
                  </div>
                  <div class="col-9">
                     <div class="input-group">
                        <input
                           :ref="i === 0 ? 'firstInput' : ''"
                           v-model="values[parameter.name]"
                           class="form-input"
                           type="text"
                        >
                        <span class="input-group-addon field-type" :class="`type-${parameter.type.toLowerCase()}`">
                           {{ parameter.type }} {{ parameter.length | wrapNumber }}
                        </span>
                     </div>
                  </div>
               </div>
            </form>
         </div>
      </div>
   </ConfirmModal>
</template>

<script>
import ConfirmModal from '@/components/BaseConfirmModal';

export default {
   name: 'ModalAskParameters',
   components: {
      ConfirmModal
   },
   filters: {
      wrapNumber (num) {
         if (!num) return '';
         return `(${num})`;
      }
   },
   props: {
      localRoutine: Object
   },
   data () {
      return {
         values: {}
      };
   },
   created () {
      window.addEventListener('keydown', this.onKey);

      setTimeout(() => {
         this.$refs.firstInput[0].focus();
      }, 20);
   },
   beforeDestroy () {
      window.removeEventListener('keydown', this.onKey);
   },
   methods: {
      runRoutine () {
         const valArr = Object.keys(this.values).reduce((acc, curr) => {
            const value = isNaN(this.values[curr]) ? `"${this.values[curr]}"` : this.values[curr];
            acc.push(value);
            return acc;
         }, []);
         this.$emit('confirm', valArr);
      },
      closeModal () {
         this.$emit('close');
      },
      onKey (e) {
         e.stopPropagation();
         if (e.key === 'Escape')
            this.closeModal();
      }
   }
};
</script>

<style scoped>
  .field-type {
    font-size: 0.6rem;
  }
</style>
