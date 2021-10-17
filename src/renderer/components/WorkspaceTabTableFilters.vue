<template>
   <form class="workspace-table-filters" @submit.prevent="doFilter">
      <div
         v-for="(row, index) of rows"
         :key="index"
         class="workspace-table-filters-row"
      >
         <label class="form-checkbox my-0" :title="$t('word.insert')">
            <input
               v-model="row.active"
               type="checkbox"
               @change="doFilter"
            ><i class="form-icon" />
         </label>
         <select v-model="row.field" class="form-select col-auto select-sm">
            <option
               v-for="(item, j) of fields"
               :key="j"
               :value="item.name"
            >
               {{ item.name }}
            </option>
         </select>
         <select v-model="row.op" class="form-select ml-2 col-auto select-sm">
            <option
               v-for="(operator, k) of operators"
               :key="k"
               :value="operator"
            >
               {{ operator }}
            </option>
         </select>
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
            @click="addRow"
         >
            <i class="mdi mdi-plus-circle-outline" />
         </button>
         <button
            class="btn btn-sm btn-dark mr-0 ml-2"
            type="button"
            @click="removeRow(index)"
         >
            <i class="mdi mdi-minus-circle-outline" />
         </button>
      </div>
      <div class="workspace-table-filters-buttons">
         <button
            class="btn btn-sm btn-primary mr-0 ml-2"
            type="submit"
         >
            {{ $t('word.filter') }}
         </button>
      </div>
   </form>
</template>

<script>
export default {
   props: {
      fields: Array
   },
   data () {
      return {
         rows: [],
         operators: [
            '=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN', 'LIKE', 'BETWEEN', 'IS NULL', 'IS NOT NULL'
         ]
      };
   },
   created () {
      this.addRow();
   },
   methods: {
      addRow () {
         this.rows.push({ active: true, field: this.fields[0].name, op: '=', value: '', value2: '' });
      },
      removeRow (i) {
         if (this.rows.length >= 2)
            this.rows = this.rows.filter((_, idx) => idx !== i);
      },
      doFilter () {
         const clausoles = this.rows.filter(el => el.active).map(el => this.createClausole(el));
         this.$emit('filter', clausoles);
      },
      createClausole (filter) {
         const field = this.fields.find(field => field.name === filter.field);
         const isNumeric = field.type.match(/INT|FLOAT|DECIMAL/);
         let value = null;

         switch (filter.op) {
            case '=':
            case '!=':
               value = isNumeric ? filter.value : '"' + filter.value + '"';
               break;
            case 'BETWEEN':
               value = isNumeric ? filter.value : '"' + filter.value + '"';
               value += ' AND ';
               value += isNumeric ? filter.value2 : '"' + filter.value2 + '"';
               console.log(value);
               break;
            case 'IN':
            case 'NOT IN':
               value = filter.value.split(',').map(val => {
                  val = val.trim();
                  return isNumeric ? val : '"' + val + '"';
               }).join(',');
               value = '(' + filter.value + ')';
               break;
            case 'IS NULL':
            case 'IS NOT NULL':
               value = '';
               break;
            default:
               value = '"' + filter.value + '"';
         }

         return `${filter.field} ${filter.op} ${value}`;
      }
   }
};
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
