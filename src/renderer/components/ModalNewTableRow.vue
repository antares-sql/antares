<template>
   <Teleport to="#window-content">
      <div class="modal active">
         <a class="modal-overlay" @click.stop="closeModal" />
         <div class="modal-container p-0">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <i class="mdi mdi-24px mdi-playlist-plus mr-1" />
                     <span class="cut-text">{{ $t('message.addNewRow') }}</span>
                  </div>
               </div>
               <a class="btn btn-clear c-hand" @click.stop="closeModal" />
            </div>
            <div class="modal-body pb-0">
               <div class="content">
                  <form class="form-horizontal">
                     <fieldset :disabled="isInserting">
                        <div
                           v-for="(field, key) in fields"
                           :key="field.name"
                           class="form-group"
                        >
                           <div class="col-4 col-sm-12">
                              <label class="form-label" :title="field.name">{{ field.name }}</label>
                           </div>
                           <div class="input-group col-8 col-sm-12">
                              <ForeignKeySelect
                                 v-if="foreignKeys.includes(field.name)"
                                 ref="formInput"
                                 v-model="localRow[field.name]"
                                 class="form-select"
                                 :key-usage="getKeyUsage(field.name)"
                                 :disabled="fieldsToExclude.includes(field.name)"
                              />
                              <input
                                 v-else-if="inputProps(field).mask"
                                 ref="formInput"
                                 v-model="localRow[field.name]"
                                 v-mask="inputProps(field).mask"
                                 class="form-input"
                                 :type="inputProps(field).type"
                                 :disabled="fieldsToExclude.includes(field.name)"
                                 :tabindex="key+1"
                              >
                              <input
                                 v-else-if="inputProps(field).type === 'file'"
                                 ref="formInput"
                                 class="form-input"
                                 type="file"
                                 :disabled="fieldsToExclude.includes(field.name)"
                                 :tabindex="key+1"
                                 @change="filesChange($event,field.name)"
                              >
                              <input
                                 v-else-if="inputProps(field).type === 'number'"
                                 ref="formInput"
                                 v-model="localRow[field.name]"
                                 class="form-input"
                                 step="any"
                                 :type="inputProps(field).type"
                                 :disabled="fieldsToExclude.includes(field.name)"
                                 :tabindex="key+1"
                              >
                              <input
                                 v-else
                                 ref="formInput"
                                 v-model="localRow[field.name]"
                                 class="form-input"
                                 :type="inputProps(field).type"
                                 :disabled="fieldsToExclude.includes(field.name)"
                                 :tabindex="key+1"
                              >
                              <span class="input-group-addon" :class="typeCLass(field.type)">
                                 {{ field.type }} {{ wrapNumber(fieldLength(field)) }}
                              </span>
                              <label class="form-checkbox ml-3" :title="$t('word.insert')">
                                 <input
                                    type="checkbox"
                                    :checked="!field.autoIncrement"
                                    @change.prevent="toggleFields($event, field)"
                                 ><i class="form-icon" />
                              </label>
                           </div>
                        </div>
                     </fieldset>
                  </form>
               </div>
            </div>
            <div class="modal-footer">
               <div class="input-group col-3 tooltip tooltip-right" :data-tooltip="$t('message.numberOfInserts')">
                  <input
                     v-model="nInserts"
                     type="number"
                     class="form-input"
                     min="1"
                     :disabled="isInserting"
                  >
                  <span class="input-group-addon">
                     <i class="mdi mdi-24px mdi-repeat" />
                  </span>
               </div>
               <div>
                  <button
                     class="btn btn-primary mr-2"
                     :class="{'loading': isInserting}"
                     @click.stop="insertRows"
                  >
                     {{ $t('word.insert') }}
                  </button>
                  <button class="btn btn-link" @click.stop="closeModal">
                     {{ $t('word.close') }}
                  </button>
               </div>
            </div>
         </div>
      </div>
   </Teleport>
</template>

<script>
import moment from 'moment';
import { TEXT, LONG_TEXT, NUMBER, FLOAT, DATE, TIME, DATETIME, BLOB, BIT } from 'common/fieldTypes';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';
import Tables from '@/ipc-api/Tables';
import ForeignKeySelect from '@/components/ForeignKeySelect';
import { storeToRefs } from 'pinia';

