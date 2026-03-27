// Håndtering af persistens af arbejdsmappe-valg i IndexedDB.
// Bruges som et lille infra-lag af useWorkspace/App.

const WORKSPACE_DB_NAME = "workboard";
const WORKSPACE_STORE_NAME = "workspace";

function openWorkspaceDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(WORKSPACE_DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(WORKSPACE_STORE_NAME)) {
        db.createObjectStore(WORKSPACE_STORE_NAME);
      }
    };
  });
}

export async function persistWorkspaceHandle(handle: FileSystemDirectoryHandle | null) {
  try {
    const db = await openWorkspaceDb();
    const tx = db.transaction(WORKSPACE_STORE_NAME, "readwrite");
    const store = tx.objectStore(WORKSPACE_STORE_NAME);
    if (handle) {
      store.put(handle, "current");
    } else {
      store.delete("current");
    }
  } catch {
    // Ignorerer fejl – persistence er kun en bekvemmelighed.
  }
}

export async function restoreWorkspaceHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openWorkspaceDb();
    const tx = db.transaction(WORKSPACE_STORE_NAME, "readonly");
    const store = tx.objectStore(WORKSPACE_STORE_NAME);
    const request = store.get("current");
    return await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve((request.result as FileSystemDirectoryHandle | undefined) ?? null);
      };
    });
  } catch {
    return null;
  }
}

