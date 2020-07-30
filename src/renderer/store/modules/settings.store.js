'use strict';
import i18n from '@/i18n';

export default {
   namespaced: true,
   strict: true,
   state: {
      locale: 'en-US',
      explorebar_size: null,
      notifications_timeout: 10
   },
   getters: {
      getLocale: state => state.locale,
      getExplorebarSize: state => state.explorebar_size,
      getNotificationsTimeout: state => state.notifications_timeout
   },
   mutations: {
      SET_LOCALE (state, locale) {
         state.locale = locale;
         i18n.locale = locale;
      },
      SET_NOTIFICATIONS_TIMEOUT (state, timeout) {
         state.notifications_timeout = timeout;
      },
      SET_EXPLOREBAR_SIZE (state, size) {
         state.explorebar_size = size;
      }
   },
   actions: {
      changeLocale ({ commit }, locale) {
         commit('SET_LOCALE', locale);
      },
      updateNotificationsTimeout ({ commit }, timeout) {
         commit('SET_NOTIFICATIONS_TIMEOUT', timeout);
      },
      changeExplorebarSize ({ commit }, size) {
         commit('SET_EXPLOREBAR_SIZE', size);
      }
   }
};
