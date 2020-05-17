<template>
   <div id="notifications-board">
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
   computed: {
      ...mapGetters({
         notifications: 'notifications/getNotifications'
      }),
      latestNotifications () {
         return this.notifications.slice(0, 10);
      }
   },
   methods: {
      ...mapActions({
         removeNotification: 'notifications/removeNotification'
      })
   }
};
</script>

<style lang="scss">
   #notifications-board{
      position: absolute;
      z-index: 9;
      right: .8rem;
      bottom: $footer-height+1rem;
   }
</style>
