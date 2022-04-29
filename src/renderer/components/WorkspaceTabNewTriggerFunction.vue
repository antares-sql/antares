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
            <div v-if="customizations.triggerFunctionlanguages" class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ $t('word.language') }}
                  </label>
                  <select v-model="localFunction.language" class="form-select">
                     <option v-for="language in customizations.triggerFunctionlanguages" :key="language">
                        {{ language }}
                     </option>
                  </select>
               </div>
            </div>
            <div v-if="customizations.definer" class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ $t('word.definer') }}
                  </label>
                  <select
                     v-if="workspace.users.length"
                     v-model="localFunction.definer"
                     class="form-select"
                  >
                     <option value="">
                        {{ $t('message.currentUser') }}
                     </option>
                     <option
                        v-for="user in workspace.users"
                        :key="`${user.name}@${user.host}`"
                        :value="`\`${user.name}\`@\`${user.host}\``"
                     >
                        {{ user.name }}@{{ user.host }}
                     </option>
                  </select>
                  <select v-if="!workspace.users.length" class="form-select">
                     <option value="">
                        {{ $t('message.currentUser') }}
                     </option>
                  </select>
               </div>
            </div>
            <div v-if="customizations.comment" class="form-group">
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
   </div>
</template>

<script>
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import BaseLoader from '@/components/BaseLoader';
import QueryEditor from '@/components/QueryEditor';
import Functions from '@/ipc-api/Functions';
import { storeToRefs } from 'pinia';

export default {
   name: 'WorkspaceTabNewTriggerFunction',
   components: {
      BaseLoader,
      QueryEditor
   },
   props: {
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
         isParamsModal: false,
         isAskingParameters: false,
         originalFunction: {},
         localFunction: {},
         lastFunction: null,
         sqlProxy: '',
         editorHeight: 300
      };
   },
   computed: {
      workspace () {
         return this.getWorkspace(this.connection.uid);
      },
      customizations () {
         return this.workspace.customizations;
      },
      tabUid () {
         return this.$vnode?.key;
      },
      isChanged () {
         return JSON.stringify(this.originalFunction) !== JSON.stringify(this.localFunction);
      },
      isDefinerInUsers () {
         return this.originalFunction
            ? this.workspace.users.some(user => this.originalFunction.definer === `\`${user.name}\`@\`${user.host}\``)
            : true;
      },
      schemaTables () {
         const schemaTables = this.workspace.structure
            .filter(schema => schema.name === this.schema)
            .map(schema => schema.tables);

         return schemaTables.length ? schemaTables[0].filter(table => table.type === 'table') : [];
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
   created () {
      this.originalFunction = {
         sql: this.customizations.triggerFunctionSql,
         language: this.customizations.triggerFunctionlanguages.length ? this.customizations.triggerFunctionlanguages[0] : null,
         name: ''
      };

      this.localFunction = JSON.parse(JSON.stringify(this.originalFunction));

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
            ...this.localFunction
         };

         try {
            const { status, response } = await Functions.createTriggerFunction(params);

            if (status === 'success') {
               await this.refreshStructure(this.connection.uid);

               this.newTab({
                  uid: this.connection.uid,
                  schema: this.schema,
                  elementName: this.localFunction.name,
                  elementType: 'triggerFunction',
                  type: 'trigger-function-props'
               });

               this.removeTab({ uid: this.connection.uid, tab: this.tab.uid });
               this.changeBreadcrumbs({ schema: this.schema, triggerFunction: this.localFunction.name });
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
         this.localFunction = JSON.parse(JSON.stringify(this.originalFunction));
         this.$refs.queryEditor.editor.session.setValue(this.localFunction.sql);
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
