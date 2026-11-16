import { IpcMainInvokeEvent } from 'electron';

import { validateSender } from '../libs/misc/validateSender';

/** The subset of Electron's ipcMain used by the handlers (a fake one is used in tests) */
export interface IpcMainLike {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   handle (channel: string, listener: (event: IpcMainInvokeEvent, ...args: any[]) => unknown): void;
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   on (channel: string, listener: (event: any, ...args: any[]) => void): unknown;
}

export type SenderValidator = (frame: IpcMainInvokeEvent['senderFrame']) => boolean;

export interface IpcEnvelope {
   status: 'success' | 'error';
   response?: unknown;
}

export const UNAUTHORIZED: IpcEnvelope = { status: 'error', response: 'Unauthorized process' };

/**
 * Returns a `handle(channel, fn)` that registers an IPC handler which:
 * - rejects senders that are not the app window
 * - returns `{ status: 'success', response }` (no `response` when fn returns nothing)
 * - turns exceptions into `{ status: 'error', response: message }`
 */
export function createHandle (ipc: IpcMainLike, validate: SenderValidator = validateSender) {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   return (channel: string, fn: (...args: any[]) => unknown) => {
      ipc.handle(channel, async (event, ...args) => {
         if (!validate(event.senderFrame)) return UNAUTHORIZED;

         try {
            const result = await fn(...args);
            return result === undefined
               ? { status: 'success' }
               : { status: 'success', response: result };
         }
         catch (err) {
            return { status: 'error', response: err.toString() };
         }
      });
   };
}
