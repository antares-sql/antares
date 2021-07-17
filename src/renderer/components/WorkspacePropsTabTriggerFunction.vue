<template>
   <div class="workspace-query-tab column col-12 columns col-gapless">
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

               <button class="btn btn-dark btn-sm" @click="showOptionsModal">
                  <i class="mdi mdi-24px mdi-cogs mr-1" />
                  <span>{{ $t('word.options') }}</span>
               </button>
            </div>
         </div>
      </div>
      <div class="workspace-query-results column col-12 mt-2 p-relative">
         <BaseLoader v-if="isLoading" />
         <label class="form-label ml-2">{{ $t('message.functionBody') }}</label>
         <QueryEditor
            v-show="isSelected"
            ref="queryEditor"
            :value.sync="localFunction.sql"
            :workspace="workspace"
            :schema="schema"
            :height="editorHeight"
         />
      </div>
      <WorkspacePropsTriggerFunctionOptionsModal
         v-if="isOptionsModal"
         :local-options="localFunction"
         :workspace="workspace"
         @hide="hideOptionsModal"
         @options-update="optionsUpdate"
      />
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
import { mapGetters, mapActions } from 'vuex';
import { uidGen } from 'common/libs/uidGen';
import BaseLoader from '@/components/BaseLoader';
import QueryEditor from '@/components/QueryEditor';
import WorkspacePropsTriggerFunctionOptionsModal from '@/components/WorkspacePropsTriggerFunctionOptionsModal';
import ModalAskParameters from '@/components/ModalAskParameters';
import Functions from '@/ipc-api/Functions';

export default {
   name: 'WorkspacePropsTabTriggerFunction',
   components: {
      BaseLoader,
      QueryEditor,
      WorkspacePropsTriggerFunctionOptionsModal,
      ModalAskParameters
   },
   props: {
      connection: Object,
      function: String
   },
   data () {
      return {
         tabUid: 'prop',
         isLoading: false,
         isSaving: false,
         isOptionsModal: false,
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
      ...mapGetters({
         selectedWorkspace: 'workspaces/getSelected',
         getWorkspace: 'workspaces/getWorkspace'
      }),
      workspace () {
         return this.getWorkspace(this.connection.uid);
      },
      isSelected () {
         return this.workspace.selected_tab === 'prop' && this.selectedWorkspace === this.workspace.uid && this.function;
      },
      schema () {
         return this.workspace.breadcrumbs.schema;
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
      async function () {
         if (this.isSelected) {
            await this.getFunctionData();
            this.$refs.queryEditor.editor.session.setValue(this.localFunction.sql);
            this.lastFunction = this.function;
         }
      },
      async isSelected (val) {
         if (val && this.lastFunction !== this.function) {
            await this.getFunctionData();
            this.$refs.queryEditor.editor.session.setValue(this.localFunction.sql);
            this.lastFunction = this.function;
         }
      },
      isChanged (val) {
         if (this.isSelected && this.lastFunction === this.function && this.function !== null)
            this.setUnsavedChanges(val);
      }
   },
   mounted () {
      window.addEventListener('resize', this.resizeQueryEditor);
   },
   destroyed () {
      window.removeEventListener('resize', this.resizeQueryEditor);
   },
   created () {
      window.addEventListener('keydown', this.onKey);
   },
   beforeDestroy () {
      window.removeEventListener('keydown', this.onKey);
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification',
         refreshStructure: 'workspaces/refreshStructure',
         setUnsavedChanges: 'workspaces/setUnsavedChanges',
         changeBreadcrumbs: 'workspaces/changeBreadcrumbs',
         newTab: 'workspaces/newTab'
      }),
      async getFunctionData () {
         if (!this.function) return;

         this.isLoading = true;
         this.localFunction = { sql: '' };

         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            func: this.workspace.breadcrumbs.triggerFunction
         };

         try {
            const { status, response } = await Functions.getFunctionInformations(params);
            if (status === 'success') {
               this.originalFunction = response;

               this.originalFunction.parameters = [...this.originalFunction.parameters.map(param => {
                  param._id = uidGen();
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
            schema: this.schema,
            func: {
               ...this.localFunction,
               oldName: this.originalFunction.name
            }
         };

         try {
            const { status, response } = await Functions.alterTriggerFunction(params);

            if (status === 'success') {
               const oldName = this.originalFunction.name;

               await this.refreshStructure(this.connection.uid);

               if (oldName !== this.localFunction.name) {
                  this.setUnsavedChanges(false);
                  this.changeBreadcrumbs({ schema: this.schema, function: this.localFunction.name });
               }

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

         this.newTab({ uid: this.connection.uid, content: sql, autorun: true });
      },
      showOptionsModal () {
         this.isOptionsModal = true;
      },
      hideOptionsModal () {
         this.isOptionsModal = false;
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
