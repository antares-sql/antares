'use strict';
export function bufferToBase64 (buf) {
   const binstr = Array.prototype.map.call(buf, ch => {
      return String.fromCharCode(ch);
   }).join('');
   return btoa(binstr);
}
