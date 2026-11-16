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

   // Like ipcRenderer.invoke: always a Promise, even when the handler is synchronous
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const invokeFrom = async (event: unknown, channel: string, ...args: any[]): Promise<unknown> => {
      const handler = handlers.get(channel);
      if (!handler) throw new Error(`No IPC handler: ${channel}`);
      return handler(event, ...args);
   };

   return {
      ipc,
      channels: () => [...handlers.keys()].sort(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      invoke: (channel: string, ...args: any[]) => invokeFrom(appEvent, channel, ...args),
      invokeFrom
   };
}
