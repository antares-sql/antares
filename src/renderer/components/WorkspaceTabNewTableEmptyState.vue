<template>
   <div class="column col-12 empty">
      <p class="h6 empty-subtitle">
         {{ $t('message.thereAreNoTableFields') }}
      </p>
      <div class="empty-action">
         <button class="btn btn-gray d-flex" @click="$emit('new-field')">
            <i class="mdi mdi-24px mdi-playlist-plus mr-2" />
            {{ $t('message.addNewField') }}
         </button>
      </div>
   </div>
</template>

<script>
export default {
   name: 'WorkspaceTabNewTableEmptyState'
};
</script>

<style scoped>
  .empty {
    border-radius: 0;
    background: transparent;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-left: auto;
    margin-right: auto;
    z-index: 9;
  }
</style>
