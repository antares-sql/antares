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
            <i class="mdi mdi-24px mdi-play mr-1" />
            <span class="cut-text">{{ $t('word.parameters') }}: {{ localRoutine.name }}</span>
         </div>
      </template>
      <div slot="body">
         <div class="content">
            <form class="form-horizontal">
               <div
                  v-for="(parameter, i) in inParameters"
                  :key="parameter._antares_id"
                  class="form-group"
               >
                  <div class="col-4">
                     <label class="form-label">{{ parameter.name }}</label>
                  </div>
                  <div class="col-8">
                     <div class="input-group">
                        <input
                           :ref="i === 0 ? 'firstInput' : ''"
                           v-model="values[`${i}-${parameter.name}`]"
                           class="form-input"
                           type="text"
                        >
                        <span
                           :title="`${parameter.type} ${parameter.length}`"
                           class="input-group-addon field-type cut-text"
                           :class="typeClass(parameter.type)"
                        >
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
import { NUMBER, FLOAT } from 'common/fieldTypes';
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
      localRoutine: Object,
      client: String
   },
   data () {
      return {
         values: {}
      };
   },
   computed: {
      inParameters () {
         return this.localRoutine.parameters.filter(param => param.context === 'IN');
      }
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
      typeClass (type) {
         if (type)
            return `type-${type.toLowerCase().replaceAll(' ', '_').replaceAll('"', '')}`;
         return '';
      },
      runRoutine () {
         const valArr = Object.keys(this.values).reduce((acc, curr, i) => {
            let qc;
            switch (this.client) {
               case 'maria':
               case 'mysql':
                  qc = '"';
                  break;
               case 'pg':
                  qc = '\'';
                  break;
               default:
                  qc = '"';
            }

            const param = this.localRoutine.parameters.find(param => `${i}-${param.name}` === curr);

            const value = [...NUMBER, ...FLOAT].includes(param.type) ? this.values[curr] : `${qc}${this.values[curr]}${qc}`;
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

  .input-group-addon {
    max-width: 100px;
  }
</style>
