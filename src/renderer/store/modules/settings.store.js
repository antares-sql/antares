'use strict';
import i18n from '@/i18n';

export default {
   namespaced: true,
   strict: true,
   state: {
      locale: 'en-US',
      explorebar_size: null
   },
   getters: {
      getLocale: state => state.locale,
      getExplorebarSize: state => state.explorebar_size
   },
   mutations: {
      SET_LOCALE (state, locale) {
         state.locale = locale;
         i18n.locale = locale;
      },
      SET_EXPLOREBAR_SIZE (state, size) {
         state.explorebar_size = size;
      }
   },
   actions: {
      changeLocale ({ commit }, locale) {
         commit('SET_LOCALE', locale);
      },
      changeExplorebarSize ({ commit }, size) {
         commit('SET_EXPLOREBAR_SIZE', size);
      }
   }
};
