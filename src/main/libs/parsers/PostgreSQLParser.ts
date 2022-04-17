import { Transform, TransformCallback, TransformOptions } from 'stream';

export default class PostgreSQLParser extends Transform {
   private _buffer: string;
   private _lastChar: string;
   private _lastChars: string;
   private _bodyWrapper: string;
   private _bodyWrapperBuffer: string;
   private _firstDollarFound: boolean;
   private _isBody: boolean;
   private _isSingleLineComment: boolean;
   private _isMultiLineComment: boolean;

   encoding: BufferEncoding;
   delimiter: string;
   isEscape: boolean;
   currentQuote: string;
   isDelimiter: boolean;

   constructor (opts?: TransformOptions & { delimiter: string }) {
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
      this._lastChars = '';
      this.encoding = opts.encoding;
      this.delimiter = opts.delimiter;// ';'
      this._bodyWrapper = '';
      this._bodyWrapperBuffer = '';

      this.isEscape = false;
      this.currentQuote = null;
      this._firstDollarFound = false;
      this._isBody = false;
      this._isSingleLineComment = false;
      this._isMultiLineComment = false;
   }

   get _isComment () {
      return this._isSingleLineComment || this._isMultiLineComment;
   }

   _transform (chunk: Buffer, encoding: BufferEncoding, next: TransformCallback) {
      for (const char of chunk.toString(this.encoding)) {
         this.checkEscape();
         this._buffer += char;
         this._lastChar = char;
         this._lastChars += char;

         if (this._lastChars.length > this._bodyWrapper.length)
            this._lastChars = this._lastChars.slice(-(this._bodyWrapper.length || 2));

         this.checkBodyWrapper(char);
         this.checkQuote(char);
         this.checkCommentRow();
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

   checkCommentRow () {
      if (this._isBody) return;

      if (!this._isComment) {
         if (this.currentQuote === null && this._lastChars.includes('--'))
            this._isSingleLineComment = true;

         if (this.currentQuote === null && this._lastChars.includes('/*'))
            this._isMultiLineComment = true;
      }
      else {
         if (this._isSingleLineComment && (this._lastChar === '\n' || this._lastChar === '\r')) {
            this._buffer = '';
            this._isSingleLineComment = false;
         }

         if (this._isMultiLineComment && this._lastChars.includes('*/')) {
            this._buffer = '';
            this._isMultiLineComment = false;
         }
      }
   }

   checkBodyWrapper (char: string) {
      if (this._isBody)
         this._isBody = this._lastChars !== this._bodyWrapper;

      if (this.currentQuote === null && char === '$' && !this._firstDollarFound && !this._bodyWrapper) {
         this._firstDollarFound = true;
         this._bodyWrapperBuffer += char;
         this._isBody = true;
      }
      else if (this._firstDollarFound) {
         if (char === '\n' || char === ' ') {
            this._firstDollarFound = false;
            this._bodyWrapperBuffer = '';
            this._bodyWrapper = '';
            this._isBody = false;
            return;
         }

         this._bodyWrapperBuffer += char;
         const isEndDollar = char === '$';

         if (isEndDollar) {
            this._firstDollarFound = false;
            this._bodyWrapper = this._bodyWrapperBuffer;
            this._bodyWrapperBuffer = '';
         }
      }
   }

   checkQuote (char: string) {
      const isQuote = !this.isEscape && (char === '\'' || char === '"');
      if (isQuote && this.currentQuote === char)
         this.currentQuote = null;

      else if (isQuote && this.currentQuote === null)
         this.currentQuote = char;
   }

   getQuery () {
      if (this._isBody || this._isComment)
         return false;

      let query: false | string = false;
      let demiliterFound = false;

      if (this.currentQuote === null && this._buffer.length >= this.delimiter.length)
         demiliterFound = this._lastChars.slice(-this.delimiter.length) === this.delimiter;

      if (demiliterFound) {
         const parsedStr = this._buffer.trim();
         query = parsedStr;
         this._buffer = '';
         this._bodyWrapper = '';
      }

      return query;
   }
}
