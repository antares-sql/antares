import { Transform } from 'stream';

export default class MySQLParser extends Transform {
   constructor (opts) {
      opts = {
         delimiter: ';',
         encoding: 'utf8',
         writableObjectMode: true,
         readableObjectMode: true,
         ...opts
      };
      super(opts);
      this._buffer = '';
      this._lastChar = '';
      this._last9Chars = '';
      this.encoding = opts.encoding;
      this.delimiter = opts.delimiter;

      this.isEscape = false;
      this.currentQuote = null;
      this.isDelimiter = false;
   }

   _transform (chunk, encoding, next) {
      for (const char of chunk.toString(this.encoding)) {
         this.checkEscape();
         this._buffer += char;
         this._lastChar = char;
         this._last9Chars += char.trim().toLocaleLowerCase();

         if (this._last9Chars.length > 9)
            this._last9Chars = this._last9Chars.slice(-9);

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
         this.isEscape = this._lastChar === '\\'
            ? !this.isEscape
            : false;
      }
   }

   checkNewDelimiter (char) {
      if (this.currentQuote === null && this._last9Chars === 'delimiter') {
         this.isDelimiter = true;
         this._buffer = '';
      }
      else {
         const isNewLine = char === '\n' || char === '\r';
         if (isNewLine && this.isDelimiter) {
            this.isDelimiter = false;
            this.delimiter = this._buffer.trim();
            this._buffer = '';
         }
      }
   }

   checkQuote (char) {
      const isQuote = !this.isEscape && (char === '\'' || char === '"');
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
         demiliterFound = this._last9Chars.slice(-this.delimiter.length) === this.delimiter;

      if (demiliterFound) {
         const parsedStr = this._buffer.trim();
         query = parsedStr.slice(0, parsedStr.length - this.delimiter.length);
         this._buffer = '';
      }

      return query;
   }
}
