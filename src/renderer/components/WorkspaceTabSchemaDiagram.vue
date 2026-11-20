<template>
   <div v-show="isSelected" class="workspace-query-tab column col-12 columns col-gapless">
      <div class="workspace-query-runner column col-12">
         <div class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <button
                  class="btn btn-dark btn-sm"
                  :class="{'loading': isLoading}"
                  :disabled="isLoading"
                  :title="t('general.refresh')"
                  @click="getDiagram"
               >
                  <BaseIcon
                     class="mr-1"
                     icon-name="mdiRefresh"
                     :size="24"
                  />
                  <span>{{ t('general.refresh') }}</span>
               </button>
               <div class="divider-vert py-3" />
               <button
                  class="btn btn-dark btn-sm"
                  :disabled="!hasTables"
                  :title="t('application.zoomIn')"
                  @click="zoomBy(1.2)"
               >
                  <BaseIcon icon-name="mdiMagnifyPlusOutline" :size="24" />
               </button>
               <button
                  class="btn btn-dark btn-sm"
                  :disabled="!hasTables"
                  :title="t('application.zoomOut')"
                  @click="zoomBy(1 / 1.2)"
               >
                  <BaseIcon icon-name="mdiMagnifyMinusOutline" :size="24" />
               </button>
               <button
                  class="btn btn-dark btn-sm"
                  :disabled="!hasTables"
                  :title="t('database.fitToScreen')"
                  @click="fitToScreen"
               >
                  <BaseIcon icon-name="mdiFitToScreen" :size="24" />
               </button>
               <button
                  class="btn btn-dark btn-sm"
                  :disabled="!hasTables"
                  :title="t('database.resetLayout')"
                  @click="resetLayout"
               >
                  <BaseIcon
                     class="mr-1"
                     icon-name="mdiAutoFix"
                     :size="24"
                  />
                  <span>{{ t('database.resetLayout') }}</span>
               </button>
               <div class="divider-vert py-3" />
               <button
                  class="btn btn-dark btn-sm"
                  :disabled="!hasTables"
                  :title="t('database.exportAsSvg')"
                  @click="exportSvg"
               >
                  <BaseIcon
                     class="mr-1"
                     icon-name="mdiFileImageOutline"
                     :size="24"
                  />
                  <span>{{ t('database.export') }}</span>
               </button>
            </div>
            <div class="workspace-query-info">
               <div class="d-flex" :title="t('database.schema')">
                  <BaseIcon
                     class="mr-1 mt-1"
                     icon-name="mdiDatabase"
                     :size="18"
                  /><b class="cut-text">{{ schema }}</b>
               </div>
               <div
                  v-if="diagram"
                  class="d-flex"
                  :title="t('database.table', 2)"
               >
                  <BaseIcon
                     class="mr-1 mt-1"
                     icon-name="mdiTable"
                     :size="18"
                  /><b>{{ diagram.tables.length }}</b>
               </div>
               <div
                  v-if="diagram"
                  class="d-flex"
                  :title="t('database.relation', 2)"
               >
                  <BaseIcon
                     class="mr-1 mt-1"
                     icon-name="mdiRelationManyToOne"
                     :size="18"
                  /><b>{{ relations.length }}</b>
               </div>
               <div class="d-flex" :title="t('application.zoomReset')">
                  <span class="c-hand" @click="zoomAt(1)">{{ Math.round(zoom * 100) }}%</span>
               </div>
            </div>
         </div>
      </div>
      <div
         ref="canvasRef"
         class="schema-diagram column col-12"
         :class="{'panning': drag?.kind === 'pan'}"
         :style="{ height: `${canvasHeight}px` }"
      >
         <BaseLoader v-if="isLoading && !diagram" />
         <div v-else-if="diagram && !hasTables" class="empty">
            <div class="empty-icon">
               <BaseIcon icon-name="mdiTableNetwork" :size="48" />
            </div>
            <p class="empty-title h5">
               {{ t('database.thereAreNoTables') }}
            </p>
         </div>
         <svg
            v-show="hasTables"
            ref="svgRef"
            class="schema-diagram-svg"
            xmlns="http://www.w3.org/2000/svg"
            @mousedown.left="startPan"
            @wheel.prevent="onWheel"
         >
            <defs>
               <marker
                  :id="`${tabUid}-one`"
                  viewBox="0 0 12 12"
                  refX="11"
                  refY="6"
                  markerWidth="12"
                  markerHeight="12"
                  markerUnits="userSpaceOnUse"
                  orient="auto-start-reverse"
               >
                  <!-- Path end at x=11, the box edge: two bars just before it -->
                  <path class="relation-marker" d="M 7 1 L 7 11 M 3 1 L 3 11" />
               </marker>
               <marker
                  :id="`${tabUid}-many`"
                  viewBox="0 0 12 12"
                  refX="11"
                  refY="6"
                  markerWidth="12"
                  markerHeight="12"
                  markerUnits="userSpaceOnUse"
                  orient="auto-start-reverse"
               >
                  <!-- Reversed at the path start: x=11 is the box edge, lower x go away from the box (crow's foot) -->
                  <path class="relation-marker" d="M 11 1 L 1 6 L 11 11 M 11 6 L 1 6" />
               </marker>
            </defs>
            <g class="diagram-viewport" :transform="`translate(${pan.x} ${pan.y}) scale(${zoom})`">
               <g class="diagram-relations">
                  <path
                     v-for="relation of relationPaths"
                     :key="relation.key"
                     class="relation"
                     :class="{
                        'active': relation.active,
                        'dimmed': activeTable && !relation.active
                     }"
                     :d="relation.d"
                     :marker-start="`url(#${tabUid}-many)`"
                     :marker-end="`url(#${tabUid}-one)`"
                  >
                     <title>{{ relation.title }}</title>
                  </path>
               </g>
               <g
                  v-for="table of diagram?.tables || []"
                  :key="table.name"
                  class="diagram-table"
                  :class="{
                     'selected': selectedTable === table.name,
                     'dimmed': activeTable && !relatedTables.has(table.name)
                  }"
                  :transform="`translate(${boxes[table.name]?.x || 0} ${boxes[table.name]?.y || 0})`"
                  @mousedown.left.stop="startTableDrag(table.name, $event)"
                  @mouseenter="hoveredTable = table.name"
                  @mouseleave="hoveredTable = null"
                  @dblclick="openTableData(table.name)"
               >
                  <title>{{ table.name }}</title>
                  <rect
                     class="table-box"
                     :width="boxes[table.name]?.width"
                     :height="boxes[table.name]?.height"
                     rx="4"
                  />
                  <path class="table-header" :d="headerPath(boxes[table.name]?.width)" />
                  <text
                     class="table-name"
                     :x="BOX_PADDING + 2"
                     :y="HEADER_HEIGHT / 2"
                     dominant-baseline="central"
                  >{{ fitText(table.name, boxes[table.name]?.width - BOX_PADDING * 2 - 4, NAME_CHAR_WIDTH) }}</text>
                  <g
                     v-for="(field, i) of table.fields"
                     :key="field.name"
                     class="table-field"
                     :class="{ 'linked': isLinkedField(table.name, field.name) }"
                     :transform="`translate(0 ${HEADER_HEIGHT + i * ROW_HEIGHT})`"
                  >
                     <title>{{ field.name }} {{ field.type }}{{ field.nullable === false ? ' NOT NULL' : '' }}</title>
                     <rect
                        class="field-row"
                        x="1"
                        :width="boxes[table.name]?.width - 2"
                        :height="ROW_HEIGHT"
                     />
                     <path
                        v-if="fieldKey(table.name, field)"
                        class="column-key"
                        :class="`key-${fieldKey(table.name, field)}`"
                        :d="fieldKey(table.name, field) === 'fk' ? mdiKeyLink : mdiKey"
                        :transform="`translate(${BOX_PADDING} ${(ROW_HEIGHT - 14) / 2}) scale(${14 / 24})`"
                     />
                     <text
                        class="field-name"
                        :x="ICON_SPACE"
                        :y="ROW_HEIGHT / 2"
                        dominant-baseline="central"
                     >{{ fitText(field.name, fieldNameSpace(table.name, field), NAME_CHAR_WIDTH) }}</text>
                     <text
                        class="field-type"
                        :class="typeClass(field.type)"
                        :x="boxes[table.name]?.width - BOX_PADDING"
                        :y="ROW_HEIGHT / 2"
                        text-anchor="end"
                        dominant-baseline="central"
                     >{{ fitText(field.type || '', typeSpace(table.name), TYPE_CHAR_WIDTH) }}</text>
                  </g>
               </g>
            </g>
         </svg>
      </div>
   </div>
