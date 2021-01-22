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
            </div>
         </div>
      </div>
      <div class="container">
         <div class="columns mb-4">
            <div class="column col-3">
               <div class="form-group">
                  <label class="form-label">{{ $t('word.name') }}</label>
                  <input
                     v-model="localTrigger.name"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div class="column col-3">
               <div class="form-group">
                  <label class="form-label">{{ $t('word.definer') }}</label>
                  <select
                     v-if="workspace.users.length"
                     v-model="localTrigger.definer"
                     class="form-select"
                  >
                     <option value="">
                        {{ $t('message.currentUser') }}
                     </option>
                     <option v-if="!isDefinerInUsers" :value="originalTrigger.definer">
                        {{ originalTrigger.definer.replaceAll('`', '') }}
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
            <div class="column col-3">
               <div class="form-group">
                  <label class="form-label">{{ $t('word.table') }}</label>
                  <select v-model="localTrigger.table" class="form-select">
                     <option v-for="table in schemaTables" :key="table.name">
                        {{ table.name }}
                     </option>
                  </select>
               </div>
            </div>
            <div class="column col-3">
               <div class="form-group">
                  <label class="form-label">{{ $t('word.event') }}</label>
                  <div class="input-group">
                     <select v-model="localTrigger.event1" class="form-select">
                        <option>BEFORE</option>
                        <option>AFTER</option>
                     </select>
                     <select v-model="localTrigger.event2" class="form-select">
                        <option>INSERT</option>
                        <option>UPDATE</option>
                        <option>DELETE</option>
                     </select>
                  </div>
               </div>
            </div>
         </div>
      </div>
      <div class="workspace-query-results column col-12 mt-2 p-relative">
         <BaseLoader v-if="isLoading" />
         <label class="form-label ml-2">{{ $t('message.triggerStatement') }}</label>
         <QueryEditor
            v-if="isSelected"
            ref="queryEditor"
            :value.sync="localTrigger.sql"
            :workspace="workspace"
            :schema="schema"
            :height="editorHeight"
         />
      </div>
   </div>
</template>

<script>
import QueryEditor from '@/components/QueryEditor';
import { mapGetters, mapActions } from 'vuex';
import BaseLoader from '@/components/BaseLoader';
import Triggers from '@/ipc-api/Triggers';

export default {
   name: 'WorkspacePropsTabTrigger',
   components: {
      BaseLoader,
      QueryEditor
   },
   props: {
      connection: Object,
      trigger: String
   },
   data () {
      return {
         tabUid: 'prop',
         isLoading: false,
         isSaving: false,
         originalTrigger: null,
         localTrigger: { sql: '' },
         lastTrigger: null,
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
         return JSON.stringify(this.originalTrigger) !== JSON.stringify(this.localTrigger);
      },
      isDefinerInUsers () {
         return this.originalTrigger ? this.workspace.users.some(user => this.originalTrigger.definer === `\`${user.name}\`@\`${user.host}\``) : true;
      },
      schemaTables () {
         const schemaTables = this.workspace.structure
            .filter(schema => schema.name === this.schema)
            .map(schema => schema.tables);

         return schemaTables.length ? schemaTables[0].filter(table => table.type === 'table') : [];
      }
   },
   watch: {
      async trigger () {
         if (this.isSelected) {
            await this.getTriggerData();
            this.$refs.queryEditor.editor.session.setValue(this.localTrigger.sql);
            this.lastTrigger = this.trigger;
         }
      },
      async isSelected (val) {
         if (val && this.lastTrigger !== this.trigger) {
            await this.getTriggerData();
            this.$refs.queryEditor.editor.session.setValue(this.localTrigger.sql);
            this.lastTrigger = this.trigger;
         }
      },
      isChanged (val) {
         if (this.isSelected && this.lastTrigger === this.trigger && this.trigger !== null)
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
      async getTriggerData () {
         if (!this.trigger) return;

         this.localTrigger = { sql: '' };
         this.isLoading = true;

         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            trigger: this.workspace.breadcrumbs.trigger
         };

         try {
            const { status, response } = await Triggers.getTriggerInformations(params);
            if (status === 'success') {
               this.originalTrigger = response;
               this.localTrigger = JSON.parse(JSON.stringify(this.originalTrigger));
               this.sqlProxy = this.localTrigger.sql;
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
            trigger: {
               ...this.localTrigger,
               oldName: this.originalTrigger.name
            }
         };

         try {
            const { status, response } = await Triggers.alterTrigger(params);

            if (status === 'success') {
               const oldName = this.originalTrigger.name;

               await this.refreshStructure(this.connection.uid);

               if (oldName !== this.localTrigger.name) {
                  this.setUnsavedChanges(false);
                  this.changeBreadcrumbs({ schema: this.schema, trigger: this.localTrigger.name });
               }

               this.getTriggerData();
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
         this.localTrigger = JSON.parse(JSON.stringify(this.originalTrigger));
         this.$refs.queryEditor.editor.session.setValue(this.localTrigger.sql);
      },
      resizeQueryEditor () {
         if (this.$refs.queryEditor) {
            const footer = document.getElementById('footer');
            const size = window.innerHeight - this.$refs.queryEditor.$el.getBoundingClientRect().top - footer.offsetHeight;
            this.editorHeight = size;
            this.$refs.queryEditor.editor.resize();
         }
      }
   }
};
</script>
