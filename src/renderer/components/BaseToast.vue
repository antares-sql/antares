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

<script>
export default {
   name: 'BaseToast',
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
         isVisible: false
      };
   },
   computed: {
      toastStatus () {
         let className = '';
         let iconName = '';
         switch (this.status) {
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
      }
   },
   watch: {
      message: function () {
         if (this.message)
            this.isVisible = true;
         else
            this.isVisible = false;
      }
   },
   methods: {
      hideToast () {
         this.isVisible = false;
         this.$emit('close');
      }
   }
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
