<template>
   <ConfirmModal
      :confirm-text="$t('word.confirm')"
      size="medium"
      @confirm="confirmOptionsChange"
      @hide="$emit('close')"
   >
      <template :slot="'header'">
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-eye-plus mr-1" /> {{ $t('message.createNewView') }}
         </div>
      </template>
      <div :slot="'body'">
         <div class="container">
            <div class="columns mb-4">
               <div class="column col-6">
                  <div class="form-group">
                     <label class="form-label">{{ $t('word.name') }}</label>
                     <input
                        ref="firstInput"
                        v-model="localView.name"
                        class="form-input"
                        type="text"
                     >
                  </div>
               </div>
               <div class="column col-6">
                  <div class="form-group">
                     <label class="form-label">{{ $t('word.definer') }}</label>
                     <input
                        v-model="localView.definer"
                        class="form-input"
                        type="text"
                        :placeholder="$t('message.currentUser')"
                        readonly
                     >
                  </div>
               </div>
            </div>
            <div class="columns">
               <div class="column col-4">
                  <div class="form-group">
                     <label class="form-label">{{ $t('message.sqlSecurity') }}</label>
                     <label class="form-radio">
                        <input
                           v-model="localView.security"
                           type="radio"
                           name="security"
                           value="DEFINER"
                        >
                        <i class="form-icon" /> DEFINER
                     </label>
                     <label class="form-radio">
                        <input
                           v-model="localView.security"
                           type="radio"
                           name="security"
                           value="INVOKER"
                        >
                        <i class="form-icon" /> INVOKER
                     </label>
                  </div>
               </div>
               <div class="column col-4">
                  <div class="form-group">
                     <label class="form-label">{{ $t('word.algorithm') }}</label>
                     <label class="form-radio">
                        <input
                           v-model="localView.algorithm"
                           type="radio"
                           name="algorithm"
                           value="UNDEFINED"
                        >
                        <i class="form-icon" /> UNDEFINED
                     </label>
                     <label class="form-radio">
                        <input
                           v-model="localView.algorithm"
                           type="radio"
                           value="MERGE"
                           name="algorithm"
                        >
                        <i class="form-icon" /> MERGE
                     </label>
                     <label class="form-radio">
                        <input
                           v-model="localView.algorithm"
                           type="radio"
                           value="TEMPTABLE"
                           name="algorithm"
                        >
                        <i class="form-icon" /> TEMPTABLE
                     </label>
                  </div>
               </div>
               <div class="column col-4">
                  <div class="form-group">
                     <label class="form-label">{{ $t('message.updateOption') }}</label>
                     <label class="form-radio">
                        <input
                           v-model="localView.updateOption"
                           type="radio"
                           name="update"
                           value=""
                        >
                        <i class="form-icon" /> None
                     </label>
                     <label class="form-radio">
                        <input
                           v-model="localView.updateOption"
                           type="radio"
                           name="update"
                           value="CASCADED"
                        >
                        <i class="form-icon" /> CASCADED
                     </label>
                     <label class="form-radio">
                        <input
                           v-model="localView.updateOption"
                           type="radio"
                           name="update"
                           value="LOCAL"
                        >
                        <i class="form-icon" /> LOCAL
                     </label>
                  </div>
               </div>
            </div>
         </div>
         <div class="workspace-query-results column col-12 mt-2">
            <label class="form-label ml-2">{{ $t('message.selectStatement') }}</label>
            <QueryEditor
               ref="queryEditor"
               :value.sync="localView.sql"
               :workspace="workspace"
               :schema="schema"
               :height="editorHeight"
            />
         </div>
      </div>
   </ConfirmModal>
</template>

<script>
import ConfirmModal from '@/components/BaseConfirmModal';
import QueryEditor from '@/components/QueryEditor';

export default {
   name: 'ModalNewView',
   components: {
      ConfirmModal,
      QueryEditor
   },
   props: {
      table: String,
      workspace: Object
   },
   data () {
      return {
         localView: {
            algorithm: 'UNDEFINED',
            definer: '',
            security: 'DEFINER',
            updateOption: '',
            sql: '',
            name: ''
         },
         isOptionsChanging: false,
         editorHeight: 300
      };
   },
   computed: {
      schema () {
         return this.workspace.breadcrumbs.schema;
      }
   },
   mounted () {
      setTimeout(() => {
         this.$refs.firstInput.focus();
      }, 20);
   },
   methods: {
      confirmOptionsChange () {
         this.$emit('open-create-view-editor', this.localView);
      }
   }
};
</script>
