import * as antares from 'common/interfaces/antares';

export interface EngineTypes {
   int: string;
   varchar: string;
   decimal: string;
   datetime: string;
}

export const engineTypes: Record<'mysql' | 'pg' | 'sqlite' | 'firebird', EngineTypes> = {
   mysql: { int: 'INT', varchar: 'VARCHAR', decimal: 'DECIMAL', datetime: 'DATETIME' },
   pg: { int: 'INTEGER', varchar: 'CHARACTER VARYING', decimal: 'NUMERIC', datetime: 'TIMESTAMP WITHOUT TIME ZONE' },
   sqlite: { int: 'INTEGER', varchar: 'VARCHAR', decimal: 'NUMERIC', datetime: 'DATETIME' },
   firebird: { int: 'INTEGER', varchar: 'VARCHAR', decimal: 'DECIMAL', datetime: 'TIMESTAMP' }
};

const SCHEMA = 'test_schema';
const TABLE = 'products';

const field = (props: Partial<antares.TableField> & { name: string; type: string }): antares.TableField => ({
   schema: SCHEMA,
   table: TABLE,
   alias: props.name,
   tableAlias: TABLE,
   orgTable: TABLE,
   orgName: props.name,
   nullable: false,
   unsigned: false,
   zerofill: false,
   default: null,
   numScale: null,
   ...props
});

export function buildFixtures (t: EngineTypes) {
   const fields = {
      id: field({ name: 'id', type: t.int, numLength: 11, autoIncrement: true, order: 1 }),
      name: field({ name: 'name', type: t.varchar, charLength: 100, nullable: true, default: '\'unnamed\'', comment: 'Product name', order: 2 }),
      price: field({ name: 'price', type: t.decimal, numLength: 10, numScale: 2, default: '0', order: 3 }),
      created: field({ name: 'created_at', type: t.datetime, nullable: true, order: 4 })
   };

   const indexes: Record<string, antares.TableIndex> = {
      primary: { name: 'PRIMARY', fields: ['id'], type: 'PRIMARY' },
      unique: { name: 'products_name_uq', fields: ['name'], type: 'UNIQUE' },
      index: { name: 'products_price_idx', fields: ['price', 'created_at'], type: 'INDEX' }
   };

   const foreign: antares.TableForeign = {
      constraintName: 'products_category_fk',
      refSchema: SCHEMA,
      table: TABLE,
      refTable: 'categories',
      field: 'category_id',
      refField: 'id',
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
   };

   const check: antares.TableCheck = { name: 'products_price_chk', clause: 'price >= 0' };

   const createTable: antares.CreateTableParams = {
      schema: SCHEMA,
      fields: [fields.id, fields.name, fields.price, fields.created],
      indexes: [indexes.primary, indexes.unique, indexes.index],
      foreigns: [foreign],
      checks: [check],
      options: {
         name: TABLE,
         comment: 'Products table',
         collation: 'utf8mb4_general_ci',
         engine: 'InnoDB'
      }
   };

   const renamedName = { ...fields.name, name: 'title', orgName: 'name', charLength: 150 };
   const stock = field({ name: 'stock', type: t.int, numLength: 11, default: '0', after: 'price' });

   const alterTable: antares.AlterTableParams = {
      schema: SCHEMA,
      table: TABLE,
      additions: [stock],
      changes: [renamedName],
      deletions: [fields.created],
      tableStructure: {
         name: TABLE,
         fields: [fields.id, renamedName, fields.price, stock],
         foreigns: [foreign],
         indexes: [indexes.primary, indexes.index]
      },
      indexChanges: {
         additions: [{ name: 'products_stock_idx', fields: ['stock'], type: 'INDEX' }],
         changes: [{ ...indexes.index, fields: ['price'], oldName: 'products_price_idx', oldType: 'INDEX' }],
         deletions: [indexes.unique]
      },
      foreignChanges: {
         additions: [{ ...foreign, constraintName: 'products_supplier_fk', field: 'supplier_id', refTable: 'suppliers' }],
         changes: [{ ...foreign, onDelete: 'CASCADE', oldName: 'products_category_fk' }],
         deletions: [{ ...foreign, constraintName: 'products_old_fk' }]
      },
      checkChanges: {
         additions: [{ name: 'products_stock_chk', clause: 'stock >= 0' }],
         changes: [{ ...check, clause: 'price > 0' }],
         deletions: [{ name: 'products_old_chk', clause: '1 = 1' }]
      },
      options: { comment: 'Updated comment', engine: 'InnoDB', autoIncrement: 100 as unknown as boolean, collation: 'utf8mb4_bin', name: 'items' }
   };

   const view: antares.AlterViewParams = {
      schema: SCHEMA,
      name: 'expensive_products',
      oldName: 'old_expensive_products',
      algorithm: 'MERGE',
      definer: '`root`@`%`',
      security: 'DEFINER',
      sql: 'SELECT * FROM products WHERE price > 100',
      updateOption: 'CASCADED'
   };

   const trigger: antares.AlterTriggerParams = {
      schema: SCHEMA,
      name: 'products_bi',
      oldName: 'products_bi_old',
      definer: '`root`@`%`',
      activation: 'BEFORE',
      event: 'INSERT',
      table: TABLE,
      sql: 'BEGIN SET NEW.price = ABS(NEW.price); END'
   };

   const parameters: antares.FunctionParam[] = [
      { _antares_id: 'p1', context: 'IN', name: 'p_id', type: t.int, length: 11 },
      { _antares_id: 'p2', context: 'OUT', name: 'p_name', type: t.varchar, length: 100 }
   ];

   const routine: antares.AlterRoutineParams = {
      schema: SCHEMA,
      name: 'get_product',
      oldName: 'get_product_old',
      parameters,
      definer: '`root`@`%`',
      deterministic: true,
      dataAccess: 'READS SQL DATA',
      security: 'DEFINER',
      comment: 'Fetch a product',
      language: 'plpgsql',
      sql: 'BEGIN SELECT name INTO p_name FROM products WHERE id = p_id; END'
   };

   const func: antares.AlterFunctionParams = {
      schema: SCHEMA,
      name: 'product_price',
      oldName: 'product_price_old',
      parameters: [parameters[0]],
      definer: '`root`@`%`',
      deterministic: false,
      dataAccess: 'CONTAINS SQL',
      security: 'INVOKER',
      comment: 'Price of a product',
      language: 'plpgsql',
      returns: t.decimal,
      returnsLength: 10,
      sql: 'BEGIN RETURN (SELECT price FROM products WHERE id = p_id); END'
   };

   const event: antares.AlterEventParams = {
      schema: SCHEMA,
      name: 'cleanup',
      oldName: 'cleanup_old',
      definer: '`root`@`%`',
      execution: 'EVERY',
      every: ['1', 'DAY'],
      starts: '2026-01-01 00:00:00',
      ends: '',
      at: '',
      preserve: true,
      state: 'ENABLE',
      comment: 'Nightly cleanup',
      sql: 'DELETE FROM products WHERE stock = 0'
   };

   return { schema: SCHEMA, table: TABLE, createTable, alterTable, view, trigger, routine, func, event };
}
