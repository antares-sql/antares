<template>
   <div class="toast mt-2" :class="notificationStatus.className">
      <span class="p-vcentered text-left" :class="{'expanded': isExpanded}">
         <BaseIcon
            :icon-name="notificationStatus.iconName"
            class="mr-2"
            :size="24"
         />
         <span class="notification-message">{{ message }}</span>
      </span>
      <BaseIcon
         v-if="isExpandable"
         :icon-name="isExpanded ? 'mdiChevronUp' : 'mdiChevronDown'"
         class=" c-hand expand-btn"
         :size="24"
         @click="toggleExpand"
      />
      <button class="btn btn-clear ml-2" @click="hideToast" />
   </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import BaseIcon from '@/components/BaseIcon.vue';

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
const isExpanded = ref(false);
const emit = defineEmits(['close']);

const notificationStatus = computed(() => {
   let className = '';
   let iconName = '';
   switch (props.status) {
      case 'success':
         className = 'toast-success';
         iconName = 'mdiCheck';
         break;
      case 'error':
         className = 'toast-error';
         iconName = 'mdiAlertRhombus';
         break;
      case 'warning':
         className = 'toast-warning';
         iconName = 'mdiAlert';
         break;
      case 'primary':
         className = 'toast-primary';
         iconName = 'mdiInformationOutline';
         break;
   }

   return { className, iconName };
});

const isExpandable = computed(() => props.message.length > 80);

const hideToast = () => {
   emit('close');
};

const toggleExpand = () => {
   isExpanded.value = !isExpanded.value;
};
</script>

<style scoped>
  .toast {
    display: flex;
    justify-content: space-between;
    user-select: text;
    word-break: break-all;
    width: fit-content;
    margin-left: auto;
  }

  .notification-message {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
    max-width: 30rem;
  }

  .expand-btn {
    align-items: initial;
  }

  .expanded .notification-message {
    white-space: initial;
  }
</style>
