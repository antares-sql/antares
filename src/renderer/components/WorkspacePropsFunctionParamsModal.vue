<template>
   <ConfirmModal
      :confirm-text="$t('word.confirm')"
      size="medium"
      class="options-modal"
      @confirm="confirmParametersChange"
      @hide="$emit('hide')"
   >
      <template :slot="'header'">
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-dots-horizontal mr-1" />
            <span class="cut-text">{{ $t('word.parameters') }} "{{ func }}"</span>
         </div>
      </template>
      <div :slot="'body'">
         <div class="columns col-gapless">
            <div class="column col-5">
               <div class="panel" :style="{ height: modalInnerHeight + 'px'}">
                  <div class="panel-header pt-0 pl-0">
                     <div class="d-flex">
                        <button class="btn btn-dark btn-sm d-flex" @click="addParameter">
                           <span>{{ $t('word.add') }}</span>
                           <i class="mdi mdi-24px mdi-plus ml-1" />
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
                  <div ref="parametersPanel" class="panel-body p-0 pr-1">
                     <div
                        v-for="param in parametersProxy"
                        :key="param._id"
                        class="tile tile-centered c-hand mb-1 p-1"
                        :class="{'selected-element': selectedParam === param._id}"
                        @click="selectParameter($event, param._id)"
                     >
                        <div class="tile-icon">
                           <div>
                              <i class="mdi mdi-hexagon mdi-24px" :class="typeClass(param.type)" />
                           </div>
                        </div>
                        <div class="tile-content">
                           <div class="tile-title">
                              {{ param.name }}
                           </div>
                           <small class="tile-subtitle text-gray">{{ param.type }}{{ param.length ? `(${param.length})` : '' }} · {{ param.context }}</small>
                        </div>
                        <div class="tile-action">
                           <button
                              class="btn btn-link remove-field p-0 mr-2"
                              :title="$t('word.delete')"
                              @click.prevent="removeParameter(param._id)"
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
                  v-if="selectedParamObj"
                  :style="{ height: modalInnerHeight + 'px'}"
                  class="form-horizontal"
               >
                  <div class="form-group">
                     <label class="form-label col-3">
                        {{ $t('word.name') }}
                     </label>
                     <div class="column">
                        <input
                           v-model="selectedParamObj.name"
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
                        <select v-model="selectedParamObj.type" class="form-select text-uppercase">
                           <optgroup
                              v-for="group in workspace.dataTypes"
                              :key="group.group"
                              :label="group.group"
                           >
                              <option
                                 v-for="type in group.types"
                                 :key="type.name"
                                 :selected="selectedParamObj.type.toUpperCase() === type.name"
                                 :value="type.name"
                              >
                                 {{ type.name }}
                              </option>
                           </optgroup>
                        </select>
                     </div>
                  </div>
                  <div v-if="customizations.parametersLength" class="form-group">
                     <label class="form-label col-3">
                        {{ $t('word.length') }}
                     </label>
                     <div class="column">
                        <input
                           v-model="selectedParamObj.length"
                           class="form-input"
                           type="number"
                           min="0"
                        >
                     </div>
                  </div>
                  <div v-if="customizations.functionContext" class="form-group">
                     <label class="form-label col-3">
                        {{ $t('word.context') }}
                     </label>
                     <div class="column">
                        <label class="form-radio">
                           <input
                              v-model="selectedParamObj.context"
                              type="radio"
                              name="context"
                              value="IN"
                           > <i class="form-icon" /> IN
                        </label>
                        <label class="form-radio">
                           <input
                              v-model="selectedParamObj.context"
                              type="radio"
                              value="OUT"
                              name="context"
                           > <i class="form-icon" /> OUT
                        </label>
                        <label class="form-radio">
                           <input
                              v-model="selectedParamObj.context"
                              type="radio"
                              value="INOUT"
                              name="context"
                           > <i class="form-icon" /> INOUT
                        </label>
                     </div>
                  </div>
               </form>
               <div v-if="!parametersProxy.length" class="empty">
                  <div class="empty-icon">
                     <i class="mdi mdi-dots-horizontal mdi-48px" />
                  </div>
                  <p class="empty-title h5">
                     {{ $t('message.thereAreNoParameters') }}
                  </p>
                  <div class="empty-action">
                     <button class="btn btn-primary" @click="addParameter">
                        {{ $t('message.createNewParameter') }}
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
   name: 'WorkspacePropsRoutineParamsModal',
   components: {
      ConfirmModal
   },
   props: {
      localParameters: Array,
      func: String,
      workspace: Object
   },
   data () {
      return {
         parametersProxy: [],
         isOptionsChanging: false,
         selectedParam: '',
         modalInnerHeight: 400,
         i: 1
      };
   },
   computed: {
      selectedParamObj () {
         return this.parametersProxy.find(param => param._id === this.selectedParam);
      },
      isChanged () {
         return JSON.stringify(this.localParameters) !== JSON.stringify(this.parametersProxy);
      },
      customizations () {
         return this.workspace.customizations;
      }
   },
   mounted () {
      this.parametersProxy = JSON.parse(JSON.stringify(this.localParameters));
      this.i = this.parametersProxy.length + 1;

      if (this.parametersProxy.length)
         this.resetSelectedID();

      this.getModalInnerHeight();
      window.addEventListener('resize', this.getModalInnerHeight);
   },
   destroyed () {
      window.removeEventListener('resize', this.getModalInnerHeight);
   },
   methods: {
      typeClass (type) {
         if (type)
            return `type-${type.toLowerCase().replaceAll(' ', '_').replaceAll('"', '')}`;
         return '';
      },
      confirmParametersChange () {
         this.$emit('parameters-update', this.parametersProxy);
      },
      selectParameter (event, uid) {
         if (this.selectedParam !== uid && !event.target.classList.contains('remove-field'))
            this.selectedParam = uid;
      },
      getModalInnerHeight () {
         const modalBody = document.querySelector('.modal-body');
         if (modalBody)
            this.modalInnerHeight = modalBody.clientHeight - (parseFloat(getComputedStyle(modalBody).paddingTop) + parseFloat(getComputedStyle(modalBody).paddingBottom));
      },
      addParameter () {
         this.parametersProxy = [...this.parametersProxy, {
            _id: uidGen(),
            name: `Param${this.i++}`,
            type: 'INT',
            context: 'IN',
            length: 10
         }];

         if (this.parametersProxy.length === 1)
            this.resetSelectedID();

         setTimeout(() => {
            this.$refs.parametersPanel.scrollTop = this.$refs.parametersPanel.scrollHeight + 60;
         }, 20);
      },
      removeParameter (uid) {
         this.parametersProxy = this.parametersProxy.filter(param => param._id !== uid);

         if (this.selectedParam === name && this.parametersProxy.length)
            this.resetSelectedID();
      },
      clearChanges () {
         this.parametersProxy = JSON.parse(JSON.stringify(this.localParameters));
         this.i = this.parametersProxy.length + 1;

         if (!this.parametersProxy.some(param => param.name === this.selectedParam))
            this.resetSelectedID();
      },
      resetSelectedID () {
         this.selectedParam = this.parametersProxy.length ? this.parametersProxy[0]._id : '';
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
