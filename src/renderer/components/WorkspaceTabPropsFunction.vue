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
                     icon-name="save"
                     :size="24"
                  />
                  <span>{{ t('general.save') }}</span>
               </button>
               <button
                  :disabled="!isChanged"
                  class="btn btn-link btn-sm mr-0"
                  :title="t('database.discardChanges')"
                  @click="clearChanges"
               >
                  <BaseIcon
                     class="mr-1"
                     icon-name="restore"
                     :size="24"
                  />
                  <span>{{ t('general.restore') }}</span>
               </button>

               <div class="divider-vert py-3" />
               <BaseToolbarOverflow>
                  <button
                     class="btn btn-dark btn-sm"
                     :disabled="isChanged"
                     @click="runFunctionCheck"
                  >
                     <BaseIcon
                        class="mr-1"
                        icon-name="play"
                        :size="24"
                     />
                     <span>{{ t('general.run') }}</span>
                  </button>
                  <button class="btn btn-dark btn-sm" @click="showParamsModal">
                     <BaseIcon
                        class="mr-1"
                        icon-name="dots"
                        :size="24"
                     />
                     <span>{{ t('database.parameters') }}</span>
                  </button>
               </BaseToolbarOverflow>
            </div>
            <div class="workspace-query-info">
               <div class="d-flex" :title="t('database.schema')">
                  <BaseIcon
                     class="mt-1 mr-1"
                     icon-name="database"
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
                     v-model="localFunction.name"
                     class="form-input"
                     :class="{'is-error': !isTableNameValid}"
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
                     v-model="localFunction.language"
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
                     v-model="localFunction.definer"
                     :options="[{value: '', name:t('database.currentUser')}, ...workspace.users]"
                     :option-label="(user: any) => user.value === '' ? user.name : `${user.name}@${user.host}`"
                     :option-track-by="(user: any) => user.value === '' ? '' : `\`${user.name}\`@\`${user.host}\``"
                     class="form-select"
                  />
               </div>
            </div>
            <div class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ t('database.returns') }}
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
                        type="text"
                        :placeholder="t('database.length')"
                     >
                  </div>
               </div>
            </div>
            <div v-if="customizations.comment" class="column">
               <div class="form-group">
                  <label class="form-label">
                     {{ t('database.comment') }}
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
                     {{ t('database.sqlSecurity') }}
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
                     {{ t('database.dataAccess') }}
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
                     <input v-model="localFunction.deterministic" type="checkbox"><i class="form-icon" /> {{ t('database.deterministic') }}
                  </label>
               </div>
            </div>
         </div>
      </div>
      <div class="workspace-query-results column col-12 mt-2 p-relative">
         <BaseLoader v-if="isLoading" />
         <label class="form-label ml-2">{{ t('database.functionBody') }}</label>
         <QueryEditor
            v-show="isSelected"
            ref="queryEditor"
            v-model="localFunction.sql"
            formattable
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
      <ModalAskParameters
         v-if="isAskingParameters"
         :local-routine="localFunction"
         :client="workspace.client"
         @confirm="runFunction"
         @close="hideAskParamsModal"
      />
   </div>
</template>

<script setup lang="ts">
import { AlterFunctionParams, FunctionInfos, FunctionParam } from 'common/interfaces/antares';
import { buildFunctionCall } from 'common/libs/routineCalls';
import { uidGen } from 'common/libs/uidGen';
import { ipcRenderer } from 'electron';
import { storeToRefs } from 'pinia';
import { Component, computed, onBeforeUnmount, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import BaseLoader from '@/components/BaseLoader.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import BaseToolbarOverflow from '@/components/BaseToolbarOverflow.vue';
import ModalAskParameters from '@/components/ModalAskParameters.vue';
import QueryEditor from '@/components/QueryEditor.vue';
import WorkspaceTabPropsFunctionParamsModal from '@/components/WorkspaceTabPropsFunctionParamsModal.vue';
import Functions from '@/ipc-api/Functions';
import { EditorApi } from '@/libs/editorApi';
import { useConsoleStore } from '@/stores/console';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';

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
   newTab,
   changeBreadcrumbs,
   setUnsavedChanges
} = workspacesStore;

