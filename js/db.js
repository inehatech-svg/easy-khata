/* IndexedDB wrapper — offline-first local storage */
const DB = {
  name: 'solar_khata',
  version: 1,
  db: null,
  ST: {
    settings: 'settings', users: 'users', items: 'items', moves: 'stock_moves',
    customers: 'customers', entries: 'entries', invoices: 'invoices'
  },

  open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB.name, DB.version);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
        if (!db.objectStoreNames.contains('users')) {
          const s = db.createObjectStore('users', { keyPath: 'id' });
          s.createIndex('username', 'username', { unique: true });
        }
        if (!db.objectStoreNames.contains('items')) {
          const s = db.createObjectStore('items', { keyPath: 'id' });
          s.createIndex('category', 'category');
        }
        if (!db.objectStoreNames.contains('stock_moves')) {
          const s = db.createObjectStore('stock_moves', { keyPath: 'id' });
          s.createIndex('itemId', 'itemId');
          s.createIndex('refId', 'refId');
          s.createIndex('day', 'day');
        }
        if (!db.objectStoreNames.contains('customers')) {
          db.createObjectStore('customers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('entries')) {
          const s = db.createObjectStore('entries', { keyPath: 'id' });
          s.createIndex('customerId', 'customerId');
          s.createIndex('day', 'day');
          s.createIndex('invoiceId', 'invoiceId');
          s.createIndex('type', 'type');
        }
        if (!db.objectStoreNames.contains('invoices')) {
          const s = db.createObjectStore('invoices', { keyPath: 'id' });
          s.createIndex('customerId', 'customerId');
          s.createIndex('day', 'day');
        }
      };
      req.onsuccess = () => { DB.db = req.result; resolve(DB.db); };
      req.onerror = () => reject(req.error);
    });
  },

  _tx(store, mode) {
    if (store === 'moves') store = 'stock_moves';
    return DB.db.transaction(store, mode).objectStore(store);
  },
  _pr(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async put(store, obj) {
    const now = U.nowISO();
    if (store === 'settings') {
      if (!obj.key) throw new Error('settings record needs key');
    } else if (!obj.id) {
      obj.id = U.uid();
    }
    if (store !== 'settings') {
      if (!obj.createdAt) obj.createdAt = now;
      if (!obj.date) obj.date = now;
      obj.updatedAt = now;
    }
    await DB._pr(DB._tx(store, 'readwrite').put(obj));
    return obj;
  },

  get(store, key) { return DB._pr(DB._tx(store, 'readonly').get(key)); },
  all(store) { return DB._pr(DB._tx(store, 'readonly').getAll()); },
  async del(store, key) { await DB._pr(DB._tx(store, 'readwrite').delete(key)); return true; },
  async clear(store) { await DB._pr(DB._tx(store, 'readwrite').clear()); return true; },
  idx(store, index, value) { return DB._pr(DB._tx(store, 'readonly').index(index).getAll(value)); },

  async bulkPut(store, arr) {
    return new Promise((resolve, reject) => {
      const tx = DB.db.transaction(store, 'readwrite');
      const os = tx.objectStore(store);
      arr.forEach(o => os.put(o));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  async bulkDel(store, keys) {
    return new Promise((resolve, reject) => {
      const tx = DB.db.transaction(store, 'readwrite');
      const os = tx.objectStore(store);
      keys.forEach(k => os.delete(k));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }
};
