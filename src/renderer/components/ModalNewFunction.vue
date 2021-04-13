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
                     <option v-for="language in customizations.languages" :key="language">
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
            <div class="form-group">
               <label class="form-label col-4">
                  {{ $t('message.sqlSecurity') }}
               </label>
               <div class="column">
                  <select v-model="localFunction.security" class="form-select">
                     <option>DEFINER</option>
                     <option>INVOKER</option>
                  </select>
               </div>
            </div>
            <div v-if="customizations.functionDataAccess" class="form-group">
               <label class="form-label col-4">
                  {{ $t('message.dataAccess') }}
               </label>
               <div class="column">
                  <select v-model="localFunction.dataAccess" class="form-select">
                     <option>CONTAINS SQL</option>
                     <option>NO SQL</option>
                     <option>READS SQL DATA</option>
                     <option>MODIFIES SQL DATA</option>
                  </select>
               </div>
            </div>
            <div v-if="customizations.functionDeterministic" class="form-group">
               <div class="col-4" />
               <div class="column">
                  <label class="form-checkbox form-inline">
                     <input v-model="localFunction.deterministic" type="checkbox"><i class="form-icon" /> {{ $t('word.deterministic') }}
                  </label>
               </div>
            </div>
         </form>
      </div>
   </ConfirmModal>
</template>

<script>
import ConfirmModal from '@/components/BaseConfirmModal';

export default {
   name: 'ModalNewFunction',
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
            parameters: [],
            name: '',
            comment: '',
            language: null,
            returns: null,
            returnsLength: 10,
            security: 'DEFINER',
            deterministic: false,
            dataAccess: 'CONTAINS SQL'
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
      if (this.customizations.languages)
         this.localFunction.language = this.customizations.languages[0];

      if (this.customizations.procedureSql)
         this.localFunction.sql = this.customizations.procedureSql;
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
