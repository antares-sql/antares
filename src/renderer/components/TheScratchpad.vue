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

<script setup lang="ts">
import { ref, Ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useApplicationStore } from '@/stores/application';
import { useScratchpadStore } from '@/stores/scratchpad';
import ConfirmModal from '@/components/BaseConfirmModal.vue';
import TextEditor from '@/components/BaseTextEditor.vue';

const applicationStore = useApplicationStore();
const scratchpadStore = useScratchpadStore();

const { notes } = storeToRefs(scratchpadStore);
const { changeNotes } = scratchpadStore;
const { hideScratchpad } = applicationStore;

const localNotes = ref(notes.value);
const debounceTimeout: Ref<NodeJS.Timeout> = ref(null);

watch(localNotes, () => {
   clearTimeout(debounceTimeout.value);

   debounceTimeout.value = setTimeout(() => {
      changeNotes(localNotes.value);
   }, 200);
});

</script>
