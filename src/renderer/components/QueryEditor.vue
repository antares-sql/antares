<template>
   <div class="editor-wrapper">
      <div
         ref="editorEl"
         class="editor"
         :class="editorClasses"
         :style="{height: `${height}px`}"
      />
      <Teleport v-if="hasActions" :to="actionsEl">
         <button
            v-if="formattable"
            type="button"
            class="cm-editor-action"
            :disabled="!props.modelValue || props.readOnly"
            :title="t('general.format')"
            :aria-label="t('general.format')"
            @click="format()"
         >
            <BaseIcon icon-name="brush" :size="18" />
         </button>
         <slot name="actions" />
      </Teleport>
   </div>
</template>

<script setup lang="ts">
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { storeToRefs } from 'pinia';
import { format as formatSql } from 'sql-formatter';
import { computed, onBeforeUnmount, onMounted, Prop, Ref, ref, useSlots, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import Tables from '@/ipc-api/Tables';
import { actionsPanel } from '@/libs/editor/actionsPanel';
import { breakpoints } from '@/libs/editor/breakpoints';
import { baseSetup } from '@/libs/editor/setup';
import { sqlCompletion, SqlCompletionProvider, SqlEntity } from '@/libs/editor/sql/completion';
import { getSqlDialect } from '@/libs/editor/sql/dialects';
import { buildEditorTheme, buildFontTheme } from '@/libs/editor/themes';
import { EditorApi } from '@/libs/editorApi';
import { useNotificationsStore } from '@/stores/notifications';
import { useSettingsStore } from '@/stores/settings';
import { useThemesStore } from '@/stores/themes';
import { Workspace } from '@/stores/workspaces';

const settingsStore = useSettingsStore();

const { editorTheme } = storeToRefs(useThemesStore());

const {
   editorFontSize,
   autoComplete,
   lineWrap
} = storeToRefs(settingsStore);

const props = defineProps({
   modelValue: String,
   workspace: Object as Prop<Workspace>,
   isSelected: Boolean,
   schema: { type: String, default: '' },
   autoFocus: { type: Boolean, default: false },
   readOnly: { type: Boolean, default: false },
   height: { type: Number, default: 200 },
   editorClasses: { type: String, default: '' },
   /** Shows the "format" action in the editor */
   formattable: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

const { t } = useI18n();
const { addNotification } = useNotificationsStore();

const slots = useSlots();
const hasActions = computed(() => props.formattable || !!slots.actions);

/** Host of the actions (format + `actions` slot): CodeMirror places it as a top panel, stacked with the search widget */
const actionsEl = document.createElement('div');
actionsEl.className = 'cm-editor-actions';

const editorEl: Ref<HTMLDivElement> = ref(null);
// Not reactive: a Vue proxy around the view breaks CodeMirror
let view: EditorView = null;

const theme = new Compartment();
const fontSize = new Compartment();
const wrap = new Compartment();
const readOnly = new Compartment();
const completion = new Compartment();

const dialectDefinition = computed(() => getSqlDialect(props.workspace?.customizations?.sqlDialect ?? 'sql'));

const schemaStructure = computed(() => props.workspace
   ? props.workspace.structure.filter(schema => schema.name === props.schema)
   : []);

const entities = computed<SqlEntity[]>(() => {
   const list: SqlEntity[] = [];
   for (const schema of schemaStructure.value) {
      for (const table of schema.tables)
         list.push({ name: table.name, type: (table.type || 'table') as SqlEntity['type'] });
      for (const trigger of schema.triggers)
         list.push({ name: trigger.name, type: 'trigger' });
      for (const procedure of schema.procedures)
         list.push({ name: `${procedure.name}()`, type: 'routine' });
      for (const func of schema.functions)
         list.push({ name: `${func.name}()`, type: 'function' });
      for (const scheduler of schema.schedulers)
         list.push({ name: scheduler.name, type: 'scheduler' });
   }
   return list;
});

const tableNames = computed(() => new Set(schemaStructure.value.flatMap(schema => schema.tables.map(table => table.name as string))));

/** Columns per table of the current schema, until the structure or the schema change */
let columnsCache = new Map<string, Promise<string[]>>();

watch(() => [props.schema, props.workspace?.structure], () => {
   columnsCache = new Map();
});

const fetchColumns = (table: string): Promise<string[]> => {
   if (!columnsCache.has(table)) {
      const request = Tables.getTableColumns({ uid: props.workspace.uid, schema: props.schema, table } as { schema: string; table: string })
         .then(({ status, response }) => status === 'success' ? (response as { name: string }[]).map(field => field.name) : [])
         .catch(() => [] as string[]);
      columnsCache.set(table, request);
      request.then(columns => {
         if (!columns.length) columnsCache.delete(table);
      });
   }
   return columnsCache.get(table);
};

const completionProvider: SqlCompletionProvider = {
   getEntities: () => entities.value,
   getTableColumns: async (table: string) => {
      if (!props.workspace || !tableNames.value.has(table)) return null;
      return fetchColumns(table);
   },
   getQueryColumns: async (query: string) => {
      if (!props.workspace) return [];
      const words = new Set(query.replaceAll(/[.'"`]/g, ' ').split(/\s+/).filter(Boolean));
      const tables = [...tableNames.value].filter(table => words.has(table));
      const columns = await Promise.all(tables.map(fetchColumns));
      return [...new Set(columns.flat())];
   }
};

const buildCompletion = () => sqlCompletion({
   definition: dialectDefinition.value,
   provider: completionProvider,
   activateOnTyping: autoComplete.value
});

watch(() => props.modelValue, value => {
   value = value ?? '';
   if (view && value !== view.state.doc.toString())
      setValue(value);
});

watch(editorTheme, () => {
   view?.dispatch({ effects: theme.reconfigure(buildEditorTheme(editorTheme.value)) });
});

watch(editorFontSize, () => {
   view?.dispatch({ effects: fontSize.reconfigure(buildFontTheme(editorFontSize.value)) });
});

watch(autoComplete, () => {
   view?.dispatch({ effects: completion.reconfigure(buildCompletion()) });
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
            breakpoints(),
            baseSetup(),
            hasActions.value ? actionsPanel(actionsEl) : [],
            dialectDefinition.value.dialect,
            completion.of(buildCompletion()),
            theme.of(buildEditorTheme(editorTheme.value)),
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

const getValue = () => view ? view.state.doc.toString() : props.modelValue ?? '';

const setValue = (value: string) => {
   if (!view) return;
   view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value ?? '' } });
};

const getSelectedText = () => {
   if (!view) return '';
   const { from, to } = view.state.selection.main;
   return view.state.sliceDoc(from, to);
};

const getCursorIndex = () => view ? view.state.selection.main.head : 0;

const focus = () => view?.focus();

const resize = () => view?.requestMeasure();

const format = () => {
   if (!view || props.readOnly) return;
   const value = view.state.doc.toString();
   if (!value) return;

   try {
      const language = props.workspace?.customizations?.formatterLanguage ?? 'sql';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue(formatSql(value, { language, uppercase: true } as any));
   }
   catch (err) { // The formatter can't parse some statements (e.g. procedural bodies of some engines)
      addNotification({ status: 'error', message: err.message });
   }
};

defineExpose<EditorApi>({
   getValue,
   setValue,
   getSelectedText,
   getCursorIndex,
   focus,
   resize,
   format
});
</script>

<style lang="scss">
.editor-wrapper {
  .editor {
    width: 100%;
    overflow: hidden;
  }
}
</style>
