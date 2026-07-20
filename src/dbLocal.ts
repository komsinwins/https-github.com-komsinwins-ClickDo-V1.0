/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class IndexedDBStore {
  private dbName = 'clickdo_local_db';
  private storeName = 'keyvalue';
  private version = 1;
  private dbInstance: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbInstance) {
      return Promise.resolve(this.dbInstance);
    }
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      try {
        if (typeof indexedDB === 'undefined') {
          reject(new Error('IndexedDB is not supported/allowed in this browser environment'));
          return;
        }

        const request = indexedDB.open(this.dbName, this.version);
        
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };

        request.onsuccess = () => {
          this.dbInstance = request.result;
          this.initPromise = null;
          resolve(request.result);
        };

        request.onerror = () => {
          this.initPromise = null;
          reject(request.error || new Error('Failed to open IndexedDB'));
        };
      } catch (err) {
        this.initPromise = null;
        reject(err);
      }
    });

    return this.initPromise;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      return new Promise<T | null>((resolve, reject) => {
        try {
          const transaction = db.transaction(this.storeName, 'readonly');
          const store = transaction.objectStore(this.storeName);
          const request = store.get(key);

          request.onsuccess = () => {
            const result = request.result;
            if (result === undefined) {
              resolve(null);
            } else {
              resolve(result as T);
            }
          };

          request.onerror = () => {
            reject(request.error);
          };
        } catch (err) {
          reject(err);
        }
      });
    } catch (e) {
      console.warn('IndexedDB get failed, falling back to localStorage:', e);
      try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        return null;
      }
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    // 1. Try writing to IndexedDB first
    let idbSuccess = false;
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        try {
          const transaction = db.transaction(this.storeName, 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.put(value, key);

          request.onsuccess = () => {
            idbSuccess = true;
            resolve();
          };

          request.onerror = () => {
            reject(request.error);
          };
        } catch (err) {
          reject(err);
        }
      });
    } catch (e) {
      console.warn('IndexedDB set failed:', e);
    }

    // 2. Sync to localStorage as best-effort backup
    // We strip heavy base64 data to prevent QuotaExceededError (5MB limit) in localStorage
    try {
      const cleanValue = this.stripHeavyData(key, value);
      localStorage.setItem(key, JSON.stringify(cleanValue));
    } catch (err) {
      console.warn('LocalStorage backup sync failed (possibly quota exceeded):', err);
      // If IndexedDB also failed and localStorage failed, notify in console
      if (!idbSuccess) {
        console.error('CRITICAL: Both IndexedDB and LocalStorage failed to save data!');
      }
    }
  }

  /**
   * Helper to strip heavy base64 fields (fileData, imageData) to fit in localStorage's 5MB quota.
   */
  private stripHeavyData(key: string, value: any): any {
    if (key === 'clickdo_projects' && Array.isArray(value)) {
      return value.map((proj: any) => ({
        ...proj,
        documents: Array.isArray(proj.documents)
          ? proj.documents.map((doc: any) => ({
              ...doc,
              // Replace heavy fileData with a placeholder to prevent QuotaExceededError
              fileData: doc.fileData ? '(Stored in Local DB)' : undefined,
            }))
          : [],
        diagrams: Array.isArray(proj.diagrams)
          ? proj.diagrams.map((diag: any) => ({
              ...diag,
              // Replace heavy imageData with a placeholder to prevent QuotaExceededError
              imageData: diag.imageData ? '(Stored in Local DB)' : undefined,
            }))
          : [],
      }));
    }
    return value;
  }
}

export const localDb = new IndexedDBStore();
