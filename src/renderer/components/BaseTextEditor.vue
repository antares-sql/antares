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

<script>
import * as ace from 'ace-builds';
import { storeToRefs } from 'pinia';
import 'ace-builds/webpack-resolver';
import { useSettingsStore } from '@/stores/settings';
import { uidGen } from 'common/libs/uidGen';

export default {
   name: 'BaseTextEditor',
   props: {
      modelValue: String,
      mode: { type: String, default: 'text' },
      editorClass: { type: String, default: '' },
      autoFocus: { type: Boolean, default: false },
      readOnly: { type: Boolean, default: false },
      showLineNumbers: { type: Boolean, default: true },
      height: { type: Number, default: 200 }
   },
   emits: ['update:modelValue'],
   setup () {
      const settingsStore = useSettingsStore();

      const {
         editorTheme,
         editorFontSize,
         autoComplete,
         lineWrap
      } = storeToRefs(settingsStore);

      return {
         editorTheme,
         editorFontSize,
         autoComplete,
         lineWrap
      };
   },
   data () {
      return {
         editor: null,
         id: uidGen()
      };
   },
   watch: {
      mode () {
         if (this.editor)
            this.editor.session.setMode(`ace/mode/${this.mode}`);
      },
      editorTheme () {
         if (this.editor)
            this.editor.setTheme(`ace/theme/${this.editorTheme}`);
      },
      editorFontSize () {
         const sizes = {
            small: '12px',
            medium: '14px',
            large: '16px'
         };

         if (this.editor) {
            this.editor.setOptions({
               fontSize: sizes[this.editorFontSize]
            });
         }
      },
      autoComplete () {
         if (this.editor) {
            this.editor.setOptions({
               enableLiveAutocompletion: this.autoComplete
            });
         }
      },
      lineWrap () {
         if (this.editor) {
            this.editor.setOptions({
               wrap: this.lineWrap
            });
         }
      }
   },
   mounted () {
      this.editor = ace.edit(`editor-${this.id}`, {
         mode: `ace/mode/${this.mode}`,
         theme: `ace/theme/${this.editorTheme}`,
         value: this.modelValue || '',
         fontSize: '14px',
         printMargin: false,
         readOnly: this.readOnly,
         showLineNumbers: this.showLineNumbers,
         showGutter: this.showLineNumbers
      });

      this.editor.setOptions({
         enableBasicAutocompletion: false,
         wrap: this.lineWrap,
         enableSnippets: false,
         enableLiveAutocompletion: false
      });

      this.editor.session.on('change', () => {
         const content = this.editor.getValue();
         this.$emit('update:modelValue', content);
      });

      if (this.autoFocus) {
         setTimeout(() => {
            this.editor.focus();
            this.editor.resize();
         }, 20);
      }

      setTimeout(() => {
         this.editor.resize();
      }, 20);
   }
};
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
