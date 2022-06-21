import { defineStore } from 'pinia';
import * as Store from 'electron-store';
const persistentStore = new Store({ name: 'notes' });

export const useScratchpadStore = defineStore('scratchpad', {
   state: () => ({
      notes: persistentStore.get('notes', '# HOW TO SUPPORT ANTARES\n\n- [ ] Leave a star to Antares [GitHub repo](https://github.com/antares-sql/antares)\n- [ ] Send feedbacks and advices\n- [ ] Report for bugs\n- [ ] If you enjoy, share Antares with friends\n\n# ABOUT SCRATCHPAD\n\nThis is a scratchpad where you can save your **personal notes**. It supports `markdown` format, but you are free to use plain text.\nThis content is just a placeholder, feel free to clear it to make space for your notes.\n') as string
   }),
   actions: {
      changeNotes (notes: string) {
         this.notes = notes;
         persistentStore.set('notes', this.notes);
      }
   }
});
