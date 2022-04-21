<template>
   <div class="context" :class="{'bottom': isBottom}">
      <a
         class="context-overlay"
         @click="close"
         @contextmenu="close"
      />
      <div
         ref="contextContent"
         class="context-container"
         :style="position"
      >
         <slot />
      </div>
   </div>
</template>

<script>
export default {
   name: 'BaseContextMenu',
   props: {
      contextEvent: MouseEvent
   },
   data () {
      return {
         contextSize: null,
         isBottom: false
      };
   },
   computed: {
      position () {
         let topCord = 0;
         let leftCord = 0;

         if (this.contextEvent) {
            const { clientY, clientX } = this.contextEvent;
            topCord = `${clientY + 2}px`;
            leftCord = `${clientX + 5}px`;

            if (this.contextSize) {
               if (clientY + (this.contextSize.height < 200 ? 200 : this.contextSize.height) + 5 >= window.innerHeight) {
                  topCord = `${clientY + 3 - this.contextSize.height}px`;
                  this.isBottom = true;
               }

               if (clientX + this.contextSize.width + 5 >= window.innerWidth)
                  leftCord = `${clientX - this.contextSize.width}px`;
            }
         }

         return {
            top: topCord,
            left: leftCord
         };
      }
   },
   created () {
      window.addEventListener('keydown', this.onKey);
   },
   mounted () {
      if (this.$refs.contextContent)
         this.contextSize = this.$refs.contextContent.getBoundingClientRect();
   },
   beforeUnmount () {
      window.removeEventListener('keydown', this.onKey);
   },
   methods: {
      close () {
         this.$emit('close-context');
      },
      onKey (e) {
         e.stopPropagation();
         if (e.key === 'Escape')
            this.close();
      }
   }
};
</script>

<style lang="scss">
.context {
  display: flex;
  font-size: 16px;
  z-index: 400;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: fixed;
  height: 100vh;
  right: 0;
  top: 0;
  left: 0;
  bottom: 0;

  &:not(.bottom) .context-submenu {
    top: -0.2rem;
  }

  &.bottom .context-submenu {
    bottom: -0.2rem;
  }

  .context-container {
    min-width: 100px;
    z-index: 10;
    padding: 0;
    background: #1d1d1d;
    border-radius: $border-radius;
    border: 1px solid $bg-color-light-dark;
    display: flex;
    flex-direction: column;
    position: absolute;
    pointer-events: initial;

    .context-element {
      display: flex;
      align-items: center;
      margin: 0.2rem;
      padding: 0.1rem 0.3rem;
      border-radius: $border-radius;
      cursor: pointer;
      justify-content: space-between;
      position: relative;
      white-space: nowrap;

      .context-submenu {
        border-radius: $border-radius;
        border: 1px solid $bg-color-light-dark;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s;
        position: absolute;
        left: 100%;
        min-width: 100px;
        background: #1d1d1d;
      }

      &:hover {
        .context-submenu {
          display: block;
          visibility: visible;
          opacity: 1;
        }
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

.disabled {
  pointer-events: none;
  filter: grayscale(100%);
  opacity: 0.5;
}

</style>
