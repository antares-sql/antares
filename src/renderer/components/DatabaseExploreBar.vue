<template>
   <div class="workspace-explorebar column">
      <button
         v-if="!isConnected"
         class="btn btn-primary mt-4"
         @click="$emit('connect')"
      >
         Connect
      </button>
   </div>
</template>

<script>
export default {
   name: 'DatabaseExploreBar',
   props: {
      uid: String,
      isConnected: Boolean
   }
};
</script>

<style lang="scss">
   .workspace-explorebar{
      width: $explorebar-width;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      background: $bg-color-gray;
      margin-bottom: $footer-height;
      box-shadow: 0 0 1px 0px #000;
      z-index: 8;
      flex: initial;
   }
</style>
