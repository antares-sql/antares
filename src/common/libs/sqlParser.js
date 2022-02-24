import { Duplex } from 'stream';

const chars = {
   NEWLINE: 0x0A,
   CARRIAGE_RETURN: 0x0D,
   DOUBLE_QUOTE: 0x22,
   QUOTE: 0x27,
   BACKSLASH: 0x5C
};

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
      this._buffer = Buffer.from([]);
      this.encoding = opts.encoding;
      this.delimiter = opts.delimiter;

      this.isEscape = false;
      this.currentQuote = null;
      this.isDelimiter = false;
   }

   _write (chunk, encoding, next) {
      for (const char of chunk) {
         this.checkEscape();
         this._buffer = Buffer.concat([this._buffer, Buffer.from([char])]);
         this.checkNewDelimiter(char);
         this.checkQuote(char);
         const query = this.getQuery();

         if (query)
            this.push(query);
      }

      next();
   }

   checkEscape () {
      if (this._buffer.length > 0) {
         this.isEscape = this._buffer[this._buffer.length - 1] === chars.BACKSLASH
            ? !this.isEscape
            : false;
      }
   }

   checkNewDelimiter (char) {
      if (this._buffer.length === 9 && this.parsedStr.toLowerCase() === 'delimiter' && this.currentQuote === null) {
         this.isDelimiter = true;
         this._buffer = Buffer.from([]);
      }
      else {
         const isNewLine = [chars.NEWLINE, chars.CARRIAGE_RETURN].includes(char);
         if (isNewLine && this.isDelimiter) {
            this.isDelimiter = false;
            this.delimiter = this.parsedStr;
            this._buffer = Buffer.from([]);
         }
      }
   }

   checkQuote (char) {
      const isQuote = !this.isEscape && [chars.QUOTE, chars.DOUBLE_QUOTE].includes(char);
      if (isQuote && this.currentQuote === char)
         this.currentQuote = null;

      else if (isQuote && this.currentQuote === null)
         this.currentQuote = char;
   }

   getQuery () {
      if (this.isDelimiter)
         return false;

      let query = false;
      let demiliterFound = false;
      if (this.currentQuote === null && this._buffer.length >= this.delimiter.length)
         demiliterFound = this._buffer.slice(-this.delimiter.length).toString(this.encoding) === this.delimiter;

      if (demiliterFound) {
         this._buffer = this._buffer.slice(0, this._buffer.length - 1);
         query = this.parsedStr;
         this._buffer = Buffer.from([]);
      }

      return query;
   }

   get parsedStr () {
      return this._buffer.toString(this.encoding).trim();
   }

   _read (size) {

   }
}
