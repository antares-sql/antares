import { WorkerData } from 'common/interfaces/workers';
import * as log from 'electron-log/node';
import * as path from 'path';
import { workerData } from 'worker_threads';

/**
 * Logger of the worker threads.
 * `electron-log/main` can't be used here: it requires the `electron` module, which exists only in the
 * main thread (in development it resolves to the npm package, in the packaged app the import fails).
 * The logs folder comes from the main process, so the file lands next to main.log.
 */
const { logsPath } = (workerData ?? {}) as Partial<WorkerData>;

if (logsPath)
   log.transports.file.resolvePathFn = () => path.join(logsPath, 'workers.log');
else
   log.transports.file.fileName = 'workers.log';

log.transports.console = null;
log.errorHandler.startCatching();

export default log;
