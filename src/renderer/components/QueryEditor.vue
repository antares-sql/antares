<template>
   <div class="editor-wrapper">
      <div ref="editor" class="editor" />
   </div>
</template>

<script>
import * as ace from 'ace-builds';
import 'ace-builds/webpack-resolver';
import 'ace-builds/src-noconflict/ext-language_tools';

export default {
   name: 'QueryEditor',
   props: {
      value: String,
      autoFocus: { type: Boolean, default: false }
   },
   data () {
      return {
         editor: null
      };
   },
   mounted () {
      this.editor = ace.edit(this.$refs.editor, {
         mode: 'ace/mode/sql',
         theme: 'ace/theme/twilight',
         value: this.value,
         fontSize: '14px',
         printMargin: false
      });

      this.editor.setOptions({
         enableBasicAutocompletion: true,
         enableSnippets: true,
         enableLiveAutocompletion: true
      });

      this.editor.session.on('change', () => {
         const content = this.editor.getValue();
         this.$emit('update:value', content);
      });

      if (this.autoFocus) {
         setTimeout(() => {
            this.editor.focus();
         }, 20);
      }
   }
};
</script>

<style lang="scss">
  .editor-wrapper {
    border-bottom: 1px solid #444;

    .editor {
      height: 200px;
      width: 100%;
    }
  }
</style>
