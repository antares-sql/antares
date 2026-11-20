import { describe, expect, it } from 'vitest';

import { fromAccelerator, fromCodeMirror } from '@/libs/editor/keyNames';

describe('editor key names', () => {
   it.each([
      ['Mod-Enter', 'CommandOrControl+Enter'],
      ['Mod-g', 'CommandOrControl+G'],
      ['Mod-Alt-w', 'CommandOrControl+Alt+W'],
      ['Mod-Alt-ArrowRight', 'Alt+CommandOrControl+Right'],
      ['Mod-=', 'CommandOrControl+='],
      ['Mod--', 'CommandOrControl+-'],
      ['Mod-+', 'CommandOrControl+Plus'],
      ['Ctrl-Space', 'Ctrl+Space'],
      ['F5', 'F5'],
      ['Shift-Mod-z', 'CmdOrCtrl+Shift+Z']
   ])('%s matches %s', (cm, accelerator) => {
      expect(fromCodeMirror(cm, false)).toBe(fromAccelerator(accelerator, false));
      expect(fromCodeMirror(cm, true)).toBe(fromAccelerator(accelerator, true));
   });

   it('maps Mod to the platform modifier', () => {
      expect(fromCodeMirror('Mod-d', false)).toBe('ctrl+d');
      expect(fromCodeMirror('Mod-d', true)).toBe('meta+d');
      expect(fromAccelerator('Command+D', false)).toBe('meta+d');
   });

   it('tells different combinations apart', () => {
      expect(fromCodeMirror('Mod-Shift-g', false)).not.toBe(fromAccelerator('CommandOrControl+G', false));
      expect(fromCodeMirror('Alt-g', false)).not.toBe(fromAccelerator('CommandOrControl+G', false));
   });
});
