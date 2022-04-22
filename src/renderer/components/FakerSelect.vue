<template>
   <fieldset class="input-group mb-0">
      <select
         v-model="selectedGroup"
         class="form-select"
         :disabled="!isChecked"
         style="flex-grow: 0;"
         @change="onChange"
      >
         <option value="manual">
            {{ $t('message.manualValue') }}
         </option>
         <option
            v-for="group in fakerGroups"
            :key="group.name"
            :value="group.name"
         >
            {{ $t(`faker.${group.name}`) }}
         </option>
      </select>
      <select
         v-if="selectedGroup !== 'manual'"
         v-model="selectedMethod"
         class="form-select"
         :disabled="!isChecked"
         @change="onChange"
      >
         <option
            v-for="method in fakerMethods"
            :key="method.name"
            :value="method.name"
         >
            {{ $t(`faker.${method.name}`) }}
         </option>
      </select>
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
         :value="selectedValue"
         :message="$t('word.browse')"
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
      <select
         v-else-if="enumArray"
         v-model="selectedValue"
         class="form-select"
         :disabled="!isChecked"
         @change="onChange"
      >
         <option
            v-for="val in enumArray"
            :key="val"
            :value="val"
         >
            {{ val }}
         </option>
      </select>
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

<script>
import { VueMaskDirective } from 'v-mask';
import { TEXT, LONG_TEXT, NUMBER, FLOAT, DATE, TIME, DATETIME, BLOB, BIT } from 'common/fieldTypes';
import BaseUploadInput from '@/components/BaseUploadInput';
import ForeignKeySelect from '@/components/ForeignKeySelect';
import FakerMethods from 'common/FakerMethods';

export default {
   name: 'FakerSelect',
   components: {
      ForeignKeySelect,
      BaseUploadInput
   },
   directives: {
      mask: VueMaskDirective
   },
   props: {
      type: String,
      field: Object,
      isChecked: Boolean,
      foreignKeys: Array,
      keyUsage: Array,
      fieldLength: Number,
      fieldObj: Object
   },
   emits: ['update:value'],
   data () {
      return {
         localType: null,
         selectedGroup: 'manual',
         selectedMethod: '',
         selectedValue: '',
         debounceTimeout: null,
         methodParams: {},
         enumArray: null
      };
   },
   computed: {
      fakerGroups () {
         if ([...TEXT, ...LONG_TEXT].includes(this.type))
            this.localType = 'string';
         else if (NUMBER.includes(this.type))
            this.localType = 'number';
         else if (FLOAT.includes(this.type))
            this.localType = 'float';
         else if ([...DATE, ...DATETIME].includes(this.type))
            this.localType = 'datetime';
         else if (TIME.includes(this.type))
            this.localType = 'time';
         else
            this.localType = 'none';

         return FakerMethods.getGroupsByType(this.localType);
      },
      fakerMethods () {
         return FakerMethods.getMethods({ type: this.localType, group: this.selectedGroup });
      },
      methodData () {
         return this.fakerMethods.find(method => method.name === this.selectedMethod);
      }
   },
   watch: {
      fieldObj () {
         if (this.fieldObj) {
            if (Array.isArray(this.fieldObj.value)) {
               this.enumArray = this.fieldObj.value;
               this.selectedValue = this.fieldObj.value[0];
            }
            else
               this.selectedValue = this.fieldObj.value;
         }
      },
      selectedGroup () {
         if (this.fakerMethods.length)
            this.selectedMethod = this.fakerMethods[0].name;
         else
            this.selectedMethod = '';
      },
      selectedMethod () {
         this.onChange();
      },
      selectedValue () {
         clearTimeout(this.debounceTimeout);
         this.debounceTimeout = null;
         this.debounceTimeout = setTimeout(() => {
            this.onChange();
         }, 200);
      }
   },
   methods: {
      inputProps () {
         if ([...TEXT, ...LONG_TEXT].includes(this.type))
            return { type: 'text', mask: false };

         if ([...NUMBER, ...FLOAT].includes(this.type))
            return { type: 'number', mask: false };

         if (TIME.includes(this.type)) {
            let timeMask = '##:##:##';
            const precision = this.fieldLength;

            for (let i = 0; i < precision; i++)
               timeMask += i === 0 ? '.#' : '#';

            return { type: 'text', mask: timeMask };
         }

         if (DATE.includes(this.type))
            return { type: 'text', mask: '####-##-##' };

         if (DATETIME.includes(this.type)) {
            let datetimeMask = '####-##-## ##:##:##';
            const precision = this.fieldLength;

            for (let i = 0; i < precision; i++)
               datetimeMask += i === 0 ? '.#' : '#';

            return { type: 'text', mask: datetimeMask };
         }

         if (BLOB.includes(this.type))
            return { type: 'file', mask: false };

         if (BIT.includes(this.type))
            return { type: 'text', mask: false };

         return { type: 'text', mask: false };
      },
      getKeyUsage (keyName) {
         return this.keyUsage.find(key => key.field === keyName);
      },
      filesChange (event) {
         const { files } = event.target;
         if (!files.length) return;

         this.selectedValue = files[0].path;
      },
      clearValue () {
         this.selectedValue = '';
      },
      onChange () {
         this.$emit('update:value', {
            group: this.selectedGroup,
            method: this.selectedMethod,
            params: this.methodParams,
            value: this.selectedValue,
            length: this.fieldLength
         });
      }
   }
};
</script>
