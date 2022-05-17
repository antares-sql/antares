<template>
   <ConfirmModal
      :confirm-text="$t('word.run')"
      :cancel-text="$t('word.cancel')"
      size="400"
      @confirm="runRoutine"
      @hide="closeModal"
   >
      <template #header>
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-play mr-1" />
            <span class="cut-text">{{ $t('word.parameters') }}: {{ localRoutine.name }}</span>
         </div>
      </template>
      <template #body>
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
                           {{ parameter.type }} {{ wrapNumber(parameter.length) }}
                        </span>
                     </div>
                  </div>
               </div>
            </form>
         </div>
      </template>
   </ConfirmModal>
</template>

<script setup lang="ts">
import { computed, PropType, Ref, ref } from 'vue';
import { NUMBER, FLOAT } from 'common/fieldTypes';
import { FunctionParam } from 'common/interfaces/antares';
import ConfirmModal from '@/components/BaseConfirmModal.vue';

// eslint-disable-next-line camelcase
type LocalRoutineParams = FunctionParam & {_antares_id: string};

const props = defineProps({
   localRoutine: Object as PropType<{name: string; parameters: LocalRoutineParams[]}>,
   client: String
});

const emit = defineEmits(['confirm', 'close']);

const firstInput: Ref<HTMLInputElement[]> = ref(null);
const values: Ref<{[key: string]: string}> = ref({});

const inParameters = computed(() => {
   return props.localRoutine.parameters.filter(param => param.context === 'IN');
});

const typeClass = (type: string) => {
   if (type)
      return `type-${type.toLowerCase().replaceAll(' ', '_').replaceAll('"', '')}`;
   return '';
};

const runRoutine = () => {
   const valArr = Object.keys(values.value).reduce((acc, curr, i) => {
      let qc;
      switch (props.client) {
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

      const param = props.localRoutine.parameters.find(param => `${i}-${param.name}` === curr);

      const value = [...NUMBER, ...FLOAT].includes(param.type) ? values.value[curr] : `${qc}${values.value[curr]}${qc}`;
      acc.push(value);
      return acc;
   }, []);

   emit('confirm', valArr);
};

const closeModal = () => emit('close');

const onKey = (e: KeyboardEvent) => {
   e.stopPropagation();
   if (e.key === 'Escape')
      closeModal();
};

const wrapNumber = (num: number) => {
   if (!num) return '';
   return `(${num})`;
};

window.addEventListener('keydown', onKey);

setTimeout(() => {
   firstInput.value[0].focus();
}, 20);
</script>

<style scoped>
  .field-type {
    font-size: 0.6rem;
  }

  .input-group-addon {
    max-width: 100px;
  }
</style>
