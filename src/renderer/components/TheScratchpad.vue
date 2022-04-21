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
import { mapActions, mapGetters } from 'vuex';
import ConfirmModal from '@/components/BaseConfirmModal';
import TextEditor from '@/components/BaseTextEditor';

export default {
   name: 'TheScratchpad',
   components: {
      ConfirmModal,
      TextEditor
   },
   data () {
      return {
         localNotes: '',
         debounceTimeout: null
      };
   },
   computed: {
      ...mapGetters({
         notes: 'scratchpad/getNotes'
      })
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
      ...mapActions({
         hideScratchpad: 'application/hideScratchpad',
         changeNotes: 'scratchpad/changeNotes'
      }),
      hideModal () {
         this.$emit('hide');
      }
   }
};
</script>
