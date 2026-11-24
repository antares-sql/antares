export type WorkerEvent = 'export-progress' | 'import-progress' | 'query-error' | 'end' | 'cancel' | 'error'

export interface WorkerIpcMessage {
   type: WorkerEvent;
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   payload: any;
}

/** `workerData` of the exporter and importer threads */
export interface WorkerData {
   /** Logs folder of the app (`app.getPath('logs')`): workers can't load `electron` to get it */
   logsPath: string;
}
