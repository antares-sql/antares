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
         <div class="columns mb-4">
            <div class="column col-auto">
               <div class="form-group">
                  <label class="form-label">{{ $t('word.name') }}</label>
                  <input
                     v-model="localView.name"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div class="column col-auto">
               <div v-if="workspace.customizations.definer" class="form-group">
                  <label class="form-label">{{ $t('word.definer') }}</label>
                  <select
                     v-if="workspace.users.length"
                     v-model="localView.definer"
                     class="form-select"
                  >
                     <option value="">
                        {{ $t('message.currentUser') }}
                     </option>
                     <option v-if="!isDefinerInUsers" :value="originalView.definer">
                        {{ originalView.definer.replaceAll('`', '') }}
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
         </div>
         <div class="columns">
            <div class="column col-auto mr-2">
               <div v-if="workspace.customizations.viewSqlSecurity" class="form-group">
                  <label class="form-label">{{ $t('message.sqlSecurity') }}</label>
                  <label class="form-radio">
                     <input
                        v-model="localView.security"
                        type="radio"
                        name="security"
                        value="DEFINER"
                     >
                     <i class="form-icon" /> DEFINER
                  </label>
                  <label class="form-radio">
                     <input
                        v-model="localView.security"
                        type="radio"
                        name="security"
                        value="INVOKER"
                     >
                     <i class="form-icon" /> INVOKER
                  </label>
               </div>
            </div>
            <div class="column col-auto mr-2">
               <div v-if="workspace.customizations.viewAlgorithm" class="form-group">
                  <label class="form-label">{{ $t('word.algorithm') }}</label>
                  <label class="form-radio">
                     <input
                        v-model="localView.algorithm"
                        type="radio"
                        name="algorithm"
                        value="UNDEFINED"
                     >
                     <i class="form-icon" /> UNDEFINED
                  </label>
                  <label class="form-radio">
                     <input
                        v-model="localView.algorithm"
                        type="radio"
                        value="MERGE"
                        name="algorithm"
                     >
                     <i class="form-icon" /> MERGE
                  </label>
                  <label class="form-radio">
                     <input
                        v-model="localView.algorithm"
                        type="radio"
                        value="TEMPTABLE"
                        name="algorithm"
                     >
                     <i class="form-icon" /> TEMPTABLE
                  </label>
               </div>
            </div>
            <div v-if="workspace.customizations.viewUpdateOption" class="column col-auto mr-2">
               <div class="form-group">
                  <label class="form-label">{{ $t('message.updateOption') }}</label>
                  <label class="form-radio">
                     <input
                        v-model="localView.updateOption"
                        type="radio"
                        name="update"
                        value=""
                     >
                     <i class="form-icon" /> None
                  </label>
                  <label class="form-radio">
                     <input
                        v-model="localView.updateOption"
                        type="radio"
                        name="update"
                        value="CASCADED"
                     >
                     <i class="form-icon" /> CASCADED
                  </label>
                  <label class="form-radio">
                     <input
                        v-model="localView.updateOption"
                        type="radio"
                        name="update"
                        value="LOCAL"
                     >
                     <i class="form-icon" /> LOCAL
                  </label>
               </div>
            </div>
         </div>
      </div>
      <div class="workspace-query-results column col-12 mt-2 p-relative">
         <BaseLoader v-if="isLoading" />
         <label class="form-label ml-2">{{ $t('message.selectStatement') }}</label>
         <QueryEditor
            v-if="isSelected"
            ref="queryEditor"
            :value.sync="localView.sql"
            :workspace="workspace"
            :schema="schema"
            :height="editorHeight"
         />
      </div>
   </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import BaseLoader from '@/components/BaseLoader';
import QueryEditor from '@/components/QueryEditor';
import Views from '@/ipc-api/Views';

export default {
   name: 'WorkspacePropsTabView',
   components: {
      BaseLoader,
      QueryEditor
   },
   props: {
      connection: Object,
      isSelected: Boolean,
      schema: String,
      view: String
   },
   data () {
      return {
         isLoading: false,
         isSaving: false,
         originalView: null,
         localView: { sql: '' },
         lastView: null,
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
      tabUid () {
         return this.$vnode.key;
      },
      isChanged () {
         return JSON.stringify(this.originalView) !== JSON.stringify(this.localView);
      },
      isDefinerInUsers () {
         return this.originalView ? this.workspace.users.some(user => this.originalView.definer === `\`${user.name}\`@\`${user.host}\``) : true;
      }
   },
   watch: {
      schema () {
         if (this.isSelected) {
            this.getViewData();
            this.$refs.queryEditor.editor.session.setValue(this.localView.sql);
            this.lastView = this.view;
         }
      },
      view () {
         if (this.isSelected) {
            this.getViewData();
            this.$refs.queryEditor.editor.session.setValue(this.localView.sql);
            this.lastView = this.view;
         }
      },
      isSelected (val) {
         if (val) {
            this.changeBreadcrumbs({ schema: this.schema, view: this.view });

            if (this.lastView !== this.view)
               this.getViewData();
         }
      },
      isChanged (val) {
         this.setUnsavedChanges({ uid: this.connection.uid, tUid: this.tabUid, isChanged: val });
      }
   },
   async created () {
      await this.getViewData();
      this.$refs.queryEditor.editor.session.setValue(this.localView.sql);
      window.addEventListener('keydown', this.onKey);
   },
   mounted () {
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
         setUnsavedChanges: 'workspaces/setUnsavedChanges',
         changeBreadcrumbs: 'workspaces/changeBreadcrumbs',
         renameTabs: 'workspaces/renameTabs'
      }),
      async getViewData () {
         if (!this.view) return;
         this.isLoading = true;
         this.localView = { sql: '' };
         this.lastView = this.view;

         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            view: this.view
         };

         try {
            const { status, response } = await Views.getViewInformations(params);
            if (status === 'success') {
               this.originalView = response;
               this.localView = JSON.parse(JSON.stringify(this.originalView));
               this.sqlProxy = this.localView.sql;
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
            view: {
               ...this.localView,
               schema: this.schema,
               oldName: this.originalView.name
            }
         };

         try {
            const { status, response } = await Views.alterView(params);

            if (status === 'success') {
               const oldName = this.originalView.name;

               await this.refreshStructure(this.connection.uid);

               if (oldName !== this.localView.name) {
                  this.renameTabs({
                     uid: this.connection.uid,
                     schema: this.schema,
                     elementName: oldName,
                     elementNewName: this.localView.name,
                     elementType: 'view'
                  });

                  this.changeBreadcrumbs({ schema: this.schema, view: this.localView.name });
               }

               this.getViewData();
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
