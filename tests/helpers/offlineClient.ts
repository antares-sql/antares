import { vi } from 'vitest';

import { ClientsFactory } from '../../src/main/libs/ClientsFactory';

/** A client that is never connected: queries are served by a fake raw() (see rawRecorder) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function offlineClient (engine: 'mysql' | 'maria' | 'pg' | 'sqlite' | 'firebird'): any {
   const client = ClientsFactory.getClient({ client: engine, uid: 'offline', params: {} as never });
   // User settings live in electron-store, which needs a real Electron main process
   if ('_getShowTableSizeSetting' in client)
      vi.spyOn(client as never, '_getShowTableSizeSetting').mockReturnValue(false as never);
   return client;
}

/** Rebuilds params serialized in fixtures (Sets are stored as { $set: [...] }) */
export const deserializeParams = (params: unknown[]) =>
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   params.map((p: any) => p && Array.isArray(p.$set) ? new Set(p.$set) : p);
