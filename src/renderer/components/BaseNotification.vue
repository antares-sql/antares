<template>
   <div class="toast mt-2" :class="notificationStatus.className">
      <span class="p-vcentered text-left">
         <i class="material-icons mr-1">{{ notificationStatus.iconName }}</i>
         <span class="notification-message">{{ message }}</span>
      </span>
      <button class="btn btn-clear" @click="hideToast" />
   </div>
</template>

<script>
export default { // TODO: open notifications button
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
      }
   },
   methods: {
      hideToast () {
         this.$emit('close');
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
   }

   .notification-message{
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: inline-block;
      width: 25rem;
      user-select: none;
   }
</style>
