import { SchemaDiagram, SchemaDiagramRelation, SchemaDiagramTable } from 'common/interfaces/antares';

/*
 * Pure layout of the schema relations diagram (no DOM): table box sizes, positions and relation paths.
 *
 * Tables linked by foreign keys are placed in columns: referenced tables on the left, the tables
 * that reference them on the right (longest-path layering), ordered to reduce crossings.
 * Tables without relations go in a grid below.
 */

export const HEADER_HEIGHT = 28;
export const ROW_HEIGHT = 20;
export const BOX_PADDING = 6;
export const MIN_WIDTH = 150;
export const MAX_WIDTH = 340;
export const NAME_CHAR_WIDTH = 7.2;
export const TYPE_CHAR_WIDTH = 6.2;
export const FIELD_GAP = 16;
/** Space on the left of field rows for the key icon */
export const ICON_SPACE = 22;

const GAP_X = 100;
const GAP_Y = 30;
const MAX_COLUMN_HEIGHT = 1400;
const ISOLATED_MARGIN = 80;

export interface DiagramPoint { x: number; y: number }

export interface DiagramBox extends DiagramPoint {
   width: number;
   height: number;
}

/** Relations whose both ends are tables of the diagram */
export function visibleRelations (diagram: SchemaDiagram): SchemaDiagramRelation[] {
   const names = new Set(diagram.tables.map(t => t.name));
   return diagram.relations.filter(r =>
      r.refSchema === diagram.schema &&
      names.has(r.table) &&
      names.has(r.refTable)
   );
}

export function boxSize (table: SchemaDiagramTable): { width: number; height: number } {
   let width = table.name.length * NAME_CHAR_WIDTH + 2 * BOX_PADDING + 8;

   for (const field of table.fields) {
      const rowWidth = ICON_SPACE +
         field.name.length * NAME_CHAR_WIDTH +
         FIELD_GAP +
         (field.type || '').length * TYPE_CHAR_WIDTH +
         BOX_PADDING * 2;
      width = Math.max(width, rowWidth);
   }

   return {
      width: Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width))),
      height: HEADER_HEIGHT + table.fields.length * ROW_HEIGHT + BOX_PADDING
   };
}

/** Column index of every linked table: 0 for tables that reference nothing, then 1 + the deepest referenced table */
function computeLayers (names: string[], parents: Map<string, Set<string>>): Map<string, number> {
   const layers = new Map<string, number>();
   const visiting = new Set<string>();

   const visit = (name: string): number => {
      if (layers.has(name)) return layers.get(name);
      if (visiting.has(name)) return -1; // Cycle: ignore the back edge

      visiting.add(name);
      let layer = 0;
      for (const parent of parents.get(name) || [])
         layer = Math.max(layer, visit(parent) + 1);
      visiting.delete(name);

      layers.set(name, layer);
      return layer;
   };

   for (const name of names)
      visit(name);

   return layers;
}

/** Reorders the tables of each column by the mean position of their neighbors (barycenter heuristic) */
function orderColumns (columns: string[][], neighbors: Map<string, Set<string>>) {
   const position = new Map<string, number>();
   const updatePositions = () => columns.forEach(col => col.forEach((name, i) => position.set(name, i / Math.max(1, col.length - 1))));

   updatePositions();

   const sortColumn = (col: string[], ref: Set<string>) => {
      const weight = new Map<string, number>();
      col.forEach((name, i) => {
         const linked = [...(neighbors.get(name) || [])].filter(n => ref.has(n));
         weight.set(name, linked.length
            ? linked.reduce((sum, n) => sum + position.get(n), 0) / linked.length
            : i / Math.max(1, col.length - 1));
      });
      col.sort((a, b) => weight.get(a) - weight.get(b));
   };

   for (let iteration = 0; iteration < 4; iteration++) {
      const forward = iteration % 2 === 0;
      const indexes = columns.map((_, i) => i);
      if (!forward) indexes.reverse();

      for (const i of indexes.slice(1)) {
         const adjacent = columns[forward ? i - 1 : i + 1];
         sortColumn(columns[i], new Set(adjacent));
         updatePositions();
      }
   }
}

/** Splits a column taller than MAX_COLUMN_HEIGHT into several adjacent columns */
function splitColumn (column: string[], sizes: Map<string, { height: number }>): string[][] {
   const result: string[][] = [[]];
   let height = 0;

   for (const name of column) {
      const h = sizes.get(name).height + GAP_Y;
      if (height + h > MAX_COLUMN_HEIGHT && result[result.length - 1].length) {
         result.push([]);
         height = 0;
      }
      result[result.length - 1].push(name);
      height += h;
   }

   return result;
}

