<template>
   <div class="editor-wrapper">
      <div
         ref="editorEl"
         class="editor"
         :class="editorClass"
         :style="{
            height: `${height}px`,
            width: width ? `${width}px` : null,
            resize: resizable ? 'both' : 'none'
         }"
      />
   </div>
</template>

<script setup lang="ts">
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { storeToRefs } from 'pinia';
import { onBeforeUnmount, onMounted, PropType, Ref, ref, watch } from 'vue';

import { loadLanguage } from '@/libs/editor/languages';
import { baseSetup } from '@/libs/editor/setup';
import { buildEditorTheme, buildFontTheme, getEditorTheme } from '@/libs/editor/themes';
import { useSettingsStore } from '@/stores/settings';

const props = defineProps({
   modelValue: String,
   mode: { type: String, default: 'text' },
   editorClass: { type: String, default: '' },
   resizable: { type: Boolean, default: false },
   autoFocus: { type: Boolean, default: false },
   readOnly: { type: Boolean, default: false },
   showLineNumbers: { type: Boolean, default: true },
   height: { type: Number, default: 200 },
   width: { type: [Number, Boolean] as PropType<number|false>, default: false }
});
const emit = defineEmits(['update:modelValue']);
const settingsStore = useSettingsStore();

const {
   editorTheme,
   editorFontSize,
   lineWrap
} = storeToRefs(settingsStore);

const editorEl: Ref<HTMLDivElement> = ref(null);
// Not reactive: a Vue proxy around the view breaks CodeMirror
let view: EditorView = null;

const language = new Compartment();
const theme = new Compartment();
const fontSize = new Compartment();
const wrap = new Compartment();
const readOnly = new Compartment();

const setLanguage = async () => {
   const mode = props.mode;
   const extension = await loadLanguage(mode);
   if (view && mode === props.mode)
      view.dispatch({ effects: language.reconfigure(extension) });
};

watch(() => props.mode, setLanguage);

watch(() => props.modelValue, value => {
   value = value ?? '';
   if (view && value !== view.state.doc.toString())
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
});

watch(editorTheme, () => {
   view?.dispatch({ effects: theme.reconfigure(buildEditorTheme(getEditorTheme(editorTheme.value))) });
});

watch(editorFontSize, () => {
   view?.dispatch({ effects: fontSize.reconfigure(buildFontTheme(editorFontSize.value)) });
});

watch(lineWrap, () => {
   view?.dispatch({ effects: wrap.reconfigure(lineWrap.value ? EditorView.lineWrapping : []) });
});

watch(() => props.readOnly, () => {
   view?.dispatch({ effects: readOnly.reconfigure(EditorState.readOnly.of(props.readOnly)) });
});

onMounted(() => {
   view = new EditorView({
      parent: editorEl.value,
      state: EditorState.create({
         doc: props.modelValue ?? '',
         extensions: [
            baseSetup({ gutter: props.showLineNumbers }),
            language.of([]),
            theme.of(buildEditorTheme(getEditorTheme(editorTheme.value))),
            fontSize.of(buildFontTheme(editorFontSize.value)),
            wrap.of(lineWrap.value ? EditorView.lineWrapping : []),
            readOnly.of(EditorState.readOnly.of(props.readOnly)),
            EditorView.updateListener.of(update => {
               if (update.docChanged)
                  emit('update:modelValue', update.state.doc.toString());
            })
         ]
      })
   });

   setLanguage();

   if (props.autoFocus) {
      setTimeout(() => {
         view?.focus();
      }, 20);
   }
});

onBeforeUnmount(() => {
   view?.destroy();
   view = null;
});
</script>

<style lang="scss" scoped>
.editor-wrapper {
   .editor {
      width: 100%;
      height: 100%;
      max-width: 90vw;
      overflow: hidden;
   }
}
</style>
