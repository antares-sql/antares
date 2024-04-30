<template>
   <div
      id="footer"
      :class="[lightColors.includes(footerColor) ? 'text-dark' : 'text-light']"
      :style="`background-color: ${footerColor};`"
   >
      <div class="footer-left-elements">
         <ul class="footer-elements">
            <li class="footer-element">
               <BaseIcon
                  icon-name="mdiServer"
                  class="mr-1"
                  :size="18"
               />
               <small>{{ versionString }}</small>
            </li>
            <li v-if="connectionInfos && connectionInfos.readonly" class="footer-element">
               <BaseIcon
                  icon-name="mdiLock"
                  class="mr-1"
                  :size="18"
               />
               <small>{{ t('connection.readOnlyMode') }}</small>
            </li>
            <li v-if="connectionInfos && connectionInfos.ssl" class="footer-element">
               <BaseIcon
                  icon-name="mdiShieldKey"
                  class="mr-1"
                  :size="18"
               />
               <small>SSL</small>
            </li>
            <li v-if="connectionInfos && connectionInfos.ssh" class="footer-element">
               <BaseIcon
                  icon-name="mdiConsoleNetwork"
                  class="mr-1"
                  :size="18"
               />
               <small>SSH</small>
            </li>
         </ul>
      </div>

      <div class="footer-right-elements">
         <ul class="footer-elements">
            <li
               v-if="workspace?.connectionStatus === 'connected'"
               class="footer-element footer-link"
               @click="toggleConsole()"
            >
               <BaseIcon
                  icon-name="mdiConsoleLine"
                  class="mr-1"
                  :size="18"
               />
               <small>{{ t('application.console') }}</small>
            </li>
            <li class="footer-element footer-link" @click="openOutside('https://www.paypal.com/paypalme/fabiodistasio')">
               <BaseIcon
                  icon-name="mdiCoffee"
                  class="mr-1"
                  :size="18"
               />
               <small>{{ t('general.donate') }}</small>
            </li>
            <li
               class="footer-element footer-link"
               :title="t('application.reportABug')"
               @click="openOutside('https://github.com/antares-sql/antares/issues')"
            >
               <BaseIcon icon-name="mdiBug" :size="18" />
            </li>
            <li
               class="footer-element footer-link"
               :title="t('application.about')"
               @click="showSettingModal('about')"
            >
               <BaseIcon icon-name="mdiInformationOutline" :size="18" />
            </li>
         </ul>
      </div>
   </div>
</template>

<script setup lang="ts">
import { shell } from 'electron';
import { storeToRefs } from 'pinia';
import { computed, ComputedRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import BaseIcon from '@/components/BaseIcon.vue';
import { hexToRGBA } from '@/libs/hexToRgba';
import { useApplicationStore } from '@/stores/application';
import { useConnectionsStore } from '@/stores/connections';
import { useConsoleStore } from '@/stores/console';
import { useWorkspacesStore } from '@/stores/workspaces';

const { t } = useI18n();

interface DatabaseInfos {// TODO: temp
   name: string;
   number: string;
   arch: string;
   os: string;
}

const applicationStore = useApplicationStore();
const workspacesStore = useWorkspacesStore();
const connectionsStore = useConnectionsStore();

const lightColors = ['#FFCE54', '#FDA50F', '#BEBDB8', '#48CFAD'];

const { getSelected: workspaceUid } = storeToRefs(workspacesStore);
const { toggleConsole } = useConsoleStore();

const { showSettingModal } = applicationStore;
const { getWorkspace } = workspacesStore;
const { getConnectionFolder, getConnectionByUid } = connectionsStore;

const workspace = computed(() => getWorkspace(workspaceUid.value));
const footerColor = computed(() => {
   if (getConnectionFolder(workspaceUid.value)?.color)
      return getConnectionFolder(workspaceUid.value).color;
   return '#E36929';
});
const connectionInfos = computed(() => getConnectionByUid(workspaceUid.value));
const version: ComputedRef<DatabaseInfos> = computed(() => {
   return getWorkspace(workspaceUid.value) ? workspace.value.version : null;
});

const versionString = computed(() => {
   if (version.value)
      return `${version.value.name} ${version.value.number} (${version.value.arch} ${version.value.os})`;
   return '';
});

watch(footerColor, () => {
   document.querySelector<HTMLBodyElement>(':root').style.setProperty('--primary-color', footerColor.value);
   document.querySelector<HTMLBodyElement>(':root').style.setProperty('--primary-color-shadow', hexToRGBA(footerColor.value, 0.2));
});

const openOutside = (link: string) => shell.openExternal(link);
</script>

<style lang="scss">
  #footer {
    height: $footer-height;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0.2rem;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;

    .footer-elements {
      list-style: none;
      margin: 0;
      display: flex;
      align-items: center;

      .footer-element {
        height: $footer-height;
        display: flex;
        align-items: center;
        padding: 0 0.4rem;
        margin: 0;

        &.footer-link {
          cursor: pointer;
          transition: background 0.2s;
        }
      }
    }
  }
</style>
