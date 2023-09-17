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
            <BaseIcon
               icon-name="mdiNotebookEditOutline"
               class="mr-1"
               :size="24"
            /> {{ t('application.scratchpad') }}
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
import BaseIcon from '@/components/BaseIcon.vue';
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
