<template>
   <fieldset class="input-group mb-0">
      <BaseSelect
         v-model="selectedGroup"
         class="form-select"
         :options="[{name: 'manual'}, ...fakerGroups]"
         :option-label="(opt: any) => opt.name === 'manual' ? t('general.manualValue') : t(`faker.${opt.name}`)"
         option-track-by="name"
         :disabled="!isChecked"
         :style="'flex-grow: 0;'"
         @change="onChange"
      />

      <BaseSelect
         v-if="selectedGroup !== 'manual'"
         v-model="selectedMethod"
         :options="fakerMethods"
         :option-label="(opt: any) => t(`faker.${opt.name}`)"
         option-track-by="name"
         class="form-select"
         :disabled="!isChecked"
         @change="onChange"
      />
      <ForeignKeySelect
         v-else-if="foreignKeys.includes(field.name)"
         ref="formInput"
         v-model="selectedValue"
         class="form-select"
         :key-usage="getKeyUsage(field.name)"
         :disabled="!isChecked"
      />
      <input
         v-else-if="inputProps().mask"
         ref="formInput"
         v-model="selectedValue"
         v-mask="inputProps().mask"
         class="form-input"
         :type="inputProps().type"
         :disabled="!isChecked"
      >
      <BaseUploadInput
         v-else-if="inputProps().type === 'file'"
         :model-value="selectedValue"
         :message="t('general.browse')"
         @clear="clearValue"
         @change="filesChange($event)"
      />
      <input
         v-else-if="inputProps().type === 'number'"
         ref="formInput"
         v-model="selectedValue"
         class="form-input"
         step="any"
         :type="inputProps().type"
         :disabled="!isChecked"
      >
      <BaseSelect
         v-else-if="enumArray"
         v-model="selectedValue"
         :options="enumArray"
         class="form-select"
         :disabled="!isChecked"
         @change="onChange"
      />
      <input
         v-else
         ref="formInput"
         v-model="selectedValue"
         class="form-input"
         :type="inputProps().type"
         :disabled="!isChecked"
      >
      <template v-if="methodData && 'params' in methodData">
         <input
            v-for="(option, key) in methodData.params"
            :key="key"
            v-model="methodParams[option]"
            class="form-input column"
            :type="inputProps().type"
            :disabled="!isChecked"
            :placeholder="option"
         >
      </template>
      <slot />
   </fieldset>
</template>

<script setup lang="ts">
import FakerMethods from 'common/FakerMethods';
import { BIT, BLOB, DATE, DATETIME, FLOAT, IS_BIGINT, LONG_TEXT, NUMBER, TEXT, TIME, UUID } from 'common/fieldTypes';
import { computed, PropType, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseSelect from '@/components/BaseSelect.vue';
import BaseUploadInput from '@/components/BaseUploadInput.vue';
import ForeignKeySelect from '@/components/ForeignKeySelect.vue';

const { t } = useI18n();

const props = defineProps({
   type: String,
   field: Object,
   isChecked: Boolean,
   foreignKeys: Array,
   keyUsage: Array as PropType<{field: string}[]>,
   fieldLength: Number,
   fieldObj: Object
});
const emit = defineEmits(['update:modelValue']);

const localType: Ref<string> = ref(null);
const selectedGroup: Ref<string> = ref('manual');
const selectedMethod: Ref<string> = ref('');
const selectedValue: Ref<string> = ref('');
const debounceTimeout: Ref<NodeJS.Timeout> = ref(null);
const methodParams: Ref<Record<string, string>> = ref({});
const enumArray: Ref<string[]> = ref(null);

const fakerGroups = computed(() => {
   if ([...TEXT, ...LONG_TEXT].includes(props.type))
      localType.value = 'string';
   else if (NUMBER.includes(props.type))
      localType.value = 'number';
   else if (FLOAT.includes(props.type))
      localType.value = 'float';
   else if ([...DATE, ...DATETIME].includes(props.type))
      localType.value = 'datetime';
   else if (TIME.includes(props.type))
      localType.value = 'time';
   else if (UUID.includes(props.type) || (BLOB.includes(props.type) && props.field.key === 'pri'))
      localType.value = 'uuid';
   else
      localType.value = 'none';

   return FakerMethods.getGroupsByType(localType.value);
});

const fakerMethods = computed(() => {
   return FakerMethods.getMethods({ type: localType.value, group: selectedGroup.value });
});

const methodData = computed(() => {
   return fakerMethods.value.find(method => method.name === selectedMethod.value);
});

const inputProps = () => {
   if ([...TEXT, ...LONG_TEXT].includes(props.type))
      return { type: 'text', mask: false };

   if ([...NUMBER, ...FLOAT].includes(props.type)) {
      if (IS_BIGINT.includes(props.type))
         return { type: 'text', mask: false };
      else
         return { type: 'number', mask: false };
   }

   if (TIME.includes(props.type)) {
      let timeMask = '##:##:##';
      const precision = props.fieldLength;

      for (let i = 0; i < precision; i++)
         timeMask += i === 0 ? '.#' : '#';

      return { type: 'text', mask: timeMask };
   }

   if (DATE.includes(props.type))
      return { type: 'text', mask: '####-##-##' };

   if (DATETIME.includes(props.type)) {
      let datetimeMask = '####-##-## ##:##:##';
      const precision = props.fieldLength;

      for (let i = 0; i < precision; i++)
         datetimeMask += i === 0 ? '.#' : '#';

      return { type: 'text', mask: datetimeMask };
   }

   if (BLOB.includes(props.type) && props.field.key !== 'pri')
      return { type: 'file', mask: false };

   if (BIT.includes(props.type))
      return { type: 'text', mask: false };

   return { type: 'text', mask: false };
};

const getKeyUsage = (keyName: string) => {
   return props.keyUsage.find(key => key.field === keyName);
};

const filesChange = ({ target } : {target: HTMLInputElement }) => {
   const { files } = target;
   if (!files.length) return;

   selectedValue.value = files[0].path;
};

const clearValue = () => {
   selectedValue.value = '';
};

const onChange = () => {
   emit('update:modelValue', {
      group: selectedGroup.value,
      method: selectedMethod.value,
      params: methodParams.value,
      value: selectedValue.value,
      length: props.fieldLength
   });
};

watch(() => props.fieldObj, () => {
   if (props.fieldObj) {
      if (Array.isArray(props.fieldObj.value)) {
         enumArray.value = props.fieldObj.value;
         selectedValue.value = props.fieldObj.value[0];
      }
      else
         selectedValue.value = props.fieldObj.value;
   }
});

watch(selectedGroup, () => {
   if (fakerMethods.value.length)
      selectedMethod.value = fakerMethods.value[0].name;
   else
      selectedMethod.value = '';
});

watch(selectedMethod, () => {
   onChange();
});

watch(selectedValue, () => {
   clearTimeout(debounceTimeout.value);
   debounceTimeout.value = null;
   debounceTimeout.value = setTimeout(() => {
      onChange();
   }, 200);
});
</script>
