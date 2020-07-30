<template>
   <div
      id="notifications-board"
      @mouseenter="clearTimeouts"
      @mouseleave="rearmTimeouts"
   >
      <transition-group name="slide-fade">
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
      notifications: {
         deep: true,
         handler: function (notification) {
            if (notification.length) {
               this.timeouts[notification[0].uid] = setTimeout(() => {
                  this.removeNotification(notification[0].uid);
                  delete this.timeouts[notification.uid];
               }, this.notificationsTimeout * 1000);
            }
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
         for (const notification of this.notifications) {
            this.timeouts[notification.uid] = setTimeout(() => {
               this.removeNotification(notification.uid);
               delete this.timeouts[notification.uid];
            }, this.notificationsTimeout * 1000);
         }
      }
   }
};
</script>

<style lang="scss">
   #notifications-board{
      position: absolute;
      z-index: 9;
      right: 1rem;
      bottom: 1rem;
   }
</style>
