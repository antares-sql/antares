<template>
   <tr>
       <td class="no-padding"> {{ table.name }} </td>
       <td 
            class="no-padding"
            v-for="option in options"
       >
         <input @change="updateCheckbox(table.name, option)" type="checkbox" :value="option" v-model="selected" />
      </td>
   </tr>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
export default {
   name: 'ExportTableRow',
   props: {
      selectedTable: Object,
      selectedDatabase: String,
      table: Object,
   },
   data () {
      return {
         options: ["structure", "content", "drop"],
         selected: []
      };
   },
   computed: {
      ...mapGetters({
         selectedWorkspace: 'workspaces/getSelected'
      }),   
   },
   async created () {
       this.$parent.$on('checkboxes', this.updateCheckboxes);
       if (this.selectedTable && this.selectedTable.name===this.table.name) {
          this.selected = this.options;
       }
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification'
      }),
      async updateCheckboxes(type) {
         switch (type) {
            case 'selectAll':
               this.selected = this.options;
               for await (const option of this.options) {
                  this.$emit('checked', this.table.name, option);
               }
               break;
            case 'deselectAll':
               this.selected = [];
               break;
         }
      },
      updateCheckbox(tableName, type) {
         this.$emit('checked', tableName, type);
         this.selected.push(type);
         if (this.selected?.length===this.options.length) {
            this.selectAll = true;
         } else {
            this.selectAll = false;
         }
      }
   }
};
</script>

<style scoped>
   td.no-padding {
      padding: 0px !important;
   }
</style>