</template>

<script setup lang="ts">
import { mdiKey, mdiKeyLink } from '@mdi/js';
import { ConnectionParams, SchemaDiagram, SchemaDiagramField } from 'common/interfaces/antares';
import { ipcRenderer } from 'electron';
import { computed, nextTick, onBeforeUnmount, onMounted, Prop, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import BaseLoader from '@/components/BaseLoader.vue';
import Application from '@/ipc-api/Application';
import Schema from '@/ipc-api/Schema';
import {
   BOX_PADDING,
   diagramBounds,
   DiagramBox,
   FIELD_GAP,
   fieldY,
   HEADER_HEIGHT,
   ICON_SPACE,
   layoutDiagram,
   NAME_CHAR_WIDTH,
   relationPath,
   ROW_HEIGHT,
   TYPE_CHAR_WIDTH,
   visibleRelations
} from '@/libs/schemaDiagramLayout';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

const props = defineProps({
   tabUid: String,
   connection: Object as Prop<ConnectionParams>,
   isSelected: Boolean,
   schema: String
});

const { addNotification } = useNotificationsStore();
const { newTab, changeBreadcrumbs } = useWorkspacesStore();

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 2;
const FIT_MARGIN = 30;

const canvasRef = ref<HTMLDivElement>(null);
const svgRef = ref<SVGSVGElement>(null);
const canvasHeight = ref(400);
const isLoading = ref(false);
const diagram = ref<SchemaDiagram>(null);
const boxes = ref<Record<string, DiagramBox>>({});
const zoom = ref(1);
const pan = ref({ x: FIT_MARGIN, y: FIT_MARGIN });
const hoveredTable = ref<string>(null);
const selectedTable = ref<string>(null);
const drag = ref<{
   kind: 'pan' | 'table';
   table?: string;
   startX: number;
   startY: number;
   originX: number;
   originY: number;
   moved: boolean;
}>(null);

const hasTables = computed(() => !!diagram.value?.tables.length);
const tablesByName = computed(() => new Map((diagram.value?.tables || []).map(table => [table.name, table])));
const relations = computed(() => diagram.value ? visibleRelations(diagram.value) : []);

/** `table.field` of every foreign key column */
const foreignFields = computed(() => new Set((diagram.value?.relations || []).map(r => `${r.table}.${r.field}`)));
/** `table.field` of every column involved in a drawn relation */
const linkedFields = computed(() => new Set(relations.value.flatMap(r => [`${r.table}.${r.field}`, `${r.refTable}.${r.refField}`])));

const activeTable = computed(() => drag.value?.kind === 'table' ? drag.value.table : selectedTable.value || hoveredTable.value);

const relatedTables = computed(() => {
   const related = new Set<string>();
   if (!activeTable.value) return related;

   related.add(activeTable.value);
   for (const relation of relations.value) {
      if (relation.table === activeTable.value) related.add(relation.refTable);
      if (relation.refTable === activeTable.value) related.add(relation.table);
   }
   return related;
});

const relationPaths = computed(() => relations.value.flatMap((relation, i) => {
   const source = boxes.value[relation.table];
   const target = boxes.value[relation.refTable];
   if (!source || !target) return [];

   const sourceTable = tablesByName.value.get(relation.table);
   const targetTable = tablesByName.value.get(relation.refTable);

   return [{
      key: `${relation.constraintName}-${relation.table}-${relation.field}-${i}`,
      d: relationPath(source, fieldY(source, sourceTable, relation.field), target, fieldY(target, targetTable, relation.refField)),
      active: !!activeTable.value && (relation.table === activeTable.value || relation.refTable === activeTable.value),
      title: `${relation.constraintName}: ${relation.table}.${relation.field} → ${relation.refTable}.${relation.refField}`
   }];
}));

const isLinkedField = (table: string, field: string) => linkedFields.value.has(`${table}.${field}`);

const fieldKey = (table: string, field: SchemaDiagramField) => {
   if (field.key === 'pri') return 'pri';
   if (foreignFields.value.has(`${table}.${field.name}`)) return 'fk';
   if (field.key === 'uni') return 'uni';
   return '';
};

const typeClass = (type: string) => `type-${(type || '').toLowerCase().replaceAll(' ', '_').replaceAll('"', '')}`;

/** Width available for the type label: at most half of the row */
const typeSpace = (table: string) => {
   const width = boxes.value[table]?.width || 0;
   return Math.floor((width - ICON_SPACE - BOX_PADDING) / 2);
};

const fieldNameSpace = (table: string, field: SchemaDiagramField) => {
   const width = boxes.value[table]?.width || 0;
   const typeWidth = Math.min(typeSpace(table), (field.type || '').length * TYPE_CHAR_WIDTH);
   return width - ICON_SPACE - BOX_PADDING - FIELD_GAP / 2 - typeWidth;
};

/** Cuts a label to the available width (estimated with an average character width) */
const fitText = (text: string, space: number, charWidth: number) => {
   const maxChars = Math.max(1, Math.floor(space / charWidth));
   return text.length > maxChars ? `${text.slice(0, Math.max(1, maxChars - 1))}…` : text;
};

/** Header shape with rounded top corners only */
const headerPath = (width = 0) => {
   const r = 4;
   return `M 0 ${HEADER_HEIGHT} V ${r} Q 0 0 ${r} 0 H ${width - r} Q ${width} 0 ${width} ${r} V ${HEADER_HEIGHT} Z`;
};

const resizeCanvas = () => {
   if (!canvasRef.value || !props.isSelected) return;

   const footer = document.getElementById('footer');
   const top = canvasRef.value.getBoundingClientRect().top;
   canvasHeight.value = Math.max(200, window.innerHeight - top - (footer ? footer.offsetHeight : 0));
};

const getDiagram = async () => {
   isLoading.value = true;

   try {
      const { status, response } = await Schema.getSchemaDiagram({
         uid: props.connection.uid,
         schema: props.schema
      });

      if (status === 'success') {
         const previousBoxes = boxes.value;
         const sameTables = diagram.value &&
            response.tables.length === Object.keys(previousBoxes).length &&
            response.tables.every(table => previousBoxes[table.name]);

         diagram.value = response;

         if (sameTables) { // Keep the tables where the user moved them, but resize them
            const layout = layoutDiagram(response);
            boxes.value = Object.fromEntries(Object.entries(layout).map(([name, box]) =>
               [name, { ...box, x: previousBoxes[name].x, y: previousBoxes[name].y }]
            ));
         }
         else
            resetLayout();
      }
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   isLoading.value = false;
};

const resetLayout = async () => {
   boxes.value = diagram.value ? layoutDiagram(diagram.value) : {};
   selectedTable.value = null;
   await nextTick();
   resizeCanvas();
   fitToScreen();
};

const fitToScreen = () => {
   if (!canvasRef.value || !hasTables.value) return;

   const bounds = diagramBounds(boxes.value);
   const width = canvasRef.value.clientWidth;
   const height = canvasRef.value.clientHeight;
   if (!width || !height) return;

   const scale = Math.min(
      MAX_ZOOM,
      1,
      (width - FIT_MARGIN * 2) / Math.max(1, bounds.width),
      (height - FIT_MARGIN * 2) / Math.max(1, bounds.height)
   );

   zoom.value = Math.max(MIN_ZOOM, scale);
   pan.value = {
      x: Math.max(FIT_MARGIN, (width - bounds.width * zoom.value) / 2) - bounds.x * zoom.value,
      y: Math.max(FIT_MARGIN, (height - bounds.height * zoom.value) / 2) - bounds.y * zoom.value
   };
};

/** Zooms keeping the point (x, y) of the canvas still (its center by default) */
const zoomAt = (newZoom: number, x?: number, y?: number) => {
   if (!canvasRef.value) return;

   x = x ?? canvasRef.value.clientWidth / 2;
   y = y ?? canvasRef.value.clientHeight / 2;

   const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
   const ratio = clamped / zoom.value;

   pan.value = {
      x: x - (x - pan.value.x) * ratio,
      y: y - (y - pan.value.y) * ratio
   };
   zoom.value = clamped;
};

const zoomBy = (factor: number) => zoomAt(zoom.value * factor);

const onWheel = (event: WheelEvent) => {
   if (event.ctrlKey || event.metaKey) {
      const rect = canvasRef.value.getBoundingClientRect();
      zoomAt(zoom.value * Math.exp(-event.deltaY / 500), event.clientX - rect.left, event.clientY - rect.top);
   }
   else {
      const dx = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
      const dy = event.shiftKey && !event.deltaX ? 0 : event.deltaY;
      pan.value = { x: pan.value.x - dx, y: pan.value.y - dy };
   }
};

const startPan = (event: MouseEvent) => {
   drag.value = {
      kind: 'pan',
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.value.x,
      originY: pan.value.y,
      moved: false
   };
   addDragListeners();
};

const startTableDrag = (table: string, event: MouseEvent) => {
   drag.value = {
      kind: 'table',
      table,
      startX: event.clientX,
      startY: event.clientY,
      originX: boxes.value[table].x,
      originY: boxes.value[table].y,
      moved: false
   };
   addDragListeners();
};

const onDragMove = (event: MouseEvent) => {
   if (!drag.value) return;

   const dx = event.clientX - drag.value.startX;
   const dy = event.clientY - drag.value.startY;
   if (Math.abs(dx) + Math.abs(dy) > 3) drag.value.moved = true;
   if (!drag.value.moved) return;

   if (drag.value.kind === 'pan')
      pan.value = { x: drag.value.originX + dx, y: drag.value.originY + dy };
   else {
      const name = drag.value.table;
      boxes.value = {
         ...boxes.value,
         [name]: {
            ...boxes.value[name],
            x: Math.round(drag.value.originX + dx / zoom.value),
            y: Math.round(drag.value.originY + dy / zoom.value)
         }
      };
   }
};

const onDragEnd = () => {
   if (drag.value && !drag.value.moved) { // A click: select the table, or clear the selection on the background
      selectedTable.value = drag.value.kind === 'table' && selectedTable.value !== drag.value.table
         ? drag.value.table
         : null;
   }

   drag.value = null;
   removeDragListeners();
};

const addDragListeners = () => {
   window.addEventListener('mousemove', onDragMove);
   window.addEventListener('mouseup', onDragEnd);
};

const removeDragListeners = () => {
   window.removeEventListener('mousemove', onDragMove);
   window.removeEventListener('mouseup', onDragEnd);
};

const openTableData = (table: string) => {
   newTab({
      uid: props.connection.uid,
      schema: props.schema,
      elementName: table,
      elementType: 'table',
      type: 'data'
   });
};

const INLINED_STYLES = [
   'fill',
   'fill-opacity',
   'stroke',
   'stroke-width',
   'stroke-opacity',
   'opacity',
   'font-family',
   'font-size',
   'font-weight',
   'font-style'
];

/** Standalone SVG of the whole diagram, with the theme colors inlined */
const buildSvg = () => {
   const bounds = diagramBounds(boxes.value);
   const clone = svgRef.value.cloneNode(true) as SVGSVGElement;

   const originals = svgRef.value.querySelectorAll('*');
   const copies = clone.querySelectorAll('*');
   originals.forEach((original, i) => {
      const computed = window.getComputedStyle(original);
      const style = INLINED_STYLES.map(prop => `${prop}:${computed.getPropertyValue(prop)}`).join(';');
      (copies[i] as SVGElement).setAttribute('style', style);
      copies[i].removeAttribute('class');
   });

   const width = Math.ceil(bounds.width + FIT_MARGIN * 2);
   const height = Math.ceil(bounds.height + FIT_MARGIN * 2);
   clone.setAttribute('width', String(width));
   clone.setAttribute('height', String(height));
   clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
   clone.removeAttribute('style');
   clone.querySelector('g').setAttribute('transform', `translate(${FIT_MARGIN - bounds.x} ${FIT_MARGIN - bounds.y})`);

   const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
   background.setAttribute('width', '100%');
   background.setAttribute('height', '100%');
   background.setAttribute('fill', window.getComputedStyle(canvasRef.value).backgroundColor);
   clone.insertBefore(background, clone.querySelector('g'));

   return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
};

const exportSvg = async () => {
   const selected = selectedTable.value;
   selectedTable.value = null; // Export without highlights
   hoveredTable.value = null;
   await nextTick();

   const content = buildSvg();
   selectedTable.value = selected;

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const result: any = await Application.showSaveDialog({
      filters: [{ name: 'SVG', extensions: ['svg'] }],
      defaultPath: `${props.schema}.svg`
   });

   if (!result || result.canceled) return;

   const { status, response } = await Application.writeFile(result.filePath, content);
   if (status === 'success')
      addNotification({ status: 'success', message: t('general.actionSuccessful', { action: t('database.exportAsSvg') }) });
   else
      addNotification({ status: 'error', message: response });
};

const reloadListener = () => {
   const hasModalOpen = !!document.querySelectorAll('.modal.active').length;
   if (props.isSelected && !hasModalOpen && !isLoading.value)
      getDiagram();
};

watch(() => props.isSelected, async (val) => {
   if (val) {
      changeBreadcrumbs({ schema: props.schema });
      await nextTick();
      resizeCanvas();
   }
});

onMounted(() => {
   window.addEventListener('resize', resizeCanvas);
   resizeCanvas();
});

onBeforeUnmount(() => {
   window.removeEventListener('resize', resizeCanvas);
   removeDragListeners();
   ipcRenderer.removeListener('run-or-reload', reloadListener);
});

ipcRenderer.on('run-or-reload', reloadListener);

getDiagram();
</script>

<style lang="scss" scoped>
.schema-diagram {
  position: relative;
  overflow: hidden;
  cursor: grab;

  &.panning {
    cursor: grabbing;
  }

  .empty {
    background: transparent;
  }
}

.schema-diagram-svg {
  display: block;
  width: 100%;
  height: 100%;
  font-size: 12px;

  .relation {
    fill: none;
    stroke-width: 1.5;
    transition: opacity 0.15s;

    &.active {
      stroke: var(--primary-color);
      stroke-width: 2;
    }

    &.dimmed {
      opacity: 0.15;
    }
  }

  .relation-marker {
    fill: none;
    stroke-width: 1.5;
  }

  .diagram-table {
    cursor: pointer;
    transition: opacity 0.15s;

    &.dimmed {
      opacity: 0.35;
    }

    &.selected .table-box {
      stroke: var(--primary-color);
      stroke-width: 2;
    }
  }

  .table-box {
    stroke-width: 1;
  }

  .table-name {
    font-weight: bold;
  }

  .field-row {
    fill: transparent;
  }

  .field-type {
    fill: currentcolor;
    font-size: 11px;
  }

  .column-key {
    fill: currentcolor;
  }
}
</style>
