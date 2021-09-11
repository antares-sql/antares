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
            :key="`new-${_uid}`"
            ref="queryEditor"
            :value.sync="localRoutine.sql"
            :workspace="workspace"
            :schema="schema"
            :height="editorHeight"
         />
      </div>
      <WorkspaceTabPropsRoutineParamsModal
         v-if="isParamsModal"
         :local-parameters="localRoutine.parameters"
         :workspace="workspace"
         routine="new"
         @hide="hideParamsModal"
         @parameters-update="parametersUpdate"
      />
   </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import QueryEditor from '@/components/QueryEditor';
import BaseLoader from '@/components/BaseLoader';
import WorkspaceTabPropsRoutineParamsModal from '@/components/WorkspaceTabPropsRoutineParamsModal';
import Routines from '@/ipc-api/Routines';

export default {
   name: 'WorkspaceTabNewRoutine',
   components: {
      QueryEditor,
      BaseLoader,
      WorkspaceTabPropsRoutineParamsModal
   },
   props: {
      connection: Object,
      tab: Object,
      isSelected: Boolean,
      schema: String
   },
   data () {
      return {
         isLoading: false,
         isSaving: false,
         isParamsModal: false,
         originalRoutine: {},
         localRoutine: {},
         lastRoutine: null,
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
      customizations () {
         return this.workspace.customizations;
      },
      tabUid () {
         return this.$vnode.key;
      },
      isChanged () {
         return JSON.stringify(this.originalRoutine) !== JSON.stringify(this.localRoutine);
      },
      isDefinerInUsers () {
         return this.originalRoutine ? this.workspace.users.some(user => this.originalRoutine.definer === `\`${user.name}\`@\`${user.host}\``) : true;
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
      this.originalRoutine = {
         sql: this.customizations.procedureSql,
         language: this.customizations.languages ? this.customizations.languages[0] : null,
         name: '',
         definer: '',
         comment: '',
         security: 'DEFINER',
         dataAccess: 'CONTAINS SQL',
         deterministic: false
      };

      this.localRoutine = JSON.parse(JSON.stringify(this.originalRoutine));

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
   destroyed () {
      window.removeEventListener('resize', this.resizeQueryEditor);
   },
   beforeDestroy () {
      window.removeEventListener('keydown', this.onKey);
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification',
         refreshStructure: 'workspaces/refreshStructure',
         changeBreadcrumbs: 'workspaces/changeBreadcrumbs',
         setUnsavedChanges: 'workspaces/setUnsavedChanges',
         newTab: 'workspaces/newTab',
         removeTab: 'workspaces/removeTab',
         renameTabs: 'workspaces/renameTabs'
      }),
      async saveChanges () {
         if (this.isSaving) return;
         this.isSaving = true;
         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            ...this.localRoutine
         };

         try {
            const { status, response } = await Routines.createRoutine(params);

            if (status === 'success') {
               await this.refreshStructure(this.connection.uid);

               this.newTab({
                  uid: this.connection.uid,
                  schema: this.schema,
                  elementName: this.localRoutine.name,
                  elementType: 'routine',
                  type: 'routine-props'
               });

               this.removeTab({ uid: this.connection.uid, tab: this.tab.uid });
               this.changeBreadcrumbs({ schema: this.schema, routine: this.localRoutine.name });
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
      parametersUpdate (parameters) {
         this.localRoutine = { ...this.localRoutine, parameters };
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
