<template>
   <ConfirmModal
      :confirm-text="$t('word.confirm')"
      size="400"
      @confirm="confirmOptionsChange"
      @hide="$emit('hide')"
   >
      <template :slot="'header'">
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-cogs mr-1" /> {{ $t('word.options') }} "{{ localOptions.name }}"
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
            <div v-if="customizations.languages" class="form-group">
               <label class="form-label col-4">
                  {{ $t('word.language') }}
               </label>
               <div class="column">
                  <select v-model="optionsProxy.language" class="form-select">
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
                     v-model="optionsProxy.definer"
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
                  {{ $t('word.returns') }}
               </label>
               <div class="column">
                  <div class="input-group">
                     <select
                        v-model="optionsProxy.returns"
                        class="form-select text-uppercase"
                        style="width: 0;"
                     >
                        <option v-if="localOptions.returns === 'VOID'">
                           VOID
                        </option>
                        <optgroup
                           v-for="group in workspace.dataTypes"
                           :key="group.group"
                           :label="group.group"
                        >
                           <option
                              v-for="type in group.types"
                              :key="type.name"
                              :selected="optionsProxy.returns === type.name"
                              :value="type.name"
                           >
                              {{ type.name }}
                           </option>
                        </optgroup>
                     </select>
                     <input
                        v-if="customizations.parametersLength"
                        v-model="optionsProxy.returnsLength"
                        class="form-input"
                        type="number"
                        min="0"
                     >
                  </div>
               </div>
            </div>
            <div v-if="customizations.comment" class="form-group">
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
            <div class="form-group">
               <label class="form-label col-4">
                  {{ $t('message.sqlSecurity') }}
               </label>
               <div class="column">
                  <select v-model="optionsProxy.security" class="form-select">
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
                  <select v-model="optionsProxy.dataAccess" class="form-select">
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
                     <input v-model="optionsProxy.deterministic" type="checkbox"><i class="form-icon" /> {{ $t('word.deterministic') }}
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
   name: 'WorkspacePropsFunctionOptionsModal',
   components: {
      ConfirmModal
   },
   props: {
      localOptions: Object,
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
      },
      customizations () {
         return this.workspace.customizations;
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
