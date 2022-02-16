/**
 *
 * @param {any[]} array
 * @returns {number}
 */
export function getArrayDepth (array) {
   return Array.isArray(array)
      ? 1 + Math.max(0, ...array.map(getArrayDepth))
      : 0;
}
