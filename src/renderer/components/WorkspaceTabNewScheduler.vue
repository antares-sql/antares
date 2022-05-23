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
               <button class="btn btn-dark btn-sm" @click="showTimingModal">
                  <i class="mdi mdi-24px mdi-timer mr-1" />
                  <span>{{ $t('word.timing') }}</span>
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
                  <label class="form-label">{{ $t('word.name') }}</label>
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
                  <label class="form-label">{{ $t('word.definer') }}</label>
                  <BaseSelect
                     v-model="localScheduler.definer"
                     :options="users"
                     :option-label="(user) => user.value === '' ? $t('message.currentUser') : `${user.name}@${user.host}`"
                     :option-track-by="(user) => user.value === '' ? '' : `\`${user.name}\`@\`${user.host}\``"
                     class="form-select"
                  />
               </div>
            </div>
            <div class="column">
               <div class="form-group">
                  <label class="form-label">{{ $t('word.comment') }}</label>
                  <input
                     v-model="localScheduler.comment"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div class="column">
               <div class="form-group">
                  <label class="form-label mr-2">{{ $t('word.state') }}</label>
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
         <label class="form-label ml-2">{{ $t('message.schedulerBody') }}</label>
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

<script>
import { storeToRefs } from 'pinia';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import BaseLoader from '@/components/BaseLoader';
import QueryEditor from '@/components/QueryEditor';
import WorkspaceTabPropsSchedulerTimingModal from '@/components/WorkspaceTabPropsSchedulerTimingModal';
import Schedulers from '@/ipc-api/Schedulers';
import BaseSelect from '@/components/BaseSelect.vue';

export default {
   name: 'WorkspaceTabNewScheduler',
   components: {
      BaseLoader,
      QueryEditor,
      WorkspaceTabPropsSchedulerTimingModal,
      BaseSelect
   },
   props: {
      tabUid: String,
      connection: Object,
      tab: Object,
      isSelected: Boolean,
      schema: String
   },
   setup () {
      const { addNotification } = useNotificationsStore();
      const workspacesStore = useWorkspacesStore();

      const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

      const {
         getWorkspace,
         refreshStructure,
         changeBreadcrumbs,
         setUnsavedChanges,
         newTab,
         removeTab,
         renameTabs
      } = workspacesStore;

      return {
         addNotification,
         selectedWorkspace,
         getWorkspace,
         refreshStructure,
         changeBreadcrumbs,
         setUnsavedChanges,
         newTab,
         removeTab,
         renameTabs
      };
   },
   data () {
      return {
         isLoading: false,
         isSaving: false,
         isTimingModal: false,
         originalScheduler: {},
         localScheduler: {},
         lastScheduler: null,
         sqlProxy: '',
         editorHeight: 300
      };
   },
   computed: {
      workspace () {
         return this.getWorkspace(this.connection.uid);
      },
      isChanged () {
         return JSON.stringify(this.originalScheduler) !== JSON.stringify(this.localScheduler);
      },
      isDefinerInUsers () {
         return this.originalScheduler ? this.workspace.users.some(user => this.originalScheduler.definer === `\`${user.name}\`@\`${user.host}\``) : true;
      },
      schemaTables () {
         const schemaTables = this.workspace.structure
            .filter(schema => schema.name === this.schema)
            .map(schema => schema.tables);

         return schemaTables.length ? schemaTables[0].filter(table => table.type === 'table') : [];
      },
      users () {
         const users = [{ value: '' }, ...this.workspace.users];
         if (!this.isDefinerInUsers) {
            const [name, host] = this.originalScheduler.definer.replaceAll('`', '').split('@');
            users.unshift({ name, host });
         }

         return users;
      }
   },
   watch: {
      isSelected (val) {
         if (val)
            this.changeBreadcrumbs({ schema: this.schema });
      },
      isChanged (val) {
         this.setUnsavedChanges({ uid: this.connection.uid, tUid: this.tabUid, isChanged: val });
      }
   },
   async created () {
      this.originalScheduler = {
         definer: '',
         sql: 'BEGIN\r\n\r\nEND',
         name: '',
         comment: '',
         execution: 'EVERY',
         every: ['1', 'DAY'],
         preserve: true,
         state: 'DISABLE'
      };

      this.localScheduler = JSON.parse(JSON.stringify(this.originalScheduler));

      setTimeout(() => {
         this.resizeQueryEditor();
      }, 50);

      window.addEventListener('keydown', this.onKey);
   },
   mounted () {
      if (this.isSelected)
         this.changeBreadcrumbs({ schema: this.schema });

      setTimeout(() => {
         this.$refs.firstInput.focus();
      }, 100);

      window.addEventListener('resize', this.resizeQueryEditor);
   },
   unmounted () {
      window.removeEventListener('resize', this.resizeQueryEditor);
   },
   beforeUnmount () {
      window.removeEventListener('keydown', this.onKey);
   },
   methods: {
      async saveChanges () {
         if (this.isSaving) return;
         this.isSaving = true;
         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            ...this.localScheduler
         };

         try {
            const { status, response } = await Schedulers.createScheduler(params);

            if (status === 'success') {
               await this.refreshStructure(this.connection.uid);

               this.newTab({
                  uid: this.connection.uid,
                  schema: this.schema,
                  elementName: this.localScheduler.name,
                  elementType: 'scheduler',
                  type: 'scheduler-props'
               });

               this.removeTab({ uid: this.connection.uid, tab: this.tab.uid });
               this.changeBreadcrumbs({ schema: this.schema, scheduler: this.localScheduler.name });
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.isSaving = false;
      },
      clearChanges () {
         this.localScheduler = JSON.parse(JSON.stringify(this.originalScheduler));
         this.$refs.queryEditor.editor.session.setValue(this.localScheduler.sql);
      },
      resizeQueryEditor () {
         if (this.$refs.queryEditor) {
            const footer = document.getElementById('footer');
            const size = window.innerHeight - this.$refs.queryEditor.$el.getBoundingClientRect().top - footer.offsetHeight;
            this.editorHeight = size;
            this.$refs.queryEditor.editor.resize();
         }
      },
      showTimingModal () {
         this.isTimingModal = true;
      },
      hideTimingModal () {
         this.isTimingModal = false;
      },
      timingUpdate (options) {
         this.localScheduler = options;
      },
      onKey (e) {
         if (this.isSelected) {
            e.stopPropagation();
            if (e.ctrlKey && e.keyCode === 83) { // CTRL + S
               if (this.isChanged)
                  this.saveChanges();
            }
         }
      }
   }
};
</script>
