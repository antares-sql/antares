<template>
   <div
      :style="{display: isVisible ? 'flex' : 'none'}"
      class="toast mt-2"
      :class="toastStatus.className"
   >
      <span class="p-vcentered text-left" v-html="`${toastStatus.iconTag} ${message}`" />
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
         let iconTag = '';
         switch (this.status) {
            case 'success':
               className = 'toast-success';
               iconTag = '<i class="material-icons mr-1">done</i>';
               break;
            case 'error':
               className = 'toast-error';
               iconTag = '<i class="material-icons mr-1">error</i>';
               break;
            case 'warning':
               className = 'toast-warning';
               iconTag = '<i class="material-icons mr-1">warning</i>';
               break;
            case 'primary':
               className = 'toast-primary';
               iconTag = '<i class="material-icons mr-1">info_outline</i>';
               break;
         }

         return { className, iconTag };
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
</style>
