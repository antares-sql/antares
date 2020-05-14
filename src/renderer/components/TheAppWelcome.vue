<template>
   <div class="columns">
      <div class="column col-12 empty text-light">
         <div class="empty-icon">
            <i class="material-icons md-48">mood</i>
         </div>
         <p class="empty-title h5">
            Welcome to Antares SQL Client!
         </p>
         <p class="empty-subtitle">
            Your first step: create a new database connection.
         </p>
         <div class="empty-action">
            <button class="btn btn-primary" @click="$emit('newConn')">
               Create connection
            </button>
         </div>
      </div>
   </div>
</template>

<script>
export default {
   name: 'TheAppWelcome'
};
</script>

<style scoped>
   .empty{
      height: 100%;
      border-radius: 0;
      background: transparent;
      display: flex;
      flex-direction: column;
      justify-content: center;
   }
</style>
