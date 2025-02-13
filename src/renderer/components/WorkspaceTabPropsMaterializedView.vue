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
                  <label class="form-label">{{ t('general.name') }}</label>
                  <input
                     v-model="localView.name"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div class="column col-auto">
               <div v-if="workspace.customizations.definer" class="form-group">
                  <label class="form-label">{{ t('database.definer') }}</label>
                  <BaseSelect
                     v-model="localView.definer"
                     :options="users"
                     :option-label="(user: any) => user.value === '' ? t('database.currentUser') : `${user.name}@${user.host}`"
                     :option-track-by="(user: any) => user.value === '' ? '' : `\`${user.name}\`@\`${user.host}\``"
                     class="form-select"
                  />
               </div>
            </div>
            <div class="column col-auto mr-2">
               <div v-if="workspace.customizations.viewSqlSecurity" class="form-group">
                  <label class="form-label">{{ t('database.sqlSecurity') }}</label>
                  <BaseSelect
                     v-model="localView.security"
                     :options="['DEFINER', 'INVOKER']"
                     class="form-select"
                  />
               </div>
            </div>
            <div class="column col-auto mr-2">
               <div v-if="workspace.customizations.viewAlgorithm" class="form-group">
                  <label class="form-label">{{ t('database.algorithm') }}</label>
                  <BaseSelect
                     v-model="localView.algorithm"
                     :options="['UNDEFINED', 'MERGE', 'TEMPTABLE']"
                     class="form-select"
                  />
               </div>
            </div>
            <div v-if="workspace.customizations.viewUpdateOption" class="column col-auto mr-2">
               <div class="form-group">
                  <label class="form-label">{{ t('database.updateOption') }}</label>
                  <BaseSelect
                     v-model="localView.updateOption"
                     :option-track-by="(user: any) => user.value"
                     :options="[{label: 'None', value: ''}, {label: 'CASCADED', value: 'CASCADED'}, {label: 'LOCAL', value: 'LOCAL'}]"
                     class="form-select"
                  />
               </div>
            </div>
         </div>
      </div>
      <div class="workspace-query-results column col-12 mt-2 p-relative">
         <BaseLoader v-if="isLoading" />
         <label class="form-label ml-2">{{ t('database.selectStatement') }}</label>
         <QueryEditor
            v-show="isSelected"
            ref="queryEditor"
            v-model="localView.sql"
            :workspace="workspace"
            :schema="schema"
            :height="editorHeight"
         />
      </div>
   </div>
</template>

<script setup lang="ts">
import { Ace } from 'ace-builds';
import { ipcRenderer } from 'electron';
import { Component, computed, onBeforeUnmount, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import BaseLoader from '@/components/BaseLoader.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import QueryEditor from '@/components/QueryEditor.vue';
import Views from '@/ipc-api/Views';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

const props = defineProps({
   tabUid: String,
   connection: Object,
   isSelected: Boolean,
   schema: String,
   view: String
});

const { addNotification } = useNotificationsStore();
const workspacesStore = useWorkspacesStore();

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
const originalView = ref(null);
const localView = ref(null);
const editorHeight = ref(300);
const lastView = ref(null);
const sqlProxy = ref('');

const workspace = computed(() => getWorkspace(props.connection.uid));
const isChanged = computed(() => JSON.stringify(originalView.value) !== JSON.stringify(localView.value));
const isDefinerInUsers = computed(() => originalView.value ? workspace.value.users.some(user => originalView.value.definer === `\`${user.name}\`@\`${user.host}\``) : true);

const users = computed(() => {
   const users = [{ value: '' }, ...workspace.value.users];
   if (!isDefinerInUsers.value) {
      const [name, host] = originalView.value.definer.replaceAll('`', '').split('@');
      users.unshift({ name, host });
   }

   return users;
});

const getViewData = async () => {
   if (!props.view) return;
   isLoading.value = true;
   localView.value = { sql: '' };
   lastView.value = props.view;

   const params = {
      uid: props.connection.uid,
      schema: props.schema,
      view: props.view
   };

   try {
      const { status, response } = await Views.getMaterializedViewInformations(params);
      if (status === 'success') {
         originalView.value = response;
         localView.value = JSON.parse(JSON.stringify(originalView.value));
         sqlProxy.value = localView.value.sql;
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
      view: {
         ...localView.value,
         schema: props.schema,
         oldName: originalView.value.name
      }
   };

   try {
      const { status, response } = await Views.alterMaterializedView(params);

      if (status === 'success') {
         const oldName = originalView.value.name;

         await refreshStructure(props.connection.uid);

         if (oldName !== localView.value.name) {
            renameTabs({
               uid: props.connection.uid,
               schema: props.schema,
               elementName: oldName,
               elementNewName: localView.value.name,
               elementType: 'materializedView'
            });

            changeBreadcrumbs({ schema: props.schema, view: localView.value.name });
         }
         else
            getViewData();
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
   localView.value = JSON.parse(JSON.stringify(originalView.value));
   queryEditor.value.editor.session.setValue(localView.value.sql);
};

const resizeQueryEditor = () => {
   if (queryEditor.value) {
      const footer = document.getElementById('footer');
      const size = window.innerHeight - queryEditor.value.$el.getBoundingClientRect().top - footer.offsetHeight;
      editorHeight.value = size;
      queryEditor.value.editor.resize();
   }
};

const saveContentListener = () => {
   const hasModalOpen = !!document.querySelectorAll('.modal.active').length;
   if (props.isSelected && !hasModalOpen && isChanged.value)
      saveChanges();
};

watch(() => props.schema, async () => {
   if (props.isSelected) {
      await getViewData();
      queryEditor.value.editor.session.setValue(localView.value.sql);
      lastView.value = props.view;
   }
});

watch(() => props.view, async () => {
   if (props.isSelected) {
      await getViewData();
      queryEditor.value.editor.session.setValue(localView.value.sql);
      lastView.value = props.view;
   }
});

watch(() => props.isSelected, (val) => {
   if (val) {
      changeBreadcrumbs({ schema: props.schema, view: localView.value.name });

      setTimeout(() => {
         resizeQueryEditor();
      }, 50);
   }
});

watch(isChanged, (val) => {
   setUnsavedChanges({ uid: props.connection.uid, tUid: props.tabUid, isChanged: val });
});

(async () => {
   await getViewData();
   queryEditor.value.editor.session.setValue(localView.value.sql);
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
