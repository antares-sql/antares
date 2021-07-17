<template>
   <div class="modal active">
      <a class="modal-overlay c-hand" @click="closeModal" />
      <div class="modal-container">
         <div class="modal-header pl-2">
            <div class="modal-title h6">
               <div class="d-flex">
                  <i class="mdi mdi-24px mdi-server mr-1" /> {{ $t('message.exportTable') }}
               </div>
            </div>
            <a class="btn btn-clear c-hand" @click="closeModal" />
         </div>
         <div class="modal-body p-0">
            <div class="panel">
               <div class="panel-nav">
                  <ul class="tab tab-block">
                     <li
                        class="tab-item c-hand"
                        :class="{'active': selectedTab === 'sql'}"
                        @click="selectTab('sql')"
                     >
                        <a class="tab-link">{{ $t('word.sql') }}</a>
                     </li>
                     <li
                        class="tab-item c-hand"
                        :class="{'active': selectedTab === 'csv'}"
                        @click="selectTab('csv')"
                     >
                        <a class="tab-link">{{ $t('word.csv') }}</a>
                     </li>
                     <li
                        class="tab-item"
                        :class="{'active': selectedTab === 'json'}"
                        @click="selectTab('json')"
                     >
                        <a class="c-hand">{{ $t('word.json') }}</a>
                     </li>
                  </ul>
               </div>
               <div v-if="selectedTab === 'sql'" class="panel-body py-0">
                  <div class="container">
                     <form class="form-horizontal">
                        
                     </form>
                  </div>
                  <BaseToast
                     class="mb-2"
                     :message="toast.message"
                     :status="toast.status"
                  />
               </div>
               <div v-if="selectedTab === 'csv'" class="panel-body py-0">
                  <div class="container">
                     <form class="form-horizontal">
                        
                     </form>
                  </div>
                  <BaseToast
                     class="mb-2"
                     :message="toast.message"
                     :status="toast.status"
                  />
               </div>
               <div v-if="selectedTab === 'json'" class="panel-body py-0">
                  <div class="container">
                     <form class="form-horizontal">
                        
                     </form>
                  </div>
                  <BaseToast
                     class="mb-2"
                     :message="toast.message"
                     :status="toast.status"
                  />
               </div>
               <div class="modal-footer text-light">
                  <button class="btn btn-primary mr-2" @click="exportTable">
                     {{ $t('word.export') }}
                  </button>
                  <button class="btn btn-link" @click="closeModal">
                     {{ $t('word.close') }}
                  </button>
               </div>
            </div>
         </div>
      </div>
   </div>
</template>

<script>
import { mapActions } from 'vuex';
import customizations from 'common/customizations';
import ModalAskCredentials from '@/components/ModalAskCredentials';
import BaseToast from '@/components/BaseToast';
import BaseUploadInput from '@/components/BaseUploadInput';

export default {
   name: 'ModalExport',
   components: {
      ModalAskCredentials,
      BaseToast,
      BaseUploadInput
   },
   props: {
      connection: Object,
      schema: String,
      table: String,
   },
   data () {
      return {
         toast: {
            status: '',
            message: ''
         },
         selectedTab: 'sql'
      };
   },
   computed: {
      customizations () {
         return customizations[this.connection.client];
      }
   },
   created () {
      window.addEventListener('keydown', this.onKey);
   },
   beforeDestroy () {
      window.removeEventListener('keydown', this.onKey);
   },
   methods: {
      ...mapActions({
         export: 'connections/export'
      }),
      exportTable () {
        console.log(this);
        console.log(this.table);
        console.log(this.schema);
        //this.export(this);
        //this.closeModal();
      },
      closeModal () {
         this.$emit('close');
      },
      onKey (e) {
         e.stopPropagation();
         if (e.key === 'Escape')
            this.closeModal();
      },
      selectTab (tab) {
         this.selectedTab = tab;
      },
   }
};
</script>

<style scoped>
  .modal-container {
    position: absolute;
    max-width: 450px;
    top: 17.5vh;
  }
</style>
