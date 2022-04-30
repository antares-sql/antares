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
      <ModalAskParameters
         v-if="isAskingParameters"
         :local-routine="localFunction"
         :client="workspace.client"
         @confirm="runFunction"
         @close="hideAskParamsModal"
      />
   </div>
</template>

<script>
import { storeToRefs } from 'pinia';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import { uidGen } from 'common/libs/uidGen';
import BaseLoader from '@/components/BaseLoader';
import QueryEditor from '@/components/QueryEditor';
import ModalAskParameters from '@/components/ModalAskParameters';
import Functions from '@/ipc-api/Functions';

export default {
   name: 'WorkspaceTabPropsTriggerFunction',
   components: {
      BaseLoader,
      QueryEditor,
      ModalAskParameters
   },
   props: {
      tabUid: String,
      connection: Object,
      function: String,
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
         renameTabs,
         newTab,
         changeBreadcrumbs,
         setUnsavedChanges
      } = workspacesStore;

      return {
         addNotification,
         selectedWorkspace,
         getWorkspace,
         refreshStructure,
         renameTabs,
         newTab,
         changeBreadcrumbs,
         setUnsavedChanges
      };
   },
   data () {
      return {
         isLoading: false,
         isSaving: false,
         isParamsModal: false,
         isAskingParameters: false,
         originalFunction: null,
         localFunction: { sql: '' },
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
      async schema () {
         if (this.isSelected) {
            await this.getFunctionData();
            this.$refs.queryEditor.editor.session.setValue(this.localFunction.sql);
            this.lastFunction = this.function;
         }
      },
      async function () {
         if (this.isSelected) {
            await this.getFunctionData();
            this.$refs.queryEditor.editor.session.setValue(this.localFunction.sql);
            this.lastFunction = this.function;
         }
      },
      async isSelected (val) {
         if (val) {
            this.changeBreadcrumbs({ schema: this.schema, triggerFunction: this.function });

            setTimeout(() => {
               this.resizeQueryEditor();
            }, 200);

            if (this.lastFunction !== this.function)
               await this.getFunctionData();
         }
      },
      isChanged (val) {
         this.setUnsavedChanges({ uid: this.connection.uid, tUid: this.tabUid, isChanged: val });
      }
   },
   async created () {
      await this.getFunctionData();
      this.$refs.queryEditor.editor.session.setValue(this.localFunction.sql);
      window.addEventListener('keydown', this.onKey);
   },
   mounted () {
      window.addEventListener('resize', this.resizeQueryEditor);
   },
   unmounted () {
      window.removeEventListener('resize', this.resizeQueryEditor);
   },
   beforeUnmount () {
      window.removeEventListener('keydown', this.onKey);
   },
   methods: {
      async getFunctionData () {
         if (!this.function) return;

         this.isLoading = true;
         this.localFunction = { sql: '' };
         this.lastFunction = this.function;

         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            func: this.function
         };

         try {
            const { status, response } = await Functions.getFunctionInformations(params);
            if (status === 'success') {
               this.originalFunction = response;

               this.originalFunction.parameters = [...this.originalFunction.parameters.map(param => {
                  param._antares_id = uidGen();
                  return param;
               })];

               this.localFunction = JSON.parse(JSON.stringify(this.originalFunction));
               this.sqlProxy = this.localFunction.sql;
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.resizeQueryEditor();
         this.isLoading = false;
      },
      async saveChanges () {
         if (this.isSaving) return;
         this.isSaving = true;
         const params = {
            uid: this.connection.uid,
            func: {
               ...this.localFunction,
               schema: this.schema,
               oldName: this.originalFunction.name
            }
         };

         try {
            const { status, response } = await Functions.alterTriggerFunction(params);

            if (status === 'success') {
               const oldName = this.originalFunction.name;

               await this.refreshStructure(this.connection.uid);

               if (oldName !== this.localFunction.name) {
                  this.renameTabs({
                     uid: this.connection.uid,
                     schema: this.schema,
                     elementName: oldName,
                     elementNewName: this.localFunction.name,
                     elementType: 'triggerFunction'
                  });

                  this.changeBreadcrumbs({ schema: this.schema, triggerFunction: this.localFunction.name });
               }
               else
                  this.getFunctionData();
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
      optionsUpdate (options) {
         this.localFunction = options;
      },
      parametersUpdate (parameters) {
         this.localFunction = { ...this.localFunction, parameters };
      },
      runFunctionCheck () {
         if (this.localFunction.parameters.length)
            this.showAskParamsModal();
         else
            this.runFunction();
      },
      runFunction (params) {
         if (!params) params = [];

         let sql;
         switch (this.connection.client) { // TODO: move in a better place
            case 'maria':
            case 'mysql':
               sql = `SELECT \`${this.originalFunction.name}\` (${params.join(',')})`;
               break;
            case 'pg':
               sql = `SELECT ${this.originalFunction.name}(${params.join(',')})`;
               break;
            case 'mssql':
               sql = `SELECT ${this.originalFunction.name} ${params.join(',')}`;
               break;
            default:
               sql = `SELECT \`${this.originalFunction.name}\` (${params.join(',')})`;
         }

         this.newTab({ uid: this.connection.uid, content: sql, type: 'query', autorun: true });
      },
      showParamsModal () {
         this.isParamsModal = true;
      },
      hideParamsModal () {
         this.isParamsModal = false;
      },
      showAskParamsModal () {
         this.isAskingParameters = true;
      },
      hideAskParamsModal () {
         this.isAskingParameters = false;
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
