<template>
   <div class="editor-wrapper">
      <div
         ref="editor"
         class="editor"
         :style="{height: `${height}px`}"
      />
   </div>
</template>

<script>
import * as ace from 'ace-builds';
import 'ace-builds/webpack-resolver';
import '../libs/ext-language_tools';
import { mapGetters } from 'vuex';
import Tables from '@/ipc-api/Tables';

export default {
   name: 'QueryEditor',
   props: {
      value: String,
      workspace: Object,
      schema: { type: String, default: '' },
      autoFocus: { type: Boolean, default: false },
      readOnly: { type: Boolean, default: false },
      height: { type: Number, default: 200 }
   },
   data () {
      return {
         editor: null,
         fields: [],
         baseCompleter: []
      };
   },
   computed: {
      ...mapGetters({
         editorTheme: 'settings/getEditorTheme',
         autoComplete: 'settings/getAutoComplete',
         lineWrap: 'settings/getLineWrap'
      }),
      tables () {
         return this.workspace
            ? this.workspace.structure.filter(schema => schema.name === this.schema)
               .reduce((acc, curr) => {
                  acc.push(...curr.tables);
                  return acc;
               }, []).map(table => {
                  return {
                     name: table.name,
                     comment: table.comment,
                     type: table.type,
                     fields: []
                  };
               })
            : [];
      },
      mode () {
         switch (this.workspace.client) {
            case 'mysql':
            case 'maria':
               return 'mysql';
            case 'mssql':
               return 'sqlserver';
            case 'pg':
               return 'pgsql';
            default:
               return 'sql';
         }
      },
      lastWord () {
         const words = this.value.split(' ');
         return words[words.length - 1];
      },
      isLastWordATable () {
         return /\w+\.\w*/gm.test(this.lastWord);
      },
      fieldsCompleter () {
         return {
            getCompletions: (editor, session, pos, prefix, callback) => {
               const completions = [];
               this.fields.forEach(field => {
                  completions.push({
                     value: field,
                     meta: 'column',
                     score: 1000
                  });
               });
               callback(null, completions);
            }
         };
      }
   },
   watch: {
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
   mounted () {
      this.editor = ace.edit(this.$refs.editor, {
         mode: `ace/mode/${this.mode}`,
         theme: `ace/theme/${this.editorTheme}`,
         value: this.value,
         fontSize: '14px',
         printMargin: false,
         readOnly: this.readOnly
      });

      this.editor.setOptions({
         enableBasicAutocompletion: true,
         wrap: this.lineWrap,
         enableSnippets: true,
         enableLiveAutocompletion: this.autoComplete
      });

      this.editor.completers.push({
         getCompletions: (editor, session, pos, prefix, callback) => {
            const completions = [];
            this.tables.forEach(table => {
               completions.push({
                  value: table.name,
                  meta: table.type,
                  caption: table.comment
               });
            });
            callback(null, completions);
         }
      });

      this.baseCompleter = this.editor.completers;

      this.editor.commands.on('afterExec', e => {
         if (['insertstring', 'backspace', 'del'].includes(e.command.name)) {
            if (this.isLastWordATable || e.args === '.') {
               if (e.args !== ' ') {
                  const table = this.tables.find(t => t.name === this.lastWord.split('.').pop());

                  if (table) {
                     const params = {
                        uid: this.workspace.uid,
                        schema: this.schema,
                        table: table.name
                     };

                     Tables.getTableColumns(params).then(res => {
                        if (res.response.length)
                           this.fields = res.response.map(field => field.name);
                        this.editor.completers = [this.fieldsCompleter];
                        this.editor.execCommand('startAutocomplete');
                     }).catch(console.log);
                  }
                  else
                     this.editor.completers = this.baseCompleter;
               }
               else
                  this.editor.completers = this.baseCompleter;
            }
            else
               this.editor.completers = this.baseCompleter;
         }
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
    width: 100%;
  }
}

.ace_.mdi {
  display: inline-block;
  width: 17px;
}

.ace_dark.ace_editor.ace_autocomplete .ace_marker-layer .ace_active-line {
  background-color: #c9561a99;
}

.ace_dark.ace_editor.ace_autocomplete .ace_marker-layer .ace_line-hover {
  background-color: #c9571a33;
  border: none;
}

.ace_dark.ace_editor.ace_autocomplete .ace_completion-highlight {
  color: #e0d00c;
}
</style>
