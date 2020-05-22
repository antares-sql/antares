<template>
   <div class="context">
      <!-- <a
         class="context-overlay c-hand"
         @click="$emit('close')"
         @contextmenu="$emit('close')"
      /> -->
      <div
         v-click-outside="close"
         class="context-container"
         :style="position"
      >
         <slot />
      </div>
   </div>
</template>

<script>
import ClickOutside from 'vue-click-outside';

export default {
   name: 'BaseContextMenu',
   directives: {
      ClickOutside
   },
   props: {
      contextEvent: MouseEvent
   },
   computed: {
      position () {
         return {
            top: this.contextEvent.clientY + 'px',
            left: this.contextEvent.clientX + 'px'
         };
      }
   },
   methods: {
      close () {
         this.$emit('close');
      }
   }
};
</script>

<style lang="scss">
   .context{
      display: flex;
      position: absolute;
      z-index: 400;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      padding: 0.4rem;
      position: fixed;
      right: 0;
      top: 0;
      left: 0;
      bottom: 0;
      pointer-events: none;

      .context-container{
         max-width: 150px;
         z-index: 1;
         box-shadow: 0px 1px 1px 0px #000;
         padding: 0;
         background: #1d1d1d;
         border-radius: 0.1rem;
         display: flex;
         flex-direction: column;
         max-height: 75vh;
         padding: 0.3rem;
         width: 100%;
         position: absolute;
         pointer-events: initial;

         .context-element{
            display: flex;
            align-items: center;
         }
      }

      .context-overlay{
         background: transparent;
         bottom: 0;
         cursor: default;
         display: block;
         left: 0;
         position: absolute;
         right: 0;
         top: 0;
      }
   }

</style>
