import * as Store from 'electron-store';
import { defineStore } from 'pinia';
const persistentStore = new Store({ name: 'notes' });

export type TagCode = 'all' | 'note' | 'todo' | 'query'

export interface ConnectionNote {
   uid: string;
   cUid: string | null;
   title?: string;
   isArchived: boolean;
   type: TagCode;
   note: string;
   date: Date;
}

export const useScratchpadStore = defineStore('scratchpad', {
   state: () => ({
      /** Global notes */
      notes: persistentStore.get('notes', '# HOW TO SUPPORT ANTARES\n\n- [ ] Leave a star to Antares [GitHub repo](https://github.com/antares-sql/antares)\n- [ ] Send feedbacks and advices\n- [ ] Report for bugs\n- [ ] If you enjoy, share Antares with friends\n\n# ABOUT SCRATCHPAD\n\nThis is a scratchpad where you can save your **personal notes**. It supports `markdown` format, but you are free to use plain text.\nThis content is just a placeholder, feel free to clear it to make space for your notes.\n') as string,
      /** Connection specific notes */
      connectionNotes: persistentStore.get('connectionNotes', []) as ConnectionNote[]
   }),
   actions: {
      changeNotes (notes: ConnectionNote[]) {
         this.connectionNotes = notes;
         persistentStore.set('connectionNotes', this.connectionNotes);
      },
      addNote (note: ConnectionNote) {
         this.connectionNotes = [
            note,
            ...this.connectionNotes
         ];
         persistentStore.set('connectionNotes', this.connectionNotes);
      }
   }
});
