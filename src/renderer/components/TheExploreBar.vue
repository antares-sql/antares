<template>
   <div id="explorebar" class="container">
      <!-- aaa -->
   </div>
</template>

<script>
export default {
   name: 'TheExploreBar'

};
</script>

<style lang="scss">
   #explorebar{
      width: $explorebar-width;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      background: #272727;
      margin-bottom: $footer-height;
      box-shadow: 0 0 1px 0px #000;
      z-index: 8;
   }
</style>
