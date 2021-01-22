<template>
   <div class="workspace-query-tab column col-12 columns col-gapless">
      <div class="workspace-query-runner column col-12">
         <div class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <button
                  class="btn btn-primary btn-sm"
                  :disabled="!isChanged"
                  :class="{'loading':isSaving}"
                  @click="saveChanges"
               >
                  <span>{{ $t('word.save') }}</span>
                  <i class="mdi mdi-24px mdi-content-save ml-1" />
               </button>
               <button
                  :disabled="!isChanged"
                  class="btn btn-link btn-sm mr-0"
                  :title="$t('message.clearChanges')"
                  @click="clearChanges"
               >
                  <span>{{ $t('word.clear') }}</span>
                  <i class="mdi mdi-24px mdi-delete-sweep ml-1" />
               </button>

               <div class="divider-vert py-3" />

               <button
                  class="btn btn-dark btn-sm disabled"
                  :disabled="isChanged"
                  @click="false"
               >
                  <span>{{ $t('word.run') }}</span>
                  <i class="mdi mdi-24px mdi-play ml-1" />
               </button>
               <button class="btn btn-dark btn-sm" @click="showParamsModal">
                  <span>{{ $t('word.parameters') }}</span>
                  <i class="mdi mdi-24px mdi-dots-horizontal ml-1" />
               </button>
               <button class="btn btn-dark btn-sm" @click="showOptionsModal">
                  <span>{{ $t('word.options') }}</span>
                  <i class="mdi mdi-24px mdi-cogs ml-1" />
               </button>
            </div>
         </div>
      </div>
      <div class="workspace-query-results column col-12 mt-2 p-relative">
         <BaseLoader v-if="isLoading" />
         <label class="form-label ml-2">{{ $t('message.functionBody') }}</label>
         <QueryEditor
            v-if="isSelected"
            ref="queryEditor"
            :value.sync="localFunction.sql"
            :workspace="workspace"
            :schema="schema"
            :height="editorHeight"
         />
      </div>
      <WorkspacePropsFunctionOptionsModal
         v-if="isOptionsModal"
         :local-options="localFunction"
         :workspace="workspace"
         @hide="hideOptionsModal"
         @options-update="optionsUpdate"
      />
      <WorkspacePropsFunctionParamsModal
         v-if="isParamsModal"
         :local-parameters="localFunction.parameters"
         :workspace="workspace"
         :func="localFunction.name"
         @hide="hideParamsModal"
         @parameters-update="parametersUpdate"
      />
   </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import BaseLoader from '@/components/BaseLoader';
import QueryEditor from '@/components/QueryEditor';
import WorkspacePropsFunctionOptionsModal from '@/components/WorkspacePropsFunctionOptionsModal';
import WorkspacePropsFunctionParamsModal from '@/components/WorkspacePropsFunctionParamsModal';
import Functions from '@/ipc-api/Functions';

export default {
   name: 'WorkspacePropsTabFunction',
   components: {
      BaseLoader,
      QueryEditor,
      WorkspacePropsFunctionOptionsModal,
      WorkspacePropsFunctionParamsModal
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
         originalFunction: null,
         localFunction: { sql: '' },
         lastFunction: null,
         sqlProxy: '',
         editorHeight: 300
      };
   },
   computed: {
      ...mapGetters({
         getWorkspace: 'workspaces/getWorkspace'
      }),
      workspace () {
         return this.getWorkspace(this.connection.uid);
      },
      isSelected () {
         return this.workspace.selected_tab === 'prop';
      },
      schema () {
         return this.workspace.breadcrumbs.schema;
      },
      isChanged () {
         return JSON.stringify(this.originalFunction) !== JSON.stringify(this.localFunction);
      },
      isDefinerInUsers () {
         return this.originalFunction ? this.workspace.users.some(user => this.originalFunction.definer === `\`${user.name}\`@\`${user.host}\``) : true;
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
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification',
         refreshStructure: 'workspaces/refreshStructure',
         setUnsavedChanges: 'workspaces/setUnsavedChanges',
         changeBreadcrumbs: 'workspaces/changeBreadcrumbs'
      }),
      async getFunctionData () {
         if (!this.function) return;

         this.isLoading = true;
         this.localFunction = { sql: '' };

         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            func: this.workspace.breadcrumbs.function
         };

         try {
            const { status, response } = await Functions.getFunctionInformations(params);
            if (status === 'success') {
               this.originalFunction = response;
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
            const { status, response } = await Functions.alterFunction(params);

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
      }
   }
};
</script>
