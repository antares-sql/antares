import * as Store from 'electron-store';
import { defineStore } from 'pinia';

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

const persistentStore = new Store({ name: 'notes' });

// Migrate old scratchpad on new notes TODO: remove in future releases
const oldNotes = persistentStore.get('notes') as string;
if (oldNotes) {
   const newNotes = persistentStore.get('connectionNotes', []) as ConnectionNote[];
   newNotes.unshift({
      uid: 'N:LEGACY',
      cUid: null,
      isArchived: false,
      type: 'note',
      note: oldNotes,
      date: new Date()
   });

   persistentStore.delete('notes');

   persistentStore.set('connectionNotes', newNotes);
}

export const useScratchpadStore = defineStore('scratchpad', {
   state: () => ({
      selectedTag: 'all',
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
      },
      editNote (note: ConnectionNote) {
         this.connectionNotes = (this.connectionNotes as ConnectionNote[]).map(n => {
            if (n.uid === note.uid)
               n = note;

            return n;
         });
         persistentStore.set('connectionNotes', this.connectionNotes);
      }
   }
});
