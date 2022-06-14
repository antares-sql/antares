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
                  <span>{{ $t('word.save') }}</span>
               </button>
               <button
                  :disabled="!isChanged"
                  class="btn btn-link btn-sm mr-0"
                  :title="$t('message.clearChanges')"
                  @click="clearChanges"
               >
                  <i class="mdi mdi-24px mdi-delete-sweep mr-1" />
                  <span>{{ $t('word.clear') }}</span>
               </button>

               <div class="divider-vert py-3" />

               <button class="btn btn-dark btn-sm" @click="showParamsModal">
                  <i class="mdi mdi-24px mdi-dots-horizontal mr-1" />
                  <span>{{ $t('word.parameters') }}</span>
               </button>
            </div>
            <div class="workspace-query-info">
               <div class="d-flex" :title="$t('word.schema')">
                  <i class="mdi mdi-18px mdi-database mr-1" /><b>{{ schema }}</b>
               </div>
            </div>
         </div>
      </div>
      <div class="container">
         <div class="columns">
            <div class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ $t('word.name') }}
                  </label>
                  <input
                     ref="firstInput"
                     v-model="localFunction.name"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div v-if="customizations.languages" class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ $t('word.language') }}
                  </label>
                  <BaseSelect
                     v-model="localFunction.language"
                     :options="customizations.languages"
                     class="form-select"
                  />
               </div>
            </div>
            <div v-if="customizations.definer" class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ $t('word.definer') }}
                  </label>
                  <BaseSelect
                     v-model="localFunction.definer"
                     :options="[{value: '', name:$t('message.currentUser')}, ...workspace.users]"
                     :option-label="(user: any) => user.value === '' ? user.name : `${user.name}@${user.host}`"
                     :option-track-by="(user: any) => user.value === '' ? '' : `\`${user.name}\`@\`${user.host}\``"
                     class="form-select"
                  />
               </div>
            </div>
            <div class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ $t('word.returns') }}
                  </label>
                  <div class="input-group">
                     <BaseSelect
                        v-model="localFunction.returns"
                        class="form-select text-uppercase"
                        :options="[{ name: 'VOID' }, ...(workspace.dataTypes as any)]"
                        group-label="group"
                        group-values="types"
                        option-label="name"
                        option-track-by="name"
                        style="max-width: 150px;"
                     />
                     <input
                        v-if="customizations.parametersLength"
                        v-model="localFunction.returnsLength"
                        style="max-width: 150px;"
                        class="form-input"
                        type="number"
                        min="0"
                        :placeholder="$t('word.length')"
                     >
                  </div>
               </div>
            </div>
            <div v-if="customizations.comment" class="column">
               <div class="form-group">
                  <label class="form-label">
                     {{ $t('word.comment') }}
                  </label>
                  <input
                     v-model="localFunction.comment"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ $t('message.sqlSecurity') }}
                  </label>
                  <BaseSelect
                     v-model="localFunction.security"
                     :options="['DEFINER', 'INVOKER']"
                     class="form-select"
                  />
               </div>
            </div>
            <div v-if="customizations.functionDataAccess" class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ $t('message.dataAccess') }}
                  </label>
                  <BaseSelect
                     v-model="localFunction.dataAccess"
                     :options="['CONTAINS SQL', 'NO SQL', 'READS SQL DATA', 'MODIFIES SQL DATA']"
                     class="form-select"
                  />
               </div>
            </div>
            <div v-if="customizations.functionDeterministic" class="column col-auto">
               <div class="form-group">
                  <label class="form-label d-invisible">.</label>
                  <label class="form-checkbox form-inline">
                     <input v-model="localFunction.deterministic" type="checkbox"><i class="form-icon" /> {{ $t('word.deterministic') }}
                  </label>
               </div>
            </div>
         </div>
      </div>
      <div class="workspace-query-results column col-12 mt-2 p-relative">
         <BaseLoader v-if="isLoading" />
         <label class="form-label ml-2">{{ $t('message.functionBody') }}</label>
         <QueryEditor
            v-show="isSelected"
            ref="queryEditor"
            v-model="localFunction.sql"
            :workspace="workspace"
            :schema="schema"
            :height="editorHeight"
         />
      </div>
      <WorkspaceTabPropsFunctionParamsModal
         v-if="isParamsModal"
         :local-parameters="localFunction.parameters"
         :workspace="workspace"
         :func="localFunction.name"
         @hide="hideParamsModal"
         @parameters-update="parametersUpdate"
      />
   </div>
</template>

<script setup lang="ts">
import { Component, computed, onBeforeUnmount, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { Ace } from 'ace-builds';
import Functions from '@/ipc-api/Functions';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import BaseLoader from '@/components/BaseLoader.vue';
import QueryEditor from '@/components/QueryEditor.vue';
import WorkspaceTabPropsFunctionParamsModal from '@/components/WorkspaceTabPropsFunctionParamsModal.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import { FunctionInfos, FunctionParam } from 'common/interfaces/antares';

const props = defineProps({
   tabUid: String,
   connection: Object,
   tab: Object,
   isSelected: Boolean,
   schema: String
});

const { addNotification } = useNotificationsStore();
const workspacesStore = useWorkspacesStore();

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
const originalFunction: Ref<FunctionInfos> = ref(null);
const localFunction = ref(null);
const editorHeight = ref(300);

const workspace = computed(() => {
   return getWorkspace(props.connection.uid);
});

const customizations = computed(() => {
   return workspace.value.customizations;
});

const isChanged = computed(() => {
   return JSON.stringify(originalFunction.value) !== JSON.stringify(localFunction.value);
});

const saveChanges = async () => {
   if (isSaving.value) return;
   isSaving.value = true;
   const params = {
      uid: props.connection.uid,
      schema: props.schema,
      ...localFunction.value
   };

   try {
      const { status, response } = await Functions.createFunction(params);

      if (status === 'success') {
         await refreshStructure(props.connection.uid);

         newTab({
            uid: props.connection.uid,
            schema: props.schema,
            elementName: localFunction.value.name,
            elementType: 'function',
            type: 'function-props'
         });

         removeTab({ uid: props.connection.uid, tab: props.tab.uid });
         changeBreadcrumbs({ schema: props.schema, function: localFunction.value.name });
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
      const footer = document.getElementById('footer');
      const size = window.innerHeight - queryEditor.value.$el.getBoundingClientRect().top - footer.offsetHeight;
      editorHeight.value = size;
      queryEditor.value.editor.resize();
   }
};

const parametersUpdate = (parameters: FunctionParam[]) => {
   localFunction.value = { ...localFunction.value, parameters };
};

const showParamsModal = () => {
   isParamsModal.value = true;
};

const hideParamsModal = () => {
   isParamsModal.value = false;
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

watch(() => props.isSelected, (val) => {
   if (val) changeBreadcrumbs({ schema: props.schema });
});

watch(isChanged, (val) => {
   setUnsavedChanges({ uid: props.connection.uid, tUid: props.tabUid, isChanged: val });
});

originalFunction.value = {
   sql: customizations.value.functionSql,
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

localFunction.value = JSON.parse(JSON.stringify(originalFunction.value));

setTimeout(() => {
   resizeQueryEditor();
}, 50);

window.addEventListener('keydown', onKey);

onMounted(() => {
   if (props.isSelected)
      changeBreadcrumbs({ schema: props.schema });

   setTimeout(() => {
      firstInput.value.focus();
   }, 100);
});

onBeforeUnmount(() => {
   window.removeEventListener('keydown', onKey);
});

onUnmounted(() => {
   window.removeEventListener('resize', resizeQueryEditor);
});
</script>
