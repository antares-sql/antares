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
      <div class="px-2">
         <div class="columns">
            <div class="column col-auto">
               <div class="form-group">
                  <label class="form-label">{{ t('word.name') }}</label>
                  <input
                     v-model="localTrigger.name"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div v-if="customizations.definer" class="column col-auto">
               <div class="form-group">
                  <label class="form-label">{{ t('word.definer') }}</label>
                  <BaseSelect
                     v-model="localTrigger.definer"
                     :options="users"
                     :option-label="(user: any) => user.value === '' ? t('message.currentUser') : `${user.name}@${user.host}`"
                     :option-track-by="(user: any) => user.value === '' ? '' : `\`${user.name}\`@\`${user.host}\``"
                     class="form-select"
                  />
               </div>
            </div>
            <fieldset class="column columns mb-0" :disabled="customizations.triggerOnlyRename">
               <div class="column col-auto">
                  <div class="form-group">
                     <label class="form-label">{{ t('word.table') }}</label>
                     <BaseSelect
                        v-model="localTrigger.table"
                        :options="schemaTables"
                        option-label="name"
                        option-track-by="name"
                        class="form-select"
                     />
                  </div>
               </div>
               <div class="column col-auto">
                  <div class="form-group">
                     <label class="form-label">{{ t('word.event') }}</label>
                     <div class="input-group">
                        <BaseSelect
                           v-model="localTrigger.activation"
                           :options="['BEFORE', 'AFTER']"
                           class="form-select"
                        />
                        <BaseSelect
                           v-if="!customizations.triggerMultipleEvents"
                           v-model="localTrigger.event"
                           :options="Object.keys(localEvents)"
                           class="form-select"
                        />

                        <div v-if="customizations.triggerMultipleEvents" class="px-4">
                           <label
                              v-for="event in (Object.keys(localEvents) as ('INSERT' | 'UPDATE' | 'DELETE')[])"
                              :key="event"
                              class="form-checkbox form-inline"
                              @change.prevent="changeEvents(event)"
                           >
                              <input :checked="localEvents[event]" type="checkbox"><i class="form-icon" /> {{ event }}
                           </label>
                        </div>
                     </div>
                  </div>
               </div>
            </fieldset>
         </div>
      </div>
      <div class="workspace-query-results column col-12 mt-2 p-relative">
         <BaseLoader v-if="isLoading" />
         <label class="form-label ml-2">{{ t('message.triggerStatement') }}</label>
         <QueryEditor
            v-show="isSelected"
            ref="queryEditor"
            v-model="localTrigger.sql"
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
import { useConsoleStore } from '@/stores/console';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import QueryEditor from '@/components/QueryEditor.vue';
import BaseLoader from '@/components/BaseLoader.vue';
import Triggers from '@/ipc-api/Triggers';
import BaseSelect from '@/components/BaseSelect.vue';

type TriggerEventName = 'INSERT' | 'UPDATE' | 'DELETE'

const { t } = useI18n();

