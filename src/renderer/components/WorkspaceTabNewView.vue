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
                     v-model="localView.name"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div class="column col-auto">
               <div v-if="workspace.customizations.definer" class="form-group">
                  <label class="form-label">{{ $t('word.definer') }}</label>
                  <BaseSelect
                     v-model="localView.definer"
                     :options="users"
                     :option-label="(user) => user.value === '' ? $t('message.currentUser') : `${user.name}@${user.host}`"
                     :option-track-by="(user) => user.value === '' ? '' : `\`${user.name}\`@\`${user.host}\``"
                     class="form-select"
                  />
               </div>
            </div>
            <div class="column col-auto mr-2">
               <div v-if="workspace.customizations.viewSqlSecurity" class="form-group">
                  <label class="form-label">{{ $t('message.sqlSecurity') }}</label>
                  <BaseSelect
                     v-model="localView.security"
                     :options="['DEFINER', 'INVOKER']"
                     class="form-select"
                  />
               </div>
            </div>
            <div class="column col-auto mr-2">
               <div v-if="workspace.customizations.viewAlgorithm" class="form-group">
                  <label class="form-label">{{ $t('word.algorithm') }}</label>
                  <BaseSelect
                     v-model="localView.algorithm"
                     :options="['UNDEFINED', 'MERGE', 'TEMPTABLE']"
                     class="form-select"
                  />
               </div>
            </div>
            <div v-if="workspace.customizations.viewUpdateOption" class="column col-auto mr-2">
               <div class="form-group">
                  <label class="form-label">{{ $t('message.updateOption') }}</label>
                  <BaseSelect
                     v-model="localView.updateOption"
                     :option-track-by="(user) => user.value"
                     :options="[{label: 'None', value: ''}, {label: 'CASCADED', value: 'CASCADED'}, {label: 'LOCAL', value: 'LOCAL'}]"
                     class="form-select"
                  />
               </div>
            </div>
         </div>
      </div>
      <div class="workspace-query-results column col-12 mt-2 p-relative">
         <BaseLoader v-if="isLoading" />
         <label class="form-label ml-2">{{ $t('message.selectStatement') }}</label>
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

<script>
import { storeToRefs } from 'pinia';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import BaseLoader from '@/components/BaseLoader';
import QueryEditor from '@/components/QueryEditor';
import Views from '@/ipc-api/Views';
import BaseSelect from '@/components/BaseSelect.vue';

export default {
   name: 'WorkspaceTabNewView',
   components: {
      BaseLoader,
      QueryEditor,
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
         setUnsavedChanges,
         changeBreadcrumbs,
         newTab,
         removeTab,
         renameTabs
      } = workspacesStore;

      return {
         addNotification,
         selectedWorkspace,
         getWorkspace,
         refreshStructure,
         setUnsavedChanges,
         changeBreadcrumbs,
         newTab,
         removeTab,
         renameTabs
      };
   },
   data () {
      return {
         isLoading: false,
         isSaving: false,
         originalView: {},
         localView: {},
         lastView: null,
         sqlProxy: '',
         editorHeight: 300
      };
   },
   computed: {
      workspace () {
         return this.getWorkspace(this.connection.uid);
      },
      isChanged () {
         return JSON.stringify(this.originalView) !== JSON.stringify(this.localView);
      },
      isDefinerInUsers () {
         return this.originalView ? this.workspace.users.some(user => this.originalView.definer === `\`${user.name}\`@\`${user.host}\``) : true;
      },
      users () {
         const users = [{ value: '' }, ...this.workspace.users];
         if (!this.isDefinerInUsers) {
            const [name, host] = this.originalView.definer.replaceAll('`', '').split('@');
            users.unshift({ name, host });
         }

         return users;
      }
   },
   watch: {
      isSelected (val) {
         if (val) {
            this.changeBreadcrumbs({ schema: this.schema, view: this.view });

            setTimeout(() => {
               this.resizeQueryEditor();
            }, 50);
         }
      },
      isChanged (val) {
         this.setUnsavedChanges({ uid: this.connection.uid, tUid: this.tabUid, isChanged: val });
      }
   },
   async created () {
      this.originalView = {
         algorithm: 'UNDEFINED',
         definer: '',
         security: 'DEFINER',
         updateOption: '',
         sql: '',
         name: ''
      };

      this.localView = JSON.parse(JSON.stringify(this.originalView));

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
            ...this.localView
         };

         try {
            const { status, response } = await Views.createView(params);

            if (status === 'success') {
               await this.refreshStructure(this.connection.uid);

               this.newTab({
                  uid: this.connection.uid,
                  schema: this.schema,
                  elementName: this.localView.name,
                  elementType: 'view',
                  type: 'view-props'
               });

               this.removeTab({ uid: this.connection.uid, tab: this.tab.uid });
               this.changeBreadcrumbs({ schema: this.schema, view: this.localView.name });
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
         this.localView = JSON.parse(JSON.stringify(this.originalView));
         this.$refs.queryEditor.editor.session.setValue(this.localView.sql);
      },
      resizeQueryEditor () {
         if (this.$refs.queryEditor) {
            const footer = document.getElementById('footer');
            const size = window.innerHeight - this.$refs.queryEditor.$el.getBoundingClientRect().top - footer.offsetHeight;
            this.editorHeight = size;
            this.$refs.queryEditor.editor.resize();
         }
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
