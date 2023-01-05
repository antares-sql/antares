<template>
   <div
      id="footer"
      :class="[lightColors.includes(footerColor) ? 'text-dark' : 'text-light']"
      :style="`background-color: ${footerColor};`"
   >
      <div class="footer-left-elements">
         <ul class="footer-elements">
            <li class="footer-element">
               <i class="mdi mdi-18px mdi-database mr-1" />
               <small>{{ versionString }}</small>
            </li>
            <li v-if="connectionInfos.readonly" class="footer-element">
               <i class="mdi mdi-18px mdi-lock mr-1" />
               <small>{{ t('message.readOnlyMode') }}</small>
            </li>
            <li v-if="connectionInfos.ssl" class="footer-element">
               <i class="mdi mdi-18px mdi-shield-key mr-1" />
               <small>SSL</small>
            </li>
            <li v-if="connectionInfos.ssh" class="footer-element">
               <i class="mdi mdi-18px mdi-console-network mr-1" />
               <small>SSH</small>
            </li>
         </ul>
      </div>

      <div class="footer-right-elements">
         <ul class="footer-elements">
            <li
               v-if="workspace?.connectionStatus === 'connected' "
               class="footer-element footer-link"
               @click="toggleConsole()"
            >
               <i class="mdi mdi-18px mdi-console-line mr-1" />
               <small>{{ t('word.console') }}</small>
            </li>
            <li class="footer-element footer-link" @click="openOutside('https://www.paypal.com/paypalme/fabiodistasio')">
               <i class="mdi mdi-18px mdi-coffee mr-1" />
               <small>{{ t('word.donate') }}</small>
            </li>
            <li
               class="footer-element footer-link"
               :title="t('message.reportABug')"
               @click="openOutside('https://github.com/antares-sql/antares/issues')"
            >
               <i class="mdi mdi-18px mdi-bug" />
            </li>
            <li
               class="footer-element footer-link"
               :title="t('word.about')"
               @click="showSettingModal('about')"
            >
               <i class="mdi mdi-18px mdi-information-outline" />
            </li>
         </ul>
      </div>
   </div>
</template>

<script setup lang="ts">
import { shell } from 'electron';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useApplicationStore } from '@/stores/application';
import { useWorkspacesStore } from '@/stores/workspaces';
import { computed, ComputedRef } from 'vue';
import { useConsoleStore } from '@/stores/console';
import { useConnectionsStore } from '@/stores/connections';

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
const footerColor = computed(() => getConnectionFolder(workspaceUid.value)?.color || '#E36929');
const connectionInfos = computed(() => getConnectionByUid(workspaceUid.value));
const version: ComputedRef<DatabaseInfos> = computed(() => {
   return getWorkspace(workspaceUid.value) ? workspace.value.version : null;
});

const versionString = computed(() => {
   if (version.value)
      return `${version.value.name} ${version.value.number} (${version.value.arch} ${version.value.os})`;
   return '';
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
