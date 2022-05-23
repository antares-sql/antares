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
      @blur="$emit('blur')"
   />
</template>

<script>
import { storeToRefs } from 'pinia';
import Tables from '@/ipc-api/Tables';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import { TEXT, LONG_TEXT } from 'common/fieldTypes';
import BaseSelect from '@/components/BaseSelect.vue';

export default {
   name: 'ForeignKeySelect',
   components: { BaseSelect },
   props: {
      modelValue: [String, Number],
      keyUsage: Object,
      size: {
         type: String,
         default: ''
      }
   },
   emits: ['update:modelValue', 'blur'],
   setup () {
      const { addNotification } = useNotificationsStore();
      const workspacesStore = useWorkspacesStore();

      const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

      return { addNotification, selectedWorkspace };
   },
   data () {
      return {
         foreignList: [],
         currentValue: this.modelValue
      };
   },
   computed: {
      isValidDefault () {
         if (!this.foreignList.length) return true;
         if (this.modelValue === null) return false;
         return this.foreignList.some(foreign => foreign.foreign_column.toString() === this.modelValue.toString());
      },
      foreigns () {
         const list = [];

         if (!this.isValidDefault)
            list.push({ value: this.modelValue, label: this.modelValue === null ? 'NULL' : this.modelValue });

         for (const row of this.foreignList)
            list.push({ value: row.foreign_column, label: `${row.foreign_column} ${this.cutText('foreign_description' in row ? ` - ${row.foreign_description}` : '')}` });

         return list;
      }
   },
   async created () {
      let foreignDesc;
      const params = {
         uid: this.selectedWorkspace,
         schema: this.keyUsage.refSchema,
         table: this.keyUsage.refTable
      };

      try { // Field data
         const { status, response } = await Tables.getTableColumns(params);
         if (status === 'success') {
            const textField = response.find(field => [...TEXT, ...LONG_TEXT].includes(field.type) && field.name !== this.keyUsage.refField);
            foreignDesc = textField ? textField.name : false;
         }
         else
            this.addNotification({ status: 'error', message: response });
      }
      catch (err) {
         this.addNotification({ status: 'error', message: err.stack });
      }

      try { // Foregn list
         const { status, response } = await Tables.getForeignList({
            ...params,
            column: this.keyUsage.refField,
            description: foreignDesc
         });

         if (status === 'success')
            this.foreignList = response.rows;
         else
            this.addNotification({ status: 'error', message: response });
      }
      catch (err) {
         this.addNotification({ status: 'error', message: err.stack });
      }
   },
   methods: {
      onChange (opt) {
         this.$emit('update:modelValue', opt.value);
      },
      cutText (val) {
         if (typeof val !== 'string') return val;
         return val.length > 15 ? `${val.substring(0, 15)}...` : val;
      }
   }
};
</script>
