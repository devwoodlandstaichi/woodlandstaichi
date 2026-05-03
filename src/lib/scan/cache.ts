"use client";

// IndexedDB-backed cache + queue for the attendance scanner.
//
// Two stores live in a single database so we don't touch the network
// to resolve member names or to persist a scan when the venue's Wi-Fi
// drops mid-class:
//
//   members  — full active roster keyed by id, refreshed every time
//              the scan page loads. Used to resolve a tokenId → name
//              instantly during a scan, and to power the manual
//              search box without a server round-trip.
//
//   queue    — scans that couldn't be written to the server yet,
//              keyed by a local uuid + scannedAt. Drained by the
//              scanner whenever the network returns.
//
// IndexedDB persists across reloads + browser restarts, so a queued
// scan survives a phone going to sleep, the tab being backgrounded,
// or even a forced reload — as long as it's the same browser
// profile, the queue's still there waiting to drain.

const DB_NAME = "wtc-scanner";
const DB_VERSION = 1;
const STORE_MEMBERS = "members";
const STORE_QUEUE = "queue";

export type CachedMember = {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  qr_token: string | null;
  level: string | null;
};

export type QueuedScan = {
  /** Local uuid; persists for idempotency on retry. */
  id: string;
  sessionId: string;
  scannedAt: string;
  method: "qr" | "manual";
  /** For QR: the encoded `<tokenId>.<sig>` string. */
  encodedToken?: string;
  /** For manual: resolved memberId from the cached roster. */
  memberId?: string;
  /** Resolved at scan time so the pending list can show the name
   *  even if the roster is rebuilt mid-flight. */
  memberName?: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_MEMBERS)) {
        db.createObjectStore(STORE_MEMBERS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ---------- Members cache ----------

export async function cacheMembers(members: CachedMember[]): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_MEMBERS, "readwrite");
    const store = tx.objectStore(STORE_MEMBERS);
    store.clear();
    for (const m of members) store.put(m);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function getCachedMembers(): Promise<CachedMember[]> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_MEMBERS, "readonly");
    return await promisify(tx.objectStore(STORE_MEMBERS).getAll());
  } catch {
    return [];
  }
}

export async function findMemberByTokenId(
  tokenId: string,
): Promise<CachedMember | null> {
  const all = await getCachedMembers();
  return all.find((m) => m.qr_token === tokenId) ?? null;
}

export async function searchMembersLocal(
  query: string,
  limit = 8,
): Promise<CachedMember[]> {
  const term = query.toLowerCase().trim();
  if (term.length < 2) return [];
  const all = await getCachedMembers();
  return all
    .filter((m) => {
      const haystack = `${m.first_name} ${m.last_name} ${m.nickname ?? ""}`
        .toLowerCase();
      return haystack.includes(term);
    })
    .sort((a, b) => a.last_name.localeCompare(b.last_name))
    .slice(0, limit);
}

// ---------- Scan queue ----------

export async function enqueueScan(scan: QueuedScan): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, "readwrite");
    tx.objectStore(STORE_QUEUE).put(scan);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function getQueuedScans(): Promise<QueuedScan[]> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_QUEUE, "readonly");
    const rows = await promisify<QueuedScan[]>(
      tx.objectStore(STORE_QUEUE).getAll() as IDBRequest<QueuedScan[]>,
    );
    // Drain in scan order so retries arrive in the order the room
    // experienced them — useful if two members share a name and the
    // sequence matters for any future reporting.
    return rows.sort((a, b) => a.scannedAt.localeCompare(b.scannedAt));
  } catch {
    return [];
  }
}

export async function removeQueuedScan(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, "readwrite");
    tx.objectStore(STORE_QUEUE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function countQueuedScans(): Promise<number> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_QUEUE, "readonly");
    return await promisify(tx.objectStore(STORE_QUEUE).count());
  } catch {
    return 0;
  }
}
