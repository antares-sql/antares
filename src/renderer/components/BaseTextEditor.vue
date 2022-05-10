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
import { onMounted, ref, watch } from 'vue';
import * as ace from 'ace-builds';
import 'ace-builds/webpack-resolver';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '@/stores/settings';
import { uidGen } from 'common/libs/uidGen';

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
const mode = ref(props.mode);

const {
   editorTheme,
   editorFontSize,
   autoComplete,
   lineWrap
} = storeToRefs(settingsStore);

let editor: ace.Ace.Editor;
const id = uidGen();

watch(mode, () => {
   if (editor)
      editor.session.setMode(`ace/mode/${props.mode}`);
});

watch(editorTheme, () => {
   if (editor)
      editor.setTheme(`ace/theme/${editorTheme.value}`);
});

watch(editorFontSize, () => {
   const sizes = {
      small: 12,
      medium: 14,
      large: 16
   };

   if (editor) {
      editor.setOptions({
         fontSize: sizes[editorFontSize.value as undefined as 'small' | 'medium' | 'large']
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
      mode: `ace/mode/${mode.value}`,
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

   editor.session.on('changeFold', () => {
      const content = editor.getValue();
      emit('update:modelValue', content);
   });

   if (props.autoFocus) {
      setTimeout(() => {
         editor.focus();
         editor.resize();
      }, 20);
   }

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

.ace_.mdi {
  display: inline-block;
  width: 17px;
}
</style>
