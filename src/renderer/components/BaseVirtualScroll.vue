<template>
   <div class="vscroll-holder">
      <div
         class="vscroll-spacer"
         :style="{
            opacity: 0,
            clear: 'both',
            height: topHeight + 'px'
         }"
      />
      <slot :items="visibleItems" />
      <div
         class="vscroll-spacer"
         :style="{
            opacity: 0,
            clear: 'both',
            height: bottomHeight + 'px'
         }"
      />
   </div>
</template>

<script>
export default {
   name: 'BaseVirtualScroll',
   props: {
      items: Array,
      itemHeight: Number,
      visibleHeight: Number,
      scrollElement: {
         type: HTMLDivElement,
         default: null
      }
   },
   data () {
      return {
         topHeight: 0,
         bottomHeight: 0,
         visibleItems: [],
         renderTimeout: null,
         localScrollElement: null
      };
   },
   watch: {
      scrollElement () {
         this.setScrollElement();
      }
   },
   mounted () {
      this.setScrollElement();
   },
   beforeUnmount () {
      this.localScrollElement.removeEventListener('scroll', this.checkScrollPosition);
   },
   methods: {
      checkScrollPosition (e) {
         clearTimeout(this.renderTimeout);

         this.renderTimeout = setTimeout(() => {
            this.updateWindow(e);
         }, 200);
      },
      updateWindow () {
         const visibleItemsCount = Math.ceil(this.visibleHeight / this.itemHeight);
         const totalScrollHeight = this.items.length * this.itemHeight;
         const offset = 50;

         const scrollTop = this.localScrollElement.scrollTop;

         const firstVisibleIndex = Math.floor(scrollTop / this.itemHeight);
         const lastVisibleIndex = firstVisibleIndex + visibleItemsCount;
         const firstCutIndex = Math.max(firstVisibleIndex - offset, 0);
         const lastCutIndex = lastVisibleIndex + offset;

         this.visibleItems = this.items.slice(firstCutIndex, lastCutIndex);

         this.topHeight = firstCutIndex * this.itemHeight;
         this.bottomHeight = totalScrollHeight - this.visibleItems.length * this.itemHeight - this.topHeight;
      },
      setScrollElement () {
         if (this.localScrollElement)
            this.localScrollElement.removeEventListener('scroll', this.checkScrollPosition);

         this.localScrollElement = this.scrollElement ? this.scrollElement : this.$el;
         this.updateWindow();
         this.localScrollElement.addEventListener('scroll', this.checkScrollPosition);
      }
   }
};
</script>
