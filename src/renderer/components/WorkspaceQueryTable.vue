<template>
   <div v-if="results" class="table table-hover">
      <div class="thead">
         <div class="tr">
            <div
               v-for="field in results.fields"
               :key="field.name"
               class="th"
            >
               {{ field.name }}
            </div>
         </div>
      </div>
      <div class="tbody">
         <div
            v-for="(row, rKey) in results.rows"
            :key="rKey"
            class="tr"
            tabindex="0"
         >
            <div
               v-for="(col, cKey) in row"
               :key="cKey"
               class="td"
               :class="fieldType(col)"
            >
               {{ col }}
            </div>
         </div>
      </div>
   </div>
</template>

<script>
export default {
   name: 'WorkspaceQueryTable',
   props: {
      results: Object
   },
   methods: {
      fieldType (col) {
         let type = typeof col;
         if (type === 'object')
            if (col instanceof Date) type = 'date';
         if (col instanceof Uint8Array) type = 'blob';
         if (col === null) type = 'null';

         return `type-${type}`;
      }
   }
};
</script>

<style>

</style>