/** Position and size of every table box */
export function layoutDiagram (diagram: SchemaDiagram): Record<string, DiagramBox> {
   const sizes = new Map(diagram.tables.map(t => [t.name, boxSize(t)]));
   const parents = new Map<string, Set<string>>();
   const neighbors = new Map<string, Set<string>>();
   const link = (map: Map<string, Set<string>>, a: string, b: string) => {
      if (!map.has(a)) map.set(a, new Set());
      map.get(a).add(b);
   };

   for (const relation of visibleRelations(diagram)) {
      if (relation.table === relation.refTable) continue;
      link(parents, relation.table, relation.refTable);
      link(neighbors, relation.table, relation.refTable);
      link(neighbors, relation.refTable, relation.table);
   }

   const names = diagram.tables.map(t => t.name).sort((a, b) => a.localeCompare(b));
   const linked = names.filter(name => neighbors.has(name));
   const isolated = names.filter(name => !neighbors.has(name));

   const boxes: Record<string, DiagramBox> = {};

   // Linked tables, in columns
   const layers = computeLayers(linked, parents);
   const layerColumns: string[][] = [];
   for (const name of linked) {
      const layer = layers.get(name);
      (layerColumns[layer] = layerColumns[layer] || []).push(name);
   }

   const columns = layerColumns.filter(Boolean);
   orderColumns(columns, neighbors);

   const finalColumns = columns.flatMap(col => splitColumn(col, sizes));
   const columnHeight = (col: string[]) => col.reduce((sum, name) => sum + sizes.get(name).height, 0) + GAP_Y * (col.length - 1);
   const maxHeight = finalColumns.reduce((max, col) => Math.max(max, columnHeight(col)), 0);

   let x = 0;
   for (const col of finalColumns) {
      let y = Math.round((maxHeight - columnHeight(col)) / 2);
      const width = col.reduce((max, name) => Math.max(max, sizes.get(name).width), 0);

      for (const name of col) {
         boxes[name] = { x, y, ...sizes.get(name) };
         y += sizes.get(name).height + GAP_Y;
      }

      x += width + GAP_X;
   }

   // Isolated tables, in a grid
   const linkedWidth = Math.max(0, x - GAP_X);
   const rowWidth = Math.max(linkedWidth, 1200);
   let cursorX = 0;
   let cursorY = linked.length ? maxHeight + ISOLATED_MARGIN : 0;
   let rowHeight = 0;

   for (const name of isolated) {
      const size = sizes.get(name);
      if (cursorX > 0 && cursorX + size.width > rowWidth) {
         cursorX = 0;
         cursorY += rowHeight + GAP_Y;
         rowHeight = 0;
      }
      boxes[name] = { x: cursorX, y: cursorY, ...size };
      cursorX += size.width + GAP_Y;
      rowHeight = Math.max(rowHeight, size.height);
   }

   return boxes;
}

/** Bounding box of all the boxes */
export function diagramBounds (boxes: Record<string, DiagramBox>): DiagramBox {
   const values = Object.values(boxes);
   if (!values.length) return { x: 0, y: 0, width: 0, height: 0 };

   const minX = Math.min(...values.map(b => b.x));
   const minY = Math.min(...values.map(b => b.y));
   const maxX = Math.max(...values.map(b => b.x + b.width));
   const maxY = Math.max(...values.map(b => b.y + b.height));

   return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Vertical center of a field row (of the header if the field is not found) */
export function fieldY (box: DiagramBox, table: SchemaDiagramTable, field: string): number {
   const index = table.fields.findIndex(f => f.name === field);
   return index === -1
      ? box.y + HEADER_HEIGHT / 2
      : box.y + HEADER_HEIGHT + index * ROW_HEIGHT + ROW_HEIGHT / 2;
}

/**
 * SVG path of a relation, from the foreign key field of `source` to the referenced field of `target`.
 * It leaves and enters the boxes on the facing sides; boxes that overlap horizontally (same column or
 * self reference) are joined by a loop on their right side.
 */
export function relationPath (source: DiagramBox, sourceY: number, target: DiagramBox, targetY: number): string {
   let startX: number;
   let endX: number;
   let startDir: number;
   let endDir: number;

   if (target.x >= source.x + source.width) {
      startX = source.x + source.width; startDir = 1;
      endX = target.x; endDir = -1;
   }
   else if (target.x + target.width <= source.x) {
      startX = source.x; startDir = -1;
      endX = target.x + target.width; endDir = 1;
   }
   else {
      startX = source.x + source.width; startDir = 1;
      endX = target.x + target.width; endDir = 1;
   }

   const curve = startDir === endDir
      ? Math.max(40, Math.abs(endX - startX) + 40, Math.abs(targetY - sourceY) / 4)
      : Math.max(40, Math.abs(endX - startX) / 2);

   const c1x = startX + startDir * curve;
   const c2x = endX + endDir * curve;

   return `M ${startX} ${sourceY} C ${c1x} ${sourceY}, ${c2x} ${targetY}, ${endX} ${targetY}`;
}
