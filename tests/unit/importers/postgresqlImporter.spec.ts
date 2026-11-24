import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Readable } from 'stream';
import { afterAll, describe, expect, it } from 'vitest';

import PostgreSQLImporter, { stripMetaCommands } from '../../../src/main/libs/importers/sql/PostgreSQLImporter';
import { InlineDataSink } from '../../../src/main/libs/importers/sql/ScriptImporter';

type Step = { sql: string; data?: string; aborted?: boolean };

/** PostgreSQL importer without a server: records the statements and the COPY data it would send */
class RecordingImporter extends PostgreSQLImporter {
   steps: Step[] = [];
   failing: RegExp | undefined;
   onStep: (importer: RecordingImporter) => void = () => null;

   protected open () {
      return Promise.resolve();
   }

   protected close () {
      return Promise.resolve();
   }

   protected async execute (sql: string) {
      this.steps.push({ sql });
      this.onStep(this);
      if (this.failing?.test(sql)) throw new Error(`failed: ${sql}`);
   }

   protected async openInlineData (sql: string): Promise<InlineDataSink> {
      if (this.failing?.test(sql)) throw new Error(`failed: ${sql}`);
      const step: Step = { sql, data: '' };
      this.steps.push(step);
      return {
         write: async data => {
            step.data += data;
            this.onStep(this);
         },
         end: async () => null,
         abort: () => {
            step.aborted = true;
         }
      };
   }
}

const files: string[] = [];
afterAll(() => {
   for (const file of files) fs.rmSync(file, { force: true });
});

/** Imports a script read in chunks of the given size */
async function importScript (script: string, chunkSize?: number, setup?: (importer: RecordingImporter) => void) {
   const file = path.join(os.tmpdir(), `antares-pg-import-${process.pid}-${files.length}.sql`);
   files.push(file);
   fs.writeFileSync(file, script);

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const importer = new RecordingImporter(null as any, { uid: 'test', schema: '', type: 'pg', file });
   setup?.(importer);
   const buffer = Buffer.from(script);
   if (chunkSize) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const internal = importer as any;
      internal._fileHandler.destroy();
      const chunks: Buffer[] = [];
      for (let i = 0; i < buffer.length; i += chunkSize) chunks.push(buffer.subarray(i, i + chunkSize));
      internal._fileHandler = Object.assign(Readable.from(chunks), { close: (): null => null });
   }

   const errors: string[] = [];
   importer.on('query-error', (error: { message: string }) => errors.push(error.message));
   await importer.run();
   return { steps: importer.steps, errors };
}

// Plain dump of pg_dump/pgAdmin (abridged), with standard conforming strings
const copyRows = [
   '1\tO\'Brien; Jr.\t$$ not a quote\t-- not a comment',
   '2\tC:\\\\dir\\\\\tline\\nbreak\t\\N',
   '3\t\\\\.\tit\'s\t/* x'
].join('\n') + '\n';

const dump = String.raw`--
-- PostgreSQL database dump
--

\restrict AbC123

SET statement_timeout = 0;
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);

--
-- Name: o'brien; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."o'brien" (
    id integer NOT NULL, -- the id
    name text DEFAULT 'it''s'::text
);

CREATE FUNCTION public.f() RETURNS text
    LANGUAGE plpgsql
    AS $_$
BEGIN
   -- don't break; here
   RETURN 'a\';
END;
$_$;

INSERT INTO public.paths VALUES (1, 'C:\dir\');
INSERT INTO public.paths VALUES (2, E'it\'s; \\');
COMMENT ON TABLE public.paths IS 'Windows path: C:\';

--
-- Data for Name: o'brien; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."o'brien" (id, name, a, b) FROM stdin;
` + copyRows + String.raw`\.


SELECT pg_catalog.setval('public.seq', 3, true);

--
-- PostgreSQL database dump complete
--

\unrestrict AbC123
`;

