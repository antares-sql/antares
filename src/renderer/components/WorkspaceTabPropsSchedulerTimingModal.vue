<template>
   <ConfirmModal
      :confirm-text="t('general.confirm')"
      size="400"
      :disable-autofocus="true"
      @confirm="confirmOptionsChange"
      @hide="$emit('hide')"
   >
      <template #header>
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-timer mr-1" />
            <span class="cut-text">{{ t('database.timing') }} "{{ localOptions.name }}"</span>
         </div>
      </template>
      <template #body>
         <form class="form-horizontal">
            <div class="form-group">
               <label class="form-label col-4">
                  {{ t('database.execution') }}
               </label>
               <div class="column">
                  <BaseSelect
                     v-model="optionsProxy.execution"
                     :options="['EVERY', 'ONCE']"
                     class="form-select"
                  />
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
                        <BaseSelect
                           v-model="optionsProxy.every[1]"
                           class="form-select text-uppercase"
                           :options="['YEAR',
                                      'QUARTER',
                                      'MONTH',
                                      'WEEK',
                                      'DAY',
                                      'HOUR',
                                      'MINUTE',
                                      'SECOND',
                                      'YEAR_MONTH',
                                      'DAY_HOUR',
                                      'DAY_MINUTE',
                                      'DAY_SECOND',
                                      'HOUR_MINUTE',
                                      'HOUR_SECOND',
                                      'MINUTE_SECOND']"
                           style="width: 0;"
                        />
                     </div>
                  </div>
               </div>
               <div class="form-group">
                  <label class="form-label col-4">
                     {{ t('database.starts') }}
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
                     {{ t('database.ends') }}
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
                     <input v-model="optionsProxy.preserve" type="checkbox"><i class="form-icon" /> {{ t('database.preserveOnCompletion') }}
                  </label>
               </div>
            </div>
         </form>
      </template>
   </ConfirmModal>
</template>

<script setup lang="ts">
import { Ref, ref } from 'vue';
import * as moment from 'moment';
import { useI18n } from 'vue-i18n';
import ConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import { EventInfos } from 'common/interfaces/antares';

const { t } = useI18n();

const props = defineProps({
   localOptions: Object,
   workspace: Object
});

const emit = defineEmits(['hide', 'options-update']);

const optionsProxy: Ref<EventInfos> = ref({} as EventInfos);
const hasStart = ref(false);
const hasEnd = ref(false);

const confirmOptionsChange = () => {
   if (!hasStart.value) optionsProxy.value.starts = '';
   if (!hasEnd.value) optionsProxy.value.ends = '';

   emit('options-update', optionsProxy.value);
};

const isNumberOrMinus = (event: KeyboardEvent) => {
   if (!/\d/.test(event.key) && event.key !== '-')
      return event.preventDefault();
};

optionsProxy.value = JSON.parse(JSON.stringify(props.localOptions));

hasStart.value = !!optionsProxy.value.starts;
hasEnd.value = !!optionsProxy.value.ends;

if (!optionsProxy.value.at) optionsProxy.value.at = moment().format('YYYY-MM-DD HH:mm:ss');
if (!optionsProxy.value.starts) optionsProxy.value.starts = moment().format('YYYY-MM-DD HH:mm:ss');
if (!optionsProxy.value.ends) optionsProxy.value.ends = moment().format('YYYY-MM-DD HH:mm:ss');
if (!optionsProxy.value.every.length) optionsProxy.value.every = ['1', 'DAY'];

</script>
