<template>
   <ConfirmModal
      :confirm-text="$t('word.confirm')"
      size="medium"
      class="options-modal"
      @confirm="confirmIndexesChange"
      @hide="$emit('hide')"
   >
      <template :slot="'header'">
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-key mdi-rotate-45 mr-1" />
            <span class="cut-text">{{ $t('word.indexes') }} "{{ table }}"</span>
         </div>
      </template>
      <div :slot="'body'">
         <div class="columns col-gapless">
            <div class="column col-5">
               <div class="panel" :style="{ height: modalInnerHeight + 'px'}">
                  <div class="panel-header pt-0 pl-0">
                     <div class="d-flex">
                        <button class="btn btn-dark btn-sm d-flex" @click="addIndex">
                           <span>{{ $t('word.add') }}</span>
                           <i class="mdi mdi-24px mdi-key-plus ml-1" />
                        </button>
                        <button
                           class="btn btn-dark btn-sm d-flex ml-2 mr-0"
                           :title="$t('message.clearChanges')"
                           :disabled="!isChanged"
                           @click.prevent="clearChanges"
                        >
                           <span>{{ $t('word.clear') }}</span>
                           <i class="mdi mdi-24px mdi-delete-sweep ml-1" />
                        </button>
                     </div>
                  </div>
                  <div ref="indexesPanel" class="panel-body p-0 pr-1">
                     <div
                        v-for="index in indexesProxy"
                        :key="index._id"
                        class="tile tile-centered c-hand mb-1 p-1"
                        :class="{'selected-element': selectedIndexID === index._id}"
                        @click="selectIndex($event, index._id)"
                     >
                        <div class="tile-icon">
                           <div>
                              <i class="mdi mdi-key mdi-24px column-key" :class="`key-${index.type}`" />
                           </div>
                        </div>
                        <div class="tile-content">
                           <div class="tile-title">
                              {{ index.name }}
                           </div>
                           <small class="tile-subtitle text-gray">{{ index.type }} · {{ index.fields.length }} {{ $tc('word.field', index.fields.length) }}</small>
                        </div>
                        <div class="tile-action">
                           <button
                              class="btn btn-link remove-field p-0 mr-2"
                              :title="$t('word.delete')"
                              @click.prevent="removeIndex(index._id)"
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
                  v-if="selectedIndexObj"
                  :style="{ height: modalInnerHeight + 'px'}"
                  class="form-horizontal"
               >
                  <div class="form-group">
                     <label class="form-label col-3">
                        {{ $t('word.name') }}
                     </label>
                     <div class="column">
                        <input
                           v-model="selectedIndexObj.name"
                           class="form-input"
                           type="text"
                        >
                     </div>
                  </div>
                  <div class="form-group">
                     <label class="form-label col-3">
                        {{ $t('word.type') }}
                     </label>
                     <div class="column">
                        <select v-model="selectedIndexObj.type" class="form-select">
                           <option
                              v-for="index in indexTypes"
                              :key="index"
                              :value="index"
                              :disabled="index === 'PRIMARY' && hasPrimary"
                           >
                              {{ index }}
                           </option>
                        </select>
                     </div>
                  </div>
                  <div class="form-group">
                     <label class="form-label col-3">
                        {{ $tc('word.field', fields.length) }}
                     </label>
                     <div class="fields-list column pt-1">
                        <label
                           v-for="(field, i) in fields"
                           :key="`${field.name}-${i}`"
                           class="form-checkbox m-0"
                           @click.prevent="toggleField(field.name)"
                        >
                           <input type="checkbox" :checked="selectedIndexObj.fields.some(f => f === field.name)">
                           <i class="form-icon" /> {{ field.name }}
                        </label>
                     </div>
                  </div>
               </form>
               <div v-if="!indexesProxy.length" class="empty">
                  <div class="empty-icon">
                     <i class="mdi mdi-key-outline mdi-48px" />
                  </div>
                  <p class="empty-title h5">
                     {{ $t('message.thereAreNoIndexes') }}
                  </p>
                  <div class="empty-action">
                     <button class="btn btn-primary" @click="addIndex">
                        {{ $t('message.createNewIndex') }}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </ConfirmModal>
</template>

<script>
import { uidGen } from 'common/libs/uidGen';
import ConfirmModal from '@/components/BaseConfirmModal';

export default {
   name: 'WorkspacePropsIndexesModal',
   components: {
      ConfirmModal
   },
   props: {
      localIndexes: Array,
      table: String,
      fields: Array,
      workspace: Object,
      indexTypes: Array
   },
   data () {
      return {
         indexesProxy: [],
         isOptionsChanging: false,
         selectedIndexID: '',
         modalInnerHeight: 400
      };
   },
   computed: {
      selectedIndexObj () {
         return this.indexesProxy.find(index => index._id === this.selectedIndexID);
      },
      isChanged () {
         return JSON.stringify(this.localIndexes) !== JSON.stringify(this.indexesProxy);
      },
      hasPrimary () {
         return this.indexesProxy.some(index => index.type === 'PRIMARY');
      }
   },
   mounted () {
      this.indexesProxy = JSON.parse(JSON.stringify(this.localIndexes));

      if (this.indexesProxy.length)
         this.resetSelectedID();

      this.getModalInnerHeight();
      window.addEventListener('resize', this.getModalInnerHeight);
   },
   destroyed () {
      window.removeEventListener('resize', this.getModalInnerHeight);
   },
   methods: {
      confirmIndexesChange () {
         this.$emit('indexes-update', this.indexesProxy);
      },
      selectIndex (event, id) {
         if (this.selectedIndexID !== id && !event.target.classList.contains('remove-field'))
            this.selectedIndexID = id;
      },
      getModalInnerHeight () {
         const modalBody = document.querySelector('.modal-body');
         if (modalBody)
            this.modalInnerHeight = modalBody.clientHeight - (parseFloat(getComputedStyle(modalBody).paddingTop) + parseFloat(getComputedStyle(modalBody).paddingBottom));
      },
      addIndex () {
         this.indexesProxy = [...this.indexesProxy, {
            _id: uidGen(),
            name: 'NEW_INDEX',
            fields: [],
            type: 'INDEX',
            comment: '',
            indexType: 'BTREE',
            indexComment: '',
            cardinality: 0
         }];

         if (this.indexesProxy.length === 1)
            this.resetSelectedID();

         setTimeout(() => {
            this.$refs.indexesPanel.scrollTop = this.$refs.indexesPanel.scrollHeight + 60;
         }, 20);
      },
      removeIndex (id) {
         this.indexesProxy = this.indexesProxy.filter(index => index._id !== id);

         if (this.selectedIndexID === id && this.indexesProxy.length)
            this.resetSelectedID();
      },
      clearChanges () {
         this.indexesProxy = JSON.parse(JSON.stringify(this.localIndexes));
         if (!this.indexesProxy.some(index => index._id === this.selectedIndexID))
            this.resetSelectedID();
      },
      toggleField (field) {
         this.indexesProxy = this.indexesProxy.map(index => {
            if (index._id === this.selectedIndexID) {
               if (index.fields.includes(field))
                  index.fields = index.fields.filter(f => f !== field);
               else
                  index.fields.push(field);
            }
            return index;
         });
      },
      resetSelectedID () {
         this.selectedIndexID = this.indexesProxy.length ? this.indexesProxy[0]._id : '';
      }
   }
};
</script>

<style lang="scss" scoped>
.tile {
  border-radius: 2px;
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
  max-height: 300px;
  overflow: auto;
}

.remove-field .mdi {
  pointer-events: none;
}
</style>
