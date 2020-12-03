<template>
   <ConfirmModal
      :confirm-text="$t('word.confirm')"
      size="400"
      @confirm="confirmOptionsChange"
      @hide="$emit('close')"
   >
      <template :slot="'header'">
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-table-plus mr-1" /> {{ $t('message.createNewTable') }}
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
                     v-model="localOptions.name"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div class="form-group">
               <label class="form-label col-4">
                  {{ $t('word.comment') }}
               </label>
               <div class="column">
                  <input
                     v-model="localOptions.comment"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div class="form-group">
               <label class="form-label col-4">
                  {{ $t('word.collation') }}
               </label>
               <div class="column">
                  <select v-model="localOptions.collation" class="form-select">
                     <option
                        v-for="collation in workspace.collations"
                        :key="collation.id"
                        :value="collation.collation"
                     >
                        {{ collation.collation }}
                     </option>
                  </select>
               </div>
            </div>
            <div class="form-group">
               <label class="form-label col-4">
                  {{ $t('word.engine') }}
               </label>
               <div class="column">
                  <select v-model="localOptions.engine" class="form-select">
                     <option
                        v-for="engine in workspace.engines"
                        :key="engine.name"
                        :value="engine.name"
                     >
                        {{ engine.name }}
                     </option>
                  </select>
               </div>
            </div>
         </form>
      </div>
   </ConfirmModal>
</template>

<script>
import { mapGetters } from 'vuex';
import ConfirmModal from '@/components/BaseConfirmModal';

export default {
   name: 'ModalNewTable',
   components: {
      ConfirmModal
   },
   props: {
      table: String,
      workspace: Object
   },
   data () {
      return {
         localOptions: {
            name: '',
            comment: '',
            collation: '',
            engine: ''
         },
         isOptionsChanging: false
      };
   },
   computed: {
      ...mapGetters({
         selectedWorkspace: 'workspaces/getSelected',
         getDatabaseVariable: 'workspaces/getDatabaseVariable'
      }),
      defaultCollation () {
         return this.getDatabaseVariable(this.selectedWorkspace, 'collation_server').value || '';
      },
      defaultEngine () {
         return this.workspace.engines.find(engine => engine.isDefault).name;
      }
   },
   mounted () {
      this.localOptions.collation = this.defaultCollation;
      this.localOptions.engine = this.defaultEngine;
   },
   methods: {
      confirmOptionsChange () {
         this.$emit('open-create-table-editor', this.localOptions);
      }
   }
};
</script>
