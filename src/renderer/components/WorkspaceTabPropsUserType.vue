<template>
   <div v-show="isSelected" class="workspace-query-tab column col-12 columns col-gapless">
      <div class="workspace-query-runner column col-12">
         <div class="workspace-query-runner-footer">
            <div class="workspace-query-buttons">
               <button
                  class="btn btn-primary btn-sm"
                  :disabled="!isChanged || isReadonly"
                  :class="{'loading':isSaving}"
                  @click="saveChanges"
               >
                  <BaseIcon
                     class="mr-1"
                     icon-name="save"
                     :size="24"
                  />
                  <span>{{ t('general.save') }}</span>
               </button>
               <button
                  :disabled="!isChanged"
                  class="btn btn-link btn-sm mr-0"
                  :title="t('database.discardChanges')"
                  @click="clearChanges"
               >
                  <BaseIcon
                     class="mr-1"
                     icon-name="restore"
                     :size="24"
                  />
                  <span>{{ t('general.restore') }}</span>
               </button>
            </div>
            <div class="workspace-query-info">
               <div class="d-flex" :title="t('database.schema')">
                  <BaseIcon
                     class="mt-1 mr-1"
                     icon-name="database"
                     :size="18"
                  /><b>{{ schema }}</b>
               </div>
            </div>
         </div>
      </div>
      <div
         v-if="localType"
         ref="editorBody"
         class="column col-12 user-type-body p-relative"
         :style="{ height: `${bodyHeight}px` }"
      >
         <BaseLoader v-if="isLoading" />
         <div class="container">
            <div class="columns">
               <div class="column col-auto">
                  <div class="form-group">
                     <label class="form-label">{{ t('general.name') }}</label>
                     <input
                        ref="firstInput"
                        v-model="localType.name"
                        class="form-input"
                        type="text"
                     >
                  </div>
               </div>
               <div class="column col-auto">
                  <div class="form-group">
                     <label class="form-label">{{ t('database.kind') }}</label>
                     <BaseSelect
                        v-model="localType.kind"
                        :options="kinds"
                        option-label="label"
                        option-track-by="value"
                        :disabled="!isNew"
                        class="form-select"
                     />
                  </div>
               </div>
               <div v-if="['domain', 'range'].includes(localType.kind)" class="column col-auto">
                  <div class="form-group">
                     <label class="form-label">{{ localType.kind === 'domain' ? t('database.baseType') : t('database.subtype') }}</label>
                     <BaseSelect
                        v-if="localType.kind === 'range'"
                        v-model="localType.baseType"
                        :options="subtypeOptions"
                        group-label="group"
                        group-values="types"
                        option-label="name"
                        option-track-by="name"
                        :disabled="!isNew"
                        :title="!isNew ? t('database.typeNotChangeable') : ''"
                        class="form-select subtype-select"
                        :class="{'text-uppercase': !isIdentifierSubtype}"
                     />
                     <input
                        v-else
                        v-model="localType.baseType"
                        class="form-input"
                        type="text"
                        :list="`${tabUid}-types`"
                        :disabled="!isNew"
                        :title="!isNew ? t('database.typeNotChangeable') : ''"
                     >
                  </div>
               </div>
               <div class="column">
                  <div class="form-group">
                     <label class="form-label">{{ t('database.comment') }}</label>
                     <input
                        v-model="localType.comment"
                        class="form-input"
                        type="text"
                     >
                  </div>
               </div>
            </div>

            <!-- ENUM -->
            <template v-if="localType.kind === 'enum'">
               <div class="user-type-section-header">
                  <label class="form-label">{{ t('database.enumValues') }}</label>
                  <button class="btn btn-dark btn-sm ml-2" @click="addValue">
                     <BaseIcon
                        class="mr-1"
                        icon-name="plus"
                        :size="18"
                     />
                     <span>{{ t('database.addValue') }}</span>
                  </button>
                  <small v-if="!isNew" class="text-gray ml-2">{{ t('database.enumValuesInfo') }}</small>
               </div>
               <div
                  v-for="(value, i) in localType.values"
                  :key="i"
                  class="user-type-row"
               >
                  <span class="user-type-index">{{ i + 1 }}</span>
                  <input
                     v-model="value.name"
                     class="form-input input-sm"
                     type="text"
                  >
                  <template v-if="value.oldName === undefined">
                     <button
                        class="btn btn-link btn-sm"
                        :disabled="i === 0"
                        :title="t('general.moveUp')"
                        @click="moveValue(i, -1)"
                     >
                        <BaseIcon icon-name="arrow-up" :size="18" />
                     </button>
                     <button
                        class="btn btn-link btn-sm"
                        :disabled="i === localType.values.length - 1"
                        :title="t('general.moveDown')"
                        @click="moveValue(i, 1)"
                     >
                        <BaseIcon icon-name="arrow-down" :size="18" />
                     </button>
                     <button
                        class="btn btn-link btn-sm"
                        :title="t('general.delete')"
                        @click="localType.values.splice(i, 1)"
                     >
                        <BaseIcon icon-name="trash" :size="18" />
                     </button>
                  </template>
               </div>
            </template>

            <!-- COMPOSITE -->
            <template v-else-if="localType.kind === 'composite'">
               <div class="user-type-section-header">
                  <label class="form-label">{{ t('database.attribute', 2) }}</label>
                  <button class="btn btn-dark btn-sm ml-2" @click="addAttribute">
                     <BaseIcon
                        class="mr-1"
                        icon-name="plus"
                        :size="18"
                     />
                     <span>{{ t('database.addAttribute') }}</span>
                  </button>
                  <small v-if="!isNew" class="text-gray ml-2">{{ t('database.attributesInfo') }}</small>
               </div>
               <div
                  v-for="(attribute, i) in localType.attributes"
                  :key="i"
                  class="user-type-row"
               >
                  <span class="user-type-index">{{ i + 1 }}</span>
                  <input
                     v-model="attribute.name"
                     class="form-input input-sm"
                     type="text"
                     :placeholder="t('general.name')"
                  >
                  <input
                     v-model="attribute.type"
                     class="form-input input-sm"
                     type="text"
                     :list="`${tabUid}-types`"
                     :placeholder="t('database.type')"
                  >
                  <button
                     class="btn btn-link btn-sm"
                     :title="t('general.delete')"
                     @click="localType.attributes.splice(i, 1)"
                  >
                     <BaseIcon icon-name="trash" :size="18" />
                  </button>
               </div>
            </template>

            <!-- DOMAIN -->
            <template v-else-if="localType.kind === 'domain'">
               <div class="columns">
                  <div class="column col-auto">
                     <div class="form-group">
                        <label class="form-label">{{ t('database.default') }}</label>
                        <input
                           v-model="localType.default"
                           class="form-input"
                           type="text"
                           :placeholder="t('database.expression')"
                        >
                     </div>
                  </div>
                  <div class="column col-auto">
                     <div class="form-group">
                        <label class="form-label">&nbsp;</label>
                        <label class="form-checkbox">
                           <input v-model="localType.notNull" type="checkbox"><i class="form-icon" /> NOT NULL
                        </label>
                     </div>
                  </div>
               </div>
               <div class="user-type-section-header">
                  <label class="form-label">{{ t('database.checkConstraints') }}</label>
                  <button class="btn btn-dark btn-sm ml-2" @click="addCheck">
                     <BaseIcon
                        class="mr-1"
                        icon-name="plus"
                        :size="18"
                     />
                     <span>{{ t('database.createNewCheck') }}</span>
                  </button>
               </div>
               <div
                  v-for="(check, i) in localType.checks"
                  :key="i"
                  class="user-type-row"
               >
                  <span class="user-type-index">{{ i + 1 }}</span>
                  <input
                     v-model="check.name"
                     class="form-input input-sm"
                     type="text"
                     :placeholder="t('general.name')"
                  >
                  <input
                     v-model="check.clause"
                     class="form-input input-sm user-type-clause"
                     type="text"
                     :placeholder="`${t('database.checkClause')}: VALUE > 0`"
                  >
                  <button
                     class="btn btn-link btn-sm"
                     :title="t('general.delete')"
                     @click="localType.checks.splice(i, 1)"
                  >
                     <BaseIcon icon-name="trash" :size="18" />
                  </button>
               </div>
            </template>
         </div>
         <datalist :id="`${tabUid}-types`">
            <option
               v-for="type in typeSuggestions"
               :key="type"
               :value="type"
            />
         </datalist>
      </div>
   </div>
