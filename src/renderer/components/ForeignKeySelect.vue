<template>
   <select
      ref="editField"
      class="form-select pl-1 pr-4"
      :class="{'small-select': size === 'small'}"
      @change="onChange"
      @blur="$emit('blur')"
   >
      <option v-if="!isValidDefault" :value="value">
         {{ value === null ? 'NULL' : value }}
      </option>
      <option
         v-for="row in foreignList"
         :key="row.foreign_column"
         :value="row.foreign_column"
         :selected="row.foreign_column === value"
      >
         {{ row.foreign_column }} {{ cutText('foreign_description' in row ? ` - ${row.foreign_description}` : '') }}
      </option>
   </select>
</template>

<script>
import Tables from '@/ipc-api/Tables';
import { mapGetters, mapActions } from 'vuex';
import { TEXT, LONG_TEXT } from 'common/fieldTypes';
export default {
   name: 'ForeignKeySelect',
   props: {
      value: [String, Number],
      keyUsage: Object,
      size: {
         type: String,
         default: ''
      }
   },
   data () {
      return {
         foreignList: []
      };
   },
   computed: {
      ...mapGetters({
         selectedWorkspace: 'workspaces/getSelected'
      }),
      isValidDefault () {
         if (!this.foreignList.length) return true;
         if (this.value === null) return false;
         return this.foreignList.some(foreign => foreign.foreign_column.toString() === this.value.toString());
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
      ...mapActions({
         addNotification: 'notifications/addNotification'
      }),
      onChange () {
         this.$emit('update:value', this.$refs.editField.value);
      },
      cutText (val) {
         if (typeof val !== 'string') return val;
         return val.length > 15 ? `${val.substring(0, 15)}...` : val;
      }
   }
};
</script>
