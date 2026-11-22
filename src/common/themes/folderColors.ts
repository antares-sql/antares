/**
 * Palette of the connection folder colors. The folder color is the accent of the app (`--primary-color`)
 * while one of its connections is selected; `default` is also the accent outside folders.
 *
 * Folders store the default hex of a slot, so the stored data never depends on the theme:
 * a theme can give each slot another color (e.g. for color vision deficiencies) and
 * the folders follow it when the theme changes.
 */
export const folderColorSlots = [
   { name: 'default', hex: '#E36929' },
   { name: 'grape-fruit', hex: '#ED5565' },
   { name: 'rose', hex: '#E3242B' },
   { name: 'fire', hex: '#FDA50F' },
   { name: 'sunflower', hex: '#FFCE54' },
   { name: 'moss', hex: '#8A985E' },
   { name: 'grass', hex: '#6DCD05' },
   { name: 'emerald', hex: '#038835' },
   { name: 'mint', hex: '#48CFAD' },
   { name: 'aqua', hex: '#4FC1E9' },
   { name: 'royal-lblue', hex: '#4169E1' },
   { name: 'blue-jeans', hex: '#5D9CEC' },
   { name: 'stone', hex: '#59788E' },
   { name: 'lavander', hex: '#AC92EC' },
   { name: 'pink-rose', hex: '#EC87C0' },
   { name: 'smoke', hex: '#BEBDB8' },
   { name: 'slate', hex: '#757C88' }
] as const;

export type FolderColorSlot = typeof folderColorSlots[number]['name'];

export const folderColorSlotNames: readonly FolderColorSlot[] = folderColorSlots.map(slot => slot.name);

export const DEFAULT_ACCENT = folderColorSlots[0].hex;

/** Slot of a stored folder color, null for colors outside the palette */
export const folderColorSlotOf = (hex: string): FolderColorSlot | null =>
   folderColorSlots.find(slot => slot.hex.toLowerCase() === String(hex ?? '').toLowerCase())?.name ?? null;
