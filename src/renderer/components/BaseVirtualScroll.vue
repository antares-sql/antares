<template>
   <div :style="{'height': visibleHeight+'px'}" class="vscroll-holder">
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
      visibleHeight: Number
   },
   data () {
      return {
         topHeight: 0,
         bottomHeight: 0,
         visibleItems: [],
         renderTimeout: null
      };
   },
   mounted () {
      this._checkScrollPosition = this.updateWindow.bind(this);
      this.updateWindow();
      this.$el.addEventListener('scroll', this._checkScrollPosition);
   },
   beforeDestroy () {
      this.$el.removeEventListener('scroll', this._checkScrollPosition);
   },
   methods: {
      checkScrollPosition () {

      },
      updateWindow (e) { // TODO: no timeout on first render
         const visibleItemsCount = Math.ceil(this.$el.clientHeight / this.itemHeight);
         const totalScrollHeight = this.items.length * this.itemHeight;
         const offset = 50;

         const scrollTop = this.$el.scrollTop;

         clearTimeout(this.renderTimeout);

         this.renderTimeout = setTimeout(() => {
            const firstVisibleIndex = Math.floor(scrollTop / this.itemHeight);
            const lastVisibleIndex = firstVisibleIndex + visibleItemsCount;
            const firstCutIndex = Math.max(firstVisibleIndex - offset, 0);
            const lastCutIndex = lastVisibleIndex + offset;

            this.visibleItems = this.items.slice(firstCutIndex, lastCutIndex);

            this.topHeight = firstCutIndex * this.itemHeight;
            this.bottomHeight = totalScrollHeight - this.visibleItems.length * this.itemHeight - this.topHeight;
         }, 200);
      }
   }
};
</script>
