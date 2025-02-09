<template>
   <div
      class="tile my-2"
      tabindex="0"
      @click="$emit('select-note', note.uid)"
   >
      <BaseIcon
         v-if="isBig"
         class="tile-compress c-hand"
         :icon-name="isSelected ? 'mdiChevronUp' : 'mdiChevronDown'"
         :size="36"
         @click.stop="$emit('toggle-note', note.uid)"
      />
      <div class="tile-icon">
         <BaseIcon
            :icon-name="note.type === 'query'
               ? 'mdiHeartOutline'
               : note.type === 'todo'
                  ? note.isArchived
                     ? 'mdiCheckboxMarkedOutline'
                     : 'mdiCheckboxBlankOutline'
                  : 'mdiNoteEditOutline'"
            :size="36"
         />
         <div class="tile-icon-type">
            {{ note.type }}
         </div>
      </div>
      <div class="tile-content">
         <div class="tile-content-message" :class="[{'opened': isSelected}]">
            <code
               v-if="note.type === 'query'"
               ref="noteParagraph"
               class="tile-paragraph sql"
               v-html="highlight(note.note, {html: true})"
            />
            <div
               v-else
               ref="noteParagraph"
               class="tile-paragraph"
               v-html="parseMarkdown(highlightWord(note.note))"
            />
            <div v-if="isBig && !isSelected" class="tile-paragraph-overlay" />
         </div>
         <div class="tile-bottom-content">
            <small class="tile-subtitle">{{ getConnectionName(note.cUid) || t('general.all') }} · {{ formatDate(note.date) }}</small>
            <div class="tile-history-buttons">
               <button
                  v-if="note.type === 'todo' && !note.isArchived"
                  class="btn btn-dark tooltip tooltip-left"
                  :data-tooltip="t('general.archive')"
                  @click.stop="$emit('archive-note', note.uid)"
               >
                  <BaseIcon icon-name="mdiCheck" :size="22" />
               </button>
               <button
                  v-if="note.type === 'todo' && note.isArchived"
                  class="btn btn-dark tooltip tooltip-left"
                  :data-tooltip="t('general.undo')"
                  @click.stop="$emit('restore-note', note.uid)"
               >
                  <BaseIcon icon-name="mdiRestore" :size="22" />
               </button>
               <button
                  v-if="note.type === 'query'"
                  class="btn btn-dark tooltip tooltip-left"
                  :data-tooltip="t('general.select')"
                  @click.stop="$emit('select-query', note.note)"
               >
                  <BaseIcon icon-name="mdiOpenInApp" :size="22" />
               </button>
               <button
                  v-if="note.type === 'query'"
                  class="btn btn-dark tooltip tooltip-left"
                  :data-tooltip="t('general.copy')"
                  @click.stop="copyText(note.note)"
               >
                  <BaseIcon icon-name="mdiContentCopy" :size="18" />
               </button>
               <button
                  v-if=" !note.isArchived"
                  class="btn btn-dark tooltip tooltip-left"
                  :data-tooltip="t('general.edit')"
                  @click.stop="$emit('edit-note')"
               >
                  <BaseIcon icon-name="mdiPencil" :size="22" />
               </button>
               <button
                  class="btn btn-dark tooltip tooltip-left"
                  :data-tooltip="t('general.delete')"
                  @click.stop="$emit('delete-note', note.uid)"
               >
                  <BaseIcon icon-name="mdiDeleteForever" :size="22" />
               </button>
            </div>
         </div>
      </div>
   </div>
