import * as antares from 'common/interfaces/antares';

/** Pure helpers shared by the per-engine users management builders */

export const listDiff = (before: string[] = [], after: string[] = []) => ({
   added: after.filter(item => !before.includes(item)),
   removed: before.filter(item => !after.includes(item))
});

/** Privileges added and removed per object of a scope */
export const scopeDiff = (before: Record<string, string[]> = {}, after: Record<string, string[]> = {}) => {
   const objects = [...new Set([...Object.keys(before), ...Object.keys(after)])];
   return objects
      .map(object => ({ object, ...listDiff(before[object], after[object]) }))
      .filter(diff => diff.added.length || diff.removed.length);
};

/** Attributes of `user` that differ from `original` (all of them for new accounts) */
export const changedAttributes = (user: antares.UserDetails, original?: antares.UserDetails) =>
   Object.entries(user.attributes ?? {})
      .filter(([key, value]) => !original || (original.attributes?.[key] ?? null) !== (value ?? null))
      .reduce<Record<string, antares.UserAttributeValue>>((acc, [key, value]) => ({ ...acc, [key]: value }), {});

export const isRenamed = (user: antares.UserIdentity, original?: antares.UserIdentity) =>
   !!original && (original.name !== user.name || (original.host ?? '') !== (user.host ?? ''));

/** Replaces quoted secrets (passwords) in SQL meant for logs */
export const maskSecrets = (sql: string, quotedSecrets: string[]) =>
   quotedSecrets.filter(Boolean).reduce((acc, secret) => acc.replaceAll(secret, '\'********\''), sql);

/** Trims CHAR padding of values read from system tables */
export const trimmed = (value: unknown) => typeof value === 'string' ? value.trim() : value;
