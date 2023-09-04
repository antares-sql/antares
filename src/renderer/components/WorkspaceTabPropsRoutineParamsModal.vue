<template>
   <ConfirmModal
      :confirm-text="t('general.confirm')"
      size="medium"
      class="options-modal"
      @confirm="confirmParametersChange"
      @hide="$emit('hide')"
   >
      <template #header>
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-dots-horizontal mr-1" />
            <span class="cut-text">{{ t('database.parameters') }} "{{ routine }}"</span>
         </div>
      </template>
      <template #body>
         <div class="columns col-gapless">
            <div class="column col-5">
               <div class="panel" :style="{ height: modalInnerHeight + 'px'}">
                  <div class="panel-header pt-0 pl-0">
                     <div class="d-flex">
                        <button class="btn btn-dark btn-sm d-flex" @click="addParameter">
                           <i class="mdi mdi-24px mdi-plus mr-1" />
                           <span>{{ t('general.add') }}</span>
                        </button>
                        <button
                           class="btn btn-dark btn-sm d-flex ml-2 mr-0"
                           :title="t('database.clearChanges')"
                           :disabled="!isChanged"
                           @click.prevent="clearChanges"
                        >
                           <i class="mdi mdi-24px mdi-delete-sweep mr-1" />
                           <span>{{ t('general.clear') }}</span>
                        </button>
                     </div>
                  </div>
                  <div ref="parametersPanel" class="panel-body p-0 pr-1">
                     <div
                        v-for="param in parametersProxy"
                        :key="param._antares_id"
                        class="tile tile-centered c-hand mb-1 p-1"
                        :class="{'selected-element': selectedParam === param._antares_id}"
                        @click="selectParameter($event, param._antares_id)"
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
                              :title="t('general.delete')"
                              @click.prevent="removeParameter(param._antares_id)"
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
                        {{ t('general.name') }}
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
                        {{ t('database.type') }}
                     </label>
                     <div class="column">
                        <BaseSelect
                           v-model="selectedParamObj.type"
                           class="form-select text-uppercase"
                           :options="workspace.dataTypes"
                           group-label="group"
                           group-values="types"
                           option-label="name"
                           option-track-by="name"
                        />
                     </div>
                  </div>
                  <div v-if="customizations.parametersLength" class="form-group">
                     <label class="form-label col-3">
                        {{ t('database.length') }}
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
                  <div v-if="customizations.procedureContext" class="form-group">
                     <label class="form-label col-3">
                        {{ t('database.context') }}
                     </label>
                     <div class="column">
                        <label
                           v-for="condext in customizations.procedureContextValues"
                           :key="condext"
                           class="form-radio"
                        >
                           <input
                              v-model="selectedParamObj.context"
                              type="radio"
                              name="context"
                              :value="condext"
                           > <i class="form-icon" /> {{ condext }}
                        </label>
                     </div>
                  </div>
               </form>
               <div v-if="!parametersProxy.length" class="empty">
                  <div class="empty-icon">
                     <i class="mdi mdi-dots-horizontal mdi-48px" />
                  </div>
                  <p class="empty-title h5">
                     {{ t('database.thereAreNoParameters') }}
                  </p>
                  <div class="empty-action">
                     <button class="btn btn-primary" @click="addParameter">
                        {{ t('database.createNewParameter') }}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </template>
   </ConfirmModal>
</template>

<script setup lang="ts">
import { uidGen } from 'common/libs/uidGen';
import { computed, onMounted, onUnmounted, Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseSelect from '@/components/BaseSelect.vue';

const { t } = useI18n();

const props = defineProps({
   localParameters: {
      type: Array,
      default: () => []
   },
   routine: String,
   workspace: Object
});

const emit = defineEmits(['hide', 'parameters-update']);

const parametersPanel: Ref<HTMLDivElement> = ref(null);
const parametersProxy = ref([]);
const selectedParam = ref('');
const modalInnerHeight = ref(400);
const i = ref(1);

const selectedParamObj = computed(() => {
   return parametersProxy.value.find(param => param._antares_id === selectedParam.value);
});

const isChanged = computed(() => {
   return JSON.stringify(props.localParameters) !== JSON.stringify(parametersProxy.value);
});

const customizations = computed(() => {
   return props.workspace.customizations;
});

const typeClass = (type: string) => {
   if (type)
      return `type-${type.toLowerCase().replaceAll(' ', '_').replaceAll('"', '')}`;
   return '';
};

const confirmParametersChange = () => {
   emit('parameters-update', parametersProxy.value);
};

const selectParameter = (event: MouseEvent, uid: string) => {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   if (selectedParam.value !== uid && !(event.target as any).classList.contains('remove-field'))
      selectedParam.value = uid;
};

const getModalInnerHeight = () => {
   const modalBody = document.querySelector('.modal-body');
   if (modalBody)
      modalInnerHeight.value = modalBody.clientHeight - (parseFloat(getComputedStyle(modalBody).paddingTop) + parseFloat(getComputedStyle(modalBody).paddingBottom));
};

const addParameter = () => {
   const newUid = uidGen();
   parametersProxy.value = [...parametersProxy.value, {
      _antares_id: newUid,
      name: `param${i.value++}`,
      type: props.workspace.dataTypes[0].types[0].name,
      context: 'IN',
      length: ''
   }];

   if (parametersProxy.value.length === 1)
      resetSelectedID();

   setTimeout(() => {
      parametersPanel.value.scrollTop = parametersPanel.value.scrollHeight + 60;
      selectedParam.value = newUid;
   }, 20);
};

const removeParameter = (uid: string) => {
   parametersProxy.value = parametersProxy.value.filter(param => param._antares_id !== uid);

   if (parametersProxy.value.length && selectedParam.value === uid)
      resetSelectedID();
};

const clearChanges = () => {
   parametersProxy.value = JSON.parse(JSON.stringify(props.localParameters));
   i.value = parametersProxy.value.length + 1;

   if (!parametersProxy.value.some(param => param.name === selectedParam.value))
      resetSelectedID();
};

const resetSelectedID = () => {
   selectedParam.value = parametersProxy.value.length ? parametersProxy.value[0]._antares_id : '';
};

onMounted(() => {
   parametersProxy.value = JSON.parse(JSON.stringify(props.localParameters));
   i.value = parametersProxy.value.length + 1;

   if (parametersProxy.value.length)
      resetSelectedID();

   getModalInnerHeight();
   window.addEventListener('resize', getModalInnerHeight);
});

onUnmounted(() => {
   window.removeEventListener('resize', getModalInnerHeight);
});
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
  max-height: 300px;
  overflow: auto;
}

.remove-field .mdi {
  pointer-events: none;
}
</style>
