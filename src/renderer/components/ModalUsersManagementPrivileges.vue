<template>
   <div class="privileges-grid">
      <div class="privileges-toolbar mb-2">
         <input
            v-if="searchable"
            v-model="searchTerm"
            class="form-input input-sm mr-2"
            type="search"
            :placeholder="t('general.search')"
         >
         <button
            class="btn btn-dark btn-sm mr-1"
            :disabled="disabled"
            :title="t('users.checkAll')"
            @click="checkAll"
         >
            <BaseIcon icon-name="checkbox-checked" :size="15" />
         </button>
         <button
            class="btn btn-dark btn-sm"
            :disabled="disabled"
            :title="t('users.uncheckAll')"
            @click="uncheckAll"
         >
            <BaseIcon icon-name="checkbox" :size="15" />
         </button>
         <small class="ml-2 text-gray">{{ modelValue.length }}/{{ privileges.length }}</small>
      </div>
      <div class="privileges-items">
         <label
            v-for="privilege in visiblePrivileges"
            :key="privilege"
            class="form-checkbox m-0"
            :title="privilege"
         >
            <input
               type="checkbox"
               :checked="modelValue.includes(privilege)"
               :disabled="disabled"
               @change="toggle(privilege)"
            >
            <i class="form-icon" />
            <span class="cut-text">{{ privilege }}</span>
         </label>
      </div>
   </div>
</template>

<script setup lang="ts">
import { computed, PropType, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';

const { t } = useI18n();

const props = defineProps({
   privileges: { type: Array as PropType<string[]>, required: true },
   modelValue: { type: Array as PropType<string[]>, required: true },
   disabled: { type: Boolean, default: false },
   searchable: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

const searchTerm = ref('');

const visiblePrivileges = computed(() => {
   const term = searchTerm.value.toLowerCase();
   return term ? props.privileges.filter(privilege => privilege.toLowerCase().includes(term)) : props.privileges;
});

const toggle = (privilege: string) => {
   emit('update:modelValue', props.modelValue.includes(privilege)
      ? props.modelValue.filter(p => p !== privilege)
      : [...props.modelValue, privilege]);
};

// Act on the visible items only, keeping values that are not listed (e.g. privileges the UI doesn't know)
const checkAll = () => emit('update:modelValue', [...new Set([...props.modelValue, ...visiblePrivileges.value])]);
const uncheckAll = () => emit('update:modelValue', props.modelValue.filter(p => !visiblePrivileges.value.includes(p)));
</script>

<style lang="scss" scoped>
.privileges-toolbar {
  display: flex;
  align-items: center;

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .form-input {
    max-width: 220px;
  }
}

.privileges-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.2rem 0.8rem;

  .form-checkbox {
    display: flex;
    font-size: 0.7rem;
    min-width: 0;
  }
}
</style>
