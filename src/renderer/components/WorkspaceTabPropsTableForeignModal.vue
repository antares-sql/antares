<template>
   <ConfirmModal
      :confirm-text="$t('word.confirm')"
      size="medium"
      class="options-modal"
      @confirm="confirmForeignsChange"
      @hide="$emit('hide')"
   >
      <template :slot="'header'">
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-key-link mr-1" />
            <span class="cut-text">{{ $t('word.foreignKeys') }} "{{ table }}"</span>
         </div>
      </template>
      <div :slot="'body'">
         <div class="columns col-gapless">
            <div class="column col-5">
               <div class="panel" :style="{ height: modalInnerHeight + 'px'}">
                  <div class="panel-header pt-0 pl-0">
                     <div class="d-flex">
                        <button class="btn btn-dark btn-sm d-flex" @click="addForeign">
                           <i class="mdi mdi-24px mdi-link-plus mr-1" />
                           <span>{{ $t('word.add') }}</span>
                        </button>
                        <button
                           class="btn btn-dark btn-sm d-flex ml-2 mr-0"
                           :title="$t('message.clearChanges')"
                           :disabled="!isChanged"
                           @click.prevent="clearChanges"
                        >
                           <i class="mdi mdi-24px mdi-delete-sweep mr-1" />
                           <span>{{ $t('word.clear') }}</span>
                        </button>
                     </div>
                  </div>
                  <div ref="indexesPanel" class="panel-body p-0 pr-1">
                     <div
                        v-for="foreign in foreignProxy"
                        :key="foreign._id"
                        class="tile tile-centered c-hand mb-1 p-1"
                        :class="{'selected-element': selectedForeignID === foreign._id}"
                        @click="selectForeign($event, foreign._id)"
                     >
                        <div class="tile-icon">
                           <div>
                              <i class="mdi mdi-key-link mdi-24px" />
                           </div>
                        </div>
                        <div class="tile-content">
                           <div class="tile-title">
                              {{ foreign.constraintName }}
                           </div>
                           <small class="tile-subtitle text-gray d-flex">
                              <i class="mdi mdi-link-variant mr-1" />
                              <div class="fk-details-wrapper">
                                 <span v-if="foreign.table !== ''" class="fk-details">
                                    <i class="mdi mdi-table mr-1" />
                                    <span>{{ foreign.table }}.{{ foreign.field }}</span>
                                 </span>
                                 <span v-if="foreign.refTable !== ''" class="fk-details">
                                    <i class="mdi mdi-table mr-1" />
                                    <span>{{ foreign.refTable }}.{{ foreign.refField }}</span>
                                 </span>
                              </div>
                           </small>
                        </div>
                        <div class="tile-action">
                           <button
                              class="btn btn-link remove-field p-0 mr-2"
                              :title="$t('word.delete')"
                              @click.prevent="removeIndex(foreign._id)"
                           >
                              <i class="mdi mdi-close" />
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div class="column col-7 pl-2 editor-col">
               <form
                  v-if="selectedForeignObj"
                  :style="{ height: modalInnerHeight + 'px'}"
                  class="form-horizontal"
               >
                  <div class="form-group">
                     <label class="form-label col-3">
                        {{ $t('word.name') }}
                     </label>
                     <div class="column">
                        <input
                           v-model="selectedForeignObj.constraintName"
                           class="form-input"
                           type="text"
                        >
                     </div>
                  </div>
                  <div class="form-group mb-4">
                     <label class="form-label col-3">
                        {{ $tc('word.field', 1) }}
                     </label>
                     <div class="fields-list column pt-1">
                        <label
                           v-for="(field, i) in fields"
                           :key="`${field.name}-${i}`"
                           class="form-checkbox m-0"
                           @click.prevent="toggleField(field.name)"
                        >
                           <input type="checkbox" :checked="selectedForeignObj.field === field.name">
                           <i class="form-icon" /> {{ field.name }}
                        </label>
                     </div>
                  </div>
                  <div class="form-group">
                     <label class="form-label col-3 pt-0">
                        {{ $t('message.referenceTable') }}
                     </label>
                     <div class="column">
                        <select
                           v-model="selectedForeignObj.refTable"
                           class="form-select"
                           @change="reloadRefFields"
                        >
                           <option
                              v-for="schemaTable in schemaTables"
                              :key="schemaTable.name"
                              :value="schemaTable.name"
                           >
                              {{ schemaTable.name }}
                           </option>
                        </select>
                     </div>
                  </div>
                  <div class="form-group mb-4">
                     <label class="form-label col-3">
                        {{ $t('message.referenceField') }}
                     </label>
                     <div class="fields-list column pt-1">
                        <label
                           v-for="(field, i) in refFields[selectedForeignID]"
                           :key="`${field.name}-${i}`"
                           class="form-checkbox m-0"
                           @click.prevent="toggleRefField(field.name)"
                        >
                           <input type="checkbox" :checked="selectedForeignObj.refField === field.name && selectedForeignObj.refTable === field.table">
                           <i class="form-icon" /> {{ field.name }}
                        </label>
                     </div>
                  </div>
                  <div class="form-group">
                     <label class="form-label col-3">
                        {{ $t('message.onUpdate') }}
                     </label>
                     <div class="column">
                        <select v-model="selectedForeignObj.onUpdate" class="form-select">
                           <option
                              v-for="action in foreignActions"
                              :key="action"
                              :value="action"
                           >
                              {{ action }}
                           </option>
                        </select>
                     </div>
                  </div>
                  <div class="form-group">
                     <label class="form-label col-3">
                        {{ $t('message.onDelete') }}
                     </label>
                     <div class="column">
                        <select v-model="selectedForeignObj.onDelete" class="form-select">
                           <option
                              v-for="action in foreignActions"
                              :key="action"
                              :value="action"
                           >
                              {{ action }}
                           </option>
                        </select>
                     </div>
                  </div>
               </form>

               <div v-if="!foreignProxy.length" class="empty">
                  <div class="empty-icon">
                     <i class="mdi mdi-key-link mdi-48px" />
                  </div>
                  <p class="empty-title h5">
                     {{ $t('message.thereAreNoForeign') }}
                  </p>
                  <div class="empty-action">
                     <button class="btn btn-primary" @click="addForeign">
                        {{ $t('message.createNewForeign') }}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </ConfirmModal>