const expected: Step[] = [
   { sql: '--\n-- PostgreSQL database dump\n--\n\n\n\nSET statement_timeout = 0;' },
   { sql: 'SET standard_conforming_strings = on;' },
   { sql: 'SELECT pg_catalog.set_config(\'search_path\', \'\', false);' },
   { sql: '--\n-- Name: o\'brien; Type: TABLE; Schema: public; Owner: postgres\n--\n\nCREATE TABLE public."o\'brien" (\n    id integer NOT NULL, -- the id\n    name text DEFAULT \'it\'\'s\'::text\n);' },
   { sql: String.raw`CREATE FUNCTION public.f() RETURNS text
    LANGUAGE plpgsql
    AS $_$
BEGIN
   -- don't break; here
   RETURN 'a\';
END;
$_$;` },
   { sql: String.raw`INSERT INTO public.paths VALUES (1, 'C:\dir\');` },
   { sql: String.raw`INSERT INTO public.paths VALUES (2, E'it\'s; \\');` },
   { sql: String.raw`COMMENT ON TABLE public.paths IS 'Windows path: C:\';` },
   { sql: '--\n-- Data for Name: o\'brien; Type: TABLE DATA; Schema: public; Owner: postgres\n--\n\nCOPY public."o\'brien" (id, name, a, b) FROM stdin;', data: copyRows },
   { sql: 'SELECT pg_catalog.setval(\'public.seq\', 3, true);' }
];

describe('PostgreSQL import', () => {
   it('runs a pg_dump script: strings, comments, dollar quotes and COPY data', async () => {
      const { steps, errors } = await importScript(dump);
      expect(errors).toEqual([]);
      expect(steps).toEqual(expected);
   });

   it('reads the script in chunks like the whole script', async () => {
      for (const size of [1, 2, 3, 5, 7, 16, 64]) {
         const { steps } = await importScript(dump, size);
         // The data of COPY arrives in pieces
         expect(steps, `chunks of ${size}`).toEqual(expected);
      }
   });

   it('accepts CRLF line endings and data up to the end of the script', async () => {
      const crlf = await importScript('COPY t (a) FROM stdin;\r\n1\r\n2\r\n\\.\r\nSELECT 1;\r\n', 3);
      expect(crlf.steps).toEqual([{ sql: 'COPY t (a) FROM stdin;', data: '1\r\n2\r\n' }, { sql: 'SELECT 1;' }]);

      const unterminated = await importScript('COPY t (a) FROM STDIN;\n1\n2\n');
      expect(unterminated.steps).toEqual([{ sql: 'COPY t (a) FROM STDIN;', data: '1\n2\n' }]);

      const empty = await importScript('COPY t (a) FROM stdin;\n\\.\nSELECT 1;');
      expect(empty.steps).toEqual([{ sql: 'COPY t (a) FROM stdin;', data: '' }, { sql: 'SELECT 1;' }]);
   });

   it('skips the data of a failed COPY and goes on', async () => {
      const { steps, errors } = await importScript('COPY missing (a) FROM stdin;\nit\'s; not SQL\n\\.\nSELECT 1;\n', 4, importer => {
         importer.failing = /missing/;
      });
      expect(errors).toEqual(['failed: COPY missing (a) FROM stdin;']);
      expect(steps).toEqual([{ sql: 'SELECT 1;' }]);
   });

   it('does not take COPY TO or other statements as inline data', async () => {
      const { steps } = await importScript('COPY t TO STDOUT;\nCOPY t FROM \'/tmp/f\';\nSELECT 1;');
      expect(steps).toEqual([{ sql: 'COPY t TO STDOUT;' }, { sql: 'COPY t FROM \'/tmp/f\';' }, { sql: 'SELECT 1;' }]);
   });

   it('leaves out psql meta-commands and reports the ones with effects', async () => {
      expect(stripMetaCommands('\\set x 1\nSELECT \'\\x\', E\'\\\\\', "a\\b" -- \\c\n;')).toEqual({
         sql: '\nSELECT \'\\x\', E\'\\\\\', "a\\b" -- \\c\n;',
         commands: ['\\set x 1']
      });

      const { steps, errors } = await importScript('\\restrict k\nCREATE DATABASE d;\n\\connect d\nSELECT 1;\n\\unrestrict k\n');
      expect(steps).toEqual([{ sql: 'CREATE DATABASE d;' }, { sql: 'SELECT 1;' }]);
      expect(errors).toEqual(['psql meta-commands are not supported: skipped']);
   });

   it('aborts the COPY in progress when cancelled', async () => {
      const rows = Array.from({ length: 2000 }, (_, i) => `${i}\trow ${i}`).join('\n');
      const { steps } = await importScript(`COPY t (a, b) FROM stdin;\n${rows}\n\\.\nSELECT 1;\n`, 256, importer => {
         importer.onStep = recording => {
            if (recording.steps[0]?.data?.length > 1000) recording.cancel();
         };
      });
      expect(steps).toHaveLength(1);
      expect(steps[0].aborted).toBe(true);
   });
});
