<template>
   <div v-show="isSelected" class="workspace-query-tab column col-12 columns col-gapless">
      <div class="workspace-query-runner column col-12">
         <div class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <button
                  class="btn btn-primary btn-sm"
                  :disabled="!isChanged"
                  :class="{'loading':isSaving}"
                  @click="saveChanges"
               >
                  <BaseIcon
                     class="mr-1"
                     icon-name="mdiContentSave"
                     :size="24"
                  />
                  <span>{{ t('general.save') }}</span>
               </button>
               <button
                  :disabled="!isChanged"
                  class="btn btn-link btn-sm mr-0"
                  :title="t('database.clearChanges')"
                  @click="clearChanges"
               >
                  <BaseIcon
                     class="mr-1"
                     icon-name="mdiDeleteSweep"
                     :size="24"
                  />
                  <span>{{ t('general.clear') }}</span>
               </button>

               <div class="divider-vert py-3" />

               <button class="btn btn-dark btn-sm" @click="showParamsModal">
                  <BaseIcon
                     class="mr-1"
                     icon-name="mdiDotsHorizontal"
                     :size="24"
                  />
                  <span>{{ t('database.parameters') }}</span>
               </button>
            </div>
            <div class="workspace-query-info">
               <div class="d-flex" :title="t('database.schema')">
                  <BaseIcon
                     class="mt-1 mr-1"
                     icon-name="mdiDatabase"
                     :size="18"
                  /><b>{{ schema }}</b>
               </div>
            </div>
         </div>
      </div>
      <div class="container">
         <div class="columns">
            <div class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ t('general.name') }}
                  </label>
                  <input
                     ref="firstInput"
                     v-model="localRoutine.name"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div v-if="customizations.languages" class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ t('application.language') }}
                  </label>
                  <BaseSelect
                     v-model="localRoutine.language"
                     :options="customizations.languages"
                     class="form-select"
                  />
               </div>
            </div>
            <div v-if="customizations.definer" class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ t('database.definer') }}
                  </label>
                  <BaseSelect
                     v-model="localRoutine.definer"
                     :options="[{value: '', name:t('database.currentUser')}, ...workspace.users]"
                     :option-label="(user: any) => user.value === '' ? user.name : `${user.name}@${user.host}`"
                     :option-track-by="(user: any) => user.value === '' ? '' : `\`${user.name}\`@\`${user.host}\``"
                     class="form-select"
                  />
               </div>
            </div>
            <div v-if="customizations.comment" class="column">
               <div class="form-group">
                  <label class="form-label">
                     {{ t('database.comment') }}
                  </label>
                  <input
                     v-model="localRoutine.comment"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ t('database.sqlSecurity') }}
                  </label>
                  <BaseSelect
                     v-model="localRoutine.security"
                     :options="['DEFINER', 'INVOKER']"
                     class="form-select"
                  />
               </div>
            </div>
            <div v-if="customizations.procedureDataAccess" class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ t('database.dataAccess') }}
                  </label>
                  <BaseSelect
                     v-model="localRoutine.dataAccess"
                     :options="['CONTAINS SQL', 'NO SQL', 'READS SQL DATA', 'MODIFIES SQL DATA']"
                     class="form-select"
                  />
               </div>
            </div>
            <div v-if="customizations.procedureDeterministic" class="column col-auto">
               <div class="form-group">
                  <label class="form-label d-invisible">.</label>
                  <label class="form-checkbox form-inline">
                     <input v-model="localRoutine.deterministic" type="checkbox"><i class="form-icon" /> {{ t('database.deterministic') }}
                  </label>
               </div>
            </div>
         </div>
      </div>
      <div class="workspace-query-results column col-12 mt-2 p-relative">
         <BaseLoader v-if="isLoading" />
         <label class="form-label ml-2">{{ t('database.routineBody') }}</label>
         <QueryEditor
            v-show="isSelected"
            ref="queryEditor"
            v-model="localRoutine.sql"
            :workspace="workspace"
            :schema="schema"
            :height="editorHeight"
         />
      </div>
      <WorkspaceTabPropsRoutineParamsModal
         v-if="isParamsModal"
         :local-parameters="localRoutine.parameters"
         :workspace="workspace"
         routine="new"
         @hide="hideParamsModal"
         @parameters-update="parametersUpdate"
      />
   </div>
</template>

