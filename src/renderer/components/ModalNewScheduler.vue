<template>
   <ConfirmModal
      :confirm-text="$t('word.confirm')"
      size="400"
      @confirm="confirmNewTrigger"
      @hide="$emit('close')"
   >
      <template :slot="'header'">
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-plus mr-1" /> {{ $t('message.createNewScheduler') }}
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
                     v-model="localScheduler.name"
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
                     v-model="localScheduler.definer"
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
                     v-model="localScheduler.comment"
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
   name: 'ModalNewScheduler',
   components: {
      ConfirmModal
   },
   props: {
      workspace: Object
   },
   data () {
      return {
         localScheduler: {
            definer: '',
            sql: 'BEGIN\r\n\r\nEND',
            name: '',
            comment: '',
            execution: 'EVERY',
            every: ['1', 'DAY'],
            preserve: true,
            state: 'DISABLE'
         }
      };
   },
   mounted () {
      setTimeout(() => {
         this.$refs.firstInput.focus();
      }, 20);
   },
   methods: {
      confirmNewTrigger () {
         this.$emit('open-create-scheduler-editor', this.localScheduler);
      }
   }
};
</script>
