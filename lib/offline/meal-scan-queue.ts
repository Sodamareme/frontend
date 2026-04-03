export type PendingMealScan = {
  localId: string;
  learnerId: string;
  learnerFirstName: string;
  learnerLastName: string;
  learnerMatricule: string;
  learnerPhotoUrl: string;
  learnerReferentialName: string;
  learnerPromotionName: string;
  type: 'BREAKFAST' | 'LUNCH';
  serviceDate: string;
  scannedAtClient: string;
  deviceId: string;
  clientScanId: string;
  detectedType: 'BREAKFAST' | 'LUNCH';
  timezone: string;
  manualOverrideConfirmed: boolean;
  createdAt: string;
};

const DB_NAME = 'sonatel-academy-offline';
const DB_VERSION = 1;
const STORE_NAME = 'meal-scan-queue';

function openMealScanQueueDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'localId' });
        store.createIndex('createdAt', 'createdAt');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => Promise<T> | T,
) {
  const db = await openMealScanQueueDb();

  try {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const result = await handler(store);

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });

    return result;
  } finally {
    db.close();
  }
}

export async function getPendingMealScans(): Promise<PendingMealScan[]> {
  return withStore('readonly', (store) => {
    return new Promise<PendingMealScan[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const scans = (request.result as PendingMealScan[]).sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        );
        resolve(scans);
      };
      request.onerror = () => reject(request.error);
    });
  });
}

export async function enqueuePendingMealScan(scan: PendingMealScan) {
  return withStore('readwrite', (store) => {
    return new Promise<void>((resolve, reject) => {
      const request = store.put(scan);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

export async function removePendingMealScans(localIds: string[]) {
  return withStore('readwrite', async (store) => {
    await Promise.all(
      localIds.map(
        (localId) =>
          new Promise<void>((resolve, reject) => {
            const request = store.delete(localId);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          }),
      ),
    );
  });
}
