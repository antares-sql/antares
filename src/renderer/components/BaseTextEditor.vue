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
import 'ace-builds/webpack-resolver';
import { mapGetters } from 'vuex';

export default {
   name: 'BaseTextEditor',
   props: {
      value: String,
      mode: { type: String, default: 'text' },
      editorClass: { type: String, default: '' },
      autoFocus: { type: Boolean, default: false },
      readOnly: { type: Boolean, default: false },
      showLineNumbers: { type: Boolean, default: true },
      height: { type: Number, default: 200 }
   },
   data () {
      return {
         editor: null,
         id: null
      };
   },
   computed: {
      ...mapGetters({
         editorTheme: 'settings/getEditorTheme',
         autoComplete: 'settings/getAutoComplete',
         lineWrap: 'settings/getLineWrap'
      })
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
   created () {
      this.id = this._uid;
   },
   mounted () {
      this.editor = ace.edit(`editor-${this.id}`, {
         mode: `ace/mode/${this.mode}`,
         theme: `ace/theme/${this.editorTheme}`,
         value: this.value || '',
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
         this.$emit('update:value', content);
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
