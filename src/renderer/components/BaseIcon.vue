<template>
   <SvgIcon
      :type="type"
      :path="iconPath"
      :size="size"
      :rotate="rotate"
      :class="iconFlip"
   />
</template>

<script setup lang="ts">
import SvgIcon from '@jamescoyle/vue-icon';
import * as Icons from '@mdi/js';
import { computed, PropType } from 'vue';

const props = defineProps({
   iconName: {
      type: String,
      required: true
   },
   size: {
      type: Number,
      default: 48
   },
   type: {
      type: String,
      default: () => 'mdi'
   },
   flip: {
      type: String as PropType<'horizontal' | 'vertical' | 'both'>,
      default: () => null
   },
   rotate: {
      type: Number,
      default: () => null
   }
});

const iconPath = computed(() => {
   return (Icons as {[k:string]: string})[props.iconName];
});

const iconFlip = computed(() => {
   if (['horizontal', 'vertical', 'both'].includes(props.flip))
      return `flip-${props.flip}`;
   else return '';
});
</script>

<style lang="scss" scoped>
.flip-horizontal {
    transform: scaleX(-1);
}

.flip-vertical {
    transform: scaleY(-1);
}

.flip-both {
    /* flip both */
    transform: scale(-1, -1);
}
</style>
