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

               <button
                  class="btn btn-dark btn-sm"
                  :disabled="isChanged"
                  @click="runRoutineCheck"
               >
                  <i class="mdi mdi-24px mdi-play mr-1" />
                  <span>{{ $t('word.run') }}</span>
               </button>
               <button class="btn btn-dark btn-sm" @click="showParamsModal">
                  <i class="mdi mdi-24px mdi-dots-horizontal mr-1" />
                  <span>{{ $t('word.parameters') }}</span>
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
                  <label class="form-label">
                     {{ $t('word.name') }}
                  </label>
                  <input
                     ref="firstInput"
                     v-model="localRoutine.name"
                     class="form-input"
                     :class="{'is-error': !isTableNameValid}"
                     type="text"
                  >
               </div>
            </div>
            <div v-if="customizations.languages" class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ $t('word.language') }}
                  </label>
                  <select v-model="localRoutine.language" class="form-select">
                     <option v-for="language in customizations.languages" :key="language">
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
                     v-model="localRoutine.definer"
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
            <div v-if="customizations.comment" class="column">
               <div class="form-group">
                  <label class="form-label">
                     {{ $t('word.comment') }}
                  </label>
                  <input
                     v-model="localRoutine.comment"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ $t('message.sqlSecurity') }}
                  </label>
                  <select v-model="localRoutine.security" class="form-select">
                     <option>DEFINER</option>
                     <option>INVOKER</option>
                  </select>
               </div>
            </div>
            <div v-if="customizations.procedureDataAccess" class="column col-auto">
               <div class="form-group">
                  <label class="form-label">
                     {{ $t('message.dataAccess') }}
                  </label>
                  <select v-model="localRoutine.dataAccess" class="form-select">
                     <option>CONTAINS SQL</option>
                     <option>NO SQL</option>
                     <option>READS SQL DATA</option>
                     <option>MODIFIES SQL DATA</option>
                  </select>
               </div>
            </div>
            <div v-if="customizations.procedureDeterministic" class="column col-auto">
               <div class="form-group">
                  <label class="form-label d-invisible">.</label>
                  <label class="form-checkbox form-inline">
                     <input v-model="localRoutine.deterministic" type="checkbox"><i class="form-icon" /> {{ $t('word.deterministic') }}
                  </label>
               </div>
            </div>
         </div>
      </div>
      <div class="workspace-query-results column col-12 mt-2 p-relative">
         <BaseLoader v-if="isLoading" />
         <label class="form-label ml-2">{{ $t('message.routineBody') }}</label>
         <QueryEditor
            v-show="isSelected"
            :key="`${routine}-${_uid}`"
            ref="queryEditor"
            v-model="localRoutine.sql"
            :workspace="workspace"
            :schema="schema"
            :height="editorHeight"
         />
      </div>
      <WorkspaceTabPropsRoutineParamsModal
         v-if="isParamsModal"
         :local-parameters="localRoutine.parameters"
         :workspace="workspace"
         :routine="localRoutine.name"
         @hide="hideParamsModal"
         @parameters-update="parametersUpdate"
      />
      <ModalAskParameters
         v-if="isAskingParameters"
         :local-routine="localRoutine"
         :client="workspace.client"
         @confirm="runRoutine"
         @close="hideAskParamsModal"
      />
   </div>
</template>

<script>
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import { uidGen } from 'common/libs/uidGen';
import QueryEditor from '@/components/QueryEditor';
import BaseLoader from '@/components/BaseLoader';
import WorkspaceTabPropsRoutineParamsModal from '@/components/WorkspaceTabPropsRoutineParamsModal';
import ModalAskParameters from '@/components/ModalAskParameters';
import Routines from '@/ipc-api/Routines';
import { storeToRefs } from 'pinia';

