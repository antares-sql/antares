<template>
   <ConfirmModal
      :confirm-text="t('general.confirm')"
      size="medium"
      class="options-modal"
      @confirm="confirmChecksChange"
      @hide="$emit('hide')"
   >
      <template #header>
         <div class="d-flex">
            <BaseIcon
               class="mr-1"
               icon-name="mdiTableCheck"
               :size="24"
            />
            <span class="cut-text">{{ t('database.tableChecks') }} "{{ table }}"</span>
         </div>
      </template>
      <template #body>
         <div class="columns col-gapless">
            <div class="column col-5">
               <div class="panel" :style="{ height: modalInnerHeight + 'px'}">
                  <div class="panel-header pt-0 pl-0">
                     <div class="d-flex">
                        <button class="btn btn-dark btn-sm d-flex" @click="addCheck">
                           <BaseIcon
                              class="mr-1"
                              icon-name="mdiCheckboxMarkedCirclePlusOutline"
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
                  <div ref="checksPanel" class="panel-body p-0 pr-1">
                     <div
                        v-for="check in checksProxy"
                        :key="check._antares_id"
                        class="tile tile-centered c-hand mb-1 p-1"
                        :class="{'selected-element': selectedCheckID === check._antares_id}"
                        @click="selectCheck($event, check._antares_id)"
                     >
                        <div class="tile-icon">
                           <div>
                              <BaseIcon
                                 class="mt-2 column-key"
                                 icon-name="mdiCheckboxMarkedCircleOutline"
                                 :size="24"
                              />
                           </div>
                        </div>
                        <div class="tile-content">
                           <div class="tile-title">
                              {{ check.name }}
                           </div>
                           <small class="tile-subtitle text-gray d-inline-block cut-text" style="width: 100%;">{{ check.clause }}</small>
                        </div>
                        <div class="tile-action">
                           <button
                              class="btn btn-link remove-field p-0 mr-2"
                              :title="t('general.delete')"
                              @click.prevent="removeCheck(check._antares_id)"
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
                  v-if="selectedCheckObj"
                  :style="{ height: modalInnerHeight + 'px'}"
                  class="form-horizontal"
               >
                  <div class="form-group">
                     <label class="form-label col-3">
                        {{ t('general.name') }}
                     </label>
                     <div class="column">
                        <input
                           v-model="selectedCheckObj.name"
                           class="form-input"
                           type="text"
                        >
                     </div>
                  </div>
                  <div class="form-group">
                     <label class="form-label col-3">
                        {{ t('database.checkClause') }}
                     </label>
                     <div class="column">
                        <textarea
                           v-model="selectedCheckObj.clause"
                           class="form-input"
                           style="resize: vertical;"
                           rows="5"
                        />
                     </div>
                  </div>
               </form>
               <div v-if="!checksProxy.length" class="empty">
                  <div class="empty-icon">
                     <BaseIcon
                        class="mr-1"
                        icon-name="mdiCheckboxMarkedCircleOutline"
                        :size="48"
                     />
                  </div>
                  <p class="empty-title h5">
                     {{ t('database.thereAreNoTableChecks') }}
                  </p>
                  <div class="empty-action">
                     <button class="btn btn-primary" @click="addCheck">
                        {{ t('database.createNewCheck') }}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </template>
   </ConfirmModal>
</template>

<script setup lang="ts">
import { TableCheck } from 'common/interfaces/antares';
import { uidGen } from 'common/libs/uidGen';
import { computed, onMounted, onUnmounted, Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseIcon from '@/components/BaseIcon.vue';

const { t } = useI18n();

const props = defineProps({
   localChecks: Array,
   table: String,
   workspace: Object
});

const emit = defineEmits(['hide', 'checks-update']);

const checksPanel: Ref<HTMLDivElement> = ref(null);
const checksProxy: Ref<TableCheck[]> = ref([]);
const selectedCheckID = ref('');
const modalInnerHeight = ref(400);

const selectedCheckObj = computed(() => checksProxy.value.find(index => index._antares_id === selectedCheckID.value));
const isChanged = computed(() => JSON.stringify(props.localChecks) !== JSON.stringify(checksProxy.value));

const confirmChecksChange = () => {
   const filteredChecks = checksProxy.value.filter(check => check.clause.trim().length);
   emit('checks-update', filteredChecks);
};

const selectCheck = (event: MouseEvent, id: string) => {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   if (selectedCheckID.value !== id && !(event.target as any).classList.contains('remove-field'))
      selectedCheckID.value = id;
};

const getModalInnerHeight = () => {
   const modalBody = document.querySelector('.modal-body');
   if (modalBody)
      modalInnerHeight.value = modalBody.clientHeight - (parseFloat(getComputedStyle(modalBody).paddingTop) + parseFloat(getComputedStyle(modalBody).paddingBottom));
};

const addCheck = () => {
   const uid = uidGen();
   checksProxy.value = [...checksProxy.value, {
      _antares_id: uid,
      name: `CHK_${uid.substring(0, 4)}`,
      clause: ''
   }];

   if (checksProxy.value.length === 1)
      resetSelectedID();

   setTimeout(() => {
      checksPanel.value.scrollTop = checksPanel.value.scrollHeight + 60;
      selectedCheckID.value = uid;
   }, 20);
};

const removeCheck = (id: string) => {
   checksProxy.value = checksProxy.value.filter(index => index._antares_id !== id);

   if (selectedCheckID.value === id && checksProxy.value.length)
      resetSelectedID();
};

const clearChanges = () => {
   checksProxy.value = JSON.parse(JSON.stringify(props.localChecks));
   if (!checksProxy.value.some(index => index._antares_id === selectedCheckID.value))
      resetSelectedID();
};

const resetSelectedID = () => {
   selectedCheckID.value = checksProxy.value.length ? checksProxy.value[0]._antares_id : '';
};

onMounted(() => {
   checksProxy.value = JSON.parse(JSON.stringify(props.localChecks));

   if (checksProxy.value.length)
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

.remove-field svg {
  pointer-events: none;
}
</style>
