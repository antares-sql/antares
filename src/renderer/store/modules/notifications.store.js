'use strict';
import { uidGen } from 'common/libs/uidGen';

export default {
   namespaced: true,
   strict: true,
   state: {
      notifications: []
   },
   getters: {
      getNotifications: state => state.notifications
   },
   mutations: {
      ADD_NOTIFICATION (state, payload) {
         state.notifications.unshift(payload);
      },
      REMOVE_NOTIFICATION (state, uid) {
         state.notifications = state.notifications.filter(item => item.uid !== uid);
      }
   },
   actions: {
      addNotification ({ commit }, payload) {
         payload.uid = uidGen('N');
         commit('ADD_NOTIFICATION', payload);
      },
      removeNotification ({ commit }, uid) {
         commit('REMOVE_NOTIFICATION', uid);
      }
   }
};
