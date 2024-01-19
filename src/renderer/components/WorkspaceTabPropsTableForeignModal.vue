<template>
   <ConfirmModal
      :confirm-text="t('general.confirm')"
      size="medium"
      class="options-modal"
      @confirm="confirmForeignsChange"
      @hide="$emit('hide')"
   >
      <template #header>
         <div class="d-flex">
            <BaseIcon
               class="mr-1"
               icon-name="mdiKeyLink"
               :size="24"
            />
            <span class="cut-text">{{ t('database.foreignKeys') }} "{{ table }}"</span>
         </div>
      </template>
      <template #body>
         <div class="columns col-gapless">
            <div class="column col-5">
               <div class="panel" :style="{ height: modalInnerHeight + 'px'}">
                  <div class="panel-header pt-0 pl-0">
                     <div class="d-flex">
                        <button class="btn btn-dark btn-sm d-flex" @click="addForeign">
                           <BaseIcon
                              class="mr-1"
                              icon-name="mdiLinkPlus"
                              :size="24"
                           />
                           <span>{{ t('general.add') }}</span>
                        </button>
                        <button
                           class="btn btn-dark btn-sm d-flex ml-2 mr-0"
                           :title="t('database.clearChanges')"
                           :disabled="!isChanged"
                           @click.prevent="clearChanges"
                        >
                           <BaseIcon
                              class="mr-1"
                              icon-name="mdiDeleteSweep"
                              :size="24"
                           />
                           <span>{{ t('general.clear') }}</span>
                        </button>
                     </div>
                  </div>
                  <div ref="indexesPanel" class="panel-body p-0 pr-1">
                     <div
                        v-for="foreign in foreignProxy"
                        :key="foreign._antares_id"
                        class="tile tile-centered c-hand mb-1 p-1"
                        :class="{'selected-element': selectedForeignID === foreign._antares_id}"
                        @click="selectForeign($event, foreign._antares_id)"
                     >
                        <div class="tile-icon">
                           <div>
                              <BaseIcon
                                 class="mr-1 mt-1"
                                 icon-name="mdiKeyLink"
                                 :size="24"
                              />
                           </div>
                        </div>
                        <div class="tile-content">
                           <div class="tile-title">
                              {{ foreign.constraintName }}
                           </div>
                           <small class="tile-subtitle text-gray d-flex">
                              <BaseIcon
                                 class="mt-1 mr-1"
                                 icon-name="mdiLinkVariant"
                                 :size="18"
                              />
                              <div class="fk-details-wrapper">
                                 <span v-if="foreign.table !== ''" class="fk-details">
                                    <BaseIcon
                                       class="mr-1"
                                       icon-name="mdiTable"
                                       :size="14"
                                       :style="'min-width:14px'"
                                    />
                                    <span>{{ foreign.table }}.{{ foreign.field }}</span>
                                 </span>
                                 <span v-if="foreign.refTable !== ''" class="fk-details">
                                    <BaseIcon
                                       class="mr-1"
                                       icon-name="mdiTable"
                                       :size="14"
                                       :style="'min-width:14px'"
                                    />
                                    <span>{{ foreign.refTable }}.{{ foreign.refField }}</span>
                                 </span>
                              </div>
                           </small>
                        </div>
                        <div class="tile-action">
                           <button
                              class="btn btn-link remove-field p-0 mr-2"
                              :title="t('general.delete')"
                              @click.prevent="removeIndex(foreign._antares_id)"
                           >
                              <BaseIcon
                                 icon-name="mdiClose"
                                 :size="18"
                                 class="mt-2"
                              />
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
                        {{ t('general.name') }}
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
                        {{ t('database.field', 1) }}
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
                     <label class="form-label col-3">
                        {{ t('database.referenceTable') }}
                     </label>
                     <div class="column">
                        <BaseSelect
                           v-model="selectedForeignObj.refTable"
                           :options="schemaTables"
                           option-label="name"
                           option-track-by="name"
                           class="form-select"
                           @change="reloadRefFields"
                        />
                     </div>
                  </div>
                  <div class="form-group mb-4">
                     <label class="form-label col-3">
                        {{ t('database.referenceField') }}
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
                        {{ t('database.onUpdate') }}
                     </label>
                     <div class="column">
                        <BaseSelect
                           v-model="selectedForeignObj.onUpdate"
                           :options="foreignActions"
                           class="form-select"
                        />
                     </div>
                  </div>
                  <div class="form-group">
                     <label class="form-label col-3">
                        {{ t('database.onDelete') }}
                     </label>
                     <div class="column">
                        <BaseSelect
                           v-model="selectedForeignObj.onDelete"
                           :options="foreignActions"
                           class="form-select"
                        />
                     </div>
                  </div>
               </form>

               <div v-if="!foreignProxy.length" class="empty">
                  <div class="empty-icon">
                     <BaseIcon
                        class="mr-1"
                        icon-name="mdiKeyLink"
                        :size="48"
                     />
                  </div>
                  <p class="empty-title h5">
                     {{ t('database.thereAreNoForeign') }}
                  </p>
                  <div class="empty-action">
                     <button class="btn btn-primary" @click="addForeign">
                        {{ t('database.createNewForeign') }}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </template>
   </ConfirmModal>
