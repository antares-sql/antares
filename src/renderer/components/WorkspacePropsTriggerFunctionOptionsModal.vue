<template>
   <ConfirmModal
      :confirm-text="$t('word.confirm')"
      size="400"
      @confirm="confirmOptionsChange"
      @hide="$emit('hide')"
   >
      <template :slot="'header'">
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-cogs mr-1" />
            <span class="cut-text">{{ $t('word.options') }} "{{ localOptions.name }}"</span>
         </div>
      </template>
      <div :slot="'body'">
         <form class="form-horizontal">
            <div v-if="customizations.triggerFunctionlanguages" class="form-group">
               <label class="form-label col-4">
                  {{ $t('word.language') }}
               </label>
               <div class="column">
                  <select v-model="optionsProxy.language" class="form-select">
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
         </form>
      </div>
   </ConfirmModal>
</template>

<script>
import ConfirmModal from '@/components/BaseConfirmModal';

export default {
   name: 'WorkspacePropsTriggerFunctionOptionsModal',
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
      },
      isInDataTypes () {
         let typeNames = [];
         for (const group of this.workspace.dataTypes) {
            typeNames = group.types.reduce((acc, curr) => {
               acc.push(curr.name);
               return acc;
            }, []);
         }
         return typeNames.includes(this.localOptions.returns);
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
