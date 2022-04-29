import { defineStore, acceptHMRUpdate } from 'pinia';
import { uidGen } from 'common/libs/uidGen';

export const useNotificationsStore = defineStore('notifications', {
   state: () => ({
      notifications: []
   }),
   actions: {
      addNotification (payload) {
         payload.uid = uidGen('N');
         this.notifications.unshift(payload);
      },
      removeNotification (uid) {
         this.notifications = this.notifications.filter(item => item.uid !== uid);
      }
   }
});

if (import.meta.webpackHot)
   import.meta.webpackHot.accept(acceptHMRUpdate(useNotificationsStore, import.meta.webpackHot));
