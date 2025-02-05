import { match } from 'ciaplu';

export function mimeFromHex (hex: string) {
   return match(hex.substring(0, 4)) // 2 bytes
      .with('424D', () => ({ ext: 'bmp', mime: 'image/bmp' }))
      .with('1F8B', () => ({ ext: 'tar.gz', mime: 'application/gzip' }))
      .with('0B77', () => ({ ext: 'ac3', mime: 'audio/vnd.dolby.dd-raw' }))
      .with('7801', () => ({ ext: 'dmg', mime: 'application/x-apple-diskimage' }))
      .with('4D5A', () => ({ ext: 'exe', mime: 'application/x-msdownload' }))
      .when((val) => ['1FA0', '1F9D'].includes(val), () => ({ ext: 'Z', mime: 'application/x-compress' }))
      .extracting(() => hex.substring(0, 6)) // 3 bytes
      .with('FFD8FF', () => ({ ext: 'jpg', mime: 'image/jpeg' }))
      .with('4949BC', () => ({ ext: 'jxr', mime: 'image/vnd.ms-photo' }))
      .with('425A68', () => ({ ext: 'bz2', mime: 'application/x-bzip2' }))
      .extracting(() => hex) // 4 bytes
      .with('89504E47', () => ({ ext: 'png', mime: 'image/png' }))
      .with('47494638', () => ({ ext: 'gif', mime: 'image/gif' }))
      .with('25504446', () => ({ ext: 'pdf', mime: 'application/pdf' }))
      .with('504B0304', () => ({ ext: 'zip', mime: 'application/zip' }))
      .with('425047FB', () => ({ ext: 'bpg', mime: 'image/bpg' }))
      .with('4D4D002A', () => ({ ext: 'tif', mime: 'image/tiff' }))
      .with('00000100', () => ({ ext: 'ico', mime: 'image/x-icon' }))
      .otherwise(() => ({ ext: '', mime: 'unknown ' + hex }))
      .return();
}
