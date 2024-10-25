import { uidGen } from 'common/libs/uidGen';
import { defineStore } from 'pinia';

import { useConsoleStore } from './console';

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

         useConsoleStore().putLog('debug', {
            level: notification.status,
            process: 'renderer',
            message: notification.message,
            date: new Date()
         });
      },
      removeNotification (uid: string) {
         this.notifications = (this.notifications as Notification[]).filter(item => item.uid !== uid);
      }
   }
});
