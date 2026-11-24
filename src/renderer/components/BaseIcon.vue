<template>
   <svg
      v-if="type === 'custom'"
      :width="remSize"
      :height="remSize"
      :viewBox="`0 0 ${size} ${size}`"
      v-html="customSvg"
   />
   <svg
      v-else
      class="antares-icon"
      :class="iconFlip"
      viewBox="0 0 24 24"
      :width="remSize"
      :height="remSize"
      :style="rotate ? { rotate: `${rotate}deg` } : null"
      aria-hidden="true"
      v-html="markup"
   />
</template>

<script setup lang="ts">
import { computed, PropType, useId } from 'vue';

import { iconContent } from '@/libs/icons';
import { useConnectionsStore } from '@/stores/connections';
import { uiFontSizes } from '@/stores/settings';

const { getIconByUid } = useConnectionsStore();

const props = defineProps({
   /** Antares icon name (`table`, `table+cog`, `brand:docker`, …) or the uid of a custom icon */
   iconName: {
      type: String,
      required: true
   },
   size: {
      type: Number,
      default: 48
   },
   type: {
      type: String as PropType<'icon' | 'custom'>,
      default: () => 'icon'
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

/** `size` is in px at the default text size: in rem the icon follows the interface text size */
const remSize = computed(() => `${props.size / uiFontSizes.medium}rem`);

// The badge mask lives inside each icon, with ids unique to this instance
const maskPrefix = `${useId()}-icon-`;
const markup = computed(() => iconContent(props.iconName, maskPrefix));

const customSvg = computed(() => {
   if (props.type !== 'custom') return null;
   const base64 = getIconByUid(props.iconName)?.base64;
   if (!base64) return null;
   return Buffer.from(base64, 'base64').toString('utf-8');
});

const iconFlip = computed(() => {
   if (['horizontal', 'vertical', 'both'].includes(props.flip))
      return `flip-${props.flip}`;
   else return '';
});
</script>
