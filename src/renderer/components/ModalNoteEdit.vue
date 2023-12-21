<template>
   <ConfirmModal
      size="medium"
      :disable-autofocus="true"
      :close-on-confirm="!!localNote.note.length"
      :confirm-text="t('general.save')"
      @confirm="updateNote"
      @hide="$emit('hide')"
   >
      <template #header>
         <div class="d-flex">
            <BaseIcon
               icon-name="mdiNoteEditOutline"
               class="mr-1"
               :size="24"
            /> {{ t('application.editNote') }}
         </div>
      </template>
      <template #body>
         <form class="form">
            <div class="form-group columns">
               <div class="column col-8">
                  <label class="form-label">{{ t('connection.connection') }}</label>
                  <BaseSelect
                     v-model="localNote.cUid"
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
                     v-model="localNote.type"
                     class="form-select"
                     :options="noteTags"
                     option-track-by="code"
                     option-label="name"
                     @change="null"
                  />
               </div>
            </div>
            <div class="form-group">
               <label class="form-label">{{ t('general.content') }}</label>
               <BaseTextEditor
                  v-model="localNote.note"
                  :mode="editorMode"
                  :show-line-numbers="false"
               />
            </div>
         </form>
      </template>
   </ConfirmModal>
</template>

<script lang="ts" setup>
import { inject, onBeforeMount, PropType, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import BaseTextEditor from '@/components/BaseTextEditor.vue';
import { ConnectionNote, TagCode, useScratchpadStore } from '@/stores/scratchpad';

const { t } = useI18n();
const { editNote } = useScratchpadStore();

const emit = defineEmits(['hide']);

const props = defineProps({
   note: {
      type: Object as PropType<ConnectionNote>,
      required: true
   }
});

const noteTags = inject<{code: TagCode; name: string}[]>('noteTags');
const connectionOptions = inject<{code: string; name: string}[]>('connectionOptions');

const editorMode = ref('markdown');
const localNote: Ref<ConnectionNote> = ref({
   uid: 'dummy',
   cUid: null,
   title: undefined,
   note: '',
   date: new Date(),
   type: 'note',
   isArchived: false
});

const updateNote = () => {
   if (localNote.value.note) {
      if (!localNote.value.title)// Set a default title
         localNote.value.title = `${localNote.value.type.toLocaleUpperCase()}: ${localNote.value.uid}`;

      localNote.value.date = new Date();
      editNote(localNote.value);
      emit('hide');
   }
};

watch(() => localNote.value.type, () => {
   if (localNote.value.type === 'query')
      editorMode.value = 'sql';
   else
      editorMode.value = 'markdown';
});

onBeforeMount(() => {
   localNote.value = props.note;
});

</script>
