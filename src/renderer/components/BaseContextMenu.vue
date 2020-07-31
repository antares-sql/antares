<template>
   <div class="context">
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
         return { // TODO: calc direction if near corners
            top: this.contextEvent.clientY + 5 + 'px',
            left: this.contextEvent.clientX + 5 + 'px'
         };
      }
   },
   methods: {
      close () {
         this.$emit('closeContext');
      }
   }
};
</script>

<style lang="scss">
  .context {
    display: flex;
    color: $body-font-color;
    font-size: 16px;
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

    .context-container {
      min-width: 100px;
      max-width: 150px;
      z-index: 1;
      box-shadow: 0 0 1px 0 #000;
      padding: 0;
      background: #1d1d1d;
      border-radius: 0.1rem;
      display: flex;
      flex-direction: column;
      position: absolute;
      pointer-events: initial;

      .context-element {
        display: flex;
        align-items: center;
        padding: 0.1rem 0.3rem;
        cursor: pointer;

        &:hover {
          background: $primary-color;
        }
      }
    }

    .context-overlay {
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
