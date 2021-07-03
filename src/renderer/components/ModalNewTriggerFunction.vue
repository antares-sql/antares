<template>
   <ConfirmModal
      :confirm-text="$t('word.confirm')"
      size="400"
      @confirm="confirmNewFunction"
      @hide="$emit('close')"
   >
      <template :slot="'header'">
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-plus mr-1" /> {{ $t('message.createNewFunction') }}
         </div>
      </template>
      <div :slot="'body'">
         <form class="form-horizontal">
            <div class="form-group">
               <label class="form-label col-4">
                  {{ $t('word.name') }}
               </label>
               <div class="column">
                  <input
                     ref="firstInput"
                     v-model="localFunction.name"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div v-if="customizations.languages" class="form-group">
               <label class="form-label col-4">
                  {{ $t('word.language') }}
               </label>
               <div class="column">
                  <select v-model="localFunction.language" class="form-select">
                     <option v-for="language in customizations.triggerFunctionlanguages" :key="language">
                        {{ language }}
                     </option>
                  </select>
               </div>
            </div>
            <div v-if="customizations.definer" class="form-group">
               <label class="form-label col-4">
                  {{ $t('word.definer') }}
               </label>
               <div class="column">
                  <select
                     v-if="workspace.users.length"
                     v-model="localFunction.definer"
                     class="form-select"
                  >
                     <option value="">
                        {{ $t('message.currentUser') }}
                     </option>
                     <option
                        v-for="user in workspace.users"
                        :key="`${user.name}@${user.host}`"
                        :value="`\`${user.name}\`@\`${user.host}\``"
                     >
                        {{ user.name }}@{{ user.host }}
                     </option>
                  </select>
                  <select v-if="!workspace.users.length" class="form-select">
                     <option value="">
                        {{ $t('message.currentUser') }}
                     </option>
                  </select>
               </div>
            </div>
            <div v-if="customizations.comment" class="form-group">
               <label class="form-label col-4">
                  {{ $t('word.comment') }}
               </label>
               <div class="column">
                  <input
                     v-model="localFunction.comment"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
         </form>
      </div>
   </ConfirmModal>
</template>

<script>
import ConfirmModal from '@/components/BaseConfirmModal';

export default {
   name: 'ModalNewTriggerFunction',
   components: {
      ConfirmModal
   },
   props: {
      workspace: Object
   },
   data () {
      return {
         localFunction: {
            definer: '',
            sql: '',
            name: '',
            comment: '',
            language: null
         },
         isOptionsChanging: false
      };
   },
   computed: {
      schema () {
         return this.workspace.breadcrumbs.schema;
      },
      customizations () {
         return this.workspace.customizations;
      }
   },
   mounted () {
      if (this.customizations.triggerFunctionlanguages)
         this.localFunction.language = this.customizations.triggerFunctionlanguages[0];

      if (this.customizations.triggerFunctionSql)
         this.localFunction.sql = this.customizations.triggerFunctionSql;
      setTimeout(() => {
         this.$refs.firstInput.focus();
      }, 20);
   },
   methods: {
      confirmNewFunction () {
         this.$emit('open-create-function-editor', this.localFunction);
      }
   }
};
</script>
