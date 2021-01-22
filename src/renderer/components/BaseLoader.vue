<template>
   <div class="empty">
      <div class="loading loading-lg" />
   </div>
</template>

<script>
export default {
   name: 'BaseLoader'
};
</script>
<style scoped>
.empty {
  position: absolute;
  display: flex;
  height: 100%;
  flex-direction: column;
  left: 0;
  justify-content: center;
  right: 0;
}
</style>
