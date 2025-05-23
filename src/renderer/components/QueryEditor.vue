<template>
   <div class="editor-wrapper">
      <div
         :id="`editor-${id}`"
         class="editor"
         :class="editorClasses"
         :style="{height: `${height}px`}"
      />
   </div>
</template>

<script setup lang="ts">
/* eslint-disable simple-import-sort/imports */
import * as ace from 'ace-builds';
import '../libs/ext-language_tools';
import 'ace-builds/webpack-resolver';
/* eslint-enable simple-import-sort/imports */

import { uidGen } from 'common/libs/uidGen';
import { storeToRefs } from 'pinia';
import { computed, onMounted, Prop, Ref, ref, toRef, watch } from 'vue';

import Tables from '@/ipc-api/Tables';
import { useApplicationStore } from '@/stores/application';
import { useSettingsStore } from '@/stores/settings';
import { Workspace } from '@/stores/workspaces';

const editor: Ref<ace.Ace.Editor> = ref(null);
const applicationStore = useApplicationStore();
const settingsStore = useSettingsStore();

const { setBaseCompleters } = applicationStore;

const { baseCompleter } = storeToRefs(applicationStore);
const {
   editorTheme,
   editorFontSize,
   autoComplete,
   lineWrap
} = storeToRefs(settingsStore);

const sizes = {
   xsmall: '10px',
   small: '12px',
   medium: '14px',
   large: '16px',
   xlarge: '18px',
   xxlarge: '20px'
};

