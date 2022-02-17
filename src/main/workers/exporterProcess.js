// import MysqlExporter from '../libs/exporters/sql/MysqlExporter.js';
// import path from 'path';
// import fs from 'fs';
// let exporter;

// switch (type) {
//    case 'mysql':
//    case 'maria':
//       exporter = new MysqlExporter(connections[uid], tables, rest);
//       break;
//    default:
//             // return {
//             //    status: 'error',
//             //    response: `${type} exporter not aviable`
//             // };
// }

// const outputFileName = path.basename(rest.outputFile);

// if (fs.existsSync(rest.outputFile)) {
//    const result = await dialog.showMessageBox({
//       type: 'warning',
//       message: `File ${outputFileName} already exists. Do you want to replace it?`,
//       detail:
//                'A file with the same name already exists in the target folder. Replacing it will overwrite its current contents.',
//       buttons: ['Cancel', 'Replace'],
//       defaultId: 0,
//       cancelId: 0
//    });

//    if (result.response !== 1)
//       exporter = null;
//    // return { status: 'error', response: 'Operation aborted' };
// }

// // return new Promise((resolve, reject) => {
// exporter.once('error', err => {
//    reject(err);
// });

// exporter.once('end', () => {
//    resolve({ cancelled: exporter.isCancelled });
// });

// exporter.once('cancel', () => {
//    fs.unlinkSync(exporter.outputFile);
// });

// exporter.on('progress', state => {
//    event.sender.send('export-progress', state);
// });

// exporter.run();
// // })
// // .then(response => {
// //    if (!response.cancelled) {
// //       new Notification({
// //          title: 'Export finished',
// //          body: `Finished exporting to ${outputFileName}`
// //       }).show();
// //    }
// //    return { status: 'success', response };
// // })
// // .catch(err => {
// //    new Notification({
// //       title: 'Export error',
// //       body: err.toString()
// //    }).show();

// //    return { status: 'error', response: err.toString() };
// // })
// // .finally(() => {
// //    exporter.removeAllListeners();
// //    exporter = null;
// // });
