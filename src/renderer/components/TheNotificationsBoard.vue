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

<script>
import { useNotificationsStore } from '@/stores/notifications';
import { useSettingsStore } from '@/stores/settings';
import BaseNotification from '@/components/BaseNotification';
import { storeToRefs } from 'pinia';

export default {
   name: 'TheNotificationsBoard',
   components: {
      BaseNotification
   },
   setup () {
      const notificationsStore = useNotificationsStore();
      const settingsStore = useSettingsStore();

      const { removeNotification } = notificationsStore;

      const { notifications } = storeToRefs(notificationsStore);
      const { notificationsTimeout } = storeToRefs(settingsStore);

      return {
         removeNotification,
         notifications,
         notificationsTimeout
      };
   },
   data () {
      return {
         timeouts: {}
      };
   },
   computed: {
      latestNotifications () {
         return this.notifications.slice(0, 10);
      }
   },
   watch: {
      'notifications.length': function (val) {
         if (val > 0) {
            const nUid = this.notifications[0].uid;
            this.timeouts[nUid] = setTimeout(() => {
               this.removeNotification(nUid);
               delete this.timeouts[nUid];
            }, this.notificationsTimeout * 1000);
         }
      }
   },
   methods: {
      clearTimeouts () {
         for (const uid in this.timeouts) {
            clearTimeout(this.timeouts[uid]);
            delete this.timeouts[uid];
         }
      },
      rearmTimeouts () {
         const delay = 50;
         let i = this.notifications.length * delay;
         for (const notification of this.notifications) {
            this.timeouts[notification.uid] = setTimeout(() => {
               this.removeNotification(notification.uid);
               delete this.timeouts[notification.uid];
            }, (this.notificationsTimeout * 1000) + i);
            i = i > delay ? i - delay : 0;
         }
      }
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
