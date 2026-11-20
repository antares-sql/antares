/**
 * IPC handlers registered on a fake ipcMain, invoked like the renderer does,
 * with offline clients (no database): checks wiring, envelopes and executed SQL.
 */
import { describe, expect, it, vi } from 'vitest';

import connection from '../../../src/main/ipc-handlers/connection';
import database from '../../../src/main/ipc-handlers/database';
import functions from '../../../src/main/ipc-handlers/functions';
import { createHandle } from '../../../src/main/ipc-handlers/handle';
import routines from '../../../src/main/ipc-handlers/routines';
import schedulers from '../../../src/main/ipc-handlers/schedulers';
import schema from '../../../src/main/ipc-handlers/schema';
import tables from '../../../src/main/ipc-handlers/tables';
import triggers from '../../../src/main/ipc-handlers/triggers';
import users from '../../../src/main/ipc-handlers/users';
import userTypes from '../../../src/main/ipc-handlers/userTypes';
import views from '../../../src/main/ipc-handlers/views';
import { DatabaseClient } from '../../../src/main/libs/db/core/contracts';
import { appEvent, fakeIpc, foreignEvent } from '../../helpers/fakeIpc';
import { offlineClient } from '../../helpers/offlineClient';
import { captureRaw } from '../helpers/captureSql';

function setup () {
   const connections: Record<string, DatabaseClient> = {
      my: offlineClient('mysql'),
      lite: offlineClient('sqlite')
   };
   const capture = {
      my: captureRaw(connections.my as never),
      lite: captureRaw(connections.lite as never)
   };
   const ipc = fakeIpc();

   for (const register of [connection, tables, views, triggers, routines, functions, schedulers, database, schema, users, userTypes])
      register(connections, ipc.ipc);

   return { connections, capture, ipc };
}

describe('createHandle', () => {
   const register = (fn: () => unknown, validate = () => true) => {
      const ipc = fakeIpc();
      createHandle(ipc.ipc, validate)('ch', fn);
      return ipc;
   };

   it('wraps results in a success envelope', async () => {
      await expect(register(() => [1, 2]).invoke('ch')).resolves.toEqual({ status: 'success', response: [1, 2] });
   });

   it('omits response when the handler returns nothing', async () => {
      await expect(register(async () => undefined).invoke('ch')).resolves.toEqual({ status: 'success' });
   });

   it('turns exceptions into an error envelope', async () => {
      await expect(register(() => {
         throw new Error('boom');
      }).invoke('ch')).resolves.toEqual({ status: 'error', response: 'Error: boom' });
   });

   it('rejects unauthorized senders without running the handler', async () => {
      const fn = vi.fn();
      const ipc = register(fn, () => false);
      await expect(ipc.invokeFrom(foreignEvent, 'ch')).resolves.toEqual({ status: 'error', response: 'Unauthorized process' });
      expect(fn).not.toHaveBeenCalled();
   });

   it('passes the renderer arguments, not the event', async () => {
      const fn = vi.fn(() => 'ok');
      await register(fn).invoke('ch', { uid: 'x' }, 2);
      expect(fn).toHaveBeenCalledWith({ uid: 'x' }, 2);
   });
});

describe('IPC handlers', () => {
   it('registers every channel once', () => {
      expect(setup().ipc.channels()).toMatchSnapshot();
   });

   it('runs client methods and returns their result', async () => {
      const { ipc, capture } = setup();

      await expect(ipc.invoke('drop-view', { uid: 'my', schema: 's', view: 'v' })).resolves.toEqual({ status: 'success' });
      expect(capture.my.sql).toEqual(['DROP VIEW `s`.`v`']);
   });

   it('returns an error envelope for features the engine does not support', async () => {
      const { ipc } = setup();
      await expect(ipc.invoke('drop-routine', { uid: 'lite', schema: 'main', routine: 'r' }))
         .resolves.toEqual({ status: 'error', response: 'UnsupportedCapabilityError: "routines" is not supported by sqlite' });
   });

   it('returns an error envelope for unknown connections', async () => {
      const { ipc } = setup();
      const result = await ipc.invoke('get-table-columns', { uid: 'missing', schema: 's', table: 't' }) as { status: string };
      expect(result.status).toBe('error');
   });

   it('builds cell updates with the engine dialect', async () => {
      const { ipc, capture } = setup();
      const result = await ipc.invoke('update-table-cell', {
         uid: 'lite', schema: 'main', table: 't', primary: 'id', id: 'it\'s', field: 'name', type: 'VARCHAR', content: 'O\'Reilly', row: {}
      });

      expect(result).toEqual({ status: 'success', response: { reload: false } });
      expect(capture.lite.sql).toEqual(['UPDATE "main"."t" SET "name" = \'O\'\'Reilly\' WHERE "id" = \'it\'\'s\' LIMIT 1']);
   });

   // #1004: with a composite primary key the renderer sends no primary and a null id
   it('updates cells of tables with a composite primary key by every original value', async () => {
      const { ipc, capture } = setup();
      const result = await ipc.invoke('update-table-cell', {
         uid: 'lite',
         schema: 'main',
         table: 't',
         primary: undefined,
         id: null,
         field: 'v',
         type: 'TEXT',
         content: 'edited',
         row: { a: 1, b: 2, v: 'edited' },
         orgRow: { a: 1, b: 2, v: 'one-two' }
      });

      expect(result).toEqual({ status: 'success', response: { reload: true } });
      expect(capture.lite.sql).toEqual(['UPDATE "main"."t" SET "v" = \'edited\' WHERE "a" = 1 AND "b" = 2 AND "v" = \'one-two\' LIMIT 1']);
   });

   // validateSender accepts every sender on Windows (TEMP HOTFIX in libs/misc/validateSender.ts)
   it.skipIf(process.platform === 'win32')('rejects unauthorized senders on handlers with custom logic too', async () => {
      const { ipc } = setup();
      await expect(ipc.invokeFrom(foreignEvent, 'disconnect', 'my')).resolves.toEqual({ status: 'error', response: 'Unauthorized process' });
      expect(appEvent.senderFrame.url).toContain('localhost:9080');
   });
});
