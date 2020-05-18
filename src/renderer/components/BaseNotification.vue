<template>
   <div class="toast mt-2" :class="notificationStatus.className">
      <span class="p-vcentered text-left" :class="{'expanded': isExpanded}">
         <i class="material-icons mr-1">{{ notificationStatus.iconName }}</i>
         <span class="notification-message">{{ message }}</span>
      </span>
      <i
         v-if="isExpandable"
         class="material-icons c-hand"
         @click="toggleExpand"
      >{{ isExpanded ? 'expand_less' : 'expand_more' }}</i>
      <button class="btn btn-clear ml-2" @click="hideToast" />
   </div>
</template>

<script>
export default {
   name: 'BaseNotification',
   props: {
      message: {
         type: String,
         default: ''
      },
      status: {
         type: String,
         default: ''
      }
   },
   data () {
      return {
         isExpanded: false
      };
   },
   computed: {
      notificationStatus () {
         let className = '';
         let iconName = '';
         switch (this.status) {
            case 'success':
               className = 'toast-success';
               iconName = 'done';
               break;
            case 'error':
               className = 'toast-error';
               iconName = 'error';
               break;
            case 'warning':
               className = 'toast-warning';
               iconName = 'warning';
               break;
            case 'primary':
               className = 'toast-primary';
               iconName = 'info_outline';
               break;
         }

         return { className, iconName };
      },
      isExpandable () {
         return this.message.length > 80;
      }
   },
   methods: {
      hideToast () {
         this.$emit('close');
      },
      toggleExpand () {
         this.isExpanded = !this.isExpanded;
      }
   }
};
</script>
<style scoped>
   .toast{
      display: flex;
      justify-content: space-between;
      user-select: text;
      word-break: break-all;
      width: fit-content;
      margin-left: auto;
   }

   .notification-message{
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: inline-block;
      max-width: 25rem;
      user-select: none;
   }

   .expanded .notification-message{
      white-space: initial;
   }
</style>
