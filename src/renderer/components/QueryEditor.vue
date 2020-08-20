<template>
   <div class="editor-wrapper">
      <div ref="editor" class="editor" />
   </div>
</template>

<script>

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

monaco.languages.registerCompletionItemProvider('sql', {
   provideCompletionItems: () => {
      const suggestions = [// TODO: complete in a separate file
         {
            label: 'SELECT',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'SELECT'
         }
      ];

      return { suggestions };
   }
});

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
         acceptSuggestionOnEnter: 'smart',
         quickSuggestions: true,
         wordBasedSuggestions: true
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
