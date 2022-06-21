import { defineStore } from 'pinia';
import { uidGen } from 'common/libs/uidGen';

export interface Notification {
   uid: string;
   status: string;
   message: string;
}

export const useNotificationsStore = defineStore('notifications', {
   state: () => ({
      notifications: [] as Notification[]
   }),
   actions: {
      addNotification (payload: { status: string; message: string }) {
         const notification: Notification = { uid: uidGen('N'), ...payload };
         this.notifications.unshift(notification);
      },
      removeNotification (uid: string) {
         this.notifications = (this.notifications as Notification[]).filter(item => item.uid !== uid);
      }
   }
});