</template>
<script setup lang="ts">
import { useElementBounding } from '@vueuse/core';
import { marked } from 'marked';
import { highlight } from 'sql-highlight';
import { computed, PropType, Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import { useFilters } from '@/composables/useFilters';
import { copyText } from '@/libs/copyText';
import { useConnectionsStore } from '@/stores/connections';
import { ConnectionNote } from '@/stores/scratchpad';

const props = defineProps({
   note: {
      type: Object as PropType<ConnectionNote>,
      required: true
   },
   searchTerm: {
      type: String,
      default: () => ''
   },
   selectedNote: {
      type: String,
      default: () => ''
   }
});

const { t } = useI18n();
const { formatDate } = useFilters();
const { getConnectionName } = useConnectionsStore();

defineEmits([
   'edit-note',
   'delete-note',
   'select-note',
   'toggle-note',
   'archive-note',
   'restore-note',
   'select-query'
]);

const noteParagraph: Ref<HTMLDivElement> = ref(null);
const noteHeight = ref(useElementBounding(noteParagraph)?.height);

const isSelected = computed(() => props.selectedNote === props.note.uid);
const isBig = computed(() => noteHeight.value > 75);

const parseMarkdown = (text: string) => {
   const renderer = {
      listitem (text: string) {
         return `<li>${text.replace(/ *\([^)]*\) */g, '')}</li>`;
      },
      link (href: string, title: string, text: string) {
         return `<a>${text}</a>`;
      }
   };

   marked.use({ renderer });

   return marked(text);
};

const highlightWord = (string: string) => {
   string = string.replaceAll('<', '&lt;').replaceAll('>', '&gt;');

   if (props.searchTerm) {
      const regexp = new RegExp(`(${props.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return string.replace(regexp, '<span class="text-primary text-bold">$1</span>');
   }
   else
      return string;
};
</script>
<style scoped lang="scss">
.tile {
   border-radius: $border-radius;
   display: flex;
   position: relative;
   transition: none;

   &:hover,
   &:focus {
     .tile-content {
       .tile-bottom-content {
         .tile-history-buttons {
           opacity: 1;
         }
       }
     }
   }

   .tile-compress {
      position: absolute;
      right: 2px;
      top: 0px;
      opacity: .7;
      z-index: 2;
   }

   .tile-icon {
     font-size: 1.2rem;
     margin-left: 0.3rem;
     margin-right: 0.3rem;
     margin-top: 0.6rem;
     width: 40px;
     display: flex;
     align-items: center;
     flex-direction: column;
     justify-content: center;
     opacity: .8;

     .tile-icon-type {
       text-transform: uppercase;
       font-size: .5rem;
     }
   }

   .tile-content {
     padding: 0.3rem;
     padding-left: 0.1rem;
     min-height: 75px;
     display: flex;
     flex-direction: column;
     justify-content: space-between;

     .tile-content-message{
         position: relative;

         &:not(.opened) {
            max-height: 36px;
            overflow: hidden;
         }

         .tile-paragraph-overlay {
            height: 36px;
            width: 100%;
            position: absolute;
            top: 0;
         }
     }

     code, pre {
       max-width: 100%;
       width: 100%;
       display: inline-block;
       font-size: 100%;
       opacity: 0.8;
       font-weight: 600;
       white-space: break-spaces;
     }

     .tile-subtitle {
       opacity: 0.8;
     }

     .tile-bottom-content {
       display: flex;
       justify-content: space-between;

       .tile-history-buttons {
          opacity: 0;
          transition: opacity 0.2s;

          button {
             font-size: 0.7rem;
             line-height: 1rem;
             display: inline-flex;
             align-items: center;
             justify-content: center;
             margin: 0 5px;
             padding: 0;
             height: 24px;
             width: 24px;
          }
       }
     }
   }
 }

 .theme-dark {
   .tile {
      .tile-paragraph-overlay {
         background-image: linear-gradient(
            to bottom,
            rgba(255,0,0,0) 70%,
            $body-bg-dark);
      }

      &:focus {
         .tile-paragraph-overlay {
            background-image: linear-gradient(
               to bottom,
               rgba(255,0,0,0)70%,
               #323232);
         }
      }

      &:hover{
         .tile-paragraph-overlay {
            background-image: linear-gradient(
               to bottom,
               rgba(255,0,0,0) 70%,
               $bg-color-light-dark);
         }
      }
   }
 }

 .theme-light {
   .tile {
      .tile-paragraph-overlay {
         background-image: linear-gradient(
            to bottom,
            rgba(255,0,0,0) 70%,
            #FFFF);
      }

      &:hover,
      &:focus {
         .tile-paragraph-overlay {
            background-image: linear-gradient(
               to bottom,
               rgba(255,0,0,0) 70%,
               $bg-color-light-gray);
         }
      }
   }
 }
 </style>
 <style lang="scss">
 .tile-paragraph {
   white-space: initial;
   word-break: break-word;
   user-select: text;

    h1, h2, h3, h4, h5, h6, p, li {
       margin: 0;
    }
 }
 </style>
