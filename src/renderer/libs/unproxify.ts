/* eslint-disable @typescript-eslint/no-explicit-any */
import { toRaw } from 'vue';

/**
 * @param {*} val
 * @param {Boolean} json converts the value in JSON object (default true)
 */
export function unproxify (val: any, json = true): any {
   if (json)// JSON conversion
      return JSON.parse(JSON.stringify(val));
   else if (Array.isArray(val))// If array
      return toRaw(val);
   else if (typeof val === 'object') { // If object
      const result: any = {};
      for (const key in val)
         result[key] = toRaw(val[key]);

      return result;
   }
   else
      return toRaw(val);
}
