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
                  class="btn btn-dark btn-sm"
                  :title="$t('message.addNewField')"
                  @click="addField"
               >
                  <span>{{ $t('word.add') }}</span>
                  <i class="mdi mdi-24px mdi-playlist-plus ml-1" />
               </button>
               <button class="btn btn-dark btn-sm">
                  <span>{{ $t('word.indexes') }}</span>
                  <i class="mdi mdi-24px mdi-key mdi-rotate-45 ml-1" />
               </button>
               <button class="btn btn-dark btn-sm">
                  <span>{{ $t('word.foreignKeys') }}</span>
                  <i class="mdi mdi-24px mdi-key-link ml-1" />
               </button>
               <button class="btn btn-dark btn-sm">
                  <span>{{ $t('word.options') }}</span>
                  <i class="mdi mdi-24px mdi-cogs ml-1" />
               </button>
            </div>
         </div>
      </div>
      <div class="workspace-query-results column col-12">
         <WorkspacePropsTable
            v-if="localFields"
            ref="queryTable"
            :fields="localFields"
            :tab-uid="tabUid"
            :conn-uid="connection.uid"
            :table="table"
            :schema="schema"
            mode="table"
         />
      </div>
   </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { uidGen } from 'common/libs/uidGen';
import Tables from '@/ipc-api/Tables';
import WorkspacePropsTable from '@/components/WorkspacePropsTable';

export default {
   name: 'WorkspacePropsTab',
   components: {
      WorkspacePropsTable
   },
   props: {
      connection: Object,
      table: String
   },
   data () {
      return {
         tabUid: 'prop',
         isQuering: false,
         isSaving: false,
         originalFields: [],
         localFields: [],
         originalKeyUsage: [],
         localKeyUsage: [],
         lastTable: null,
         isAddModal: false
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
         return JSON.stringify(this.originalFields) !== JSON.stringify(this.localFields) || JSON.stringify(this.originalKeyUsage) !== JSON.stringify(this.localKeyUsage);
      }
   },
   watch: {
      table () {
         if (this.isSelected) {
            this.getFieldsData();
            this.lastTable = this.table;
         }
      },
      isSelected (val) {
         if (val && this.lastTable !== this.table) {
            this.getFieldsData();
            this.lastTable = this.table;
         }
      }
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification'
      }),
      async getFieldsData () {
         if (!this.table) return;
         this.isQuering = true;

         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            table: this.workspace.breadcrumbs.table
         };

         try { // Columns data
            const { status, response } = await Tables.getTableColumns(params);
            if (status === 'success') {
               this.originalFields = response.map(field => {
                  return { ...field, _id: uidGen() };
               });
               this.localFields = JSON.parse(JSON.stringify(this.originalFields));
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         try { // Key usage (foreign keys)
            const { status, response } = await Tables.getKeyUsage(params);

            if (status === 'success') {
               this.originalKeyUsage = response;
               this.localKeyUsage = JSON.parse(JSON.stringify(response));
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.isQuering = false;
      },
      async saveChanges () {
         if (this.isSaving) return;
         this.isSaving = true;

         const originalIDs = this.originalFields.reduce((acc, curr) => [...acc, curr._id], []);
         const localIDs = this.localFields.reduce((acc, curr) => [...acc, curr._id], []);

         // Additions
         const additions = this.localFields.filter((field, i) => !originalIDs.includes(field._id)).map(field => {
            const lI = this.localFields.findIndex(localField => localField._id === field._id);
            const after = lI > 0 ? this.localFields[lI - 1].name : false;
            return { ...field, after };
         });

         // Deletions
         const deletions = this.originalFields.filter(field => !localIDs.includes(field._id));

         // Changes
         const changes = [];
         this.originalFields.forEach((originalField, oI) => {
            const lI = this.localFields.findIndex(localField => localField._id === originalField._id);
            const originalSibling = oI > 0 ? this.originalFields[oI - 1]._id : false;
            const localSibling = lI > 0 ? this.localFields[lI - 1]._id : false;
            const after = lI > 0 ? this.localFields[lI - 1].name : false;
            const orgName = originalField.name;

            if (JSON.stringify(originalField) !== JSON.stringify(this.localFields[lI]) || originalSibling !== localSibling)
               changes.push({ ...this.localFields[lI], after, orgName });
         });

         const params = {
            uid: this.connection.uid,
            schema: this.schema,
            table: this.workspace.breadcrumbs.table,
            additions,
            changes,
            deletions
         };

         try { // Key usage (foreign keys)
            const { status, response } = await Tables.alterTable(params);

            if (status === 'success')
               this.getFieldsData();
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.isSaving = false;
      },
      clearChanges () {
         this.localFields = JSON.parse(JSON.stringify(this.originalFields));
         this.localKeyUsage = JSON.parse(JSON.stringify(this.originalKeyUsage));
      },
      addField () {
         this.localFields.push({
            _id: uidGen(),
            name: '',
            key: '',
            type: 'int',
            schema: this.schema,
            table: this.table,
            numPrecision: null,
            numLength: null,
            datePrecision: null,
            charLength: null,
            nullable: false,
            unsigned: false,
            zerofill: false,
            order: this.localFields.length + 1,
            default: null,
            charset: null,
            collation: null,
            autoIncrement: false,
            onUpdate: '',
            comment: ''
         });
      },
      removeField (uid) {
         this.localFields = this.localFields.filter(field => field._id !== uid);
      },
      showAddModal () {
         this.isAddModal = true;
      },
      hideAddModal () {
         this.isAddModal = false;
      }
   }
};
</script>
