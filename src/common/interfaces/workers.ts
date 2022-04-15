export type WorkerEvent = 'export-progress' | 'import-progress' | 'query-error' | 'end' | 'cancel' | 'error'

export interface WorkerIpcMessage {
   type: WorkerEvent;
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   payload: any;
}
