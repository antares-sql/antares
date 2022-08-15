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
   const singleKeysToIgnore = ['Dead', 'Backspace', 'ArrotLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
   const specialKeys = ['Control', 'Alt', 'AltGraph', 'Shift', 'Meta', 'CapsLock', 'ContextMenu', 'Escape'];
   const keysFromCode = ['Space', 'Minus', 'Equal', 'Slash', 'Quote', 'Semicolon', 'Comma', 'Period', 'Backslash', 'BracketLeft', 'BracketRight'];

   if (keyboardEvent.value) {
      if (keyboardEvent.value.altKey)
         keys.push('Alt');
      if (keyboardEvent.value.ctrlKey)
         keys.push('Control');
      if (keyboardEvent.value.metaKey && isMacOS)
         keys.push('Command');
      if (keyboardEvent.value.shiftKey && keys.length)
         keys.push('Shift');
      if (keyboardEvent.value.code) {
         if (keys.length === 0 && (keyboardEvent.value.key.length === 1 || singleKeysToIgnore.includes(keyboardEvent.value.key)))
            return t('message.invalidShortcutMessage');
         else if (!specialKeys.includes(keyboardEvent.value.key)) {
            if (keyboardEvent.value.key === 'Dead') {
               keys.push(keyboardEvent.value.code
                  .replace('Digit', '')
                  .replace('Key', '')
                  .replace('Quote', '\'')
                  .replace('Backquote', '`'));
            }
            else if (keysFromCode.includes(keyboardEvent.value.code) || keyboardEvent.value.code.includes('Digit')) {
               keys.push(keyboardEvent.value.code
                  .replace('Quote', '\'')
                  .replace('Semicolon', ';')
                  .replace('Slash', '/')
                  .replace('Backslash', '\\')
                  .replace('BracketLeft', '[')
                  .replace('BracketRight', ']')
                  .replace('Comma', ',')
                  .replace('Period', '.')
                  .replace('Minus', '-')
                  .replace('Equal', '=')
                  .replace('Digit', '')
                  .replace('Key', ''));
            }
            else {
               keys.push(keyboardEvent.value.key.length === 1
                  ? keyboardEvent.value.key.toUpperCase()
                  : keyboardEvent.value.key
                     .replace('Arrow', '')
               );
            }
         }
         else
            return t('message.invalidShortcutMessage');
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
