<template>
   <ConfirmModal
      :confirm-text="$t('word.confirm')"
      size="400"
      @confirm="confirmNewTrigger"
      @hide="$emit('close')"
   >
      <template :slot="'header'">
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-plus mr-1" /> {{ $t('message.createNewTrigger') }}
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
                     v-model="localTrigger.name"
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
                     v-model="localTrigger.definer"
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
                  {{ $t('word.table') }}
               </label>
               <div class="column">
                  <select v-model="localTrigger.table" class="form-select">
                     <option v-for="table in schemaTables" :key="table.name">
                        {{ table.name }}
                     </option>
                  </select>
               </div>
            </div>
            <div class="form-group">
               <label class="form-label col-4">
                  {{ $t('word.event') }}
               </label>
               <div class="column">
                  <div class="input-group">
                     <select v-model="localTrigger.activation" class="form-select">
                        <option>BEFORE</option>
                        <option>AFTER</option>
                     </select>
                     <select v-model="localTrigger.event" class="form-select">
                        <option>INSERT</option>
                        <option>UPDATE</option>
                        <option>DELETE</option>
                     </select>
                  </div>
               </div>
            </div>
         </form>
      </div>
   </ConfirmModal>
</template>

<script>
import ConfirmModal from '@/components/BaseConfirmModal';

export default {
   name: 'ModalNewTrigger',
   components: {
      ConfirmModal
   },
   props: {
      workspace: Object
   },
   data () {
      return {
         localTrigger: {
            definer: '',
            sql: 'BEGIN\r\n\r\nEND',
            name: '',
            table: '',
            activation: 'BEFORE',
            event: 'INSERT'
         },
         isOptionsChanging: false
      };
   },
   computed: {
      schema () {
         return this.workspace.breadcrumbs.schema;
      },
      schemaTables () {
         const schemaTables = this.workspace.structure
            .filter(schema => schema.name === this.schema)
            .map(schema => schema.tables);

         return schemaTables.length ? schemaTables[0].filter(table => table.type === 'table') : [];
      }
   },
   mounted () {
      this.localTrigger.table = this.schemaTables.length ? this.schemaTables[0].name : '';

      setTimeout(() => {
         this.$refs.firstInput.focus();
      }, 20);
   },
   methods: {
      confirmNewTrigger () {
         this.$emit('open-create-trigger-editor', this.localTrigger);
      }
   }
};
</script>
