<template>
   <div class="editor-wrapper">
      <div
         :id="`editor-${id}`"
         class="editor"
         :class="editorClass"
         :style="{height: `${height}px`}"
      />
   </div>
</template>

<script setup lang="ts">
/* eslint-disable simple-import-sort/imports */
import * as ace from 'ace-builds';
import 'ace-builds/webpack-resolver';
/* eslint-enable simple-import-sort/imports */

import { uidGen } from 'common/libs/uidGen';
import { storeToRefs } from 'pinia';
import { onMounted, watch } from 'vue';

import { useSettingsStore } from '@/stores/settings';

const props = defineProps({
   modelValue: String,
   mode: { type: String, default: 'text' },
   editorClass: { type: String, default: '' },
   autoFocus: { type: Boolean, default: false },
   readOnly: { type: Boolean, default: false },
   showLineNumbers: { type: Boolean, default: true },
   height: { type: Number, default: 200 }
});
const emit = defineEmits(['update:modelValue']);
const settingsStore = useSettingsStore();

const {
   editorTheme,
   editorFontSize,
   autoComplete,
   lineWrap
} = storeToRefs(settingsStore);

let editor: ace.Ace.Editor;
const id = uidGen();

watch(() => props.mode, () => {
   if (editor)
      editor.session.setMode(`ace/mode/${props.mode}`);
});

watch(() => props.modelValue, () => {
   if (editor && props.readOnly)
      editor.session.setValue(props.modelValue);
});

watch(editorTheme, () => {
   if (editor)
      editor.setTheme(`ace/theme/${editorTheme.value}`);
});

watch(editorFontSize, () => {
   const sizes = {
      xsmall: '10px',
      small: '12px',
      medium: '14px',
      large: '16px',
      xlarge: '18px',
      xxlarge: '20px'
   };

   if (editor) {
      editor.setOptions({
         fontSize: sizes[editorFontSize.value]
      });
   }
});

watch(autoComplete, () => {
   if (editor) {
      editor.setOptions({
         enableLiveAutocompletion: autoComplete.value
      });
   }
});

watch(lineWrap, () => {
   if (editor) {
      editor.setOptions({
         wrap: lineWrap.value
      });
   }
});

onMounted(() => {
   editor = ace.edit(`editor-${id}`, {
      mode: `ace/mode/${props.mode}`,
      theme: `ace/theme/${editorTheme.value}`,
      value: props.modelValue || '',
      fontSize: 14,
      printMargin: false,
      readOnly: props.readOnly,
      showLineNumbers: props.showLineNumbers,
      showGutter: props.showLineNumbers
   });

   editor.setOptions({
      enableBasicAutocompletion: false,
      wrap: lineWrap,
      enableSnippets: false,
      enableLiveAutocompletion: false
   });

   (editor.session as unknown as ace.Ace.Editor).on('change', () => {
      const content = editor.getValue();
      emit('update:modelValue', content);
   });

   if (props.autoFocus) {
      setTimeout(() => {
         editor.focus();
         editor.resize();
      }, 20);
   }

   editor.commands.removeCommand('showSettingsMenu');

   setTimeout(() => {
      editor.resize();
   }, 20);
});
</script>

<style lang="scss" scoped>
.editor-wrapper {
  .editor {
    width: 100%;
  }
}
</style>