</template>

<script setup lang="ts">
import { ConnectionParams, TypesGroup, UserTypeDetails, UserTypeKind } from 'common/interfaces/antares';
import { ipcRenderer } from 'electron';
import { storeToRefs } from 'pinia';
import { computed, nextTick, onBeforeUnmount, onMounted, Prop, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import BaseLoader from '@/components/BaseLoader.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import UserTypes from '@/ipc-api/UserTypes';
import { useConnectionsStore } from '@/stores/connections';
import { useConsoleStore } from '@/stores/console';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore, WorkspaceTab } from '@/stores/workspaces';

const { t } = useI18n();

const props = defineProps({
   tabUid: String,
   tab: Object as Prop<WorkspaceTab>,
   connection: Object as Prop<ConnectionParams>,
   isSelected: Boolean,
   /** Name of the type to edit, null to create a new one */
   userType: String,
   schema: String
});

const { addNotification } = useNotificationsStore();
const workspacesStore = useWorkspacesStore();
const { consoleHeight } = storeToRefs(useConsoleStore());
const { getConnectionByUid } = useConnectionsStore();

const {
   getDataTypes,
   refreshStructure,
   renameTabs,
   changeBreadcrumbs,
   setUnsavedChanges,
   newTab,
   removeTab
} = workspacesStore;

