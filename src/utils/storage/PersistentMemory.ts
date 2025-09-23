// Minimal IndexedDB wrapper using native APIs to avoid new deps

type Reminder = { id?: number; task: string; dueAt: number };

class PersistentMemory {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.openDB();
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('jarvis-db', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv');
        }
        if (!db.objectStoreNames.contains('reminders')) {
          db.createObjectStore('reminders', { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async setItem<T = any>(key: string, value: T): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getItem<T = any>(key: string): Promise<T | undefined> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readonly');
      const req = tx.objectStore('kv').get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  async saveReminder(reminder: Reminder): Promise<Reminder> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reminders', 'readwrite');
      const req = tx.objectStore('reminders').add(reminder);
      req.onsuccess = () => resolve({ ...reminder, id: req.result as number });
      req.onerror = () => reject(req.error);
    });
  }

  async listReminders(): Promise<Reminder[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reminders', 'readonly');
      const req = tx.objectStore('reminders').getAll();
      req.onsuccess = () => resolve(req.result as Reminder[]);
      req.onerror = () => reject(req.error);
    });
  }
}

const persistentMemory = new PersistentMemory();
export default persistentMemory;


