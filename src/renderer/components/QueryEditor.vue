<template>
   <div class="editor-wrapper">
      <div
         :id="`editor-${id}`"
         class="editor"
         :style="{height: `${height}px`}"
      />
   </div>
</template>

<script>
import * as ace from 'ace-builds';
import 'ace-builds/webpack-resolver';
import '../libs/ext-language_tools';
import { mapGetters, mapActions } from 'vuex';
import Tables from '@/ipc-api/Tables';

export default {
   name: 'QueryEditor',
   props: {
      value: String,
      workspace: Object,
      isSelected: Boolean,
      schema: { type: String, default: '' },
      autoFocus: { type: Boolean, default: false },
      readOnly: { type: Boolean, default: false },
      height: { type: Number, default: 200 }
   },
   data () {
      return {
         editor: null,
         fields: [],
         customCompleter: [],
         id: null,
         lastSchema: null
      };
   },
   computed: {
      ...mapGetters({
         editorTheme: 'settings/getEditorTheme',
         autoComplete: 'settings/getAutoComplete',
         lineWrap: 'settings/getLineWrap',
         baseCompleter: 'application/getBaseCompleter'
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
                     type: table.type,
                     fields: []
                  };
               })
            : [];
      },
      triggers () {
         return this.workspace
            ? this.workspace.structure.filter(schema => schema.name === this.schema)
               .reduce((acc, curr) => {
                  acc.push(...curr.triggers);
                  return acc;
               }, []).map(trigger => {
                  return {
                     name: trigger.name,
                     type: 'trigger'
                  };
               })
            : [];
      },
      procedures () {
         return this.workspace
            ? this.workspace.structure.filter(schema => schema.name === this.schema)
               .reduce((acc, curr) => {
                  acc.push(...curr.procedures);
                  return acc;
               }, []).map(procedure => {
                  return {
                     name: `${procedure.name}()`,
                     type: 'routine'
                  };
               })
            : [];
      },
      functions () {
         return this.workspace
            ? this.workspace.structure.filter(schema => schema.name === this.schema)
               .reduce((acc, curr) => {
                  acc.push(...curr.functions);
                  return acc;
               }, []).map(func => {
                  return {
                     name: `${func.name}()`,
                     type: 'function'
                  };
               })
            : [];
      },
      schedulers () {
         return this.workspace
            ? this.workspace.structure.filter(schema => schema.name === this.schema)
               .reduce((acc, curr) => {
                  acc.push(...curr.schedulers);
                  return acc;
               }, []).map(scheduler => {
                  return {
                     name: scheduler.name,
                     type: 'scheduler'
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
      },
      isSelected () {
         if (this.isSelected)
            this.lastSchema = this.schema;
      },
      lastSchema () {
         if (this.editor) {
            this.editor.completers = this.baseCompleter.map(el => Object.assign({}, el));
            this.setCustomCompleter();
         }
      }
   },
   created () {
      this.id = this._uid;
      this.lastSchema = this.schema;
   },
   mounted () {
      this.editor = ace.edit(`editor-${this.id}`, {
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

      if (!this.baseCompleter.length)
         this.setBaseCompleters(this.editor.completers.map(el => Object.assign({}, el)));

      this.setCustomCompleter();

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
                     this.editor.completers = this.customCompleter;
               }
               else
                  this.editor.completers = this.customCompleter;
            }
            else
               this.editor.completers = this.customCompleter;
         }
      });

      this.editor.session.on('change', () => {
         const content = this.editor.getValue();
         this.$emit('update:value', content);
      });

      this.editor.on('guttermousedown', e => {
         const target = e.domEvent.target;
         if (target.className.indexOf('ace_gutter-cell') === -1)
            return;
         if (!this.editor.isFocused())
            return;
         if (e.clientX > 25 + target.getBoundingClientRect().left)
            return;

         const row = e.getDocumentPosition().row;
         const breakpoints = e.editor.session.getBreakpoints(row, 0);
         if (typeof breakpoints[row] === typeof undefined)
            e.editor.session.setBreakpoint(row);
         else
            e.editor.session.clearBreakpoint(row);
         e.stop();
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
   },
   methods: {
      ...mapActions({
         setBaseCompleters: 'application/setBaseCompleter'
      }),
      setCustomCompleter () {
         this.editor.completers.push({
            getCompletions: (editor, session, pos, prefix, callback) => {
               const completions = [];
               [
                  ...this.tables,
                  ...this.triggers,
                  ...this.procedures,
                  ...this.functions,
                  ...this.schedulers
               ].forEach(el => {
                  completions.push({
                     value: el.name,
                     meta: el.type
                  });
               });
               callback(null, completions);
            }
         });

         this.customCompleter = this.editor.completers;
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

.ace_gutter-cell.ace_breakpoint {
  &::before {
    content: '\F0403';
    position: absolute;
    left: 3px;
    top: 2px;
    color: $primary-color;
    display: inline-block;
    font: normal normal normal 24px/1 "Material Design Icons", sans-serif;
    font-size: inherit;
    text-rendering: auto;
    line-height: inherit;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
</style>
