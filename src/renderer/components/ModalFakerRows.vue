<template>
   <div class="modal active">
      <a class="modal-overlay" @click.stop="closeModal" />
      <div class="modal-container p-0">
         <div class="modal-header pl-2">
            <div class="modal-title h6">
               <div class="d-flex">
                  <i class="mdi mdi-24px mdi-playlist-plus mr-1" /> {{ $t('message.tableFiller') }}
               </div>
            </div>
            <a class="btn btn-clear c-hand" @click.stop="closeModal" />
         </div>
         <div class="modal-body pb-0">
            <div class="content">
               <form class="form-horizontal">
                  <fieldset :disabled="isInserting">
                     <div
                        v-for="field in fields"
                        :key="field.name"
                        class="form-group"
                     >
                        <div class="col-3 col-sm-12">
                           <label class="form-label" :title="field.name">{{ field.name }}</label>
                        </div>
                        <div class="column columns col-sm-12">
                           <FakerSelect
                              :type="field.type"
                              class="column columns pr-0"
                              :is-checked="!fieldsToExclude.includes(field.name)"
                              :foreign-keys="foreignKeys"
                              :key-usage="keyUsage"
                              :field="field"
                              :field-length="fieldLength(field)"
                              :field-obj="localRow[field.name]"
                              :value.sync="localRow[field.name]"
                           >
                              <span class="input-group-addon field-type" :class="`type-${field.type.toLowerCase()}`">
                                 {{ field.type }} {{ fieldLength(field) | wrapNumber }}
                              </span>
                              <label class="form-checkbox ml-3" :title="$t('word.insert')">
                                 <input
                                    type="checkbox"
                                    :checked="!field.autoIncrement"
                                    @change.prevent="toggleFields($event, field)"
                                 ><i class="form-icon" />
                              </label>
                           </FakerSelect>
                        </div>
                     </div>
                  </fieldset>
               </form>
            </div>
         </div>
         <div class="modal-footer text-light">
            <div class="input-group col-2 tooltip tooltip-right" :data-tooltip="$t('message.numberOfInserts')">
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
            <div class="column col-auto">
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
</template>

<script>
import moment from 'moment';
import { TEXT, LONG_TEXT, NUMBER, FLOAT, DATE, TIME, DATETIME, BLOB } from 'common/fieldTypes';
import { mask } from 'vue-the-mask';
import { mapGetters, mapActions } from 'vuex';
import Tables from '@/ipc-api/Tables';
import FakerSelect from '@/components/FakerSelect';

export default {
   name: 'ModalFakerRows',
   components: {
      FakerSelect
   },
   directives: {
      mask
   },
   filters: {
      wrapNumber (num) {
         if (!num) return '';
         return `(${num})`;
      }
   },
   props: {
      tabUid: [String, Number],
      fields: Array,
      keyUsage: Array
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
      ...mapGetters({
         selectedWorkspace: 'workspaces/getSelected',
         getWorkspace: 'workspaces/getWorkspace',
         getWorkspaceTab: 'workspaces/getWorkspaceTab'
      }),
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

         rowObj[field.name] = { value: fieldDefault };

         if (field.autoIncrement)// Disable by default auto increment fields
            this.fieldsToExclude = [...this.fieldsToExclude, field.name];
      }

      this.localRow = { ...rowObj };
   },
   beforeDestroy () {
      window.removeEventListener('keydown', this.onKey);
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification'
      }),
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
            const { status, response } = await Tables.insertTableFakeRows({
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
      }
   }
};
</script>

<style scoped>
  .modal-container {
    max-width: 800px;
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

  .field-type {
    font-size: 0.6rem;
  }
</style>
