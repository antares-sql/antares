import { SchemaDiagram, SchemaDiagramRelation, SchemaDiagramTable, TableField, TableForeign } from 'common/interfaces/antares';

import { DatabaseClient } from './contracts';

/** Tables introspected at the same time: enough to overlap round trips without flooding the pool */
const CONCURRENCY = 4;

/** Runs `fn` on every item with at most `limit` calls in flight, keeping the input order in the result */
async function mapLimit<T, R> (items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
   const results: R[] = new Array(items.length);
   let next = 0;

   const worker = async () => {
      while (next < items.length) {
         const i = next++;
         results[i] = await fn(items[i]);
      }
   };

   await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
   return results;
}

/** Names of the base tables (no views) of a schema */
async function getSchemaTables (client: DatabaseClient, schema: string): Promise<string[]> {
   const structure = await client.getStructure(new Set([schema])) as { name: string; tables: { name: string; type: string }[] }[];
   const schemaStructure = structure.find(s => s.name === schema);

   return schemaStructure
      ? schemaStructure.tables.filter(table => table.type === 'table').map(table => table.name)
      : [];
}

/**
 * Columns and foreign keys of the tables of a schema (all base tables if `tables` is omitted), for the relations diagram.
 * Uses only `getStructure`, `getTableColumns` and `getKeyUsage`, so it works with every engine.
 */
export async function getSchemaDiagram (client: DatabaseClient, schema: string, tables?: string[]): Promise<SchemaDiagram> {
   if (!tables)
      tables = await getSchemaTables(client, schema);

   const infos = await mapLimit(tables, CONCURRENCY, async table => {
      const columns = await client.getTableColumns({ schema, table }) as TableField[];
      const keys = await client.getKeyUsage({ schema, table }) as TableForeign[];
      return { table, columns: columns || [], keys: keys || [] };
   });

   const diagramTables: SchemaDiagramTable[] = infos.map(({ table, columns }) => ({
      name: table,
      fields: columns.map(column => ({
         name: column.name,
         type: column.type,
         key: column.key || '',
         nullable: column.nullable
      }))
   }));

   const relations: SchemaDiagramRelation[] = infos.flatMap(({ table, keys }) => keys.map(key => ({
      constraintName: String(key.constraintName),
      table,
      field: key.field,
      refSchema: key.refSchema || schema,
      refTable: key.refTable,
      refField: key.refField
   })));

   return { schema, tables: diagramTables, relations };
}
