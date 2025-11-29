<template>
   <li
      class="menu-item saved-query-item"
      :style="{ paddingLeft: `${(depth || 0) * 12}px` }"
      @click="handleClick"
      @dblclick="startRename"
      @contextmenu.prevent="showContext"
   >
      <div class="query-content">
         <BaseIcon
            class="query-icon mr-1"
            icon-name="mdiCodeBrackets"
            :size="16"
         />
         <span
            v-if="!isRenaming"
            v-tooltip="{
               strategy: 'fixed',
               placement: 'right',
               content: queryPreview,
               delay: { show: 500, hide: 0 }
            }"
            class="query-name"
         >
            {{ query.name }}
         </span>
         <input
            v-else
            ref="renameInput"
            v-model="renameValue"
            type="text"
            class="form-input input-sm query-rename-input"
            @blur="confirmRename"
            @keydown.enter="confirmRename"
            @keydown.esc="cancelRename"
            @keydown.stop
            @keypress.stop
            @click.stop
            @dblclick.stop
         >
         <button
            v-tooltip="{
               strategy: 'fixed',
               content: t('database.runQuery')
            }"
            class="btn btn-link btn-sm query-run-btn"
            @click.stop="handleRun"
         >
            <BaseIcon icon-name="mdiPlay" :size="14" />
         </button>
      </div>
   </li>
</template>

<script setup lang="ts">
import { computed, nextTick, PropType, Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import { useSavedQuerySync } from '@/composables/useSavedQuerySync';
import { SavedQuery } from '@/stores/savedQueries';

const { t } = useI18n();

const props = defineProps({
   query: {
      type: Object as PropType<SavedQuery>,
      required: true
   },
   connectionUid: {
      type: String as PropType<string>,
      required: true
   },
   depth: {
      type: Number as PropType<number>,
      default: 0
   }
});

const emit = defineEmits(['open-query', 'run-query', 'show-context']);

const { renameQueryAndSyncTab } = useSavedQuerySync();

const isRenaming = ref(false);
const renameValue = ref('');
const renameInput: Ref<HTMLInputElement> = ref(null);

const queryPreview = computed(() => {
   const sql = props.query.sql || '';
   if (sql.length > 100)
      return sql.substring(0, 100) + '...';

   return sql || t('database.emptyQuery');
});

const handleClick = () => {
   if (!isRenaming.value)
      emit('open-query', props.query);
};

const handleRun = () => {
   emit('run-query', props.query);
};

const showContext = (event: MouseEvent) => {
   emit('show-context', event, props.query);
};

const startRename = () => {
   renameValue.value = props.query.name;
   isRenaming.value = true;
   nextTick(() => {
      renameInput.value?.focus();
      renameInput.value?.select();
   });
};

const confirmRename = () => {
   if (renameValue.value.trim() && renameValue.value !== props.query.name) {
      renameQueryAndSyncTab(
         props.connectionUid,
         props.query.uid,
         renameValue.value.trim()
      );
   }
   isRenaming.value = false;
};

const cancelRename = () => {
   isRenaming.value = false;
   renameValue.value = props.query.name;
};
</script>

<style lang="scss" scoped>
.saved-query-item {
   list-style: none;
   cursor: pointer;

   .query-content {
      display: flex;
      align-items: center;
      padding: 0.2rem 0.25rem;
      border-radius: $border-radius;

      &:hover {
         background: var(--bg-color-light-dark);

         .query-run-btn {
            opacity: 1;
         }
      }
   }

   .query-icon {
      color: var(--primary-color);
      min-width: 16px;
      opacity: 0.8;
   }

   .query-name {
      font-size: 0.7rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
   }

   .query-rename-input {
      font-size: 0.7rem;
      height: 1.2rem;
      padding: 0 0.25rem;
      flex: 1;
      min-width: 0;
   }

   .query-run-btn {
      opacity: 0;
      transition: opacity 0.2s;
      padding: 0 0.15rem;
      height: auto;
      min-height: 0;
      margin-left: auto;

      &:hover {
         color: var(--primary-color);
      }

      svg {
         display: block;
      }
   }
}
</style>