const queryEditor: Ref<Component & EditorApi & { $el: HTMLElement }> = ref(null);
const firstInput: Ref<HTMLInputElement> = ref(null);
const isLoading = ref(false);
const isSaving = ref(false);
const isParamsModal = ref(false);
const isAskingParameters = ref(false);
const originalFunction: Ref<FunctionInfos> = ref(null);
const localFunction: Ref<FunctionInfos> = ref({ name: '', sql: '', definer: null });
const lastFunction = ref(null);
const sqlProxy = ref('');
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

const isTableNameValid = computed(() => {
   return localFunction.value.name !== '';
});

const getFunctionData = async () => {
   if (!props.function) return;

   isLoading.value = true;
   localFunction.value = { name: '', sql: '', definer: null };
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

         originalFunction.value.parameters = [...originalFunction.value.parameters.map(param => {
            param._antares_id = uidGen();
            return param;
         })];

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
      const { status, response } = await Functions.alterFunction(params);

      if (status === 'success') {
         const oldName = originalFunction.value.name;

         await refreshStructure(props.connection.uid);

         if (oldName !== localFunction.value.name) {
            renameTabs({
               uid: props.connection.uid,
               schema: props.schema,
               elementName: oldName,
               elementNewName: localFunction.value.name,
               elementType: 'function'
            });

            changeBreadcrumbs({ schema: props.schema, function: localFunction.value.name });
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
   queryEditor.value.setValue(localFunction.value.sql);
};

const resizeQueryEditor = () => {
   if (queryEditor.value) {
      let sizeToSubtract = 0;
      const footer = document.getElementById('footer');
      if (footer) sizeToSubtract += footer.offsetHeight;
      sizeToSubtract += consoleHeight.value;

      const size = window.innerHeight - queryEditor.value.$el.getBoundingClientRect().top - sizeToSubtract;
      editorHeight.value = size;
      queryEditor.value.resize();
   }
};

const parametersUpdate = (parameters: FunctionParam[]) => {
   localFunction.value = { ...localFunction.value, parameters };
};

const runFunctionCheck = () => {
   if (localFunction.value.parameters.length)
      showAskParamsModal();
   else
      runFunction();
};

const runFunction = (params?: string[]) => {
   if (!params) params = [];

   const sql = buildFunctionCall(props.connection.client, originalFunction.value.name, params);

   newTab({ uid: props.connection.uid, content: sql, type: 'query', autorun: true });
};

const showParamsModal = () => {
   isParamsModal.value = true;
};

const hideParamsModal = () => {
   isParamsModal.value = false;
};

const showAskParamsModal = () => {
   isAskingParameters.value = true;
};

const hideAskParamsModal = () => {
   isAskingParameters.value = false;
};

const saveContentListener = () => {
   const hasModalOpen = !!document.querySelectorAll('.modal.active').length;
   if (props.isSelected && !hasModalOpen && isChanged.value)
      saveChanges();
};

watch(() => props.schema, async () => {
   if (props.isSelected) {
      await getFunctionData();
      queryEditor.value.setValue(localFunction.value.sql);
      lastFunction.value = props.function;
   }
});

watch(() => props.function, async () => {
   if (props.isSelected) {
      await getFunctionData();
      queryEditor.value.setValue(localFunction.value.sql);
      lastFunction.value = props.function;
   }
});

watch(() => props.isSelected, async (val) => {
   if (val) {
      changeBreadcrumbs({ schema: props.schema, function: props.function });

      setTimeout(() => {
         resizeQueryEditor();
      }, 200);

      if (lastFunction.value !== props.function)
         getFunctionData();
   }
});

watch(isChanged, (val) => {
   setUnsavedChanges({ uid: props.connection.uid, tUid: props.tabUid, isChanged: val });
});

watch(consoleHeight, () => {
   resizeQueryEditor();
});

(async () => {
   await getFunctionData();
   queryEditor.value.setValue(localFunction.value.sql);
})();

onMounted(() => {
   window.addEventListener('resize', resizeQueryEditor);

   ipcRenderer.on('save-content', saveContentListener);
});

onUnmounted(() => {
   window.removeEventListener('resize', resizeQueryEditor);
});

onBeforeUnmount(() => {
   ipcRenderer.removeListener('save-content', saveContentListener);
});
</script>
