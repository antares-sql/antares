import { IpcMainLike } from '../../src/main/ipc-handlers/handle';

/** Frame accepted by validateSender in development (dev server URL) */
export const appEvent = { senderFrame: { url: 'http://localhost:9080/' } };
export const foreignEvent = { senderFrame: { url: 'https://evil.example.com/' } };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener = (event: any, ...args: any[]) => unknown;

/** An ipcMain stand-in: collects handlers and lets tests invoke them like the renderer does */
export function fakeIpc () {
   const handlers = new Map<string, Listener>();
   const listeners = new Map<string, Listener>();

   const ipc: IpcMainLike = {
      handle: (channel, listener) => {
         if (handlers.has(channel)) throw new Error(`Duplicate IPC handler: ${channel}`);
         handlers.set(channel, listener);
      },
      on: (channel, listener) => listeners.set(channel, listener)
   };

   return {
      ipc,
      channels: () => [...handlers.keys()].sort(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      invoke: (channel: string, ...args: any[]) => {
         const handler = handlers.get(channel);
         if (!handler) throw new Error(`No IPC handler: ${channel}`);
         return handler(appEvent, ...args);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      invokeFrom: (event: unknown, channel: string, ...args: any[]) => handlers.get(channel)(event, ...args)
   };
}
