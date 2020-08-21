<template>
   <div class="editor-wrapper">
      <div ref="editor" class="editor" />
   </div>
</template>

<script>

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { completionItemProvider } from '@/suggestions/sql';

monaco.languages.registerCompletionItemProvider('sql', completionItemProvider(monaco));

export default {
   name: 'QueryEditor',
   props: {
      value: String
   },
   data () {
      return {
         editor: null
      };
   },
   mounted () {
      this.editor = monaco.editor.create(this.$refs.editor, {
         value: this.value,
         language: 'sql',
         theme: 'vs-dark',
         autoIndent: true,
         minimap: {
            enabled: false
         },
         contextmenu: false,
         wordBasedSuggestions: true,
         acceptSuggestionOnEnter: 'smart',
         quickSuggestions: true
      });

      this.editor.onDidChangeModelContent(e => {
         const content = this.editor.getValue();
         this.$emit('update:value', content);
      });
   },
   beforeDestroy () {
      this.editor && this.editor.dispose();
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

  .CodeMirror {
    .CodeMirror-scroll {
      max-width: 100%;
    }

    .CodeMirror-line {
      word-break: break-word !important;
      white-space: pre-wrap !important;
    }
  }
</style>
