<template>
   <div class="editor-wrapper">
      <textarea
         ref="codemirror"
         :options="cmOptions"
      />
   </div>
</template>

<script>
import CodeMirror from 'codemirror';

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material-darker.css';
import 'codemirror/mode/sql/sql';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/selection/active-line';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/hint/sql-hint';

CodeMirror.defineOption('sql-hint');

export default {
   name: 'QueryEditor',
   props: {
      value: String
   },
   data () {
      return {
         cminstance: null,
         content: '',
         cmOptions: {
            tabSize: 3,
            smartIndent: true,
            styleActiveLine: true,
            lineNumbers: true,
            line: true,
            mode: 'text/x-sql',
            theme: 'material-darker',
            extraKeys: {
               'Ctrl-Space': 'autocomplete'
            },
            hintOptions: {
               tables: {
                  users: ['name', 'score', 'birthDate'],
                  countries: ['name', 'population', 'size']
               }
            },
            autoCloseBrackets: true
         }
      };
   },
   mounted () {
      this.initialize();
   },
   methods: {
      initialize () {
         this.cminstance = CodeMirror.fromTextArea(this.$refs.codemirror, this.cmOptions);
         this.cminstance.setValue(this.value || this.content);

         this.cminstance.on('change', cm => {
            this.content = cm.getValue();
            this.$emit('input', this.content);
         });
      }
   }
};
</script>

<style lang="scss">
   .editor-wrapper{
      border-bottom: 1px solid #444444;
   }

   .CodeMirror{
      height: 200px;

      .CodeMirror-scroll{
         max-width: 100%;
      }

      .CodeMirror-line {
         word-break: break-word!important;
         white-space: pre-wrap!important;
         word-break: normal;
      }
   }
</style>
