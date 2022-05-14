<template>
   <div
      id="notifications-board"
      @mouseenter="clearTimeouts"
      @mouseleave="rearmTimeouts"
   >
      <TransitionGroup tag="div" name="slide-fade">
         <BaseNotification
            v-for="notification in latestNotifications"
            :key="notification.uid"
            :message="notification.message"
            :status="notification.status"
            @close="removeNotification(notification.uid)"
         />
      </TransitionGroup>
   </div>
</template>

<script setup lang="ts">
import { computed, Ref, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useNotificationsStore } from '@/stores/notifications';
import { useSettingsStore } from '@/stores/settings';
import BaseNotification from '@/components/BaseNotification.vue';

const notificationsStore = useNotificationsStore();
const settingsStore = useSettingsStore();

const { removeNotification } = notificationsStore;

const { notifications } = storeToRefs(notificationsStore);
const { notificationsTimeout } = storeToRefs(settingsStore) as {notificationsTimeout: Ref<number>};// TODO: temp

const timeouts: Ref<{[key: string]: NodeJS.Timeout}> = ref({});

const latestNotifications = computed(() => notifications.value.slice(0, 10));

watch(() => notifications.value.length, (val) => {
   if (val > 0) {
      const nUid: string = notifications.value[0].uid;
      timeouts.value[nUid] = setTimeout(() => {
         removeNotification(nUid);
         delete timeouts.value[nUid];
      }, notificationsTimeout.value * 1000);
   }
});

const clearTimeouts = () => {
   for (const uid in timeouts.value) {
      clearTimeout(timeouts.value[uid]);
      delete timeouts.value[uid];
   }
};

const rearmTimeouts = () => {
   const delay = 50;
   let i = notifications.value.length * delay;
   for (const notification of notifications.value) {
      timeouts.value[notification.uid] = setTimeout(() => {
         removeNotification(notification.uid);
         delete timeouts.value[notification.uid];
      }, (notificationsTimeout.value * 1000) + i);
      i = i > delay ? i - delay : 0;
   }
};
</script>

<style lang="scss">
  #notifications-board {
    position: absolute;
    z-index: 999;
    right: 1rem;
    bottom: 1rem;
  }
</style>
