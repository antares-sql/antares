<template>
   <ConfirmModal
      :confirm-text="$t('word.confirm')"
      size="400"
      @confirm="confirmNewRoutine"
      @hide="$emit('close')"
   >
      <template :slot="'header'">
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-cogs mr-1" /> {{ $t('message.createNewRoutine') }}
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
                     v-model="localRoutine.name"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div class="form-group">
               <label class="form-label col-4">
                  {{ $t('word.definer') }}
               </label>
               <div class="column">
                  <select
                     v-if="workspace.users.length"
                     v-model="localRoutine.definer"
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
            <div class="form-group">
               <label class="form-label col-4">
                  {{ $t('word.comment') }}
               </label>
               <div class="column">
                  <input
                     v-model="localRoutine.comment"
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
                  <select v-model="localRoutine.security" class="form-select">
                     <option>DEFINER</option>
                     <option>INVOKER</option>
                  </select>
               </div>
            </div>
            <div class="form-group">
               <label class="form-label col-4">
                  {{ $t('message.dataAccess') }}
               </label>
               <div class="column">
                  <select v-model="localRoutine.dataAccess" class="form-select">
                     <option>CONTAINS SQL</option>
                     <option>NO SQL</option>
                     <option>READS SQL DATA</option>
                     <option>MODIFIES SQL DATA</option>
                  </select>
               </div>
            </div>
            <div class="form-group">
               <div class="col-4" />
               <div class="column">
                  <label class="form-checkbox form-inline">
                     <input v-model="localRoutine.deterministic" type="checkbox"><i class="form-icon" /> {{ $t('word.deterministic') }}
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
   name: 'ModalNewRoutine',
   components: {
      ConfirmModal
   },
   props: {
      workspace: Object
   },
   data () {
      return {
         localRoutine: {
            definer: '',
            sql: 'BEGIN\r\n\r\nEND',
            parameters: [],
            name: '',
            comment: '',
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
      }
   },
   mounted () {
      setTimeout(() => {
         this.$refs.firstInput.focus();
      }, 20);
   },
   methods: {
      confirmNewRoutine () {
         this.$emit('open-create-routine-editor', this.localRoutine);
      }
   }
};
</script>
