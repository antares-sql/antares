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
               <button class="btn btn-dark btn-sm" @click="showTimingModal">
                  <BaseIcon
                     class="mr-1"
                     icon-name="mdiTimer"
                     :size="24"
                  />
                  <span>{{ t('database.timing') }}</span>
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
                     ref="firstInput"
                     v-model="localScheduler.name"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div class="column col-auto">
               <div class="form-group">
                  <label class="form-label">{{ t('database.definer') }}</label>
                  <BaseSelect
                     v-model="localScheduler.definer"
                     :options="users"
                     :option-label="(user: any) => user.value === '' ? t('database.currentUser') : `${user.name}@${user.host}`"
                     :option-track-by="(user: any) => user.value === '' ? '' : `\`${user.name}\`@\`${user.host}\``"
                     class="form-select"
                  />
               </div>
            </div>
            <div class="column">
               <div class="form-group">
                  <label class="form-label">{{ t('database.comment') }}</label>
                  <input
                     v-model="localScheduler.comment"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div class="column">
               <div class="form-group">
                  <label class="form-label mr-2">{{ t('database.state') }}</label>
                  <label class="form-radio form-inline">
                     <input
                        v-model="localScheduler.state"
                        type="radio"
                        name="state"
                        value="ENABLE"
                     ><i class="form-icon" /> ENABLE
                  </label>
                  <label class="form-radio form-inline">
                     <input
                        v-model="localScheduler.state"
                        type="radio"
                        name="state"
                        value="DISABLE"
                     ><i class="form-icon" /> DISABLE
                  </label>
                  <label class="form-radio form-inline">
                     <input
                        v-model="localScheduler.state"
                        type="radio"
                        name="state"
                        value="DISABLE ON SLAVE"
                     ><i class="form-icon" /> DISABLE ON SLAVE
                  </label>
               </div>
            </div>
         </div>
      </div>
      <div class="workspace-query-results column col-12 mt-2 p-relative">
         <BaseLoader v-if="isLoading" />
         <label class="form-label ml-2">{{ t('database.schedulerBody') }}</label>
         <QueryEditor
            v-show="isSelected"
            ref="queryEditor"
            v-model="localScheduler.sql"
            :workspace="workspace"
            :schema="schema"
            :height="editorHeight"
         />
      </div>
      <WorkspaceTabPropsSchedulerTimingModal
         v-if="isTimingModal"
         :local-options="localScheduler"
         :workspace="workspace"
         @hide="hideTimingModal"
         @options-update="timingUpdate"
      />
   </div>
</template>

<script setup lang="ts">
import { Ace } from 'ace-builds';
import { ConnectionParams, EventInfos } from 'common/interfaces/antares';
import { ipcRenderer } from 'electron';
import { storeToRefs } from 'pinia';
import { Component, computed, onBeforeUnmount, onMounted, onUnmounted, Prop, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import BaseLoader from '@/components/BaseLoader.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import QueryEditor from '@/components/QueryEditor.vue';
import WorkspaceTabPropsSchedulerTimingModal from '@/components/WorkspaceTabPropsSchedulerTimingModal.vue';
import Schedulers from '@/ipc-api/Schedulers';
import { useConsoleStore } from '@/stores/console';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

const props = defineProps({
   tabUid: String,
   connection: Object as Prop<ConnectionParams>,
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
const isTimingModal = ref(false);
const originalScheduler = ref(null);
const localScheduler = ref(null);
const editorHeight = ref(300);

const workspace = computed(() => {
   return getWorkspace(props.connection.uid);
});

const isChanged = computed(() => {
   return JSON.stringify(originalScheduler.value) !== JSON.stringify(localScheduler.value);
});

const isDefinerInUsers = computed(() => {
   return originalScheduler.value ? workspace.value.users.some(user => originalScheduler.value.definer === `\`${user.name}\`@\`${user.host}\``) : true;
});

const users = computed(() => {
   const users = [{ value: '' }, ...workspace.value.users];
   if (!isDefinerInUsers.value) {
      const [name, host] = originalScheduler.value.definer.replaceAll('`', '').split('@');
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
      ...localScheduler.value
   };

   try {
      const { status, response } = await Schedulers.createScheduler(params);

      if (status === 'success') {
         await refreshStructure(props.connection.uid);

         newTab({
            uid: props.connection.uid,
            schema: props.schema,
            elementName: localScheduler.value.name,
            elementType: 'scheduler',
            type: 'scheduler-props'
         });

         removeTab({ uid: props.connection.uid, tab: props.tab.uid });
         changeBreadcrumbs({ schema: props.schema, scheduler: localScheduler.value.name });
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
   localScheduler.value = JSON.parse(JSON.stringify(originalScheduler.value));
   queryEditor.value.editor.session.setValue(localScheduler.value.sql);
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

const showTimingModal = () => {
   isTimingModal.value = true;
};

const hideTimingModal = () => {
   isTimingModal.value = false;
};

const timingUpdate = (options: EventInfos) => {
   localScheduler.value = options;
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

originalScheduler.value = {
   definer: '',
   sql: 'BEGIN\r\n\r\nEND',
   name: '',
   comment: '',
   execution: 'EVERY',
   every: ['1', 'DAY'],
   preserve: true,
   state: 'DISABLE'
};

localScheduler.value = { ...originalScheduler.value };

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
