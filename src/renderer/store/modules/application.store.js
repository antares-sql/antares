'use strict';

export default {
   namespaced: false,
   strict: true,
   state: {
      appName: 'Antares - SQL Client',
      isLoading: false
   },
   mutations: {
      setLoadingStatus (state, payload) {
         state.isLoading = payload;
      }
   },
   actions: {
      setLoadingStatus ({ commit }, payload) {
         commit('setLoadingStatus', payload);
      }
   }
};
