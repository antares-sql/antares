/**
 * Replays introspection fixtures recorded from real servers (tests/fixtures/introspection)
 * through the client code, without a database.
 *
 * Re-record after changing a query or the fixture schema: npm run test:fixtures:record
 * A changed output must be intentional: re-recording updates the expected outputs too.
 */
import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

import { deserializeParams, offlineClient } from '../../helpers/offlineClient';
import { FixtureFile, replayRaw, reviver, toJson } from '../../helpers/rawRecorder';

const FIXTURES_DIR = path.join(__dirname, '../../fixtures/introspection');

const fixtures: FixtureFile[] = fs.readdirSync(FIXTURES_DIR)
   .filter(file => file.endsWith('.json'))
   .map(file => JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf8'), reviver));

for (const fixture of fixtures) {
   describe(`${fixture.engine} introspection (recorded from ${fixture.server})`, () => {
      fixture.calls.forEach((call, i) => {
         it(`${call.method} #${i}`, async () => {
            const client = offlineClient(fixture.engine as never);
            const replay = replayRaw(client, call.queries);

            let output: unknown;
            let error: string;
            try {
               output = toJson(await client[call.method](...deserializeParams(call.params)));
            }
            catch (err) {
               error = String(err);
            }

            expect(error).toBe(call.error);
            expect(output).toEqual(call.output);
            expect(replay.remaining).toBe(0);
         });
      });
   });
}