</template>

<script setup lang="ts">
import { TableField } from 'common/interfaces/antares';
import { uidGen } from 'common/libs/uidGen';
import { computed, onMounted, onUnmounted, Prop, Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import Tables from '@/ipc-api/Tables';
import { useNotificationsStore } from '@/stores/notifications';

const { t } = useI18n();

const props = defineProps({
   localKeyUsage: Array,
   connection: Object,
   table: String,
   schema: String,
   schemaTables: Array,
   fields: Array as Prop<TableField[]>,
   workspace: Object
});

const emit = defineEmits(['foreigns-update', 'hide']);

const { addNotification } = useNotificationsStore();

const indexesPanel: Ref<HTMLDivElement> = ref(null);
const foreignProxy = ref([]);
const selectedForeignID = ref('');
const modalInnerHeight = ref(400);
const refFields = ref({} as Record<string, TableField[]>);

const foreignActions = computed(() => props.workspace.customizations.foreignActions);
const selectedForeignObj = computed(() => foreignProxy.value.find(foreign => foreign._antares_id === selectedForeignID.value));
const isChanged = computed(() => JSON.stringify(props.localKeyUsage) !== JSON.stringify(foreignProxy.value));

const confirmForeignsChange = () => {
   foreignProxy.value = foreignProxy.value.filter(foreign =>
      foreign.field &&
      foreign.refField &&
      foreign.table &&
      foreign.refTable
   );
   emit('foreigns-update', foreignProxy.value);
};

const selectForeign = (event: MouseEvent, id: string) => {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   if (selectedForeignID.value !== id && !(event.target as any).classList.contains('remove-field')) {
      selectedForeignID.value = id;
      getRefFields();
   }
};

const getModalInnerHeight = () => {
   const modalBody = document.querySelector('.modal-body');
   if (modalBody)
      modalInnerHeight.value = modalBody.clientHeight - (parseFloat(getComputedStyle(modalBody).paddingTop) + parseFloat(getComputedStyle(modalBody).paddingBottom));
};

const addForeign = () => {
   const uid = uidGen();
   foreignProxy.value = [...foreignProxy.value, {
      _antares_id: uid,
      constraintName: `FK_${uid.substring(0, 4)}`,
      refSchema: props.schema,
      table: props.table,
      refTable: '',
      field: '',
      refField: '',
      onUpdate: foreignActions.value[0],
      onDelete: foreignActions.value[0]
   }];

   if (foreignProxy.value.length === 1)
      resetSelectedID();

   setTimeout(() => {
      indexesPanel.value.scrollTop = indexesPanel.value.scrollHeight + 60;
      selectedForeignID.value = uid;
   }, 20);
};

const removeIndex = (id: string) => {
   foreignProxy.value = foreignProxy.value.filter(foreign => foreign._antares_id !== id);

   if (selectedForeignID.value === id && foreignProxy.value.length)
      resetSelectedID();
};

const clearChanges = () => {
   foreignProxy.value = JSON.parse(JSON.stringify(props.localKeyUsage));
   if (!foreignProxy.value.some(foreign => foreign._antares_id === selectedForeignID.value))
      resetSelectedID();
};

const toggleField = (field: string) => {
   foreignProxy.value = foreignProxy.value.map(foreign => {
      if (foreign._antares_id === selectedForeignID.value)
         foreign.field = field;

      return foreign;
   });
};

const toggleRefField = (field: string) => {
   foreignProxy.value = foreignProxy.value.map(foreign => {
      if (foreign._antares_id === selectedForeignID.value)
         foreign.refField = field;

      return foreign;
   });
};

const resetSelectedID = () => {
   selectedForeignID.value = foreignProxy.value.length ? foreignProxy.value[0]._antares_id : '';
};

const getRefFields = async () => {
   if (!selectedForeignObj.value.refTable) return;

   const params = {
      uid: props.connection.uid,
      schema: selectedForeignObj.value.refSchema,
      table: selectedForeignObj.value.refTable
   };

   try { // Field data
      const { status, response } = await Tables.getTableColumns(params);
      if (status === 'success') {
         refFields.value = {
            ...refFields.value,
            [selectedForeignID.value]: response
         };
      }
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }
};

const reloadRefFields = () => {
   selectedForeignObj.value.refField = '';
   getRefFields();
};

onMounted(() => {
   foreignProxy.value = JSON.parse(JSON.stringify(props.localKeyUsage));

   if (foreignProxy.value.length)
      resetSelectedID();

   if (selectedForeignObj.value)
      getRefFields();

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
  max-height: 90px;
  overflow: auto;
}

.remove-field svg {
  pointer-events: none;
}

.fk-details-wrapper {
  max-width: calc(100% - 1rem);

  .fk-details {
    display: flex;
    line-height: 1;
    align-items: baseline;
    align-items: center;

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
