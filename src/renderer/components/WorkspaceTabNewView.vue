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
            <div class="workspace-query-info">
               <div class="d-flex" :title="t('word.schema')">
                  <i class="mdi mdi-18px mdi-database mr-1" /><b>{{ schema }}</b>
               </div>
            </div>
         </div>
      </div>
      <div class="container">
         <div class="columns">
            <div class="column col-auto">
               <div class="form-group">
                  <label class="form-label">{{ t('word.name') }}</label>
                  <input
                     ref="firstInput"
                     v-model="localView.name"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div class="column col-auto">
               <div v-if="workspace.customizations.definer" class="form-group">
                  <label class="form-label">{{ t('word.definer') }}</label>
                  <BaseSelect
                     v-model="localView.definer"
                     :options="users"
                     :option-label="(user: any) => user.value === '' ? t('message.currentUser') : `${user.name}@${user.host}`"
                     :option-track-by="(user: any) => user.value === '' ? '' : `\`${user.name}\`@\`${user.host}\``"
                     class="form-select"
                  />
               </div>
            </div>
            <div class="column col-auto mr-2">
               <div v-if="workspace.customizations.viewSqlSecurity" class="form-group">
                  <label class="form-label">{{ t('message.sqlSecurity') }}</label>
                  <BaseSelect
                     v-model="localView.security"
                     :options="['DEFINER', 'INVOKER']"
                     class="form-select"
                  />
               </div>
            </div>
            <div class="column col-auto mr-2">
               <div v-if="workspace.customizations.viewAlgorithm" class="form-group">
                  <label class="form-label">{{ t('word.algorithm') }}</label>
                  <BaseSelect
                     v-model="localView.algorithm"
                     :options="['UNDEFINED', 'MERGE', 'TEMPTABLE']"
                     class="form-select"
                  />
               </div>
            </div>
            <div v-if="workspace.customizations.viewUpdateOption" class="column col-auto mr-2">
               <div class="form-group">
                  <label class="form-label">{{ t('message.updateOption') }}</label>
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
         <label class="form-label ml-2">{{ t('message.selectStatement') }}</label>
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
import { Component, computed, onBeforeUnmount, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { Ace } from 'ace-builds';
import { useI18n } from 'vue-i18n';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import BaseLoader from '@/components/BaseLoader.vue';
import QueryEditor from '@/components/QueryEditor.vue';
import Views from '@/ipc-api/Views';
import BaseSelect from '@/components/BaseSelect.vue';

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

const {
   getWorkspace,
   refreshStructure,
   setUnsavedChanges,
   changeBreadcrumbs,
   newTab,
   removeTab
} = workspacesStore;

const queryEditor: Ref<Component & {editor: Ace.Editor; $el: HTMLElement}> = ref(null);
const firstInput: Ref<HTMLInputElement> = ref(null);
const isLoading = ref(false);
const isSaving = ref(false);
const originalView = ref(null);
const localView = ref(null);
const editorHeight = ref(300);

const workspace = computed(() => {
   return getWorkspace(props.connection.uid);
});

const isChanged = computed(() => {
   return JSON.stringify(originalView.value) !== JSON.stringify(localView.value);
});

const isDefinerInUsers = computed(() => {
   return originalView.value ? workspace.value.users.some(user => originalView.value.definer === `\`${user.name}\`@\`${user.host}\``) : true;
});

const users = computed(() => {
   const users = [{ value: '' }, ...workspace.value.users];
   if (!isDefinerInUsers.value) {
      const [name, host] = originalView.value.definer.replaceAll('`', '').split('@');
      users.unshift({ name, host });
   }

   return users;
});

const saveChanges = async () => {
   if (isSaving.value) return;
   isSaving.value = true;

   const params = {
      uid: props.connection.uid,
      schema: props.schema,
      ...localView.value
   };

   try {
      const { status, response } = await Views.createView(params);

      if (status === 'success') {
         await refreshStructure(props.connection.uid);

         newTab({
            uid: props.connection.uid,
            schema: props.schema,
            elementName: localView.value.name,
            elementType: 'view',
            type: 'view-props'
         });

         removeTab({ uid: props.connection.uid, tab: props.tab.uid });
         changeBreadcrumbs({ schema: props.schema, view: localView.value.name });
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

originalView.value = {
   algorithm: 'UNDEFINED',
   definer: '',
   security: 'DEFINER',
   updateOption: '',
   sql: '',
   name: ''
};

localView.value = JSON.parse(JSON.stringify(originalView.value));

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

   window.addEventListener('resize', resizeQueryEditor);
});

onUnmounted(() => {
   window.removeEventListener('resize', resizeQueryEditor);
});

onBeforeUnmount(() => {
   window.removeEventListener('keydown', onKey);
});

</script>
