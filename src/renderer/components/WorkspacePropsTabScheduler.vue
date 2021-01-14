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
               <button class="btn btn-dark btn-sm" @click="false">
                  <span>{{ $t('word.timing') }}</span>
                  <i class="mdi mdi-24px mdi-timer ml-1" />
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
                     v-model="localScheduler.name"
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
                     v-model="localScheduler.definer"
                     class="form-select"
                  >
                     <option value="">
                        {{ $t('message.currentUser') }}
                     </option>
                     <option v-if="!isDefinerInUsers" :value="originalScheduler.definer">
                        {{ originalScheduler.definer.replaceAll('`', '') }}
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
            <div class="column col-6">
               <div class="form-group">
                  <label class="form-label">{{ $t('word.comment') }}</label>
                  <input
                     v-model="localScheduler.comment"
                     class="form-input"
                     type="text"
                  >
               </div>
            </div>
         </div>
         <div class="columns">
            <!-- <div class="column"> TODO: move in timing modal
               <label class="form-checkbox form-inline">
                  <input v-model="localScheduler.preserve" type="checkbox"><i class="form-icon" /> {{ $t('message.preserveOnCompletion') }}
               </label>
            </div> -->
         </div>
         <div class="columns">
            <div class="column">
               <div class="form-group">
                  <label class="form-label mr-2">{{ $t('word.state') }}</label>
                  <label class="form-radio form-inline">
                     <input
                        v-model="localScheduler.state"
                        type="radio"
                        name="state"
                        value="ENABLE"
                     ><i class="form-icon" /> ENABLE
                  </label>
                  <label class="form-radio form-inline">
                     <input
                        v-model="localScheduler.state"
                        type="radio"
                        name="state"
                        value="DISABLE"
                     ><i class="form-icon" /> DISABLE
                  </label>
                  <label class="form-radio form-inline">
                     <input
                        v-model="localScheduler.state"
                        type="radio"
                        name="state"
                        value="DISABLE ON SLAVE"
                     ><i class="form-icon" /> DISABLE ON SLAVE
                  </label>
               </div>
            </div>
         </div>
      </div>
      <div class="workspace-query-results column col-12 mt-2">
         <label class="form-label ml-2">{{ $t('message.schedulerBody') }}</label>
         <QueryEditor
            v-if="isSelected"
            ref="queryEditor"
            :value.sync="localScheduler.sql"
            :workspace="workspace"
            :schema="schema"
            :height="editorHeight"
         />
      </div>
   </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import QueryEditor from '@/components/QueryEditor';
import Schedulers from '@/ipc-api/Schedulers';

export default {
   name: 'WorkspacePropsTabScheduler',
   components: {
      QueryEditor
   },
   props: {
      connection: Object,
      scheduler: String
   },
   data () {
      return {
         tabUid: 'prop',
         isQuering: false,
         isSaving: false,
         originalScheduler: null,
         localScheduler: { sql: '' },
         lastScheduler: null,
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
         return JSON.stringify(this.originalScheduler) !== JSON.stringify(this.localScheduler);
      },
      isDefinerInUsers () {
         return this.originalScheduler ? this.workspace.users.some(user => this.originalScheduler.definer === `\`${user.name}\`@\`${user.host}\``) : true;
      },
      schemaTables () {
         const schemaTables = this.workspace.structure
            .filter(schema => schema.name === this.schema)
            .map(schema => schema.tables);

         return schemaTables.length ? schemaTables[0].filter(table => table.type === 'table') : [];
      }
   },
   watch: {
      async scheduler () {
         if (this.isSelected) {
            await this.getSchedulerData();
            this.$refs.queryEditor.editor.session.setValue(this.localScheduler.sql);
            this.lastScheduler = this.scheduler;
         }
      },
      async isSelected (val) {
         if (val && this.lastScheduler !== this.scheduler) {
            await this.getSchedulerData();
            this.$refs.queryEditor.editor.session.setValue(this.localScheduler.sql);
            this.lastScheduler = this.scheduler;
         }
      },
      isChanged (val) {
         if (this.isSelected && this.lastScheduler === this.scheduler && this.scheduler !== null)
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
      async getSchedulerData () {
         if (!this.scheduler) return;
         this.isQuering = true;

         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            scheduler: this.workspace.breadcrumbs.scheduler
         };

         try {
            const { status, response } = await Schedulers.getSchedulerInformations(params);
            if (status === 'success') {
               this.originalScheduler = response;
               this.localScheduler = JSON.parse(JSON.stringify(this.originalScheduler));
               this.sqlProxy = this.localScheduler.sql;
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.resizeQueryEditor();
         this.isQuering = false;
      },
      async saveChanges () {
         if (this.isSaving) return;
         this.isSaving = true;
         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            scheduler: {
               ...this.localScheduler,
               oldName: this.originalScheduler.name
            }
         };

         try {
            const { status, response } = await Schedulers.alterScheduler(params);

            if (status === 'success') {
               const oldName = this.originalScheduler.name;

               await this.refreshStructure(this.connection.uid);

               if (oldName !== this.localScheduler.name) {
                  this.setUnsavedChanges(false);
                  this.changeBreadcrumbs({ schema: this.schema, scheduler: this.localScheduler.name });
               }

               this.getSchedulerData();
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
         this.localScheduler = JSON.parse(JSON.stringify(this.originalScheduler));
         this.$refs.queryEditor.editor.session.setValue(this.localScheduler.sql);
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
