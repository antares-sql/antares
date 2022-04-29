<template>
   <ConfirmModal
      :confirm-text="$t('word.confirm')"
      size="400"
      @confirm="confirmOptionsChange"
      @hide="$emit('hide')"
   >
      <template #header>
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-timer mr-1" />
            <span class="cut-text">{{ $t('word.timing') }} "{{ localOptions.name }}"</span>
         </div>
      </template>
      <template #body>
         <form class="form-horizontal">
            <div class="form-group">
               <label class="form-label col-4">
                  {{ $t('word.execution') }}
               </label>
               <div class="column">
                  <select
                     ref="firstInput"
                     v-model="optionsProxy.execution"
                     class="form-select"
                  >
                     <option>EVERY</option>
                     <option>ONCE</option>
                  </select>
               </div>
            </div>
            <div v-if="optionsProxy.execution === 'EVERY'">
               <div class="form-group">
                  <div class="col-4" />
                  <div class="column">
                     <div class="input-group">
                        <input
                           v-model="optionsProxy.every[0]"
                           class="form-input"
                           type="text"
                           @keypress="isNumberOrMinus($event)"
                        >
                        <select
                           v-model="optionsProxy.every[1]"
                           class="form-select text-uppercase"
                           style="width: 0;"
                        >
                           <option>YEAR</option>
                           <option>QUARTER</option>
                           <option>MONTH</option>
                           <option>WEEK</option>
                           <option>DAY</option>
                           <option>HOUR</option>
                           <option>MINUTE</option>
                           <option>SECOND</option>
                           <option>YEAR_MONTH</option>
                           <option>DAY_HOUR</option>
                           <option>DAY_MINUTE</option>
                           <option>DAY_SECOND</option>
                           <option>HOUR_MINUTE</option>
                           <option>HOUR_SECOND</option>
                           <option>MINUTE_SECOND</option>
                        </select>
                     </div>
                  </div>
               </div>
               <div class="form-group">
                  <label class="form-label col-4">
                     {{ $t('word.starts') }}
                  </label>
                  <div class="column">
                     <div class="input-group">
                        <label class="form-checkbox">
                           <input v-model="hasStart" type="checkbox"><i class="form-icon" />
                        </label>
                        <input
                           v-model="optionsProxy.starts"
                           v-mask="'####-##-## ##:##:##'"
                           type="text"
                           class="form-input"
                        >
                        <span class="input-group-addon p-vcentered">
                           <i class="form-icon mdi mdi-calendar" />
                        </span>
                     </div>
                  </div>
               </div>
               <div class="form-group">
                  <label class="form-label col-4">
                     {{ $t('word.ends') }}
                  </label>
                  <div class="column">
                     <div class="input-group">
                        <label class="form-checkbox">
                           <input v-model="hasEnd" type="checkbox"><i class="form-icon" />
                        </label>
                        <input
                           v-model="optionsProxy.ends"
                           v-mask="'####-##-## ##:##:##'"
                           type="text"
                           class="form-input"
                        >
                        <span class="input-group-addon p-vcentered">
                           <i class="form-icon mdi mdi-calendar" />
                        </span>
                     </div>
                  </div>
               </div>
            </div>
            <div v-else>
               <div class="form-group">
                  <div class="col-4" />
                  <div class="column">
                     <div class="input-group">
                        <input
                           v-model="optionsProxy.at"
                           v-mask="'####-##-## ##:##:##'"
                           type="text"
                           class="form-input"
                        >
                        <span class="input-group-addon p-vcentered">
                           <i class="form-icon mdi mdi-calendar" />
                        </span>
                     </div>
                  </div>
               </div>
            </div>
            <div class="form-group">
               <div class="col-4" />
               <div class="column">
                  <label class="form-checkbox form-inline mt-2">
                     <input v-model="optionsProxy.preserve" type="checkbox"><i class="form-icon" /> {{ $t('message.preserveOnCompletion') }}
                  </label>
               </div>
            </div>
         </form>
      </template>
   </ConfirmModal>
</template>

<script>
import ConfirmModal from '@/components/BaseConfirmModal';
import moment from 'moment';

export default {
   name: 'WorkspaceTabPropsSchedulerTimingModal',
   components: {
      ConfirmModal
   },
   props: {
      localOptions: Object,
      workspace: Object
   },
   emits: ['hide', 'options-update'],
   data () {
      return {
         optionsProxy: {},
         isOptionsChanging: false,
         hasStart: false,
         hasEnd: false
      };
   },
   created () {
      this.optionsProxy = JSON.parse(JSON.stringify(this.localOptions));

      this.hasStart = !!this.optionsProxy.starts;
      this.hasEnd = !!this.optionsProxy.ends;

      if (!this.optionsProxy.at) this.optionsProxy.at = moment().format('YYYY-MM-DD HH:mm:ss');
      if (!this.optionsProxy.starts) this.optionsProxy.starts = moment().format('YYYY-MM-DD HH:mm:ss');
      if (!this.optionsProxy.ends) this.optionsProxy.ends = moment().format('YYYY-MM-DD HH:mm:ss');
      if (!this.optionsProxy.every.length) this.optionsProxy.every = ['1', 'DAY'];

      setTimeout(() => {
         this.$refs.firstInput.focus();
      }, 20);
   },
   methods: {
      confirmOptionsChange () {
         if (!this.hasStart) this.optionsProxy.starts = '';
         if (!this.hasEnd) this.optionsProxy.ends = '';

         this.$emit('options-update', this.optionsProxy);
      },
      isNumberOrMinus (event) {
         if (!/\d/.test(event.key) && event.key !== '-')
            return event.preventDefault();
      }
   }
};
</script>
