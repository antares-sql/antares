<template>
   <ConfirmModal
      :confirm-text="t('word.confirm')"
      size="medium"
      class="options-modal"
      @confirm="confirmIndexesChange"
      @hide="$emit('hide')"
   >
      <template #header>
         <div class="d-flex">
            <i class="mdi mdi-24px mdi-key mdi-rotate-45 mr-1" />
            <span class="cut-text">{{ t('word.indexes') }} "{{ table }}"</span>
         </div>
      </template>
      <template #body>
         <div class="columns col-gapless">
            <div class="column col-5">
               <div class="panel" :style="{ height: modalInnerHeight + 'px'}">
                  <div class="panel-header pt-0 pl-0">
                     <div class="d-flex">
                        <button class="btn btn-dark btn-sm d-flex" @click="addIndex">
                           <i class="mdi mdi-24px mdi-key-plus mr-1" />
                           <span>{{ t('word.add') }}</span>
                        </button>
                        <button
                           class="btn btn-dark btn-sm d-flex ml-2 mr-0"
                           :title="t('message.clearChanges')"
                           :disabled="!isChanged"
                           @click.prevent="clearChanges"
                        >
                           <i class="mdi mdi-24px mdi-delete-sweep mr-1" />
                           <span>{{ t('word.clear') }}</span>
                        </button>
                     </div>
                  </div>
                  <div ref="indexesPanel" class="panel-body p-0 pr-1">
                     <div
                        v-for="index in indexesProxy"
                        :key="index._antares_id"
                        class="tile tile-centered c-hand mb-1 p-1"
                        :class="{'selected-element': selectedIndexID === index._antares_id}"
                        @click="selectIndex($event, index._antares_id)"
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
                           <small class="tile-subtitle text-gray">{{ index.type }} · {{ index.fields.length }} {{ t('word.field', index.fields.length) }}</small>
                        </div>
                        <div class="tile-action">
                           <button
                              class="btn btn-link remove-field p-0 mr-2"
                              :title="t('word.delete')"
                              @click.prevent="removeIndex(index._antares_id)"
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
                        {{ t('word.name') }}
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
                        {{ t('word.type') }}
                     </label>
                     <div class="column">
                        <BaseSelect
                           v-model="selectedIndexObj.type"
                           :options="indexTypes"
                           :option-disabled="(opt: any) => opt === 'PRIMARY' && hasPrimary"
                           class="form-select"
                        />
                     </div>
                  </div>
                  <div class="form-group">
                     <label class="form-label col-3">
                        {{ t('word.field', fields.length) }}
                     </label>
                     <div class="fields-list column pt-1">
                        <label
                           v-for="(field, i) in fields"
                           :key="`${field.name}-${i}`"
                           class="form-checkbox m-0"
                           @click.prevent="toggleField(field.name)"
                        >
                           <input type="checkbox" :checked="selectedIndexObj.fields.some((f: string) => f === field.name)">
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
                     {{ t('message.thereAreNoIndexes') }}
                  </p>
                  <div class="empty-action">
                     <button class="btn btn-primary" @click="addIndex">
                        {{ t('message.createNewIndex') }}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </template>
   </ConfirmModal>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, Prop, Ref, ref } from 'vue';
import { TableField } from 'common/interfaces/antares';
import { uidGen } from 'common/libs/uidGen';
import { useI18n } from 'vue-i18n';
import ConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseSelect from '@/components/BaseSelect.vue';

const { t } = useI18n();

const props = defineProps({
   localIndexes: Array,
   table: String,
   fields: Array as Prop<TableField[]>,
   workspace: Object,
   indexTypes: Array
});

const emit = defineEmits(['hide', 'indexes-update']);

const indexesPanel: Ref<HTMLDivElement> = ref(null);
const indexesProxy = ref([]);
const selectedIndexID = ref('');
const modalInnerHeight = ref(400);

const selectedIndexObj = computed(() => indexesProxy.value.find(index => index._antares_id === selectedIndexID.value));
const isChanged = computed(() => JSON.stringify(props.localIndexes) !== JSON.stringify(indexesProxy.value));
const hasPrimary = computed(() => indexesProxy.value.some(index => ['PRIMARY', 'PRIMARY KEY'].includes(index.type)));

const confirmIndexesChange = () => {
   indexesProxy.value = indexesProxy.value.filter(index => index.fields.length);
   emit('indexes-update', indexesProxy.value);
};

const selectIndex = (event: MouseEvent, id: string) => {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   if (selectedIndexID.value !== id && !(event.target as any).classList.contains('remove-field'))
      selectedIndexID.value = id;
};

const getModalInnerHeight = () => {
   const modalBody = document.querySelector('.modal-body');
   if (modalBody)
      modalInnerHeight.value = modalBody.clientHeight - (parseFloat(getComputedStyle(modalBody).paddingTop) + parseFloat(getComputedStyle(modalBody).paddingBottom));
};

const addIndex = () => {
   const uid = uidGen();
   indexesProxy.value = [...indexesProxy.value, {
      _antares_id: uid,
      name: `INDEX_${uid.substring(0, 4)}`,
      fields: [],
      type: props.workspace.customizations.primaryAsIndex ? props.indexTypes[0] : props.indexTypes[1]
   }];

   if (indexesProxy.value.length === 1)
      resetSelectedID();

   setTimeout(() => {
      indexesPanel.value.scrollTop = indexesPanel.value.scrollHeight + 60;
      selectedIndexID.value = uid;
   }, 20);
};

const removeIndex = (id: string) => {
   indexesProxy.value = indexesProxy.value.filter(index => index._antares_id !== id);

   if (selectedIndexID.value === id && indexesProxy.value.length)
      resetSelectedID();
};

const clearChanges = () => {
   indexesProxy.value = JSON.parse(JSON.stringify(props.localIndexes));
   if (!indexesProxy.value.some(index => index._antares_id === selectedIndexID.value))
      resetSelectedID();
};

const toggleField = (field: string) => {
   indexesProxy.value = indexesProxy.value.map(index => {
      if (index._antares_id === selectedIndexID.value) {
         if (index.fields.includes(field))
            index.fields = index.fields.filter((f: string) => f !== field);
         else
            index.fields.push(field);
      }
      return index;
   });
};

const resetSelectedID = () => {
   selectedIndexID.value = indexesProxy.value.length ? indexesProxy.value[0]._antares_id : '';
};

onMounted(() => {
   indexesProxy.value = JSON.parse(JSON.stringify(props.localIndexes));

   if (indexesProxy.value.length)
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
