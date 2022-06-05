<template>
   <BaseSelect
      ref="editField"
      :options="foreigns"
      class="form-select pl-1 pr-4"
      :class="{'small-select': size === 'small'}"
      :value="currentValue"
      dropdown-class="select-sm"
      dropdown-container=".workspace-query-results > .vscroll"
      @change="onChange"
      @blur="emit('blur')"
   />
</template>

<script setup lang="ts">
import { computed, Ref, ref } from 'vue';
import { storeToRefs } from 'pinia';
import Tables from '@/ipc-api/Tables';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import { TEXT, LONG_TEXT } from 'common/fieldTypes';
import BaseSelect from '@/components/BaseSelect.vue';
import { TableField } from 'common/interfaces/antares';

const props = defineProps({
   modelValue: [String, Number],
   keyUsage: Object,
   size: {
      type: String,
      default: ''
   }
});

const emit = defineEmits(['update:modelValue', 'blur']);

const { addNotification } = useNotificationsStore();
const workspacesStore = useWorkspacesStore();

const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

const editField: Ref<HTMLSelectElement> = ref(null);
const foreignList = ref([]);
const currentValue = ref(props.modelValue);

const isValidDefault = computed(() => {
   if (!foreignList.value.length) return true;
   if (props.modelValue === null) return false;
   return foreignList.value.some(foreign => foreign.foreign_column.toString() === props.modelValue.toString());
});

const foreigns = computed(() => {
   const list = [];
   if (!isValidDefault.value)
      list.push({ value: props.modelValue, label: props.modelValue === null ? 'NULL' : props.modelValue });
   for (const row of foreignList.value)
      list.push({ value: row.foreign_column, label: `${row.foreign_column} ${cutText('foreign_description' in row ? ` - ${row.foreign_description}` : '')}` });
   return list;
});

const onChange = (opt: HTMLSelectElement) => {
   emit('update:modelValue', opt.value);
};

const cutText = (val: string) => {
   if (typeof val !== 'string') return val;
   return val.length > 15 ? `${val.substring(0, 15)}...` : val;
};

let foreignDesc: string | false;
const params = {
   uid: selectedWorkspace.value,
   schema: props.keyUsage.refSchema,
   table: props.keyUsage.refTable
};

(async () => {
   try { // Field data
      const { status, response } = await Tables.getTableColumns(params);

      if (status === 'success') {
         const textField = (response as TableField[]).find((field: {type: string; name: string}) => [...TEXT, ...LONG_TEXT].includes(field.type) && field.name !== props.keyUsage.refField);
         foreignDesc = textField ? textField.name : false;
      }
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   try { // Foregn list
      const { status, response } = await Tables.getForeignList({
         ...params,
         column: props.keyUsage.refField,
         description: foreignDesc
      });

      if (status === 'success')
         foreignList.value = response.rows;
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }
})();
</script>
