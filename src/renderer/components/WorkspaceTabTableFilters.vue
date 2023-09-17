<template>
   <form class="workspace-table-filters" @submit.prevent="doFilter">
      <div
         v-for="(row, index) of rows"
         :key="index"
         class="workspace-table-filters-row"
      >
         <label class="form-checkbox my-0">
            <input
               v-model="row.active"
               type="checkbox"
               @change="doFilter"
            ><i class="form-icon" />
         </label>
         <BaseSelect
            v-model="row.field"
            class="form-select ml-2 col-auto select-sm"
            :options="fields"
            option-track-by="name"
            option-label="name"
         />
         <BaseSelect
            v-model="row.op"
            class="form-select ml-2 col-auto select-sm"
            :options="operators"
         />
         <div class="workspace-table-filters-row-value ml-2">
            <input
               v-if="!row.op.includes('NULL')"
               v-model="row.value"
               type="text"
               class="form-input input-sm"
            >
            <input
               v-if="row.op === 'BETWEEN'"
               v-model="row.value2"
               type="text"
               class="form-input ml-2 input-sm"
            >
         </div>
         <button
            class="btn btn-sm btn-dark mr-0 ml-2"
            type="button"
            @click="removeRow(index)"
         >
            <BaseIcon
               icon-name="mdiMinusCircleOutline"
               class="mt-1"
               :size="16"
            />
         </button>
      </div>
      <div class="workspace-table-filters-buttons">
         <button
            class="btn btn-sm btn-primary mr-0 ml-2"
            type="submit"
         >
            {{ t('general.filter') }}
         </button>
         <button
            class="btn btn-sm btn-dark mr-0 ml-2"
            type="button"
            @click="addRow"
         >
            <BaseIcon
               icon-name="mdiPlusCircleOutline"
               class="mt-1"
               :size="16"
            />
         </button>
      </div>
   </form>
</template>

<script setup lang="ts">
import customizations from 'common/customizations';
import { FLOAT, NUMBER } from 'common/fieldTypes';
import { ClientCode, TableField } from 'common/interfaces/antares';
import { TableFilterClausole } from 'common/interfaces/tableApis';
import { computed, Prop, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import BaseSelect from '@/components/BaseSelect.vue';

const { t } = useI18n();

const props = defineProps({
   fields: Array as Prop<TableField[]>,
   connClient: String as Prop<ClientCode>
});

const emit = defineEmits(['filter-change', 'filter']);

const rows = ref([]);
const operators = ref([
   '=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN', 'LIKE', 'BETWEEN', 'IS NULL', 'IS NOT NULL'
]);

const clientCustomizations = computed(() => customizations[props.connClient]);

const addRow = () => {
   rows.value.push({ active: true, field: props.fields[0].name, op: '=', value: '', value2: '' });
   emit('filter-change', rows.value);
};

const removeRow = (i: number) => {
   rows.value = rows.value.filter((_, idx) => idx !== i);
   emit('filter-change', rows.value);
};

const doFilter = () => {
   const clausoles = rows.value
      .filter(el => el.active)
      .map(el => createClausole(el));
   emit('filter', clausoles);
};

const createClausole = (filter: TableFilterClausole) => {
   const field = props.fields.find(field => field.name === filter.field);
   const isNumeric = [...NUMBER, ...FLOAT].includes(field.type);
   const { elementsWrapper: ew, stringsWrapper: sw } = clientCustomizations.value;
   let value;

   switch (filter.op) {
      case '=':
      case '!=':
         value = isNumeric ? filter.value : `${sw}${filter.value}${sw}`;
         break;
      case 'BETWEEN':
         value = isNumeric ? filter.value : `${sw}${filter.value}${sw}`;
         value += ' AND ';
         value += isNumeric ? filter.value2 : `${sw}${filter.value2}${sw}`;
         break;
      case 'IN':
      case 'NOT IN':
         value = filter.value.split(',').map(val => {
            val = val.trim();
            return isNumeric ? val : `${sw}${val}${sw}`;
         }).join(',');
         value = `(${filter.value})`;
         break;
      case 'IS NULL':
      case 'IS NOT NULL':
         value = '';
         break;
      case 'LIKE':
         value = `${sw}%${filter.value}%${sw}`;
         break;
      default:
         value = `${sw}${filter.value}${sw}`;
   }

   if (isNumeric && !value.length && !['IS NULL', 'IS NOT NULL'].includes(filter.op))
      value = `${sw}${sw}`;

   return `${ew}${filter.field}${ew} ${filter.op} ${value}`;
};

addRow();
</script>

<style lang="scss">
.workspace-table-filters {
  padding: 0 0.6rem;
  width: 100%;
}

.workspace-table-filters-buttons {
  display: flex;
  flex-direction: row-reverse;
  padding-bottom: 0.4rem;
}

.workspace-table-filters-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.4rem;
}

.workspace-table-filters-row-value {
  width: 100%;
  display: flex;
}
</style>
