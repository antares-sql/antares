<template>
   <div>
      <div
         v-for="(col, cKey) in source"
         :key="cKey"
         class="td"
         :class="fieldType(col)"
      >
         {{ col }}
      </div>
   </div>
</template>

<script>
export default {
   name: 'WorkspaceQueryRow',
   props: {
      index: { // index of current item
         type: Number
      },
      source: { // here is: {uid: 'unique_1', text: 'abc'}
         type: Object,
         default () {
            return {};
         }
      }
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
