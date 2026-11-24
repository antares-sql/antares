import { computed, Ref, ref } from 'vue';

interface ModalItem {
   // eslint-disable-next-line camelcase
   _antares_id?: string;
}

/**
 * Unconfirmed changes of a table structure modal (indexes, foreign keys, checks) that edits a copy of a list.
 * - isItemChanged: new or modified item, marked in the list with the same dot as a tab with unsaved changes
 * - requestHide: the modal hides (cancel, close button, Esc, click outside) only after asking to discard the changes
 *
 * @param original list received by the modal
 * @param proxy copy edited by the modal
 * @param hide closes the modal
 */
export function useUnconfirmedChanges<T extends ModalItem> (original: () => T[], proxy: Ref<T[]>, hide: () => void) {
   const isChanged = computed(() => JSON.stringify(original()) !== JSON.stringify(proxy.value));
   const isDiscardModal = ref(false);
   let isConfirmed = false;

   const isItemChanged = (item: T) => {
      const originalItem = original().find(i => i._antares_id === item._antares_id);
      return !originalItem || JSON.stringify(originalItem) !== JSON.stringify(item);
   };

   /** To call on confirm: BaseConfirmModal emits hide right after confirm, which must not ask */
   const markConfirmed = () => {
      isConfirmed = true;
   };

   const requestHide = () => {
      if (isConfirmed || !isChanged.value)
         hide();
      else
         isDiscardModal.value = true;
   };

   return { isChanged, isDiscardModal, isItemChanged, markConfirmed, requestHide };
}
