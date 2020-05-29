'use strict';
export default {
   namespaced: true,
   strict: true,
   state: {
      app_name: 'Antares - SQL Client',
      is_loading: false
   },
   getters: {
      isLoading: state => state.is_loading,
      appName: state => state.app_name
   },
   mutations: {
      SET_LOADING_STATUS (state, payload) {
         state.is_loading = payload;
      }
   },
   actions: {
      setLoadingStatus ({ commit }, payload) {
         commit('SET_LOADING_STATUS', payload);
      }
   }
};
