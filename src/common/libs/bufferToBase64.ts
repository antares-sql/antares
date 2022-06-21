export function bufferToBase64 (buf: Buffer) {
   const binstr = Array.prototype.map.call(buf, ch => {
      return String.fromCharCode(ch);
   }).join('');
   return Buffer.from(binstr, 'binary').toString('base64');
}
