import { Worker, isMainThread, workerData, parentPort } from 'worker_threads';
import 

if (isMainThread) {
   module.exports = function run (workerData) {
      return new Promise((resolve, reject) => {
         const worker = new Worker(__filename, { workerData });
         worker.on('message', resolve);
         worker.on('error', reject);
         worker.on('exit', (code) => {
            if (code !== 0)
               reject(new Error(`Worker stopped with exit code ${code}`));
         });
      });
   };
}
else {
  
}
