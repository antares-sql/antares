'use strict';

export default {
   namespaced: true,
   strict: true,
   state: {
      connections: [],
      isNewConnModal: false
   },
   mutations: {
      showNewConnModal (state) {
         state.isNewConnModal = true;
      },
      hideNewConnModal (state) {
         state.isNewConnModal = false;
      }
   },
   actions: {
      showNewConnModal ({ commit }) {
         commit('showNewConnModal');
      },
      hideNewConnModal ({ commit }) {
         commit('hideNewConnModal');
      }
   }
};
