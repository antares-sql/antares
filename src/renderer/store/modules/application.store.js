'use strict';
import i18n from '@/i18n';

export default {
   namespaced: true,
   strict: true,
   state: {
      app_name: 'Antares - SQL Client',
      is_loading: false,
      locale: 'it-IT'
   },
   getters: {
      isLoading: state => state.is_loading,
      appName: state => state.app_name,
      getLocale: state => state.locale
   },
   mutations: {
      SET_LOADING_STATUS (state, payload) {
         state.is_loading = payload;
      },
      SET_LOCALE (state, locale) {
         state.locale = locale;
         i18n.locale = locale;
      }
   },
   actions: {
      setLoadingStatus ({ commit }, payload) {
         commit('SET_LOADING_STATUS', payload);
      },
      changeLocale ({ commit }, locale) {
         commit('SET_LOCALE', locale);
      }
   }
};
