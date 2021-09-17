'use strict';
import Store from 'electron-store';
import { uidGen } from 'common/libs/uidGen';
const persistentStore = new Store({ name: 'history' });
const historySize = 1000;

export default {
   namespaced: true,
   strict: true,
   state: {
      history: persistentStore.get('history', {}),
      favorites: persistentStore.get('favorites', {})
   },
   getters: {
      getHistoryByWorkspace: state => uid => state.history[uid]
   },
   mutations: {
      SET_HISTORY (state, args) {
         if (!(args.uid in state.history))
            state.history[args.uid] = [];

         state.history[args.uid] = [
            {
               uid: uidGen('H'),
               sql: args.query,
               date: new Date(),
               schema: args.schema
            },
            ...state.history[args.uid]
         ];

         if (state.history[args.uid].length > historySize)
            state.history[args.uid] = state.history[args.uid].slice(0, historySize);

         persistentStore.set('history', state.history);
      },
      DELETE_QUERY_FROM_HISTORY (state, query) {
         state.history[query.workspace] = state.history[query.workspace].filter(q => q.uid !== query.uid);
         persistentStore.set('history', state.history);
      }
   },
   actions: {
      saveHistory ({ commit, getters }, args) {
         if (getters.getHistoryByWorkspace(args.uid) &&
            getters.getHistoryByWorkspace(args.uid).length &&
            getters.getHistoryByWorkspace(args.uid)[0].sql === args.query
         ) return;
         commit('SET_HISTORY', args);
      },
      deleteQueryFromHistory ({ commit }, query) {
         commit('DELETE_QUERY_FROM_HISTORY', query);
      }
   }
};
