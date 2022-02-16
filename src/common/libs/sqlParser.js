import { Duplex } from 'stream';

export default class SqlParser extends Duplex {
   constructor (opts) {
      opts = {
         delimiter: ';',
         encoding: 'utf8',
         writableObjectMode: true,
         readableObjectMode: true,
         ...opts
      };
      super(opts);
      this._buffer = [];
      this.encoding = opts.encoding;
      this.delimiter = opts.delimiter;

      this.isEscape = false;
      this.currentQuote = '';
      this.isDelimiter = false;
   }

   _write (chunk, encoding, next) {
      const str = chunk.toString(this.encoding);

      for (let i = 0; i < str.length; i++) {
         const currentChar = str[i];
         this.checkEscape();
         this._buffer.push(currentChar);
         // this.checkNewDelimiter(currentChar);
         this.checkQuote(currentChar);
         const query = this.getQuery();

         if (query)
            this.push(query);
      }

      next();
   }

   checkEscape () {
      if (this._buffer.length > 0) {
         this.isEscape = this._buffer[this._buffer.length - 1] === '\\'
            ? !this.isEscape
            : false;
      }
   }

   checkNewDelimiter (char) {
      if (this.parsedStr.toLowerCase() === 'delimiter' && this.currentQuote === '') {
         this.isDelimiter = true;
         this._buffer = [];
      }
      else {
         const isNewLine = ['\n', '\r'].includes(char);
         if (isNewLine && this.isDelimiter) {
            this.isDelimiter = false;
            this.delimiter = this.parsedStr;
            this._buffer = [];
         }
      }
   }

   checkQuote (char) {
      const isQuote = !this.isEscape && ['"', '\''].includes(char);
      if (isQuote && this.currentQuote === char)
         this.currentQuote = '';

      else if (isQuote && this.currentQuote === '')
         this.currentQuote = char;
   }

   getQuery () {
      if (this.isDelimiter)
         return false;

      let query = false;
      let demiliterFound = false;
      if (this.currentQuote === '' && this._buffer.length >= this.delimiter.length)
         demiliterFound = this.parsedStr.slice(-this.delimiter.length) === this.delimiter;

      if (demiliterFound) {
         this._buffer.splice(-this.delimiter.length, this.delimiter.length);
         query = this.parsedStr;
         this._buffer = [];
      }

      return query;
   }

   get parsedStr () {
      return this._buffer.join('').trim();
   }

   _read (size) {

   }
}