<script setup lang="ts">
import { Ace } from 'ace-builds';
import { FunctionParam } from 'common/interfaces/antares';
import { ipcRenderer } from 'electron';
import { storeToRefs } from 'pinia';
import { Component, computed, onBeforeUnmount, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import BaseLoader from '@/components/BaseLoader.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import QueryEditor from '@/components/QueryEditor.vue';
import WorkspaceTabPropsRoutineParamsModal from '@/components/WorkspaceTabPropsRoutineParamsModal.vue';
import Routines from '@/ipc-api/Routines';
import { useConsoleStore } from '@/stores/console';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

const props = defineProps({
   tabUid: String,
   connection: Object,
   tab: Object,
   isSelected: Boolean,
   schema: String
});

const { addNotification } = useNotificationsStore();
const workspacesStore = useWorkspacesStore();
const { consoleHeight } = storeToRefs(useConsoleStore());

const {
   getWorkspace,
   refreshStructure,
   changeBreadcrumbs,
   setUnsavedChanges,
   newTab,
   removeTab
} = workspacesStore;

const queryEditor: Ref<Component & {editor: Ace.Editor; $el: HTMLElement}> = ref(null);
const firstInput: Ref<HTMLInputElement> = ref(null);
const isLoading = ref(false);
const isSaving = ref(false);
const isParamsModal = ref(false);
const originalRoutine = ref(null);
const localRoutine = ref(null);
const editorHeight = ref(300);

const workspace = computed(() => {
   return getWorkspace(props.connection.uid);
});

const customizations = computed(() => {
   return workspace.value.customizations;
});

const isChanged = computed(() => {
   return JSON.stringify(originalRoutine.value) !== JSON.stringify(localRoutine.value);
});

const saveChanges = async () => {
   if (isSaving.value) return;
   isSaving.value = true;
   const params = {
      uid: props.connection.uid,
      schema: props.schema,
      ...localRoutine.value
   };

   try {
      const { status, response } = await Routines.createRoutine(params);

      if (status === 'success') {
         await refreshStructure(props.connection.uid);

         newTab({
            uid: props.connection.uid,
            schema: props.schema,
            elementName: localRoutine.value.name,
            elementType: 'routine',
            type: 'routine-props'
         });

         removeTab({ uid: props.connection.uid, tab: props.tab.uid });
         changeBreadcrumbs({ schema: props.schema, routine: localRoutine.value.name });
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
   localRoutine.value = JSON.parse(JSON.stringify(originalRoutine.value));
   queryEditor.value.editor.session.setValue(localRoutine.value.sql);
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

const parametersUpdate = (parameters: FunctionParam[]) => {
   localRoutine.value = { ...localRoutine.value, parameters };
};

const showParamsModal = () => {
   isParamsModal.value = true;
};

const hideParamsModal = () => {
   isParamsModal.value = false;
};

const saveContentListener = () => {
   const hasModalOpen = !!document.querySelectorAll('.modal.active').length;
   if (props.isSelected && !hasModalOpen && isChanged.value)
      saveChanges();
};

watch(() => props.isSelected, (val) => {
   if (val) changeBreadcrumbs({ schema: props.schema });
});

watch(isChanged, (val) => {
   setUnsavedChanges({ uid: props.connection.uid, tUid: props.tabUid, isChanged: val });
});

watch(consoleHeight, () => {
   resizeQueryEditor();
});

originalRoutine.value = {
   sql: customizations.value.procedureSql,
   language: customizations.value.languages ? customizations.value.languages[0] : null,
   name: '',
   definer: '',
   comment: '',
   security: 'DEFINER',
   dataAccess: 'CONTAINS SQL',
   deterministic: false,
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   returns: workspace.value.dataTypes.length ? (workspace.value.dataTypes[0] as any).types[0].name : null
};

localRoutine.value = JSON.parse(JSON.stringify(originalRoutine.value));

setTimeout(() => {
   resizeQueryEditor();
}, 50);

onMounted(() => {
   if (props.isSelected)
      changeBreadcrumbs({ schema: props.schema });

   ipcRenderer.on('save-content', saveContentListener);

   setTimeout(() => {
      firstInput.value.focus();
   }, 100);
});

onBeforeUnmount(() => {
   ipcRenderer.removeListener('save-content', saveContentListener);
});

onUnmounted(() => {
   window.removeEventListener('resize', resizeQueryEditor);
});
</script>
