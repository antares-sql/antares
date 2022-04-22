/**
 * @param {*} val
 * @param {Boolean} json converts the value in JSON object (default true)
 */
export function unproxify (val, json = true) {
   if (json)// JSON conversion
      return JSON.parse(JSON.stringify(val));
   else if (!(Symbol.iterator in Object(val)))// If not iterable
      return val;
   else if (Array.isArray(val))// If array
      return [...val];
   else // If object
      return { ...val };
}