export default {
   name: 'WorkspaceTabPropsRoutine',
   components: {
      QueryEditor,
      BaseLoader,
      WorkspaceTabPropsRoutineParamsModal,
      ModalAskParameters
   },
   props: {
      connection: Object,
      routine: String,
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
         originalRoutine: null,
         localRoutine: { sql: '' },
         lastRoutine: null,
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
         return JSON.stringify(this.originalRoutine) !== JSON.stringify(this.localRoutine);
      },
      isDefinerInUsers () {
         return this.originalRoutine ? this.workspace.users.some(user => this.originalRoutine.definer === `\`${user.name}\`@\`${user.host}\``) : true;
      },
      isTableNameValid () {
         return this.localRoutine.name !== '';
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
            await this.getRoutineData();
            this.$refs.queryEditor.editor.session.setValue(this.localRoutine.sql);
            this.lastRoutine = this.routine;
         }
      },
      async routine () {
         if (this.isSelected) {
            await this.getRoutineData();
            this.$refs.queryEditor.editor.session.setValue(this.localRoutine.sql);
            this.lastRoutine = this.routine;
         }
      },
      async isSelected (val) {
         if (val) {
            this.changeBreadcrumbs({ schema: this.schema, routine: this.routine });

            setTimeout(() => {
               this.resizeQueryEditor();
            }, 200);

            if (this.lastRoutine !== this.routine)
               this.getRoutineData();
         }
      },
      isChanged (val) {
         this.setUnsavedChanges({ uid: this.connection.uid, tUid: this.tabUid, isChanged: val });
      }
   },
   async created () {
      await this.getRoutineData();
      this.$refs.queryEditor.editor.session.setValue(this.localRoutine.sql);
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
      async getRoutineData () {
         if (!this.routine) return;

         this.localRoutine = { sql: '' };
         this.isLoading = true;
         this.lastRoutine = this.routine;

         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            routine: this.routine
         };

         try {
            const { status, response } = await Routines.getRoutineInformations(params);
            if (status === 'success') {
               this.originalRoutine = response;

               this.originalRoutine.parameters = [...this.originalRoutine.parameters.map(param => {
                  param._antares_id = uidGen();
                  return param;
               })];

               this.localRoutine = JSON.parse(JSON.stringify(this.originalRoutine));
               this.sqlProxy = this.localRoutine.sql;
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
            routine: {
               ...this.localRoutine,
               schema: this.schema,
               oldName: this.originalRoutine.name
            }
         };

         try {
            const { status, response } = await Routines.alterRoutine(params);

            if (status === 'success') {
               const oldName = this.originalRoutine.name;

               await this.refreshStructure(this.connection.uid);

               if (oldName !== this.localRoutine.name) {
                  this.renameTabs({
                     uid: this.connection.uid,
                     schema: this.schema,
                     elementName: oldName,
                     elementNewName: this.localRoutine.name,
                     elementType: 'procedure'
                  });

                  this.changeBreadcrumbs({ schema: this.schema, procedure: this.localRoutine.name });
               }
               else
                  this.getRoutineData();
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
         this.localRoutine = JSON.parse(JSON.stringify(this.originalRoutine));
         this.$refs.queryEditor.editor.session.setValue(this.localRoutine.sql);
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
         this.localRoutine = options;
      },
      parametersUpdate (parameters) {
         this.localRoutine = { ...this.localRoutine, parameters };
      },
      runRoutineCheck () {
         if (this.localRoutine.parameters.length)
            this.showAskParamsModal();
         else
            this.runRoutine();
      },
      runRoutine (params) {
         if (!params) params = [];

         let sql;
         switch (this.connection.client) { // TODO: move in a better place
            case 'maria':
            case 'mysql':
            case 'pg':
               sql = `CALL ${this.originalRoutine.name}(${params.join(',')})`;
               break;
            case 'mssql':
               sql = `EXEC ${this.originalRoutine.name} ${params.join(',')}`;
               break;
            default:
               sql = `CALL \`${this.originalRoutine.name}\`(${params.join(',')})`;
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
