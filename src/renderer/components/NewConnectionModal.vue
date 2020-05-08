<template>
   <div class="modal" :class="{'active': isOpened}">
      <a class="modal-overlay c-hand" @click="closeModal" />
      <div class="modal-container">
         <div class="modal-header">
            <a class="btn btn-clear float-right c-hand" @click="closeModal" />
            <div class="modal-title h5">
               Create a new connection
            </div>
         </div>
         <div class="modal-body">
            <div class="content">
               <!-- content here -->
            </div>
         </div>
         <div class="modal-footer">
            ...
         </div>
      </div>
   </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
   name: 'NewConnectionModal',
   props: {
      isOpened: {
         type: Boolean,
         default: false
      }
   },
   data () {
      return {

      };
   },
   methods: {
      ...mapActions({
         closeModal: 'connections/hideNewConnModal'
      })
   }
};
</script>

<style>

</style>
