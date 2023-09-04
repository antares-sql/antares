<template>
   <ConfirmModal
      :confirm-text="t('application.update')"
      :cancel-text="t('general.close')"
      size="large"
      :hide-footer="true"
      @hide="hideScratchpad"
   >
      <template #header>
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-notebook-edit-outline mr-1" /> {{ t('application.scratchpad') }}
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
            <small class="text-gray">{{ t('application.markdownSupported') }}</small>
         </div>
      </template>
   </ConfirmModal>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmModal from '@/components/BaseConfirmModal.vue';
import TextEditor from '@/components/BaseTextEditor.vue';
import { useApplicationStore } from '@/stores/application';
import { useScratchpadStore } from '@/stores/scratchpad';

const { t } = useI18n();

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
