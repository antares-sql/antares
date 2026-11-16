/** A connection borrowed for one query run. `release()` is idempotent. */
export interface ConnectionLease<C> {
   readonly connection: C;
   release (): void;
}

export function createLease<C> (connection: C, onRelease?: () => void): ConnectionLease<C> {
   let released = false;
   return {
      connection,
      release () {
         if (released) return;
         released = true;
         onRelease?.();
      }
   };
}
