import { uidGen } from 'common/libs/uidGen';
import * as Store from 'electron-store';
import { defineStore } from 'pinia';

const persistentStore = new Store({ name: 'saved-queries' });

export const SAVED_QUERY_MARKER_PREFIX = 'saved-query:';
export const getSavedQueryMarker = (queryUid: string): string => `${SAVED_QUERY_MARKER_PREFIX}${queryUid}`;
export const isSavedQueryMarker = (elementType?: string): boolean =>
   elementType?.startsWith(SAVED_QUERY_MARKER_PREFIX) ?? false;
export const extractQueryUidFromMarker = (elementType: string): string | null =>
   isSavedQueryMarker(elementType) ? elementType.replace(SAVED_QUERY_MARKER_PREFIX, '') : null;

export interface SavedQuery {
   uid: string;
   name: string;
   sql: string;
   folderId: string | null;
   connectionUid: string;
   schema?: string;
   database?: string;
   createdAt: string;
   updatedAt: string;
}

export interface QueryFolder {
   uid: string;
   name: string;
   connectionUid: string;
   parentId: string | null;
   isExpanded?: boolean;
   createdAt: string;
}

export interface ConnectionQueries {
   queries: SavedQuery[];
   folders: QueryFolder[];
}

export const useSavedQueriesStore = defineStore('savedQueries', {
   state: () => ({
      queriesByConnection: persistentStore.get('queriesByConnection', {}) as Record<string, ConnectionQueries>
   }),
   getters: {
      getQueriesByConnection: (state) => (connectionUid: string): ConnectionQueries => {
         return state.queriesByConnection[connectionUid] || { queries: [], folders: [] };
      },
      getQueryById: (state) => (connectionUid: string, queryUid: string): SavedQuery | undefined => {
         const connectionData = state.queriesByConnection[connectionUid];
         if (!connectionData) return undefined;
         return connectionData.queries.find(q => q.uid === queryUid);
      },
      getFolderById: (state) => (connectionUid: string, folderUid: string): QueryFolder | undefined => {
         const connectionData = state.queriesByConnection[connectionUid];
         if (!connectionData) return undefined;
         return connectionData.folders.find(f => f.uid === folderUid);
      },
      getRootQueries: (state) => (connectionUid: string): SavedQuery[] => {
         const connectionData = state.queriesByConnection[connectionUid];
         if (!connectionData) return [];
         return connectionData.queries.filter(q => q.folderId === null);
      },
      getRootFolders: (state) => (connectionUid: string): QueryFolder[] => {
         const connectionData = state.queriesByConnection[connectionUid];
         if (!connectionData) return [];
         return connectionData.folders.filter(f => f.parentId === null);
      },
      getQueriesInFolder: (state) => (connectionUid: string, folderId: string): SavedQuery[] => {
         const connectionData = state.queriesByConnection[connectionUid];
         if (!connectionData) return [];
         return connectionData.queries.filter(q => q.folderId === folderId);
      },
      getSubfolders: (state) => (connectionUid: string, parentId: string): QueryFolder[] => {
         const connectionData = state.queriesByConnection[connectionUid];
         if (!connectionData) return [];
         return connectionData.folders.filter(f => f.parentId === parentId);
      },
      getQueryCount: (state) => (connectionUid: string): number => {
         const connectionData = state.queriesByConnection[connectionUid];
         if (!connectionData) return 0;
         return connectionData.queries.length;
      }
   },
   actions: {
      _ensureConnectionData (connectionUid: string): void {
         if (!this.queriesByConnection[connectionUid]) this.queriesByConnection[connectionUid] = { queries: [], folders: [] };
      },
      _persist (): void {
         persistentStore.set('queriesByConnection', this.queriesByConnection);
      },
      addQuery (args: { connectionUid: string; name: string; sql: string; folderId?: string; schema?: string; database?: string }): SavedQuery {
         this._ensureConnectionData(args.connectionUid);

         const now = new Date().toISOString();
         const newQuery: SavedQuery = {
            uid: uidGen('SQ'),
            name: args.name,
            sql: args.sql,
            folderId: args.folderId ?? null,
            connectionUid: args.connectionUid,
            schema: args.schema,
            database: args.database,
            createdAt: now,
            updatedAt: now
         };

         this.queriesByConnection[args.connectionUid].queries.push(newQuery);
         this._persist();
         return newQuery;
      },
      updateQuery (args: { connectionUid: string; queryUid: string; name?: string; sql?: string; folderId?: string; schema?: string; database?: string }): void {
         const connectionData = this.queriesByConnection[args.connectionUid];
         if (!connectionData) return;

         const queryIndex = connectionData.queries.findIndex((q: SavedQuery) => q.uid === args.queryUid);
         if (queryIndex === -1) return;

         const existingQuery = connectionData.queries[queryIndex];

         const updatedQuery: SavedQuery = {
            ...existingQuery,
            name: args.name !== undefined ? args.name : existingQuery.name,
            sql: args.sql !== undefined ? args.sql : existingQuery.sql,
            folderId: args.folderId !== undefined ? args.folderId : existingQuery.folderId,
            schema: args.schema !== undefined ? args.schema : existingQuery.schema,
            database: args.database !== undefined ? args.database : existingQuery.database,
            updatedAt: new Date().toISOString()
         };

         connectionData.queries[queryIndex] = updatedQuery;

         this._persist();
      },
      renameQuery (args: { connectionUid: string; queryUid: string; name: string }): void {
         this.updateQuery({ connectionUid: args.connectionUid, queryUid: args.queryUid, name: args.name });
      },
      deleteQuery (args: { connectionUid: string; queryUid: string }): void {
         const connectionData = this.queriesByConnection[args.connectionUid];
         if (!connectionData) return;

         connectionData.queries = connectionData.queries.filter((q: SavedQuery) => q.uid !== args.queryUid);
         this._persist();
      },
      duplicateQuery (args: { connectionUid: string; queryUid: string }): SavedQuery | undefined {
         const query = this.getQueryById(args.connectionUid, args.queryUid);
         if (!query) return undefined;

         return this.addQuery({
            connectionUid: args.connectionUid,
            name: `${query.name} (copy)`,
            sql: query.sql,
            folderId: query.folderId,
            schema: query.schema,
            database: query.database
         });
      },
      moveQueryToFolder (args: { connectionUid: string; queryUid: string; folderId: string | null }): void {
         this.updateQuery({ connectionUid: args.connectionUid, queryUid: args.queryUid, folderId: args.folderId });
      },
      addFolder (args: { connectionUid: string; name: string; parentId?: string }): QueryFolder {
         this._ensureConnectionData(args.connectionUid);

         const newFolder: QueryFolder = {
            uid: uidGen('QF'),
            name: args.name,
            connectionUid: args.connectionUid,
            parentId: args.parentId ?? null,
            isExpanded: false,
            createdAt: new Date().toISOString()
         };

         this.queriesByConnection[args.connectionUid].folders.push(newFolder);
         this._persist();
         return newFolder;
      },
      renameFolder (args: { connectionUid: string; folderUid: string; name: string }): void {
         const connectionData = this.queriesByConnection[args.connectionUid];
         if (!connectionData) return;

         const folder = connectionData.folders.find((f: QueryFolder) => f.uid === args.folderUid);
         if (folder) {
            folder.name = args.name;
            this._persist();
         }
      },
      toggleFolderExpanded (args: { connectionUid: string; folderUid: string }): void {
         const connectionData = this.queriesByConnection[args.connectionUid];
         if (!connectionData) return;

         const folder = connectionData.folders.find((f: QueryFolder) => f.uid === args.folderUid);
         if (folder) {
            folder.isExpanded = !folder.isExpanded;
            this._persist();
         }
      },
      deleteFolder (args: { connectionUid: string; folderUid: string; deleteContents?: boolean }): void {
         const connectionData = this.queriesByConnection[args.connectionUid];
         if (!connectionData) return;

         if (args.deleteContents) {
            connectionData.queries = connectionData.queries.filter((q: SavedQuery) => q.folderId !== args.folderUid);

            const deleteSubfolders = (parentId: string) => {
               const subfolders = connectionData.folders.filter((f: QueryFolder) => f.parentId === parentId);
               for (const subfolder of subfolders) {
                  connectionData.queries = connectionData.queries.filter((q: SavedQuery) => q.folderId !== subfolder.uid);
                  deleteSubfolders(subfolder.uid);
               }
               connectionData.folders = connectionData.folders.filter((f: QueryFolder) => f.parentId !== parentId);
            };
            deleteSubfolders(args.folderUid);
         }
         else {
            const folder = connectionData.folders.find((f: QueryFolder) => f.uid === args.folderUid);
            const parentId = folder?.parentId ?? null;
            connectionData.queries = connectionData.queries.map((q: SavedQuery) => {
               if (q.folderId === args.folderUid) return { ...q, folderId: parentId };
               return q;
            });

            connectionData.folders = connectionData.folders.map((f: QueryFolder) => {
               if (f.parentId === args.folderUid) return { ...f, parentId };
               return f;
            });
         }

         connectionData.folders = connectionData.folders.filter((f: QueryFolder) => f.uid !== args.folderUid);
         this._persist();
      },
      getFolderDepth (connectionUid: string, folderId: string): number {
         let depth = 0;
         let currentId: string | null = folderId;

         while (currentId) {
            const folder = this.getFolderById(connectionUid, currentId);
            if (!folder) break;
            currentId = folder.parentId;
            depth++;
         }

         return depth;
      }
   }
});
