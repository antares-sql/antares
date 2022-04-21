<template>
   <div
      id="notifications-board"
      @mouseenter="clearTimeouts"
      @mouseleave="rearmTimeouts"
   >
      <transition-group tag="div" name="slide-fade">
         <BaseNotification
            v-for="notification in latestNotifications"
            :key="notification.uid"
            :message="notification.message"
            :status="notification.status"
            @close="removeNotification(notification.uid)"
         />
      </transition-group>
   </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import BaseNotification from '@/components/BaseNotification';

export default {
   name: 'TheNotificationsBoard',
   components: {
      BaseNotification
   },
   data () {
      return {
         timeouts: {}
      };
   },
   computed: {
      ...mapGetters({
         notifications: 'notifications/getNotifications',
         notificationsTimeout: 'settings/getNotificationsTimeout'
      }),
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
      ...mapActions({
         removeNotification: 'notifications/removeNotification'
      }),
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
