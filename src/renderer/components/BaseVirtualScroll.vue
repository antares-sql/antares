<template>
   <div ref="root" class="vscroll-holder">
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

<script setup lang="ts">
import { onBeforeUnmount, onMounted, Ref, ref, watch } from 'vue';

const props = defineProps({
   items: Array,
   itemHeight: Number,
   visibleHeight: Number,
   scrollElement: {
      type: HTMLDivElement,
      default: null
   }
});

const root = ref(null);
const topHeight: Ref<number> = ref(0);
const bottomHeight: Ref<number> = ref(0);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const visibleItems: Ref<any[]> = ref([]);
const renderTimeout: Ref<NodeJS.Timeout> = ref(null);
const localScrollElement: Ref<HTMLDivElement> = ref(null);

const checkScrollPosition = () => {
   clearTimeout(renderTimeout.value);

   renderTimeout.value = setTimeout(() => {
      updateWindow();
   }, 200);
};

const updateWindow = () => {
   const visibleItemsCount = Math.ceil(props.visibleHeight / props.itemHeight);
   const totalScrollHeight = props.items.length * props.itemHeight;
   const offset = 50;

   const scrollTop = localScrollElement.value.scrollTop;

   const firstVisibleIndex = Math.floor(scrollTop / props.itemHeight);
   const lastVisibleIndex = firstVisibleIndex + visibleItemsCount;
   const firstCutIndex = Math.max(firstVisibleIndex - offset, 0);
   const lastCutIndex = lastVisibleIndex + offset;

   visibleItems.value = props.items.slice(firstCutIndex, lastCutIndex);

   topHeight.value = firstCutIndex * props.itemHeight;
   bottomHeight.value = totalScrollHeight - visibleItems.value.length * props.itemHeight - topHeight.value;
};

const setScrollElement = () => {
   if (localScrollElement.value)
      localScrollElement.value.removeEventListener('scroll', checkScrollPosition);

   localScrollElement.value = props.scrollElement ? props.scrollElement : root.value;
   updateWindow();
   localScrollElement.value.addEventListener('scroll', checkScrollPosition);
};

watch(() => props.scrollElement, () => {
   setScrollElement();
});

onMounted(() => {
   setScrollElement();
});

onBeforeUnmount(() => {
   localScrollElement.value.removeEventListener('scroll', checkScrollPosition);
});

defineExpose({
   updateWindow
});

</script>
