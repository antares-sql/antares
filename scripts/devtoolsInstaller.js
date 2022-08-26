// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
const fs = require('fs');
const path = require('path');
const https = require('https');
const unzip = require('unzip-crx-3');
const { antares } = require('../package.json');

const extensionID = antares.devtoolsId;
const destFolder = path.resolve(__dirname, `../misc/${extensionID}`);
const filePath = path.resolve(__dirname, `${destFolder}${extensionID}.crx`);
const fileUrl = `https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&x=id%3D${extensionID}%26uc&prodversion=32`;
const fileStream = fs.createWriteStream(filePath);

const downloadFile = url => {
   return new Promise((resolve, reject) => {
      const request = https.get(url);

      request.on('response', response => {
         if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            return downloadFile(response.headers.location)
               .then(resolve)
               .catch(reject);
         }

         response.pipe(fileStream);

         response.on('close', () => {
            console.log('Devtools download completed!');
            resolve();
         });
         response.on('error', reject);
      });
      request.on('error', reject);
      request.end();
   });
};

(async () => {
   try {
      await downloadFile(fileUrl);
      await unzip(filePath, destFolder);
      fs.unlinkSync(filePath);
      fs.unlinkSync(`${destFolder}/package.json`);// <- Avoid to display annoyng npm script in vscode
   }
   catch (error) {
      console.log(error);
   }
})();