export default {
   name: 'ModalNewTableRow',
   components: {
      ForeignKeySelect
   },
   props: {
      tabUid: [String, Number],
      fields: Array,
      keyUsage: Array
   },
   emits: ['reload', 'hide'],
   setup () {
      const { addNotification } = useNotificationsStore();
      const workspacesStore = useWorkspacesStore();

      const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

      const { getWorkspace, getWorkspaceTab } = workspacesStore;

      return {
         addNotification,
         selectedWorkspace,
         getWorkspace,
         getWorkspaceTab
      };
   },
   data () {
      return {
         localRow: {},
         fieldsToExclude: [],
         nInserts: 1,
         isInserting: false
      };
   },
   computed: {
      workspace () {
         return this.getWorkspace(this.selectedWorkspace);
      },
      foreignKeys () {
         return this.keyUsage.map(key => key.field);
      }
   },
   watch: {
      nInserts (val) {
         if (!val || val < 1)
            this.nInserts = 1;
         else if (val > 1000)
            this.nInserts = 1000;
      }
   },
   created () {
      window.addEventListener('keydown', this.onKey);
   },
   mounted () {
      const rowObj = {};

      for (const field of this.fields) {
         let fieldDefault;

         if (field.default === 'NULL') fieldDefault = null;
         else {
            if ([...NUMBER, ...FLOAT].includes(field.type))
               fieldDefault = +field.default;

            if ([...TEXT, ...LONG_TEXT].includes(field.type))
               fieldDefault = field.default ? field.default.substring(1, field.default.length - 1) : '';

            if ([...TIME, ...DATE].includes(field.type))
               fieldDefault = field.default;

            if (DATETIME.includes(field.type)) {
               if (field.default && field.default.toLowerCase().includes('current_timestamp')) {
                  let datePrecision = '';
                  for (let i = 0; i < field.datePrecision; i++)
                     datePrecision += i === 0 ? '.S' : 'S';
                  fieldDefault = moment().format(`YYYY-MM-DD HH:mm:ss${datePrecision}`);
               }
            }
         }

         rowObj[field.name] = fieldDefault;

         if (field.autoIncrement)// Disable by default auto increment fields
            this.fieldsToExclude = [...this.fieldsToExclude, field.name];
      }

      this.localRow = { ...rowObj };

      // Auto focus
      setTimeout(() => {
         const firstSelectableInput = this.$refs.formInput.find(input => !input.disabled);
         firstSelectableInput.focus();
      }, 20);
   },
   beforeUnmount () {
      window.removeEventListener('keydown', this.onKey);
   },
   methods: {
      typeClass (type) {
         if (type)
            return `type-${type.toLowerCase().replaceAll(' ', '_').replaceAll('"', '')}`;
         return '';
      },
      async insertRows () {
         this.isInserting = true;
         const rowToInsert = this.localRow;
         Object.keys(rowToInsert).forEach(key => {
            if (this.fieldsToExclude.includes(key))
               delete rowToInsert[key];
            if (typeof rowToInsert[key] === 'undefined')
               delete rowToInsert[key];
         });

         const fieldTypes = {};
         this.fields.forEach(field => {
            fieldTypes[field.name] = field.type;
         });

         try {
            const { status, response } = await Tables.insertTableRows({
               uid: this.selectedWorkspace,
               schema: this.workspace.breadcrumbs.schema,
               table: this.workspace.breadcrumbs.table,
               row: rowToInsert,
               repeat: this.nInserts,
               fields: fieldTypes
            });

            if (status === 'success') {
               this.closeModal();
               this.$emit('reload');
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }

         this.isInserting = false;
      },
      closeModal () {
         this.$emit('hide');
      },
      fieldLength (field) {
         if ([...BLOB, ...LONG_TEXT].includes(field.type)) return null;
         else if (TEXT.includes(field.type)) return field.charLength;
         return field.length;
      },
      inputProps (field) {
         if ([...TEXT, ...LONG_TEXT].includes(field.type))
            return { type: 'text', mask: false };

         if ([...NUMBER, ...FLOAT].includes(field.type))
            return { type: 'number', mask: false };

         if (TIME.includes(field.type)) {
            let timeMask = '##:##:##';
            const precision = this.fieldLength(field);

            for (let i = 0; i < precision; i++)
               timeMask += i === 0 ? '.#' : '#';

            return { type: 'text', mask: timeMask };
         }

         if (DATE.includes(field.type))
            return { type: 'text', mask: '####-##-##' };

         if (DATETIME.includes(field.type)) {
            let datetimeMask = '####-##-## ##:##:##';
            const precision = this.fieldLength(field);

            for (let i = 0; i < precision; i++)
               datetimeMask += i === 0 ? '.#' : '#';

            return { type: 'text', mask: datetimeMask };
         }

         if (BLOB.includes(field.type))
            return { type: 'file', mask: false };

         if (BIT.includes(field.type))
            return { type: 'text', mask: false };

         return { type: 'text', mask: false };
      },
      toggleFields (event, field) {
         if (event.target.checked)
            this.fieldsToExclude = this.fieldsToExclude.filter(f => f !== field.name);
         else
            this.fieldsToExclude = [...this.fieldsToExclude, field.name];
      },
      filesChange (event, field) {
         const { files } = event.target;
         if (!files.length) return;

         this.localRow[field] = files[0].path;
      },
      getKeyUsage (keyName) {
         return this.keyUsage.find(key => key.field === keyName);
      },
      onKey (e) {
         e.stopPropagation();
         if (e.key === 'Escape')
            this.closeModal();
      },
      wrapNumber (num) {
         if (!num) return '';
         return `(${num})`;
      }
   }
};
</script>

<style scoped>
  .modal-container {
    max-width: 500px;
  }

  .form-label {
    overflow: hidden;
    white-space: normal;
    text-overflow: ellipsis;
  }

  .input-group-addon {
    display: flex;
    align-items: center;
  }

  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>
