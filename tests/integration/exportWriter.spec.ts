/**
 * Export writer: memory must stay bounded when rows are produced faster than they are written.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterAll, describe, expect, it } from 'vitest';

import { BaseExporter } from '../../src/main/libs/exporters/BaseExporter';

const CHUNK = 'x'.repeat(64 * 1024);
const CHUNKS = 1024; // 64 MB

class FastProducer extends BaseExporter {
   maxBuffered = 0;

   async dump () {
      for (let i = 0; i < CHUNKS; i++) {
         await this.writeString(CHUNK);
         this.maxBuffered = Math.max(this.maxBuffered, this._processedStream.writableLength);
      }
   }
}

describe('export writer', () => {
   const files: string[] = [];
   afterAll(() => files.forEach(file => fs.rmSync(file, { force: true })));

   // #970: the whole table was buffered in memory and the export froze on big tables
   it.each(['sql', 'sql.zip'])('waits for the %s output to drain', async outputFormat => {
      const outputFile = path.join(os.tmpdir(), `antares-export-${process.pid}.${outputFormat}`);
      files.push(outputFile);
      const exporter = new FastProducer([], { outputFile, outputFormat } as never);

      await exporter.run();

      expect(exporter.maxBuffered).toBeLessThanOrEqual(4 * CHUNK.length);
      if (outputFormat === 'sql')
         expect(fs.statSync(outputFile).size).toBe(CHUNKS * CHUNK.length);
   });
});
