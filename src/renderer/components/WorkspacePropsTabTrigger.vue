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
            <div class="column col-auto">
               <div class="form-group">
                  <label class="form-label">{{ $t('word.name') }}</label>
                  <input
                     v-model="localTrigger.name"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
            <div v-if="customizations.definer" class="column col-auto">
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
         <fieldset class="columns" :disabled="customizations.triggerOnlyRename">
            <div class="column col-auto">
               <div class="form-group">
                  <label class="form-label">{{ $t('word.table') }}</label>
                  <select v-model="localTrigger.table" class="form-select">
                     <option v-for="table in schemaTables" :key="table.name">
                        {{ table.name }}
                     </option>
                  </select>
               </div>
            </div>
            <div class="column col-auto">
               <div class="form-group">
                  <label class="form-label">{{ $t('word.event') }}</label>
                  <div class="input-group">
                     <select v-model="localTrigger.activation" class="form-select">
                        <option>BEFORE</option>
                        <option>AFTER</option>
                     </select>
                     <select
                        v-if="!customizations.triggerMultipleEvents"
                        v-model="localTrigger.event"
                        class="form-select"
                     >
                        <option v-for="event in Object.keys(localEvents)" :key="event">
                           {{ event }}
                        </option>
                     </select>
                     <div v-if="customizations.triggerMultipleEvents" class="px-4">
                        <label
                           v-for="event in Object.keys(localEvents)"
                           :key="event"
                           class="form-checkbox form-inline"
                           @change.prevent="changeEvents(event)"
                        >
                           <input :checked="localEvents[event]" type="checkbox"><i class="form-icon" /> {{ event }}
                        </label>
                     </div>
                  </div>
               </div>
            </div>
         </fieldset>
      </div>
      <div class="workspace-query-results column col-12 mt-2 p-relative">
         <BaseLoader v-if="isLoading" />
         <label class="form-label ml-2">{{ $t('message.triggerStatement') }}</label>
         <QueryEditor
            v-show="isSelected"
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
         editorHeight: 300,
         localEvents: { INSERT: false, UPDATE: false, DELETE: false }
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
      isSelected () {
         return this.workspace.selected_tab === 'prop' && this.selectedWorkspace === this.workspace.uid && this.trigger;
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
         changeBreadcrumbs: 'workspaces/changeBreadcrumbs'
      }),
      async getTriggerData () {
         if (!this.trigger) return;

         Object.keys(this.localEvents).forEach(event => {
            this.localEvents[event] = false;
         });

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

               if (this.customizations.triggerMultipleEvents) {
                  this.originalTrigger.event.forEach(e => {
                     this.localEvents[e] = true;
                  });
               }
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
      changeEvents (event) {
         if (this.customizations.triggerMultipleEvents) {
            this.localEvents[event] = !this.localEvents[event];
            this.localTrigger.event = [];
            for (const key in this.localEvents) {
               if (this.localEvents[key])
                  this.localTrigger.event.push(key);
            }
         }
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
                  const triggerName = this.customizations.triggerTableInName ? `${this.localTrigger.table}.${this.localTrigger.name}` : this.localTrigger.name;
                  this.changeBreadcrumbs({ schema: this.schema, trigger: triggerName });
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

         Object.keys(this.localEvents).forEach(event => {
            this.localEvents[event] = false;
         });

         if (this.customizations.triggerMultipleEvents) {
            this.originalTrigger.event.forEach(e => {
               this.localEvents[e] = true;
            });
         }
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
