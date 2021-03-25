<template>
   <ConfirmModal
      :confirm-text="$t('word.confirm')"
      size="400"
      @confirm="confirmOptionsChange"
      @hide="$emit('hide')"
   >
      <template :slot="'header'">
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-cogs mr-1" /> {{ $t('word.options') }} "{{ table }}"
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
                     v-model="optionsProxy.name"
                     class="form-input"
                     :class="{'is-error': !isTableNameValid}"
                     type="text"
                  >
               </div>
            </div>
            <div v-if="workspace.customizations.comment" class="form-group">
               <label class="form-label col-4">
                  {{ $t('word.comment') }}
               </label>
               <div class="column">
                  <input
                     v-model="optionsProxy.comment"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div v-if="workspace.customizations.autoIncrement" class="form-group">
               <label class="form-label col-4">
                  {{ $t('word.autoIncrement') }}
               </label>
               <div class="column">
                  <input
                     v-model="optionsProxy.autoIncrement"
                     class="form-input"
                     type="number"
                  >
               </div>
            </div>
            <div v-if="workspace.customizations.collations" class="form-group">
               <label class="form-label col-4">
                  {{ $t('word.collation') }}
               </label>
               <div class="column">
                  <select v-model="optionsProxy.collation" class="form-select">
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
            <div v-if="workspace.customizations.engines" class="form-group">
               <label class="form-label col-4">
                  {{ $t('word.engine') }}
               </label>
               <div class="column">
                  <select v-model="optionsProxy.engine" class="form-select">
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
import ConfirmModal from '@/components/BaseConfirmModal';

export default {
   name: 'WorkspacePropsOptionsModal',
   components: {
      ConfirmModal
   },
   props: {
      localOptions: Object,
      table: String,
      workspace: Object
   },
   data () {
      return {
         optionsProxy: {},
         isOptionsChanging: false
      };
   },
   computed: {
      isTableNameValid () {
         return this.optionsProxy.name !== '';
      }
   },
   created () {
      this.optionsProxy = JSON.parse(JSON.stringify(this.localOptions));

      setTimeout(() => {
         this.$refs.firstInput.focus();
      }, 20);
   },
   methods: {
      confirmOptionsChange () {
         if (!this.isTableNameValid)
            this.optionsProxy.name = this.localOptions.name;

         this.$emit('options-update', this.optionsProxy);
      }
   }
};
</script>