</template>

<script>
import { mapActions } from 'vuex';
import { uidGen } from 'common/libs/uidGen';
import Tables from '@/ipc-api/Tables';
import ConfirmModal from '@/components/BaseConfirmModal';

export default {
   name: 'WorkspaceTabPropsTableForeignModal',
   components: {
      ConfirmModal
   },
   props: {
      localKeyUsage: Array,
      connection: Object,
      table: String,
      schema: String,
      schemaTables: Array,
      fields: Array,
      workspace: Object
   },
   data () {
      return {
         foreignProxy: [],
         isOptionsChanging: false,
         selectedForeignID: '',
         modalInnerHeight: 400,
         refFields: {},
         foreignActions: [
            'RESTRICT',
            'CASCADE',
            'SET NULL',
            'NO ACTION'
         ]
      };
   },
   computed: {
      selectedForeignObj () {
         return this.foreignProxy.find(foreign => foreign._id === this.selectedForeignID);
      },
      isChanged () {
         return JSON.stringify(this.localKeyUsage) !== JSON.stringify(this.foreignProxy);
      },
      hasPrimary () {
         return this.foreignProxy.some(foreign => foreign.type === 'PRIMARY');
      }
   },
   mounted () {
      this.foreignProxy = JSON.parse(JSON.stringify(this.localKeyUsage));

      if (this.foreignProxy.length)
         this.resetSelectedID();

      if (this.selectedForeignObj)
         this.getRefFields();

      this.getModalInnerHeight();
      window.addEventListener('resize', this.getModalInnerHeight);
   },
   destroyed () {
      window.removeEventListener('resize', this.getModalInnerHeight);
   },
   methods: {
      ...mapActions({
         addNotification: 'notifications/addNotification'
      }),
      confirmForeignsChange () {
         this.foreignProxy = this.foreignProxy.filter(foreign =>
            foreign.field &&
            foreign.refField &&
            foreign.table &&
            foreign.refTable
         );
         this.$emit('foreigns-update', this.foreignProxy);
      },
      selectForeign (event, id) {
         if (this.selectedForeignID !== id && !event.target.classList.contains('remove-field')) {
            this.selectedForeignID = id;
            this.getRefFields();
         }
      },
      getModalInnerHeight () {
         const modalBody = document.querySelector('.modal-body');
         if (modalBody)
            this.modalInnerHeight = modalBody.clientHeight - (parseFloat(getComputedStyle(modalBody).paddingTop) + parseFloat(getComputedStyle(modalBody).paddingBottom));
      },
      addForeign () {
         this.foreignProxy = [...this.foreignProxy, {
            _id: uidGen(),
            constraintName: `FK_${this.foreignProxy.length + 1}`,
            refSchema: this.schema,
            table: this.table,
            refTable: '',
            field: '',
            refField: '',
            onUpdate: this.foreignActions[0],
            onDelete: this.foreignActions[0]
         }];

         if (this.foreignProxy.length === 1)
            this.resetSelectedID();

         setTimeout(() => {
            this.$refs.indexesPanel.scrollTop = this.$refs.indexesPanel.scrollHeight + 60;
         }, 20);
      },
      removeIndex (id) {
         this.foreignProxy = this.foreignProxy.filter(foreign => foreign._id !== id);

         if (this.selectedForeignID === id && this.foreignProxy.length)
            this.resetSelectedID();
      },
      clearChanges () {
         this.foreignProxy = JSON.parse(JSON.stringify(this.localKeyUsage));
         if (!this.foreignProxy.some(foreign => foreign._id === this.selectedForeignID))
            this.resetSelectedID();
      },
      toggleField (field) {
         this.foreignProxy = this.foreignProxy.map(foreign => {
            if (foreign._id === this.selectedForeignID)
               foreign.field = field;

            return foreign;
         });
      },
      toggleRefField (field) {
         this.foreignProxy = this.foreignProxy.map(foreign => {
            if (foreign._id === this.selectedForeignID)
               foreign.refField = field;

            return foreign;
         });
      },
      resetSelectedID () {
         this.selectedForeignID = this.foreignProxy.length ? this.foreignProxy[0]._id : '';
      },
      async getRefFields () {
         if (!this.selectedForeignObj.refTable) return;

         const params = {
            uid: this.connection.uid,
            schema: this.selectedForeignObj.refSchema,
            table: this.selectedForeignObj.refTable
         };

         try { // Field data
            const { status, response } = await Tables.getTableColumns(params);
            if (status === 'success') {
               this.refFields = {
                  ...this.refFields,
                  [this.selectedForeignID]: response
               };
            }
            else
               this.addNotification({ status: 'error', message: response });
         }
         catch (err) {
            this.addNotification({ status: 'error', message: err.stack });
         }
      },
      reloadRefFields () {
         this.selectedForeignObj.refField = '';
         this.getRefFields();
      }
   }
};
</script>

<style lang="scss" scoped>
.tile {
  border-radius: $border-radius;
  opacity: 0.5;
  transition: background 0.2s;
  transition: opacity 0.2s;

  .tile-action {
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover {
    .tile-action {
      opacity: 1;
    }
  }

  &.selected-element {
    opacity: 1;
  }
}

.fields-list {
  max-height: 80px;
  overflow: auto;
}

.remove-field .mdi {
  pointer-events: none;
}

.fk-details-wrapper {
  max-width: calc(100% - 1rem);

  .fk-details {
    display: flex;
    line-height: 1;
    align-items: baseline;

    > span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
      padding-bottom: 2px;
    }
  }
}

</style>
