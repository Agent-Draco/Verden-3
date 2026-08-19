/**
 * Client-side cache for Mapbox responses.
 *
 * Search autocomplete, geocoding and reverse-geocoding results live in
 * IndexedDB (never Supabase) so repeated lookups cost zero API requests and
 * keep working offline. Supabase writes are reserved for domain data.
 */

const DB_NAME = "verden-map-cache";
const DB_VERSION = 1;
const STORE = "responses";

type Entry<T> = { key: string; value: T; expiresAt: number };

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
  return dbPromise;
}

/** In-memory tier so hot keys never touch IndexedDB within a session. */
const memory = new Map<string, Entry<unknown>>();

export async function cacheGet<T>(key: string): Promise<T | null> {
  const hot = memory.get(key);
  if (hot) {
    if (hot.expiresAt > Date.now()) return hot.value as T;
    memory.delete(key);
  }
  const db = await openDb();
  if (!db) return null;
  return new Promise<T | null>((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => {
      const entry = req.result as Entry<T> | undefined;
      if (!entry) return resolve(null);
      if (entry.expiresAt < Date.now()) return resolve(null);
      memory.set(key, entry as Entry<unknown>);
      resolve(entry.value);
    };
    req.onerror = () => resolve(null);
  });
}

export async function cacheSet<T>(key: string, value: T, ttlMs: number): Promise<void> {
  const entry: Entry<T> = { key, value, expiresAt: Date.now() + ttlMs };
  memory.set(key, entry as Entry<unknown>);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function cacheClear(): Promise<void> {
  memory.clear();
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export const TTL = {
  search: 1000 * 60 * 60 * 12,
  geocode: 1000 * 60 * 60 * 24 * 14,
  reverse: 1000 * 60 * 60 * 24 * 14,
  category: 1000 * 60 * 30,
  directions: 1000 * 60 * 5,
  isochrone: 1000 * 60 * 60 * 6,
  details: 1000 * 60 * 60 * 24,
};

/** Round coordinates so nearby lookups reuse the same cache entry. */
export function geoKey(lng: number, lat: number, precision = 3) {
  return `${lng.toFixed(precision)},${lat.toFixed(precision)}`;
}