const props = defineProps({
   tabUid: String,
   connection: Object,
   trigger: String,
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
const lastTrigger = ref(null);
const isLoading = ref(false);
const isSaving = ref(false);
const originalTrigger = ref(null);
const localTrigger = ref(null);
const editorHeight = ref(300);
const localEvents = ref({ INSERT: false, UPDATE: false, DELETE: false });

const workspace = computed(() => {
   return getWorkspace(props.connection.uid);
});

const customizations = computed(() => {
   return workspace.value.customizations;
});

const isChanged = computed(() => {
   return JSON.stringify(originalTrigger.value) !== JSON.stringify(localTrigger.value);
});

const isDefinerInUsers = computed(() => {
   return originalTrigger.value ? workspace.value.users.some(user => originalTrigger.value.definer === `\`${user.name}\`@\`${user.host}\``) : true;
});

const schemaTables = computed(() => {
   const schemaTables = workspace.value.structure
      .filter(schema => schema.name === props.schema)
      .map(schema => schema.tables);

   return schemaTables.length ? schemaTables[0].filter(table => table.type === 'table') : [];
});

const users = computed(() => {
   const users = [{ value: '' }, ...workspace.value.users];
   if (!isDefinerInUsers.value) {
      const [name, host] = originalTrigger.value.definer.replaceAll('`', '').split('@');
      users.unshift({ name, host });
   }

   return users;
});

const getTriggerData = async () => {
   if (!props.trigger) return;

   Object.keys(localEvents.value).forEach((event: TriggerEventName) => {
      localEvents.value[event] = false;
   });

   localTrigger.value = { sql: '' };
   isLoading.value = true;
   lastTrigger.value = props.trigger;

   const params = {
      uid: props.connection.uid,
      schema: props.schema,
      trigger: props.trigger
   };

   try {
      const { status, response } = await Triggers.getTriggerInformations(params);
      if (status === 'success') {
         originalTrigger.value = response;
         localTrigger.value = JSON.parse(JSON.stringify(originalTrigger.value));

         if (customizations.value.triggerMultipleEvents) {
            originalTrigger.value.event.forEach((event: TriggerEventName) => {
               localEvents.value[event] = true;
            });
         }
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

const changeEvents = (event: TriggerEventName) => {
   if (customizations.value.triggerMultipleEvents) {
      localEvents.value[event] = !localEvents.value[event];
      localTrigger.value.event = [];
      for (const key in localEvents.value) {
         if (localEvents.value[key as TriggerEventName])
            localTrigger.value.event.push(key);
      }
   }
};

const saveChanges = async () => {
   if (isSaving.value) return;
   isSaving.value = true;
   const params = {
      uid: props.connection.uid,
      trigger: {
         ...localTrigger.value,
         schema: props.schema,
         oldName: originalTrigger.value.name
      }
   };

   try {
      const { status, response } = await Triggers.alterTrigger(params);

      if (status === 'success') {
         await refreshStructure(props.connection.uid);

         if (originalTrigger.value.name !== localTrigger.value.name) {
            const triggerName = customizations.value.triggerTableInName ? `${localTrigger.value.table}.${localTrigger.value.name}` : localTrigger.value.name;
            const triggerOldName = customizations.value.triggerTableInName ? `${originalTrigger.value.table}.${originalTrigger.value.name}` : originalTrigger.value.name;

            renameTabs({
               uid: props.connection.uid,
               schema: props.schema,
               elementName: triggerOldName,
               elementNewName: triggerName,
               elementType: 'trigger'
            });

            changeBreadcrumbs({ schema: props.schema, trigger: triggerName });
         }
         else
            getTriggerData();
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
   localTrigger.value = JSON.parse(JSON.stringify(originalTrigger.value));
   queryEditor.value.editor.session.setValue(localTrigger.value.sql);

   Object.keys(localEvents.value).forEach((event: TriggerEventName) => {
      localEvents.value[event] = false;
   });

   if (customizations.value.triggerMultipleEvents) {
      originalTrigger.value.event.forEach((event: TriggerEventName) => {
         localEvents.value[event] = true;
      });
   }
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
      await getTriggerData();
      queryEditor.value.editor.session.setValue(localTrigger.value.sql);
      lastTrigger.value = props.trigger;
   }
});

watch(() => props.trigger, async () => {
   if (props.isSelected) {
      await getTriggerData();
      queryEditor.value.editor.session.setValue(localTrigger.value.sql);
      lastTrigger.value = props.trigger;
   }
});

watch(() => props.isSelected, (val) => {
   if (val) changeBreadcrumbs({ schema: props.schema });
});

watch(isChanged, (val) => {
   setUnsavedChanges({ uid: props.connection.uid, tUid: props.tabUid, isChanged: val });
});

watch(consoleHeight, () => {
   resizeQueryEditor();
});

(async () => {
   await getTriggerData();
   queryEditor.value.editor.session.setValue(localTrigger.value.sql);
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