const props = defineProps({
   modelValue: String,
   workspace: Object as Prop<Workspace>,
   isSelected: Boolean,
   schema: { type: String, default: '' },
   autoFocus: { type: Boolean, default: false },
   readOnly: { type: Boolean, default: false },
   height: { type: Number, default: 200 },
   editorClasses: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue']);

const cursorPosition = ref(0);
const lastTableFields = ref([]);
const customCompleter = ref([]);
const id = ref(uidGen());
const lastSchema: Ref<string> = ref(null);
const fields: Ref<{name: string; type: string}[]> = ref([]);

const tables = computed(() => {
   return props.workspace
      ? props.workspace.structure.filter(schema => schema.name === props.schema)
         .reduce((acc, curr) => {
            acc.push(...curr.tables);
            return acc;
         }, []).map(table => {
            return {
               name: table.name as string,
               type: table.type as string
            };
         })
      : [];
});

const tablesInQuery = computed(() => {
   if (!props.modelValue) return [];
   const words = props.modelValue
      .replaceAll(/[.'"`]/g, ' ')
      .split(' ')
      .filter(Boolean);

   const includedTables = tables.value.reduce((acc, curr) => {
      acc.push(curr.name);
      return acc;
   }, [] as string[]).filter((t) => words.includes(t));

   return includedTables;
});

const triggers = computed(() => {
   return props.workspace
      ? props.workspace.structure.filter(schema => schema.name === props.schema)
         .reduce((acc, curr) => {
            acc.push(...curr.triggers);
            return acc;
         }, []).map(trigger => {
            return {
               name: trigger.name as string,
               type: 'trigger'
            };
         })
      : [];
});

const procedures = computed(() => {
   return props.workspace
      ? props.workspace.structure.filter(schema => schema.name === props.schema)
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
});

const functions = computed(() => {
   return props.workspace
      ? props.workspace.structure.filter(schema => schema.name === props.schema)
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
});

const schedulers = computed(() => {
   return props.workspace
      ? props.workspace.structure.filter(schema => schema.name === props.schema)
         .reduce((acc, curr) => {
            acc.push(...curr.schedulers);
            return acc;
         }, []).map(scheduler => {
            return {
               name: scheduler.name as string,
               type: 'scheduler'
            };
         })
      : [];
});

const mode = computed(() => {
   switch (props.workspace.client) {
      case 'mysql':
      case 'maria':
         return 'mysql';
      // case 'mssql':
      //    return 'sqlserver';
      case 'pg':
         return 'pgsql';
      default:
         return 'sql';
   }
});

const lastWord = computed(() => {
   const charsBefore = props.modelValue.slice(0, cursorPosition.value);
   const words = charsBefore.replaceAll('\n', ' ').split(' ').filter(Boolean);
   return words.pop();
});

const isLastWordATable = computed(() => /\w+\.\w*/gm.test(lastWord.value));

const tableFieldsCompleter = computed(() => {
   return {
      getCompletions: (editor: never, session: never, pos: never, prefix: never, callback: (err: null, response: ace.Ace.Completion[]) => void) => {
         const completions: ace.Ace.Completion[] = [];
         lastTableFields.value.forEach(field => {
            completions.push({
               value: field,
               meta: 'column',
               score: 1000
            });
         });
         callback(null, completions);
      }
   };
});

const setCustomCompleter = () => {
   editor.value.completers.push({
      getCompletions: (editor, session, pos, prefix, callback: (err: null, response: ace.Ace.Completion[]) => void) => {
         const completions: ace.Ace.Completion[] = [];
         [
            ...tables.value,
            ...triggers.value,
            ...procedures.value,
            ...functions.value,
            ...schedulers.value,
            ...fields.value
         ].forEach(el => {
            completions.push({
               value: el.name,
               meta: el.type,
               score: 1000
            });
         });
         callback(null, completions);
      }
   });

   customCompleter.value = editor.value.completers;
};

watch(() => props.modelValue, () => {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   cursorPosition.value = (editor.value.session as any).doc.positionToIndex(editor.value.getCursorPosition());
});

watch(() => tablesInQuery.value.length, () => {
   const localFields: {name: string; type: string}[] = [];
   tablesInQuery.value.forEach(async table => {
      const params = {
         uid: props.workspace.uid,
         schema: props.schema,
         table: table
      };

      const { response } = await Tables.getTableColumns(params);

      response.forEach((field: { name: string }) => {
         localFields.push({
            name: field.name,
            type: 'column'
         });
      });
   });

   fields.value = localFields;
   setTimeout(() => {
      setCustomCompleter();
   }, 100);
});

watch(editorTheme, () => {
   if (editor.value)
      editor.value.setTheme(`ace/theme/${editorTheme.value}`);
});

watch(editorFontSize, () => {
   if (editor.value) {
      editor.value.setOptions({
         fontSize: sizes[editorFontSize.value]
      });
   }
});

watch(autoComplete, () => {
   if (editor.value) {
      editor.value.setOptions({
         enableLiveAutocompletion: autoComplete.value
      });
   }
});

watch(lineWrap, () => {
   if (editor.value) {
      editor.value.setOptions({
         wrap: lineWrap.value
      });
   }
});

watch(() => props.isSelected, () => {
   if (props.isSelected) {
      lastSchema.value = props.schema;
      editor.value.resize();
   }
});

watch(() => props.height, () => {
   setTimeout(() => {
      editor.value.resize();
   }, 20);
});

watch(lastSchema, () => {
   if (editor.value) {
      editor.value.completers = baseCompleter.value.map(el => Object.assign({}, el));
      setCustomCompleter();
   }
});

lastSchema.value = toRef(props, 'schema').value;

onMounted(() => {
   editor.value = ace.edit(`editor-${id.value}`, {
      mode: `ace/mode/${mode.value}`,
      theme: `ace/theme/${editorTheme.value}`,
      value: props.modelValue,
      fontSize: 14,
      printMargin: false,
      readOnly: props.readOnly
   });

   editor.value.setOptions({
      enableBasicAutocompletion: true,
      wrap: lineWrap.value,
      enableSnippets: true,
      enableLiveAutocompletion: autoComplete.value,
      fontSize: sizes[editorFontSize.value]
   });

   if (!baseCompleter.value.length)
      setBaseCompleters(editor.value.completers.map(el => Object.assign({}, el)));

   setCustomCompleter();

   editor.value.commands.on('afterExec', (e: { args: string; command: { name: string } }) => {
      if (['insertstring', 'backspace', 'del'].includes(e.command.name)) {
         if (isLastWordATable.value || e.args === '.') {
            if (e.args !== ' ') {
               const table = tables.value.find(t => t.name === lastWord.value.split('.').pop().trim());

               if (table) {
                  const params = {
                     uid: props.workspace.uid,
                     schema: props.schema,
                     table: table.name
                  };

                  Tables.getTableColumns(params).then(res => {
                     if (res.response.length)
                        lastTableFields.value = res.response.map((field: { name: string }) => field.name);
                     editor.value.completers = [tableFieldsCompleter.value];
                     editor.value.execCommand('startAutocomplete');
                  }).catch(console.error);
               }
               else
                  editor.value.completers = customCompleter.value;
            }
            else
               editor.value.completers = customCompleter.value;
         }
         else
            editor.value.completers = customCompleter.value;
      }
   });

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   (editor.value.session as any).on('change', () => {
      const content = editor.value.getValue();
      emit('update:modelValue', content);
   });

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   (editor.value as any).on('guttermousedown', (e: any) => {
      const target = e.domEvent.target;
      if (target.className.indexOf('ace_gutter-cell') === -1)
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

   editor.value.commands.removeCommand('showSettingsMenu');

   if (props.autoFocus) {
      setTimeout(() => {
         editor.value.focus();
         editor.value.resize();
      }, 20);
   }

   setTimeout(() => {
      editor.value.resize();
   }, 20);
});

defineExpose({ editor });
</script>

<style lang="scss">
.editor-wrapper {
  border-bottom: 1px solid #444;

  .editor {
    width: 100%;
  }
}

.ace_gutter-cell.ace_breakpoint {
  &::before {
    content: '';
    position: absolute;
    left: 0px;
    top: 8px;
    display: inline-block;
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-top: 8px solid transparent;
    border-right: 8px solid var(--primary-color);
    transform: rotate(-45deg);
  }
}
</style>
