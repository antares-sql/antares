/**
 * @export
 * @param {String} [prefix]
 * @returns {String} Unique ID
 */
export function uidGen (prefix) {
   return (prefix ? `${prefix}:` : '') + Math.random().toString(36).substr(2, 9).toUpperCase();
};
