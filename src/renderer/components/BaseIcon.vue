<template>
   <SvgIcon
      v-if="type === 'mdi'"
      :type="type"
      :path="iconPath"
      :size="size"
      :rotate="rotate"
      :class="iconFlip"
   />
   <svg
      v-else
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
      v-html="iconPath"
   />
</template>

<script setup lang="ts">
import SvgIcon from '@jamescoyle/vue-icon';
import * as Icons from '@mdi/js';
import { computed, PropType } from 'vue';

import { useConnectionsStore } from '@/stores/connections';

const { getIconByUid } = useConnectionsStore();

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
      type: String as PropType<'mdi' | 'custom'>,
      default: () => 'mdi'
   },
   flip: {
      type: String as PropType<'horizontal' | 'vertical' | 'both' | null>,
      default: () => null
   },
   rotate: {
      type: Number as PropType<number | null>,
      default: () => null
   }
});

const iconPath = computed(() => {
   if (props.type === 'mdi')
      return (Icons as {[k:string]: string})[props.iconName];
   else if (props.type === 'custom') {
      const base64 = getIconByUid(props.iconName)?.base64;
      const svgString = Buffer
         .from(base64, 'base64')
         .toString('utf-8');

      return svgString;
   }
   return null;
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
    transform: scale(-1, -1);
}
</style>
