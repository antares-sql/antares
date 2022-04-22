<template>
   <div class="modal active modal-sm">
      <a class="modal-overlay" />
      <div class="modal-container p-0">
         <div class="modal-header pl-2">
            <div class="modal-title h6">
               <div class="d-flex">
                  <i class="mdi mdi-24px mdi-key-variant mr-1" /> {{ $t('word.credentials') }}
               </div>
            </div>
            <a class="btn btn-clear c-hand" @click.stop="closeModal" />
         </div>
         <div class="modal-body pb-0">
            <div class="content">
               <form class="form-horizontal">
                  <div class="form-group">
                     <div class="col-3">
                        <label class="form-label">{{ $t('word.user') }}</label>
                     </div>
                     <div class="col-9">
                        <input
                           ref="firstInput"
                           v-model="credentials.user"
                           class="form-input"
                           type="text"
                        >
                     </div>
                  </div>
                  <div class="form-group">
                     <div class="col-3">
                        <label class="form-label">{{ $t('word.password') }}</label>
                     </div>
                     <div class="col-9">
                        <input
                           v-model="credentials.password"
                           class="form-input"
                           type="password"
                        >
                     </div>
                  </div>
               </form>
            </div>
         </div>
         <div class="modal-footer">
            <button class="btn btn-primary mr-2" @click.stop="sendCredentials">
               {{ $t('word.send') }}
            </button>
            <button class="btn btn-link" @click.stop="closeModal">
               {{ $t('word.close') }}
            </button>
         </div>
      </div>
   </div>
</template>

<script>
export default {
   name: 'ModalAskCredentials',
   emits: ['close-asking', 'credentials'],
   data () {
      return {
         credentials: {
            user: '',
            password: ''
         }
      };
   },
   created () {
      setTimeout(() => {
         this.$refs.firstInput.focus();
      }, 20);
   },
   methods: {
      closeModal () {
         this.$emit('close-asking');
      },
      sendCredentials () {
         this.$emit('credentials', this.credentials);
      }
   }
};
</script>
