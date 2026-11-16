/**
 * Records the results of `client.raw()` against a real database and replays them offline.
 * Introspection fixtures (tests/fixtures/introspection) are built with it: the integration
 * recorder captures real server rows, unit tests replay them through the same client code.
 */
import * as antares from 'common/interfaces/antares';
import { vi } from 'vitest';

export interface RecordedQuery {
   sql: string;
   args?: antares.QueryParams;
   result?: unknown;
   error?: string;
}

export interface RecordedCall {
   method: string;
   params: unknown[];
   queries: RecordedQuery[];
   output?: unknown;
   error?: string;
}

export interface FixtureFile {
   engine: string;
   /** Server version the rows were recorded from */
   server: string;
   calls: RecordedCall[];
}

export const normalizeSql = (sql: string) => sql.replace(/\s+/g, ' ').trim();

/** JSON round-trip, keeping Buffers (fixtures are JSON files) */
export const toJson = <T>(value: T): T => JSON.parse(JSON.stringify(value ?? null), reviver);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function reviver (_key: string, value: any) {
   if (value && value.type === 'Buffer' && Array.isArray(value.data))
      return Buffer.from(value.data);
   return value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawClient = { raw: (...args: any[]) => Promise<any> };

/** Passes queries through to the real `raw()` and records them */
export function recordRaw (client: RawClient) {
   const original = client.raw.bind(client);
   let queries: RecordedQuery[] = [];

   vi.spyOn(client, 'raw').mockImplementation(async (sql: string, args?: antares.QueryParams) => {
      const entry: RecordedQuery = { sql: normalizeSql(sql), ...(args ? { args } : {}) };
      queries.push(entry);
      try {
         const result = await original(sql, args);
         entry.result = toJson(result);
         return result;
      }
      catch (err) {
         entry.error = String(err);
         throw err;
      }
   });

   return {
      /** Returns the queries recorded since the last call */
      take () {
         const taken = queries;
         queries = [];
         return taken;
      }
   };
}

/** Serves recorded results in order, checking that the client runs the same SQL */
export function replayRaw (client: RawClient, queries: RecordedQuery[]) {
   let index = 0;

   vi.spyOn(client, 'raw').mockImplementation(async (sql: string) => {
      const expected = queries[index++];
      if (!expected)
         throw new Error(`Unexpected query #${index}: ${normalizeSql(sql)}`);
      if (expected.sql !== normalizeSql(sql))
         throw new Error(`Query #${index} differs from the recording.\nExpected: ${expected.sql}\nReceived: ${normalizeSql(sql)}`);
      if (expected.error)
         throw new Error(expected.error);
      return toJson(expected.result);
   });

   return {
      get remaining () {
         return queries.length - index;
      }
   };
}