const editorBody: Ref<HTMLDivElement> = ref(null);
const firstInput: Ref<HTMLInputElement> = ref(null);
const isLoading = ref(false);
const isSaving = ref(false);
const bodyHeight = ref(300);
const originalType: Ref<UserTypeDetails> = ref(null);
const localType: Ref<UserTypeDetails> = ref(null);
const lastUserType = ref(null);

const isNew = computed(() => !props.userType);
const isReadonly = computed(() => !!getConnectionByUid(props.connection.uid)?.readonly);
const isChanged = computed(() => JSON.stringify(originalType.value) !== JSON.stringify(localType.value));

const kinds: { value: UserTypeKind; label: string }[] = [
   { value: 'enum', label: 'ENUM' },
   { value: 'composite', label: 'COMPOSITE' },
   { value: 'domain', label: 'DOMAIN' },
   { value: 'range', label: 'RANGE' }
];

/** Types suggested in the type inputs, in lower case as PostgreSQL shows them (quoted and qualified names are kept as they are) */
const typeSuggestions = computed(() => getDataTypes(props.connection.uid, props.schema)
   .flatMap(group => group.types.map(type => /[".]/.test(type.name) ? type.name : type.name.toLowerCase())));

/** Types of the subtype select, grouped like the column types of the table editor */
const subtypeOptions = computed(() => {
   // SERIAL types are only a shorthand of column definitions, not real types
   const groups = getDataTypes(props.connection.uid, props.schema)
      .map(group => ({ ...group, types: group.types.filter(type => !type.name.endsWith('SERIAL')) }));
   const subtype = localType.value?.baseType;
   const isOption = !subtype || groups.some(group => group.types.some(type => type.name === subtype));

   // A subtype missing from the catalog (e.g. a type of a schema not loaded) is kept as first option
   return isOption ? groups : [{ group: '', types: [{ name: subtype }] } as TypesGroup, ...groups];
});

/** Quoted or schema-qualified subtypes are shown as they are, not in upper case */
const isIdentifierSubtype = computed(() => /[".]/.test(localType.value?.baseType || ''));

/** Subtypes are read in lower case (format_type()): catalog types are matched with the upper case options */
const normalizeSubtype = (type: UserTypeDetails) => {
   if (type.kind !== 'range') return type;
   const isCatalogType = getDataTypes(props.connection.uid, props.schema)
      .some(group => group.group !== 'user-defined' && group.types.some(_type => _type.name === type.baseType.toUpperCase()));

   return isCatalogType ? { ...type, baseType: type.baseType.toUpperCase() } : type;
};

const emptyType = (): UserTypeDetails => ({
   schema: props.schema,
   name: '',
   kind: 'enum',
   comment: '',
   values: [],
   attributes: [],
   baseType: '',
   notNull: false,
   default: '',
   checks: []
});

const getTypeData = async () => {
   if (isNew.value) {
      originalType.value = emptyType();
      localType.value = emptyType();
      return;
   }

   isLoading.value = true;
   lastUserType.value = props.userType;

   try {
      const { status, response } = await UserTypes.getUserTypeInformations({
         uid: props.connection.uid,
         schema: props.schema,
         userType: props.userType
      });

      if (status === 'success') {
         originalType.value = normalizeSubtype(response);
         localType.value = JSON.parse(JSON.stringify(originalType.value));
      }
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   isLoading.value = false;
};

/** Focuses the first input of the last row (the one just added) */
const focusLastRow = async () => {
   await nextTick();
   const rows = editorBody.value?.querySelectorAll<HTMLElement>('.user-type-row');
   rows?.[rows.length - 1]?.querySelector('input')?.focus();
};

const addValue = () => {
   localType.value.values.push({ name: '' });
   focusLastRow();
};

const moveValue = (index: number, direction: number) => {
   const values = localType.value.values;
   [values[index], values[index + direction]] = [values[index + direction], values[index]];
};

const addAttribute = () => {
   localType.value.attributes.push({ name: '', type: 'text' });
   focusLastRow();
};

const addCheck = () => {
   localType.value.checks.push({ name: '', clause: '' });
   focusLastRow();
};

const saveChanges = async () => {
   if (isSaving.value || isReadonly.value) return;
   isSaving.value = true;

   try {
      const { status, response } = isNew.value
         ? await UserTypes.createUserType({ uid: props.connection.uid, userType: localType.value })
         : await UserTypes.alterUserType({ uid: props.connection.uid, type: localType.value, original: originalType.value });

      if (status === 'success') {
         await refreshStructure(props.connection.uid);
         const name = localType.value.name;

         if (isNew.value) {
            newTab({
               uid: props.connection.uid,
               schema: props.schema,
               elementName: name,
               elementType: 'userType',
               type: 'user-type-props'
            });
            removeTab({ uid: props.connection.uid, tab: props.tab.uid });
         }
         else if (originalType.value.name !== name) {
            renameTabs({
               uid: props.connection.uid,
               schema: props.schema,
               elementName: originalType.value.name,
               elementNewName: name,
               elementType: 'userType'
            });
         }
         else
            await getTypeData();

         changeBreadcrumbs({ schema: props.schema, userType: name });
      }
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   isSaving.value = false;
};

const clearChanges = () => {
   localType.value = JSON.parse(JSON.stringify(originalType.value));
};

const resizeBody = () => {
   if (editorBody.value) {
      let sizeToSubtract = consoleHeight.value;
      const footer = document.getElementById('footer');
      if (footer) sizeToSubtract += footer.offsetHeight;

      bodyHeight.value = window.innerHeight - editorBody.value.getBoundingClientRect().top - sizeToSubtract;
   }
};

const saveContentListener = () => {
   const hasModalOpen = !!document.querySelectorAll('.modal.active').length;
   if (props.isSelected && !hasModalOpen && isChanged.value)
      saveChanges();
};

// The kind of a new type can change: the fields of the other kinds are reset
watch(() => localType.value?.kind, (kind, oldKind) => {
   if (!isNew.value || !oldKind || kind === oldKind) return;
   localType.value = { ...emptyType(), name: localType.value.name, comment: localType.value.comment, kind, baseType: kind === 'range' ? 'INTEGER' : '' };
});

watch(() => props.userType, async () => {
   if (props.isSelected && props.userType && lastUserType.value !== props.userType)
      await getTypeData();
});

watch(() => props.isSelected, async (val) => {
   if (val) {
      changeBreadcrumbs({ schema: props.schema, userType: props.userType });
      setTimeout(resizeBody, 200);

      if (!isNew.value && lastUserType.value !== props.userType)
         await getTypeData();
   }
});

watch(isChanged, (val) => {
   setUnsavedChanges({ uid: props.connection.uid, tUid: props.tabUid, isChanged: val });
});

watch(consoleHeight, resizeBody);

onMounted(async () => {
   await getTypeData();
   await nextTick();

   if (props.isSelected)
      changeBreadcrumbs({ schema: props.schema, userType: props.userType });

   resizeBody();
   window.addEventListener('resize', resizeBody);
   ipcRenderer.on('save-content', saveContentListener);

   if (isNew.value)
      setTimeout(() => firstInput.value?.focus(), 100);
});

onBeforeUnmount(() => {
   window.removeEventListener('resize', resizeBody);
   ipcRenderer.removeListener('save-content', saveContentListener);
});
</script>

<style lang="scss" scoped>
.subtype-select {
  min-width: 12rem;
}

.user-type-body {
  overflow: auto;
  padding-bottom: 1rem;
}

.user-type-section-header {
  display: flex;
  align-items: center;
  margin: 0.8rem 0 0.4rem;

  .form-label {
    padding: 0;
  }

  .btn {
    display: flex;
    align-items: center;
  }
}

.user-type-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.2rem;
  max-width: 800px;

  .user-type-index {
    min-width: 1.5rem;
    text-align: right;
    opacity: 0.6;
  }

  .form-input {
    max-width: 260px;
  }

  .user-type-clause {
    max-width: none;
  }

  // Icon buttons as tall as the inputs, with the icon centered
  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 1.4rem;
    width: 1.4rem;
    padding: 0;
  }
}
</style>
