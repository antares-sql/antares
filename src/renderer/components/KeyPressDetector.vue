<template>
   <div class="form-group has-icon-right p-2 m-0">
      <input
         class="form-input"
         type="text"
         :value="pressedKeys"
         readonly
         :placeholder="t('message.registerAShortcut')"
         @focus="isFocus = true"
         @blur="isFocus = false"
         @keydown.prevent.stop="onKey"
      >
      <i class="form-icon mdi mdi-keyboard-outline mdi-24px" />
   </div>
</template>
<script setup lang="ts">
import { computed, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Application from '@/ipc-api/Application';

const { t } = useI18n();

const emit = defineEmits(['update:modelValue']);

const isMacOS = process.platform === 'darwin';

defineProps({
   modelValue: String
});

const isFocus = ref(false);
const keyboardEvent: Ref<KeyboardEvent> = ref(null);

const pressedKeys = computed(() => {
   const keys: string[] = [];

   if (keyboardEvent.value) {
      if (keyboardEvent.value.altKey)
         keys.push('Alt');
      if (keyboardEvent.value.ctrlKey)
         keys.push('Control');
      if (keyboardEvent.value.metaKey && isMacOS)
         keys.push('Meta');
      if (keyboardEvent.value.shiftKey)
         keys.push('Shift');
      if (keyboardEvent.value.code) {
         if (!['Control', 'Alt', 'AltGraph', 'Shift', 'Meta', 'CapsLock', 'ContextMenu'].includes(keyboardEvent.value.key))
            keys.push(keyboardEvent.value.code.replace('Digit', '').replace('Key', ''));
      }
   }

   return keys.join('+');
});

const onKey = (e: KeyboardEvent) => {
   e.stopPropagation();
   e.preventDefault();
   keyboardEvent.value = e;
};

watch(pressedKeys, () => {
   emit('update:modelValue', pressedKeys.value);
});

watch(isFocus, (val) => {
   if (val)
      Application.unregisterShortcuts();
   else
      Application.reloadShortcuts();
});
</script>
<style lang="scss" scoped>
.has-icon-right {
   .form-input {
      padding-right: 1.4rem;
   }
   .form-icon {
      right: 0.8rem;
   }
}
</style>
