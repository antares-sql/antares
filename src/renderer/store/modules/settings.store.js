'use strict';
import i18n from '@/i18n';

export default {
   namespaced: true,
   strict: true,
   state: {
      locale: 'it-IT'
   },
   getters: {
      getLocale: state => state.locale
   },
   mutations: {
      SET_LOCALE (state, locale) {
         state.locale = locale;
         i18n.locale = locale;
      }
   },
   actions: {
      changeLocale ({ commit }, locale) {
         commit('SET_LOCALE', locale);
      }
   }
};
