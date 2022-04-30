<template>
   <ConfirmModal
      :confirm-text="$t('word.update')"
      :cancel-text="$t('word.close')"
      size="large"
      :hide-footer="true"
      @hide="hideScratchpad"
   >
      <template #header>
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-notebook-edit-outline mr-1" /> {{ $t('word.scratchpad') }}
         </div>
      </template>
      <template #body>
         <div>
            <div>
               <TextEditor
                  v-model="localNotes"
                  editor-class="textarea-editor"
                  mode="markdown"
                  :auto-focus="true"
                  :show-line-numbers="false"
               />
            </div>
            <small class="text-gray">{{ $t('message.markdownSupported') }}</small>
         </div>
      </template>
   </ConfirmModal>
</template>

<script>
import { storeToRefs } from 'pinia';
import { useApplicationStore } from '@/stores/application';
import ConfirmModal from '@/components/BaseConfirmModal';
import TextEditor from '@/components/BaseTextEditor';
import { useScratchpadStore } from '@/stores/scratchpad';

export default {
   name: 'TheScratchpad',
   components: {
      ConfirmModal,
      TextEditor
   },
   emits: ['hide'],
   setup () {
      const applicationStore = useApplicationStore();
      const scratchpadStore = useScratchpadStore();

      const { notes } = storeToRefs(scratchpadStore);
      const { changeNotes } = scratchpadStore;

      return {
         notes,
         hideScratchpad: applicationStore.hideScratchpad,
         changeNotes
      };
   },
   data () {
      return {
         localNotes: '',
         debounceTimeout: null
      };
   },
   watch: {
      localNotes () {
         clearTimeout(this.debounceTimeout);

         this.debounceTimeout = setTimeout(() => {
            this.changeNotes(this.localNotes);
         }, 200);
      }
   },
   created () {
      this.localNotes = this.notes;
   },
   methods: {
      hideModal () {
         this.$emit('hide');
      }
   }
};
</script>
