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
                  <i class="mdi mdi-24px mdi-content-save mr-1" />
                  <span>{{ t('general.save') }}</span>
               </button>
               <button
                  :disabled="!isChanged"
                  class="btn btn-link btn-sm mr-0"
                  :title="t('database.clearChanges')"
                  @click="clearChanges"
               >
                  <i class="mdi mdi-24px mdi-delete-sweep mr-1" />
                  <span>{{ t('general.clear') }}</span>
               </button>

               <div class="divider-vert py-3" />

               <button
                  class="btn btn-dark btn-sm"
                  :disabled="isChanged"
                  @click="runRoutineCheck"
               >
                  <i class="mdi mdi-24px mdi-play mr-1" />
                  <span>{{ t('general.run') }}</span>
               </button>
               <button class="btn btn-dark btn-sm" @click="showParamsModal">
                  <i class="mdi mdi-24px mdi-dots-horizontal mr-1" />
                  <span>{{ t('database.parameters') }}</span>
               </button>
            </div>
            <div class="workspace-query-info">
               <div class="d-flex" :title="t('database.schema')">
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
                     {{ t('general.name') }}
                  </label>
                  <input
                     ref="firstInput"
                     v-model="localRoutine.name"
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
                     :options="[{value: '', name: t('database.currentUser')}, ...workspace.users]"
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
         :routine="localRoutine.name"
         @hide="hideParamsModal"
         @parameters-update="parametersUpdate"
      />
      <ModalAskParameters
         v-if="isAskingParameters"
         :local-routine="localRoutine"
         :client="workspace.client"
         @confirm="runRoutine"
         @close="hideAskParamsModal"
      />
   </div>
</template>

<script setup lang="ts">
import { Component, computed, onUnmounted, onBeforeUnmount, onMounted, Ref, ref, watch } from 'vue';
import { AlterRoutineParams, FunctionParam, RoutineInfos } from 'common/interfaces/antares';
import { Ace } from 'ace-builds';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useConsoleStore } from '@/stores/console';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import { uidGen } from 'common/libs/uidGen';
import Routines from '@/ipc-api/Routines';
import QueryEditor from '@/components/QueryEditor.vue';
import BaseLoader from '@/components/BaseLoader.vue';
import WorkspaceTabPropsRoutineParamsModal from '@/components/WorkspaceTabPropsRoutineParamsModal.vue';
import ModalAskParameters from '@/components/ModalAskParameters.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import { ipcRenderer } from 'electron';

const { t } = useI18n();

const props = defineProps({
   tabUid: String,
   connection: Object,
   routine: String,
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

const queryEditor: Ref<Component & {editor: Ace.Editor; $el: HTMLElement}> = ref(null);
const firstInput: Ref<HTMLInputElement> = ref(null);
const isLoading = ref(false);
const isSaving = ref(false);
const isParamsModal = ref(false);
const isAskingParameters = ref(false);
const originalRoutine: Ref<RoutineInfos> = ref(null);
const localRoutine: Ref<RoutineInfos> = ref(null);
const lastRoutine = ref(null);
const sqlProxy = ref('');
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

const isTableNameValid = computed(() => {
   return localRoutine.value.name !== '';
});

const getRoutineData = async () => {
   if (!props.routine) return;

   localRoutine.value = { name: '', sql: '', definer: null };
   isLoading.value = true;
   lastRoutine.value = props.routine;

   const params = {
      uid: props.connection.uid,
      schema: props.schema,
      routine: props.routine
   };

   try {
      const { status, response } = await Routines.getRoutineInformations(params);
      if (status === 'success') {
         originalRoutine.value = response;

         originalRoutine.value.parameters = [...originalRoutine.value.parameters.map(param => {
            param._antares_id = uidGen();
            return param;
         })];

         localRoutine.value = JSON.parse(JSON.stringify(originalRoutine.value));
         sqlProxy.value = localRoutine.value.sql;
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
      uid: props.connection.uid as string,
      routine: {
         ...localRoutine.value,
         schema: props.schema,
         oldName: originalRoutine.value.name
      } as AlterRoutineParams
   };

   try {
      const { status, response } = await Routines.alterRoutine(params);

      if (status === 'success') {
         const oldName = originalRoutine.value.name;

         await refreshStructure(props.connection.uid);

         if (oldName !== localRoutine.value.name) {
            renameTabs({
               uid: props.connection.uid,
               schema: props.schema,
               elementName: oldName,
               elementNewName: localRoutine.value.name,
               elementType: 'procedure'
            });

            changeBreadcrumbs({ schema: props.schema, routine: localRoutine.value.name });
         }
         else
            getRoutineData();
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

const runRoutineCheck = () => {
   if (localRoutine.value.parameters.length)
      showAskParamsModal();
   else
      runRoutine();
};

const runRoutine = (params?: string[]) => {
   if (!params) params = [];

   let sql;
   switch (props.connection.client) { // TODO: move in a better place
      case 'maria':
      case 'mysql':
      case 'pg':
         sql = `CALL ${originalRoutine.value.name}(${params.join(',')})`;
         break;
      case 'firebird':
         sql = `EXECUTE PROCEDURE "${originalRoutine.value.name}"(${params.join(',')})`;
         break;
      case 'mssql':
         sql = `EXEC ${originalRoutine.value.name} ${params.join(',')}`;
         break;
      default:
         sql = `CALL \`${originalRoutine.value.name}\`(${params.join(',')})`;
   }

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
      await getRoutineData();
      queryEditor.value.editor.session.setValue(localRoutine.value.sql);
      lastRoutine.value = props.routine;
   }
});

watch(() => props.routine, async () => {
   if (props.isSelected) {
      await getRoutineData();
      queryEditor.value.editor.session.setValue(localRoutine.value.sql);
      lastRoutine.value = props.routine;
   }
});

watch(() => props.isSelected, async (val) => {
   if (val) {
      changeBreadcrumbs({ schema: props.schema, routine: props.routine });

      setTimeout(() => {
         resizeQueryEditor();
      }, 200);

      if (lastRoutine.value !== props.routine)
         getRoutineData();
   }
});

watch(isChanged, (val) => {
   setUnsavedChanges({ uid: props.connection.uid, tUid: props.tabUid, isChanged: val });
});

watch(consoleHeight, () => {
   resizeQueryEditor();
});

(async () => {
   await getRoutineData();
   queryEditor.value.editor.session.setValue(localRoutine.value.sql);
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
