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
            <div v-if="customizations.definer" class="form-group">
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
                     <select
                        v-if="!customizations.triggerMultipleEvents"
                        v-model="localTrigger.event"
                        class="form-select"
                     >
                        <option v-for="event in Object.keys(localEvents)" :key="event">
                           {{ event }}
                        </option>
                     </select>
                     <div v-if="customizations.triggerMultipleEvents" class="px-4">
                        <label
                           v-for="event in Object.keys(localEvents)"
                           :key="event"
                           class="form-checkbox form-inline"
                           @change.prevent="changeEvents(event)"
                        >
                           <input :checked="localEvents[event]" type="checkbox"><i class="form-icon" /> {{ event }}
                        </label>
                     </div>
                  </div>
               </div>
            </div>
         </form>
         <div v-if="customizations.triggerStatementInCreation" class="workspace-query-results column col-12 mt-2">
            <label class="form-label ml-2">{{ $t('message.triggerStatement') }}</label>
            <QueryEditor
               ref="queryEditor"
               :value.sync="localTrigger.sql"
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
   name: 'ModalNewTrigger',
   components: {
      ConfirmModal,
      QueryEditor
   },
   props: {
      workspace: Object
   },
   data () {
      return {
         localTrigger: {
            definer: '',
            sql: '',
            name: '',
            table: '',
            activation: 'BEFORE',
            event: 'INSERT'
         },
         isOptionsChanging: false,
         localEvents: { INSERT: false, UPDATE: false, DELETE: false },
         editorHeight: 150
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
      },
      customizations () {
         return this.workspace.customizations;
      }
   },
   created () {
      this.localTrigger.table = this.schemaTables.length ? this.schemaTables[0].name : '';
      this.localTrigger.sql = this.customizations.triggerSql;
   },
   mounted () {
      setTimeout(() => {
         this.$refs.firstInput.focus();
      }, 20);
   },
   methods: {
      confirmNewTrigger () {
         this.$emit('open-create-trigger-editor', this.localTrigger);
      },
      changeEvents (event) {
         if (this.customizations.triggerMultipleEvents) {
            this.localEvents[event] = !this.localEvents[event];
            this.localTrigger.event = [];
            for (const key in this.localEvents) {
               if (this.localEvents[key])
                  this.localTrigger.event.push(key);
            }
         }
      }
   }
};
</script>
