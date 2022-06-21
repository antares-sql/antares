export function uidGen (prefix?: string) {
   return (prefix ? `${prefix}:` : '') + Math.random().toString(36).substr(2, 9).toUpperCase();
}
