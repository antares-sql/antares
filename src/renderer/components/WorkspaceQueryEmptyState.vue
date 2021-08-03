<template>
   <div class="container">
      <div class="columns">
         <div class="column col-16 text-right">
            <div class="mb-4">
               {{ $t('message.runQuery') }}
            </div>
            <div class="mb-4">
               {{ $t('word.format') }}
            </div>
            <div class="mb-4">
               {{ $t('word.clear') }}
            </div>
         </div>
         <div class="column col-16">
            <div class="mb-4">
               <code>F5</code>
            </div>
            <div class="mb-4">
               <code>CTRL</code> + <code>F8</code>
            </div>
            <div class="mb-4">
               <code>CTRL</code> + <code>W</code>
            </div>
         </div>
      </div>
   </div>
</template>

<script>
export default {
   name: 'WorkspaceQueryEmptyState'
};
</script>

<style scoped>
.container {
  padding-top: 15vh;
  opacity: 0.6;
}
</style>
