<template>
   <div
      :style="{display: isVisible ? 'flex' : 'none'}"
      class="toast mt-2"
      :class="toastStatus.className"
   >
      <span class="p-vcentered text-left"><i class="mdi mdi-24px mr-1" :class="toastStatus.iconName" /> {{ message }}</span>
      <button class="btn btn-clear" @click="hideToast" />
   </div>
</template>

<script setup lang="ts">
import { computed } from '@vue/reactivity';
import { ref, watch } from 'vue';

const props = defineProps({
   message: {
      type: String,
      default: ''
   },
   status: {
      type: String,
      default: ''
   }
});

const isVisible = ref(false);
const message = ref(props.message);

const emit = defineEmits(['close']);

const toastStatus = computed(() => {
   let className = '';
   let iconName = '';
   switch (props.status) {
      case 'success':
         className = 'toast-success';
         iconName = 'mdi-check';
         break;
      case 'error':
         className = 'toast-error';
         iconName = 'mdi-alert-rhombus';
         break;
      case 'warning':
         className = 'toast-warning';
         iconName = 'mdi-alert';
         break;
      case 'primary':
         className = 'toast-primary';
         iconName = 'mdi-information-outline';
         break;
   }

   return { className, iconName };
});

watch(message, () => {
   if (message.value)
      isVisible.value = true;
   else
      isVisible.value = false;
});

const hideToast = () => {
   isVisible.value = false;
   emit('close');
};
</script>

<style scoped>
  .toast {
    display: flex;
    justify-content: space-between;
    user-select: text;
    word-break: break-all;
  }
</style>
