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

               <div class="divider-vert py-3" />
               <button class="btn btn-dark btn-sm" @click="showTimingModal">
                  <i class="mdi mdi-24px mdi-timer mr-1" />
                  <span>{{ t('word.timing') }}</span>
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
                     v-model="localScheduler.name"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div class="column col-auto">
               <div class="form-group">
                  <label class="form-label">{{ t('word.definer') }}</label>
                  <BaseSelect
                     v-model="localScheduler.definer"
                     :options="users"
                     :option-label="(user: any) => user.value === '' ? t('message.currentUser') : `${user.name}@${user.host}`"
                     :option-track-by="(user: any) => user.value === '' ? '' : `\`${user.name}\`@\`${user.host}\``"
                     class="form-select"
                  />
               </div>
            </div>
            <div class="column">
               <div class="form-group">
                  <label class="form-label">{{ t('word.comment') }}</label>
                  <input
                     v-model="localScheduler.comment"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div class="column">
               <div class="form-group">
                  <label class="form-label mr-2">{{ t('word.state') }}</label>
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
         <label class="form-label ml-2">{{ t('message.schedulerBody') }}</label>
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
import { AlterEventParams, EventInfos } from 'common/interfaces/antares';
import { Component, computed, onBeforeUnmount, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { Ace } from 'ace-builds';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useConsoleStore } from '@/stores/console';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import BaseLoader from '@/components/BaseLoader.vue';
import QueryEditor from '@/components/QueryEditor.vue';
import WorkspaceTabPropsSchedulerTimingModal from '@/components/WorkspaceTabPropsSchedulerTimingModal.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import Schedulers from '@/ipc-api/Schedulers';
import { ipcRenderer } from 'electron';

const { t } = useI18n();

const props = defineProps({
   tabUid: String,
   connection: Object,
   scheduler: String,
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
const isTimingModal = ref(false);
const originalScheduler: Ref<EventInfos> = ref(null);
const localScheduler: Ref<EventInfos> = ref({} as EventInfos);
const lastScheduler = ref(null);
const sqlProxy = ref('');
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

const getSchedulerData = async () => {
   if (!props.scheduler) return;

   isLoading.value = true;
   lastScheduler.value = props.scheduler;

   const params = {
      uid: props.connection.uid,
      schema: props.schema,
      scheduler: props.scheduler
   };

   try {
      const { status, response } = await Schedulers.getSchedulerInformations(params);
      if (status === 'success') {
         originalScheduler.value = response;
         localScheduler.value = JSON.parse(JSON.stringify(originalScheduler.value));
         sqlProxy.value = localScheduler.value.sql;
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
      scheduler: {
         ...localScheduler.value,
         schema: props.schema,
         oldName: originalScheduler.value.name
      } as AlterEventParams
   };

   try {
      const { status, response } = await Schedulers.alterScheduler(params);

      if (status === 'success') {
         const oldName = originalScheduler.value.name;

         await refreshStructure(props.connection.uid);

         if (oldName !== localScheduler.value.name) {
            renameTabs({
               uid: props.connection.uid,
               schema: props.schema,
               elementName: oldName,
               elementNewName: localScheduler.value.name,
               elementType: 'scheduler'
            });

            changeBreadcrumbs({ schema: props.schema, scheduler: localScheduler.value.name });
         }
         else
            getSchedulerData();
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

watch(() => props.schema, async () => {
   if (props.isSelected) {
      await getSchedulerData();
      queryEditor.value.editor.session.setValue(localScheduler.value.sql);
      lastScheduler.value = props.scheduler;
   }
});

watch(() => props.scheduler, async () => {
   if (props.isSelected) {
      await getSchedulerData();
      queryEditor.value.editor.session.setValue(localScheduler.value.sql);
      lastScheduler.value = props.scheduler;
   }
});

watch(() => props.isSelected, async (val) => {
   if (val) {
      changeBreadcrumbs({ schema: props.schema, scheduler: props.scheduler });

      setTimeout(() => {
         resizeQueryEditor();
      }, 200);

      if (lastScheduler.value !== props.scheduler)
         getSchedulerData();
   }
});

watch(isChanged, (val) => {
   setUnsavedChanges({ uid: props.connection.uid, tUid: props.tabUid, isChanged: val });
});

watch(consoleHeight, () => {
   resizeQueryEditor();
});

(async () => {
   await getSchedulerData();
   queryEditor.value.editor.session.setValue(localScheduler.value.sql);
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
