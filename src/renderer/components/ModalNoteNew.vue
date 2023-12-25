<template>
   <ConfirmModal
      size="medium"
      :disable-autofocus="true"
      :close-on-confirm="!!newNote.note.length"
      :confirm-text="t('general.save')"
      @confirm="createNote"
      @hide="$emit('hide')"
   >
      <template #header>
         <div class="d-flex">
            <BaseIcon
               icon-name="mdiNotePlusOutline"
               class="mr-1"
               :size="24"
            /> {{ t('application.addNote') }}
         </div>
      </template>
      <template #body>
         <form class="form">
            <div class="form-group columns">
               <div class="column col-8">
                  <label class="form-label">{{ t('connection.connection') }}</label>
                  <BaseSelect
                     v-model="newNote.cUid"
                     class="form-select"
                     :options="connectionOptions"
                     option-track-by="code"
                     option-label="name"
                     @change="null"
                  />
               </div>
               <div class="column col-4">
                  <label class="form-label">{{ t('application.tag') }}</label>
                  <BaseSelect
                     v-model="newNote.type"
                     class="form-select"
                     :options="noteTags"
                     option-track-by="code"
                     option-label="name"
                     @change="null"
                  />
               </div>
            </div>
            <div class="form-group">
               <label class="form-label">{{ t('general.content') }} <small
                  v-if="newNote.type !== 'query'"
                  style="line-height: 1;"
                  class="text-gray"
               >({{ t('application.markdownSupported') }})</small></label>
               <BaseTextEditor
                  v-model="newNote.note"
                  :mode="editorMode"
                  :show-line-numbers="false"
               />
            </div>
         </form>
      </template>
   </ConfirmModal>
</template>

<script lang="ts" setup>
import { uidGen } from 'common/libs/uidGen';
import { inject, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import BaseTextEditor from '@/components/BaseTextEditor.vue';
import { ConnectionNote, TagCode, useScratchpadStore } from '@/stores/scratchpad';

const { t } = useI18n();
const { addNote } = useScratchpadStore();

const emit = defineEmits(['hide']);

const noteTags = inject<{code: TagCode; name: string}[]>('noteTags');
const selectedConnection = inject<Ref<null | string>>('selectedConnection');
const selectedTag = inject<Ref<TagCode>>('selectedTag');
const connectionOptions = inject<{code: string; name: string}[]>('connectionOptions');

const editorMode = ref('markdown');

const newNote: Ref<ConnectionNote> = ref({
   uid: uidGen('N'),
   cUid: null,
   title: undefined,
   note: '',
   date: new Date(),
   type: 'note',
   isArchived: false
});

const createNote = () => {
   if (newNote.value.note) {
      if (!newNote.value.title)// Set a default title
         newNote.value.title = `${newNote.value.type.toLocaleUpperCase()}: ${newNote.value.uid}`;

      newNote.value.date = new Date();
      addNote(newNote.value);
      emit('hide');
   }
};

watch(() => newNote.value.type, () => {
   if (newNote.value.type === 'query')
      editorMode.value = 'sql';
   else
      editorMode.value = 'markdown';
});

newNote.value.cUid = selectedConnection.value;

if (selectedTag.value !== 'all')
   newNote.value.type = selectedTag.value;

</script>
