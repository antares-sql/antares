<template>
   <SvgIcon
      :type="type"
      :path="iconPath"
      :size="size"
      :flip="flip"
      :rotate="rotate"
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
</script>
