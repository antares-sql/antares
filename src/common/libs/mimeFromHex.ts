export function mimeFromHex (hex: string) {
   switch (hex.substring(0, 4)) { // 2 bytes
      case '424D':
         return { ext: 'bmp', mime: 'image/bmp' };
      case '1F8B':
         return { ext: 'tar.gz', mime: 'application/gzip' };
      case '0B77':
         return { ext: 'ac3', mime: 'audio/vnd.dolby.dd-raw' };
      case '7801':
         return { ext: 'dmg', mime: 'application/x-apple-diskimage' };
      case '4D5A':
         return { ext: 'exe', mime: 'application/x-msdownload' };
      case '1FA0':
      case '1F9D':
         return { ext: 'Z', mime: 'application/x-compress' };
      default:
         switch (hex.substring(0, 6)) { // 3 bytes
            case 'FFD8FF':
               return { ext: 'jpg', mime: 'image/jpeg' };
            case '4949BC':
               return { ext: 'jxr', mime: 'image/vnd.ms-photo' };
            case '425A68':
               return { ext: 'bz2', mime: 'application/x-bzip2' };
            default:
               switch (hex) { // 4 bites
                  case '89504E47':
                     return { ext: 'png', mime: 'image/png' };
                  case '47494638':
                     return { ext: 'gif', mime: 'image/gif' };
                  case '25504446':
                     return { ext: 'pdf', mime: 'application/pdf' };
                  case '504B0304':
                     return { ext: 'zip', mime: 'application/zip' };
                  case '425047FB':
                     return { ext: 'bpg', mime: 'image/bpg' };
                  case '4D4D002A':
                     return { ext: 'tif', mime: 'image/tiff' };
                  case '00000100':
                     return { ext: 'ico', mime: 'image/x-icon' };
                  default:
                     return { ext: '', mime: 'unknown ' + hex };
               }
         }
   }
}
