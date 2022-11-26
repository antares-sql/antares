export function uidGen (prefix?: string) {
   return (prefix ? `${prefix}:` : '') + Math.random().toString(36).substring(2, 11).toUpperCase();
}
