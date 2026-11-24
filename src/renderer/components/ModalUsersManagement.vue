<template>
   <Teleport to="#window-content">
      <div class="modal active users-modal">
         <a class="modal-overlay" @click.stop="requestClose" />
         <div ref="trapRef" class="modal-container p-0">
            <div class="modal-header pl-2">
               <div class="modal-title h6">
                  <div class="d-flex">
                     <BaseIcon
                        icon-name="users"
                        class="mr-1"
                        :size="24"
                     />
                     <span class="cut-text">{{ t('database.manageUsers') }}: {{ connectionName }}</span>
                  </div>
               </div>
               <a class="btn btn-clear c-hand" @click.stop="requestClose" />
            </div>
            <div class="modal-body p-0">
               <BaseLoader v-if="!info && isLoading" />
               <div v-else-if="info" class="users-layout">
                  <div class="users-list-panel">
                     <div class="users-list-toolbar p-2">
                        <button
                           class="btn btn-dark btn-sm mr-1"
                           :disabled="!info.canManage"
                           :title="t('users.newUser')"
                           @click="requestAction(newUser)"
                        >
                           <BaseIcon icon-name="user+plus" :size="18" />
                        </button>
                        <button
                           class="btn btn-dark btn-sm mr-1"
                           :class="{'loading': isLoading}"
                           :title="`${t('general.refresh')} (F5)`"
                           @click="requestAction(refresh)"
                        >
                           <BaseIcon icon-name="refresh" :size="18" />
                        </button>
                        <input
                           v-model="searchTerm"
                           class="form-input input-sm"
                           type="search"
                           :placeholder="t('users.searchForUsers')"
                        >
                     </div>
                     <ul class="menu users-list">
                        <li
                           v-if="isNew"
                           class="menu-item"
                        >
                           <a class="active d-flex">
                              <BaseIcon
                                 icon-name="user+plus"
                                 class="mr-1"
                                 :size="16"
                              />
                              <span class="cut-text text-italic">{{ t('users.newUser') }}</span>
                           </a>
                        </li>
                        <li
                           v-for="user in filteredUsers"
                           :key="userKey(user)"
                           class="menu-item"
                           :title="accountLabel(user)"
                        >
                           <a
                              class="c-hand d-flex"
                              :class="{'active': !isNew && selected && userKey(selected) === userKey(user), 'text-gray': !user.editable}"
                              @click="requestAction(() => selectUser(user))"
                           >
                              <BaseIcon
                                 :icon-name="user.disabled ? 'user+ban' : 'user'"
                                 class="mr-1"
                                 :size="16"
                              />
                              <span class="cut-text">{{ user.name }}<span v-if="user.host !== undefined" class="text-gray">@{{ user.host }}</span></span>
                              <BaseIcon
                                 v-if="isSelf(user)"
                                 icon-name="user+check"
                                 class="ml-1 current-user-icon"
                                 :size="16"
                                 :title="t('users.currentUser')"
                              />
                           </a>
                        </li>
                     </ul>
                  </div>

                  <div class="users-editor-panel">
                     <div v-if="!editing" class="empty">
                        <div class="empty-icon">
                           <BaseIcon icon-name="users" :size="48" />
                        </div>
                        <p class="empty-title h5">
                           {{ t('users.selectUser') }}
                        </p>
                     </div>
                     <template v-else>
                        <div class="workspace-query-runner-footer px-2 py-2">
                           <div class="workspace-query-buttons">
                              <button
                                 class="btn btn-primary btn-sm"
                                 :class="{'loading': isSaving}"
                                 :disabled="!isDirty || isSaving || !canEditPassword"
                                 :title="`${t('general.save')} (CTRL+S)`"
                                 @click="saveUser"
                              >
                                 <BaseIcon
                                    icon-name="save"
                                    class="mr-1"
                                    :size="24"
                                 />
                                 <span>{{ t('general.save') }}</span>
                              </button>
                              <button
                                 class="btn btn-link btn-sm mr-0"
                                 :disabled="!isDirty || isSaving"
                                 :title="t('database.clearChanges')"
                                 @click="clearChanges"
                              >
                                 <BaseIcon
                                    icon-name="eraser"
                                    class="mr-1"
                                    :size="24"
                                 />
                                 <span>{{ t('general.clear') }}</span>
                              </button>
                              <button
                                 v-if="canDelete"
                                 class="btn btn-link btn-sm"
                                 :disabled="isSaving"
                                 :title="t('users.deleteUser')"
                                 @click="isDeleteModal = true"
                              >
                                 <BaseIcon
                                    icon-name="user+minus"
                                    class="mr-1"
                                    :size="24"
                                 />
                                 <span>{{ t('general.delete') }}</span>
                              </button>
                           </div>
                           <div class="workspace-query-info">
                              <div
                                 v-if="notice"
                                 class="d-flex text-warning notice"
                                 :title="notice"
                              >
                                 <BaseIcon
                                    icon-name="lock"
                                    class="mr-1"
                                    :size="18"
                                 />
                                 <span class="cut-text">{{ notice }}</span>
                              </div>
                           </div>
                        </div>

                        <ul class="tab tab-block mx-2">
                           <li
                              v-for="tab in tabs"
                              :key="tab.name"
                              class="tab-item c-hand"
                              :class="{'active': selectedTab === tab.name}"
                              @click="selectedTab = tab.name"
                           >
                              <a class="tab-link">{{ tab.label }}</a>
                           </li>
                        </ul>

                        <BaseLoader v-if="isLoadingDetails" />
                        <div v-else class="users-editor-content p-2">
                           <!-- Account -->
                           <form
                              v-if="selectedTab === 'account'"
                              class="form-horizontal"
                              autocomplete="off"
                              @submit.prevent
                           >
                              <div class="form-group">
                                 <div class="col-4">
                                    <label class="form-label">{{ t('general.name') }}</label>
                                 </div>
                                 <div class="col-8">
                                    <input
                                       ref="nameInput"
                                       v-model="editing.name"
                                       class="form-input"
                                       type="text"
                                       :readonly="!canEditIdentity"
                                    >
                                 </div>
                              </div>
                              <div v-if="info.hasHost" class="form-group">
                                 <div class="col-4">
                                    <label class="form-label">{{ t('connection.hostName') }}</label>
                                 </div>
                                 <div class="col-8">
                                    <input
                                       v-model="editing.host"
                                       class="form-input"
                                       type="text"
                                       placeholder="%"
                                       :readonly="!canEditIdentity"
                                    >
                                 </div>
                              </div>
                              <div v-if="editing.plugin" class="form-group">
                                 <div class="col-4">
                                    <label class="form-label">{{ t('users.plugin') }}</label>
                                 </div>
                                 <div class="col-8">
                                    <input
                                       :value="editing.plugin"
                                       class="form-input"
                                       type="text"
                                       readonly
                                    >
                                 </div>
                              </div>
                              <div class="form-group">
                                 <div class="col-4">
                                    <label class="form-label">{{ isNew ? t('connection.password') : t('users.newPassword') }}</label>
                                 </div>
                                 <div class="col-8">
                                    <input
                                       v-model="password"
                                       class="form-input"
                                       type="password"
                                       autocomplete="new-password"
                                       :placeholder="isNew ? '' : t('users.passwordUnchanged')"
                                       :readonly="!canEditPassword"
                                    >
                                 </div>
                              </div>
                              <div class="form-group">
                                 <div class="col-4">
                                    <label class="form-label">{{ t('users.confirmPassword') }}</label>
                                 </div>
                                 <div class="col-8">
                                    <input
                                       v-model="passwordConfirm"
                                       class="form-input"
                                       :class="{'is-error': passwordConfirm && password !== passwordConfirm}"
                                       type="password"
                                       autocomplete="new-password"
                                       :readonly="!canEditPassword"
                                    >
                                 </div>
                              </div>

                              <template v-for="group in attributeGroups" :key="group.name">
                                 <div v-if="group.name !== 'account'" class="h6 text-uppercase mt-4 mb-2">
                                    {{ t(`users.${group.name}`) }}
                                 </div>
                                 <div
                                    v-for="attribute in group.attributes"
                                    :key="attribute.name"
                                    class="form-group"
                                 >
                                    <div class="col-4">
                                       <label class="form-label">{{ t(`users.${attribute.name}`) }}</label>
                                    </div>
                                    <div class="col-8">
                                       <label v-if="attribute.type === 'boolean'" class="form-switch d-inline-block">
                                          <input
                                             v-model="editing.attributes[attribute.name]"
                                             type="checkbox"
                                             :disabled="!canEditAttribute(attribute)"
                                          >
                                          <i class="form-icon" />
                                       </label>
                                       <template v-else-if="attribute.type === 'number'">
                                          <input
                                             v-model.number="editing.attributes[attribute.name]"
                                             class="form-input"
                                             type="number"
                                             :min="attribute.min"
                                             :readonly="!canEditAttribute(attribute)"
                                          >
                                          <small v-if="attribute.group === 'limits'" class="text-gray">{{ t('users.unlimitedValue', { value: attribute.default }) }}</small>
                                       </template>
                                       <template v-else>
                                          <input
                                             :value="editing.attributes[attribute.name] ?? ''"
                                             class="form-input"
                                             type="text"
                                             :placeholder="attribute.type === 'datetime' ? 'YYYY-MM-DD HH:MM:SS' : ''"
                                             :readonly="!canEditAttribute(attribute)"
                                             @input="setTextAttribute(attribute.name, ($event.target as HTMLInputElement).value)"
                                          >
                                          <small v-if="attribute.type === 'datetime'" class="text-gray">{{ t('users.emptyNeverExpires') }}</small>
                                       </template>
                                    </div>
                                 </div>
                              </template>
                           </form>

                           <!-- Global privileges -->
                           <div v-else-if="selectedTab === 'global'">
                              <UsersPrivilegesGrid
                                 :privileges="info.globalPrivileges"
                                 :model-value="editing.globalPrivileges"
                                 :disabled="!canEditAll"
                                 @update:model-value="editing.globalPrivileges = $event"
                              />
                           </div>

                           <!-- Privileges on databases/schemas -->
                           <div v-else-if="selectedTab === 'objects'">
                              <div class="columns mb-2">
                                 <div v-if="info.scopes.length > 1" class="column col-4">
                                    <label class="form-label">{{ t('users.objectType') }}</label>
                                    <BaseSelect
                                       v-model="selectedScopeName"
                                       class="form-select"
                                       :options="info.scopes.map(scope => ({ value: scope.name, label: t(`users.${scope.name}`) }))"
                                    />
                                 </div>
                                 <div class="column col-8">
                                    <label class="form-label">{{ selectedScope ? t(`users.${selectedScope.name}`) : '' }}</label>
                                    <BaseSelect
                                       v-model="selectedObject"
                                       class="form-select"
                                       :options="scopeObjects"
                                       :max-visible-options="1000"
                                    />
                                 </div>
                              </div>
                              <UsersPrivilegesGrid
                                 v-if="selectedScope && selectedObject"
                                 :privileges="selectedScope.privileges"
                                 :model-value="editing.privileges[selectedScope.name]?.[selectedObject] ?? []"
                                 :disabled="!canEditAll"
                                 @update:model-value="setObjectPrivileges"
                              />
                           </div>

                           <!-- Roles -->
                           <div v-else-if="selectedTab === 'roles'">
                              <UsersPrivilegesGrid
                                 :privileges="grantableRoles"
                                 :model-value="editing.roles"
                                 :disabled="!canEditAll"
                                 searchable
                                 @update:model-value="editing.roles = $event"
                              />
                           </div>
                        </div>
                     </template>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <BaseConfirmModal
         v-if="isDeleteModal"
         :confirm-text="t('general.delete')"
         @confirm="deleteUser"
         @hide="isDeleteModal = false"
      >
         <template #header>
            <div class="d-flex">
               <BaseIcon
                  icon-name="user+minus"
                  class="mr-1"
                  :size="24"
               />
               <span class="cut-text">{{ t('users.deleteUser') }}</span>
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ t('general.deleteConfirm') }} "<b>{{ selected ? accountLabel(selected) : '' }}</b>"?
            </div>
         </template>
      </BaseConfirmModal>

      <BaseConfirmModal
         v-if="pendingAction"
         :confirm-text="t('general.discard')"
         @confirm="confirmPendingAction"
         @hide="pendingAction = null"
      >
         <template #header>
            <div class="d-flex">
               <BaseIcon
                  icon-name="save"
                  class="mr-1"
                  :size="24"
               />
               <span class="cut-text">{{ t('application.unsavedChanges') }}</span>
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ t('users.discardUnsavedChanges') }}
            </div>
         </template>
      </BaseConfirmModal>
   </Teleport>
