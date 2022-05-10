/* eslint-disable @typescript-eslint/no-explicit-any */
export function getArrayDepth (array: any[]): number {
   return Array.isArray(array)
      ? 1 + Math.max(0, ...array.map(getArrayDepth))
      : 0;
}
