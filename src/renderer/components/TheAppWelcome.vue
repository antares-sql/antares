<template>
   <div class="columns">
      <div class="column col-12 empty text-light">
         <div class="empty-icon">
            <i class="mdi mdi-48px mdi-emoticon" />
         </div>
         <p class="empty-title h5">
            {{ $t('message.appWelcome') }}
         </p>
         <p class="empty-subtitle">
            {{ $t('message.appFirstStep') }}
         </p>
         <div class="empty-action">
            <button class="btn btn-primary" @click="$emit('new-conn')">
               {{ $t('message.createConnection') }}
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
  .empty {
    height: 100%;
    border-radius: 0;
    background: transparent;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
</style>