</template>

<script setup lang="ts">
import {
   ConnectionParams,
   UserAccount,
   UserAttributeDefinition,
   UserAttributeValue,
   UserDetails,
   UserIdentity,
   UserPrivilegeScope,
   UsersManagementInfo
} from 'common/interfaces/antares';
import { ipcRenderer } from 'electron';
import { computed, nextTick, onBeforeUnmount, onMounted, Prop, Ref, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseConfirmModal from '@/components/BaseConfirmModal.vue';
import BaseIcon from '@/components/BaseIcon.vue';
import BaseLoader from '@/components/BaseLoader.vue';
import BaseSelect from '@/components/BaseSelect.vue';
import UsersPrivilegesGrid from '@/components/ModalUsersManagementPrivileges.vue';
import { useFocusTrap } from '@/composables/useFocusTrap';
import Users from '@/ipc-api/Users';
import { useConnectionsStore } from '@/stores/connections';
import { useNotificationsStore } from '@/stores/notifications';
import { useWorkspacesStore } from '@/stores/workspaces';

type EditorTab = 'account' | 'global' | 'objects' | 'roles';

const { t } = useI18n();

const { addNotification } = useNotificationsStore();
const { getConnectionName } = useConnectionsStore();
const { refreshUsers } = useWorkspacesStore();

const { trapRef } = useFocusTrap();

const props = defineProps({
   connection: Object as Prop<ConnectionParams>
});

const emit = defineEmits(['close']);

const info: Ref<UsersManagementInfo> = ref(null);
const users: Ref<UserAccount[]> = ref([]);
const selected: Ref<UserAccount> = ref(null);
const isNew = ref(false);
const original: Ref<UserDetails> = ref(null);
const editing: Ref<UserDetails> = ref(null);
const password = ref('');
const passwordConfirm = ref('');
const searchTerm = ref('');
const selectedTab: Ref<EditorTab> = ref('account');
const selectedScopeName: Ref<UserPrivilegeScope['name']> = ref(null);
const selectedObject: Ref<string> = ref(null);
const isLoading = ref(false);
const isLoadingDetails = ref(false);
const isSaving = ref(false);
const isDeleteModal = ref(false);
const pendingAction: Ref<() => void> = ref(null);
const nameInput: Ref<HTMLInputElement> = ref(null);

const uid = computed(() => props.connection.uid);
const connectionName = computed(() => getConnectionName(uid.value));

const userKey = (user: UserIdentity) => `${user.name}@${user.host ?? ''}#${user.plugin ?? ''}`;
const accountLabel = (user: UserIdentity) => `${user.name}${user.host !== undefined ? `@${user.host}` : ''}${user.plugin ? ` (${user.plugin})` : ''}`;
const isSelf = (user: UserIdentity) => !!info.value &&
   user.name === info.value.currentUser.name &&
   (!info.value.hasHost || user.host === info.value.currentUser.host);

const filteredUsers = computed(() => {
   const term = searchTerm.value.toLowerCase();
   return term ? users.value.filter(user => accountLabel(user).toLowerCase().includes(term)) : users.value;
});

// Permissions
const canEditAll = computed(() => !!info.value?.canManage && (isNew.value || !!selected.value?.editable));
const canEditPassword = computed(() => isNew.value ? !!info.value?.canManage : !!selected.value?.editable);
const canEditIdentity = computed(() => isNew.value || (canEditAll.value && info.value.canRename));
const canDelete = computed(() => !isNew.value && canEditAll.value && !!selected.value && !isSelf(selected.value));
const canEditAttribute = (attribute: UserAttributeDefinition) => canEditAll.value && !attribute.disabled && !attribute.readonly;

const notice = computed(() => {
   if (!info.value || !editing.value || canEditAll.value) return '';
   return canEditPassword.value ? t('users.onlyOwnPassword') : t('users.readOnlyUser');
});

const tabs = computed(() => {
   const list: { name: EditorTab; label: string }[] = [{ name: 'account', label: t('users.account') }];
   if (info.value?.globalPrivileges.length) list.push({ name: 'global', label: t('users.globalPrivileges') });
   if (info.value?.scopes.length) list.push({ name: 'objects', label: t('users.objectPrivileges') });
   if (info.value?.roles) list.push({ name: 'roles', label: t('users.roles') });
   return list;
});

const attributeGroups = computed(() => {
   if (!info.value) return [];
   return (['account', 'limits'] as const)
      .map(name => ({ name, attributes: info.value.attributes.filter(attribute => attribute.group === name) }))
      .filter(group => group.attributes.length);
});

const selectedScope = computed(() => info.value?.scopes.find(scope => scope.name === selectedScopeName.value) ?? null);

const scopeObjects = computed(() => {
   if (!selectedScope.value || !editing.value) return [];
   const granted = editing.value.privileges[selectedScope.value.name] ?? {};
   // Objects with grants but not in the list (e.g. MySQL wildcards like `db\_%`) are shown too
   const objects = [...new Set([...selectedScope.value.objects, ...Object.keys(granted)])].sort();

   return objects.map(object => {
      const count = granted[object]?.length ?? 0;
      return { value: object, label: count ? `${object} (${count})` : object };
   });
});

const grantableRoles = computed(() => (info.value?.roles ?? []).filter(role => role !== editing.value?.name));

/** Comparable form of the account: privilege order and empty objects don't count as changes */
const normalized = (user: UserDetails) => JSON.stringify({
   ...user,
   globalPrivileges: [...user.globalPrivileges].sort(),
   roles: [...user.roles].sort(),
   privileges: Object.fromEntries(Object.entries(user.privileges).map(([scope, objects]) => [
      scope,
      Object.fromEntries(Object.entries(objects).filter(([, privileges]) => privileges.length).map(([object, privileges]) => [object, [...privileges].sort()]).sort())
   ]))
});

const isDirty = computed(() => {
   if (!editing.value) return false;
   if (isNew.value || password.value || passwordConfirm.value) return true;
   return normalized(editing.value) !== normalized(original.value);
});

function clone<T> (value: T): T {
   return JSON.parse(JSON.stringify(value));
}

const loadInfo = async () => {
   const { status, response } = await Users.getUsersManagementInfo(uid.value);
   if (status !== 'success') throw new Error(response);
   info.value = response;
};

const loadUsers = async () => {
   const { status, response } = await Users.getUsersList(uid.value);
   if (status !== 'success') throw new Error(response);
   users.value = response;
};

const resetEditor = () => {
   selected.value = null;
   isNew.value = false;
   original.value = null;
   editing.value = null;
   password.value = '';
   passwordConfirm.value = '';
};

const selectUser = async (user: UserAccount) => {
   resetEditor();
   selected.value = user;
   isLoadingDetails.value = true;
   editing.value = { ...user, attributes: {}, globalPrivileges: [], privileges: {}, roles: [] };

   try {
      const { status, response } = await Users.getUserDetails({ uid: uid.value, user: { name: user.name, host: user.host, plugin: user.plugin } });

      if (status === 'success') {
         original.value = response;
         editing.value = clone(response);
         if (!tabs.value.some(tab => tab.name === selectedTab.value)) selectedTab.value = 'account';
      }
      else {
         addNotification({ status: 'error', message: response });
         resetEditor();
      }
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
      resetEditor();
   }

   isLoadingDetails.value = false;
};

const newUser = async () => {
   resetEditor();
   isNew.value = true;
   selectedTab.value = 'account';

   const attributes = Object.fromEntries(info.value.attributes
      .filter(attribute => !attribute.readonly)
      .map(attribute => [attribute.name, attribute.default ?? null]));

   editing.value = {
      name: '',
      ...(info.value.hasHost ? { host: '%' } : {}),
      attributes,
      globalPrivileges: [],
      privileges: {},
      roles: []
   };

   await nextTick();
   nameInput.value?.focus();
};

const refresh = async () => {
   isLoading.value = true;
   const current = selected.value;

   try {
      await loadInfo();
      await loadUsers();

      const stillThere = current && users.value.find(user => userKey(user) === userKey(current));
      if (stillThere) await selectUser(stillThere);
      else resetEditor();
   }
   catch (err) {
      addNotification({ status: 'error', message: err.message });
   }

   isLoading.value = false;
};

const clearChanges = () => {
   if (isNew.value) {
      resetEditor();
      return;
   }

   editing.value = clone(original.value);
   password.value = '';
   passwordConfirm.value = '';
};

const setTextAttribute = (name: string, value: string) => {
   editing.value.attributes[name] = value.trim() === '' ? null : value;
};

const setObjectPrivileges = (privileges: string[]) => {
   const scope = selectedScope.value.name;
   editing.value.privileges[scope] = { ...(editing.value.privileges[scope] ?? {}), [selectedObject.value]: privileges };
};

/** Account as sent to the main process: no read-only attributes, numbers as numbers */
const toSave = (user: UserDetails): UserDetails => {
   const readonly = info.value.attributes.filter(attribute => attribute.readonly).map(attribute => attribute.name);
   const numbers = info.value.attributes.filter(attribute => attribute.type === 'number').map(attribute => attribute.name);
   const attributes: Record<string, UserAttributeValue> = {};

   for (const [name, value] of Object.entries(user.attributes)) {
      if (readonly.includes(name)) continue;
      attributes[name] = numbers.includes(name) && value !== null && value !== '' ? Number(value) : value;
   }

   return { ...clone(user), name: user.name.trim(), attributes };
};

const saveUser = async () => {
   if (!editing.value.name.trim())
      return addNotification({ status: 'error', message: t('users.nameRequired') });
   if (password.value !== passwordConfirm.value)
      return addNotification({ status: 'error', message: t('users.passwordsDoNotMatch') });
   if (isNew.value && info.value.passwordRequired && !password.value)
      return addNotification({ status: 'error', message: t('users.passwordRequired') });

   isSaving.value = true;
   const user = toSave(editing.value);
   const params = { uid: uid.value, user, password: password.value || undefined };

   try {
      const { status, response } = isNew.value
         ? await Users.createUser(params)
         : await Users.alterUser({ ...params, original: toSave(original.value) });

      if (status === 'success') {
         await loadUsers();
         const saved = users.value.find(account => account.name.toLowerCase() === user.name.toLowerCase() &&
            (account.host ?? '') === (user.host ?? '') &&
            (!user.plugin || account.plugin === user.plugin));

         if (saved) await selectUser(saved);
         else resetEditor();

         refreshUsers(uid.value); // definer lists
      }
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   isSaving.value = false;
};

const deleteUser = async () => {
   isDeleteModal.value = false;
   isSaving.value = true;

   try {
      const { name, host, plugin } = selected.value;
      const { status, response } = await Users.dropUser({ uid: uid.value, user: { name, host, plugin } });

      if (status === 'success') {
         resetEditor();
         await loadUsers();
         refreshUsers(uid.value);
      }
      else
         addNotification({ status: 'error', message: response });
   }
   catch (err) {
      addNotification({ status: 'error', message: err.stack });
   }

   isSaving.value = false;
};

/** Runs an action that replaces the account in the editor, asking first when there are unsaved changes */
const requestAction = (action: () => void) => {
   if (isDirty.value) pendingAction.value = action;
   else action();
};

const confirmPendingAction = () => {
   const action = pendingAction.value;
   pendingAction.value = null;
   action();
};

const closeModal = () => emit('close');
const requestClose = () => requestAction(closeModal);

watch(selectedScope, () => {
   selectedObject.value = null;
});

watch(() => info.value?.scopes, scopes => {
   if (scopes?.length && !scopes.some(scope => scope.name === selectedScopeName.value))
      selectedScopeName.value = scopes[0].name;
});

const onKey = (e: KeyboardEvent) => {
   if (isDeleteModal.value || pendingAction.value) return; // handled by the confirm modals

   if (e.key === 'Escape') {
      e.stopPropagation();
      requestClose();
   }
};

const onRefresh = () => requestAction(refresh);
const onSave = () => {
   if (isDirty.value && !isSaving.value && canEditPassword.value) saveUser();
};

ipcRenderer.on('run-or-reload', onRefresh);
ipcRenderer.on('save-content', onSave);

onMounted(() => {
   window.addEventListener('keydown', onKey);
   refresh();
});

onBeforeUnmount(() => {
   window.removeEventListener('keydown', onKey);
   ipcRenderer.removeListener('run-or-reload', onRefresh);
   ipcRenderer.removeListener('save-content', onSave);
});
</script>

<style lang="scss" scoped>
.users-modal {
  align-items: flex-start;

  .modal-container {
    max-width: 75vw;
    width: 900px;
    margin-top: 10vh;

    .modal-body {
      height: 75vh;
      overflow: hidden;
    }
  }
}

.users-layout {
  display: flex;
  height: 100%;
}

.users-list-panel {
  display: flex;
  flex-direction: column;
  width: 240px;
  min-width: 240px;

  .users-list-toolbar {
    display: flex;
    align-items: center;

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
  }

  .users-list {
    flex: 1;
    overflow: auto;
    margin: 0;
    padding: 0 0.4rem;
    box-shadow: none;
    background: transparent;

    .menu-item > a {
      display: flex;
      align-items: center;
      font-size: 0.7rem;

      &.active {
        background: var(--primary-color-shadow);
        color: inherit;
      }
    }

    .current-user-icon {
      color: var(--primary-color);
    }
  }
}

.users-editor-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;

  .empty {
    height: 100%;
    background: transparent;
  }

  .workspace-query-runner-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .workspace-query-buttons {
    display: flex;

    .btn {
      display: flex;
      align-items: center;
    }
  }

  .workspace-query-info {
    min-width: 0;

    .notice {
      align-items: center;
    }
  }

  .users-editor-content {
    flex: 1;
    overflow: auto;

    .form-horizontal {
      max-width: 520px;
    }
  }
}
</style>
