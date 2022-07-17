<template>
   <div v-show="isSelected" class="workspace-query-tab column col-12 columns col-gapless">
      <div class="workspace-query-runner column col-12">
         <div class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <button
                  class="btn btn-primary btn-sm"
                  :disabled="!isChanged"
                  :class="{'loading':isSaving}"
                  title="CTRL+S"
                  @click="saveChanges"
               >
                  <i class="mdi mdi-24px mdi-content-save mr-1" />
                  <span>{{ t('word.save') }}</span>
               </button>
               <button
                  :disabled="!isChanged"
                  class="btn btn-link btn-sm mr-0"
                  :title="t('message.clearChanges')"
                  @click="clearChanges"
               >
                  <i class="mdi mdi-24px mdi-delete-sweep mr-1" />
                  <span>{{ t('word.clear') }}</span>
               </button>
            </div>
         </div>
      </div>
      <div class="container">
         <div class="columns">
            <div v-if="customizations.triggerFunctionlanguages" class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ t('word.language') }}
                  </label>
                  <BaseSelect
                     v-model="localFunction.language"
                     :options="customizations.triggerFunctionlanguages"
                     class="form-select"
                  />
               </div>
            </div>
            <div v-if="customizations.definer" class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ t('word.definer') }}
                  </label>
                  <BaseSelect
                     v-model="localFunction.definer"
                     :options="workspace.users"
                     :option-label="(user: any) => user.value === '' ? t('message.currentUser') : `${user.name}@${user.host}`"
                     :option-track-by="(user: any) => user.value === '' ? '' : `\`${user.name}\`@\`${user.host}\``"
                     class="form-select"
                  />
               </div>
            </div>
            <div v-if="customizations.comment" class="form-group">
               <label class="form-label">
                  {{ t('word.comment') }}
               </label>
               <input
                  v-model="localFunction.comment"
                  class="form-input"
                  type="text"
               >
            </div>
         </div>
      </div>
      <div class="workspace-query-results column col-12 mt-2 p-relative">
         <BaseLoader v-if="isLoading" />
         <label class="form-label ml-2">{{ t('message.functionBody') }}</label>
         <QueryEditor
            v-show="isSelected"
            ref="queryEditor"
            v-model="localFunction.sql"
            :workspace="workspace"
            :schema="schema"
            :height="editorHeight"
         />
      </div>
   </div>
</template>

<script setup lang="ts">
import { Component, computed, onBeforeUnmount, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { Ace } from 'ace-builds';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import { useConsoleStore } from '@/stores/console';
import BaseLoader from '@/components/BaseLoader.vue';
import QueryEditor from '@/components/QueryEditor.vue';
import Functions from '@/ipc-api/Functions';
import BaseSelect from '@/components/BaseSelect.vue';
import { AlterFunctionParams, TriggerFunctionInfos } from 'common/interfaces/antares';

const { t } = useI18n();

const props = defineProps({
   tabUid: String,
   connection: Object,
   function: String,
   isSelected: Boolean,
   schema: String
});

const { addNotification } = useNotificationsStore();
const workspacesStore = useWorkspacesStore();
const { consoleHeight } = storeToRefs(useConsoleStore());

const {
   getWorkspace,
   refreshStructure,
   renameTabs,
   changeBreadcrumbs,
   setUnsavedChanges
} = workspacesStore;

const queryEditor: Ref<Component & {editor: Ace.Editor; $el: HTMLElement}> = ref(null);
const isLoading = ref(false);
const isSaving = ref(false);
const originalFunction: Ref<TriggerFunctionInfos> = ref(null);
const localFunction: Ref<TriggerFunctionInfos> = ref(null);
const lastFunction = ref(null);
const sqlProxy = ref('');
const editorHeight = ref(300);

const workspace = computed(() => getWorkspace(props.connection.uid));
const customizations = computed(() => workspace.value.customizations);
const isChanged = computed(() => JSON.stringify(originalFunction.value) !== JSON.stringify(localFunction.value));

const getFunctionData = async () => {
   if (!props.function) return;

   isLoading.value = true;
   localFunction.value = { name: '', sql: '', type: '', definer: null };
   lastFunction.value = props.function;

   const params = {
      uid: props.connection.uid,
      schema: props.schema,
      func: props.function
   };

   try {
      const { status, response } = await Functions.getFunctionInformations(params);
      if (status === 'success') {
         originalFunction.value = response;

         localFunction.value = JSON.parse(JSON.stringify(originalFunction.value));
         sqlProxy.value = localFunction.value.sql;
      }
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   resizeQueryEditor();
   isLoading.value = false;
};

const saveChanges = async () => {
   if (isSaving.value) return;
   isSaving.value = true;
   const params = {
      uid: props.connection.uid,
      func: {
         ...localFunction.value,
         schema: props.schema,
         oldName: originalFunction.value.name
      } as AlterFunctionParams
   };

   try {
      const { status, response } = await Functions.alterTriggerFunction(params);

      if (status === 'success') {
         const oldName = originalFunction.value.name;

         await refreshStructure(props.connection.uid);

         if (oldName !== localFunction.value.name) {
            renameTabs({
               uid: props.connection.uid,
               schema: props.schema,
               elementName: oldName,
               elementNewName: localFunction.value.name,
               elementType: 'triggerFunction'
            });

            changeBreadcrumbs({ schema: props.schema, triggerFunction: localFunction.value.name });
         }
         else
            getFunctionData();
      }
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   isSaving.value = false;
};

const clearChanges = () => {
   localFunction.value = JSON.parse(JSON.stringify(originalFunction.value));
   queryEditor.value.editor.session.setValue(localFunction.value.sql);
};

const resizeQueryEditor = () => {
   if (queryEditor.value) {
      let sizeToSubtract = 0;
      const footer = document.getElementById('footer');
      if (footer) sizeToSubtract += footer.offsetHeight;
      sizeToSubtract += consoleHeight.value;

      const size = window.innerHeight - queryEditor.value.$el.getBoundingClientRect().top - sizeToSubtract;
      editorHeight.value = size;
      queryEditor.value.editor.resize();
   }
};

const onKey = (e: KeyboardEvent) => {
   if (props.isSelected) {
      e.stopPropagation();
      if (e.ctrlKey && e.key === 's') { // CTRL + S
         if (isChanged.value)
            saveChanges();
      }
   }
};

watch(() => props.schema, async () => {
   if (props.isSelected) {
      await getFunctionData();
      queryEditor.value.editor.session.setValue(localFunction.value.sql);
      lastFunction.value = props.function;
   }
});

watch(() => props.function, async () => {
   if (props.isSelected) {
      await getFunctionData();
      queryEditor.value.editor.session.setValue(localFunction.value.sql);
      lastFunction.value = props.function;
   }
});

watch(consoleHeight, () => {
   resizeQueryEditor();
});

watch(() => props.isSelected, (val) => {
   if (val) changeBreadcrumbs({ schema: props.schema });
});

watch(isChanged, (val) => {
   setUnsavedChanges({ uid: props.connection.uid, tUid: props.tabUid, isChanged: val });
});

(async () => {
   await getFunctionData();
   queryEditor.value.editor.session.setValue(localFunction.value.sql);
   window.addEventListener('keydown', onKey);
})();

onMounted(() => {
   window.addEventListener('resize', resizeQueryEditor);
});

onUnmounted(() => {
   window.removeEventListener('resize', resizeQueryEditor);
});

onBeforeUnmount(() => {
   window.removeEventListener('keydown', onKey);
});
</script>
