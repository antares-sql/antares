<template>
   <ConfirmModal
      :confirm-text="t('general.run')"
      :cancel-text="t('general.cancel')"
      size="400"
      @confirm="runRoutine"
      @hide="closeModal"
   >
      <template #header>
         <div class="d-flex">
            <BaseIcon
               icon-name="play"
               class="mr-1"
               :size="24"
            />
            <span class="cut-text">{{ t('database.parameters') }}: {{ localRoutine.name }}</span>
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
import { ClientCode, FunctionInfos, RoutineInfos } from 'common/interfaces/antares';
import { formatRoutineArgument } from 'common/libs/routineCalls';
import { computed, onBeforeUnmount, PropType, Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import { useFilters } from '@/composables/useFilters';

const { t } = useI18n();

const { wrapNumber } = useFilters();

const props = defineProps({
   localRoutine: Object as PropType<RoutineInfos | FunctionInfos>,
   client: String
});

const emit = defineEmits(['confirm', 'close']);

const firstInput: Ref<HTMLInputElement[]> = ref(null);
const values: Ref<Record<string, string>> = ref({});

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
      const param = props.localRoutine.parameters.find(param => `${i}-${param.name}` === curr);
      acc.push(formatRoutineArgument(props.client as ClientCode, param.type, values.value[curr]));
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

window.addEventListener('keydown', onKey);

// Otherwise, after closing, it would keep stopping the propagation of every key press in the window
onBeforeUnmount(() => {
   window.removeEventListener('keydown', onKey);
});

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
