// IndexedDB-backed store for a guest's listing photos. The wizard holds guest
// photos as in-memory Files with blob: preview URLs, which die on any reload —
// including the signup email-confirmation round trip. Persisting the Files here
// lets the wizard rebuild them (with fresh preview URLs) afterwards.
//
// Every function is a safe no-op on SSR or when IndexedDB is unavailable.

const DB_NAME = "buyauto-guest-images";
const DB_VERSION = 1;
const STORE = "files";

interface StoredGuestImage {
  previewUrl: string;
  file: File;
  addedAt: number;
}

export interface GuestImagePair {
  url: string;
  file: File;
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      resolve(null);
      return;
    }
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "previewUrl" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T | undefined> {
  const db = await openDb();
  if (!db) return undefined;
  return new Promise<T | undefined>((resolve) => {
    try {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      let result: T | undefined;
      if (req) req.onsuccess = () => { result = req.result; };
      tx.oncomplete = () => { db.close(); resolve(result); };
      tx.onerror = () => { db.close(); resolve(undefined); };
      tx.onabort = () => { db.close(); resolve(undefined); };
    } catch {
      db.close();
      resolve(undefined);
    }
  });
}

/** Persist newly added guest photos, keyed by their blob: preview URL. */
export async function saveGuestImages(pairs: GuestImagePair[]): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const base = Date.now();
      pairs.forEach((p, i) => {
        const row: StoredGuestImage = { previewUrl: p.url, file: p.file, addedAt: base + i };
        store.put(row);
      });
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
      tx.onabort = () => { db.close(); resolve(); };
    } catch {
      db.close();
      resolve();
    }
  });
}

/** Drop a photo the guest removed at Step 4. */
export async function removeGuestImage(previewUrl: string): Promise<void> {
  await withStore("readwrite", (store) => { store.delete(previewUrl); });
}

/** All persisted guest photos in the order they were added. */
export async function loadGuestImages(): Promise<StoredGuestImage[]> {
  const rows = (await withStore<StoredGuestImage[]>("readonly", (store) => store.getAll())) ?? [];
  return rows
    .filter((r) => r && r.file instanceof File && typeof r.previewUrl === "string")
    .sort((a, b) => a.addedAt - b.addedAt);
}

/** Wipe the store once the photos reached Supabase storage (or on publish). */
export async function clearGuestImages(): Promise<void> {
  await withStore("readwrite", (store) => { store.clear(); });
}
