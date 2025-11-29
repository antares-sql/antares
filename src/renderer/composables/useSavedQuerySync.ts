import {
   getSavedQueryMarker,
   useSavedQueriesStore
} from '@/stores/savedQueries';
import { useWorkspacesStore } from '@/stores/workspaces';

export function useSavedQuerySync () {
   const savedQueriesStore = useSavedQueriesStore();
   const workspacesStore = useWorkspacesStore();

   const renameQueryAndSyncTab = (connectionUid: string, queryUid: string, newName: string): void => {
      savedQueriesStore.renameQuery({ connectionUid, queryUid, name: newName });

      const workspace = workspacesStore.getWorkspace(connectionUid);
      if (!workspace) return;

      const savedQueryMarker = getSavedQueryMarker(queryUid);
      const openTab = workspace.tabs.find(
         tab => tab.type === 'query' && tab.elementType === savedQueryMarker
      );

      if (openTab) {
         workspacesStore.updateTabContent({
            uid: connectionUid,
            tab: openTab.uid,
            type: openTab.type,
            schema: openTab.schema,
            content: openTab.content,
            elementName: newName,
            elementType: openTab.elementType,
            filePath: openTab.filePath
         });
      }
   };

   const closeTabForQuery = (connectionUid: string, queryUid: string): void => {
      const workspace = workspacesStore.getWorkspace(connectionUid);
      if (!workspace) return;

      const savedQueryMarker = getSavedQueryMarker(queryUid);
      const openTab = workspace.tabs.find(
         tab => tab.type === 'query' && tab.elementType === savedQueryMarker
      );

      if (openTab) workspacesStore.removeTab({ uid: connectionUid, tab: openTab.uid });
   };

   return {
      renameQueryAndSyncTab,
      closeTabForQuery
   };
}
