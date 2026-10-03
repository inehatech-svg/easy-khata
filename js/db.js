/* IndexedDB wrapper — offline-first local storage */
const DB = {
  name: 'solar_khata',
  version: 3,
  db: null,
  ST: {
    settings: 'settings', users: 'users', items: 'items', moves: 'stock_moves',
    customers: 'customers', entries: 'entries', invoices: 'invoices', auditLog: 'audit_log', reminders: 'reminders'
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
        if (!db.objectStoreNames.contains('audit_log')) {
          const s = db.createObjectStore('audit_log', { keyPath: 'id' });
          s.createIndex('recordId', 'recordId');
          s.createIndex('store', 'store');
          s.createIndex('at', 'at');
        }
        if (!db.objectStoreNames.contains('reminders')) {
          const s = db.createObjectStore('reminders', { keyPath: 'id' });
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
    const target = store === 'moves' ? 'stock_moves' : store;
    if (target === 'settings') {
      if (!obj.key) throw new Error('settings record needs key');
      await DB._pr(DB._tx(target, 'readwrite').put(obj));
      return obj;
    }
    if (!obj.id) obj.id = U.uid();
    if (target === 'audit_log') {
      await DB._pr(DB._tx(target, 'readwrite').put(obj));
      return obj;
    }

    const now = U.nowISO();
    const actor = typeof Auth !== 'undefined' && Auth.user ? Auth.user.id : null;
    const tx = DB.db.transaction([target, 'audit_log'], 'readwrite');
    const records = tx.objectStore(target), log = tx.objectStore('audit_log');
    const req = records.get(obj.id);
    const snapshot = value => value == null ? null : JSON.parse(JSON.stringify(value));
    req.onsuccess = () => {
      const oldValue = req.result || null;
      if (!obj.createdAt) obj.createdAt = oldValue && oldValue.createdAt || now;
      if (!obj.date) obj.date = now;
      if (!obj.createdBy) obj.createdBy = oldValue && oldValue.createdBy || actor;
      const restoring = !!(oldValue && oldValue.deletedAt);
      if (restoring) { delete obj.deletedAt; delete obj.deletedBy; }
      obj.updatedAt = now;
      obj.updatedBy = actor;
      records.put(obj);
      log.add({
        id: U.uid(), store: target, recordId: obj.id,
        action: restoring ? 'restore' : oldValue ? 'update' : 'create', at: now, actorId: actor,
        oldValue: snapshot(oldValue), newValue: snapshot(obj)
      });
    };
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || req.error);
      tx.onabort = () => reject(tx.error || req.error || new Error('Save cancelled'));
    });
    return obj;
  },

  async get(store, key, options) {
    const value = await DB._pr(DB._tx(store, 'readonly').get(key));
    return value && value.deletedAt && !(options && options.includeDeleted) ? undefined : value;
  },
  async all(store, options) {
    const values = await DB._pr(DB._tx(store, 'readonly').getAll());
    return options && options.includeDeleted ? values : values.filter(value => !value.deletedAt);
  },
  async del(store, key) {
    const target = store === 'moves' ? 'stock_moves' : store;
    if (target === 'audit_log') { await DB._pr(DB._tx(target, 'readwrite').delete(key)); return true; }
    const now = U.nowISO();
    const actor = typeof Auth !== 'undefined' && Auth.user ? Auth.user.id : null;
    const tx = DB.db.transaction([target, 'audit_log'], 'readwrite');
    const records = tx.objectStore(target), log = tx.objectStore('audit_log');
    const req = records.get(key);
    const snapshot = value => value == null ? null : JSON.parse(JSON.stringify(value));
    req.onsuccess = () => {
      const oldValue = req.result || null;
      if (oldValue && !oldValue.deletedAt) {
        const deleted = Object.assign({}, oldValue, { deletedAt: now, deletedBy: actor, updatedAt: now, updatedBy: actor });
        records.put(deleted);
        log.add({
          id: U.uid(), store: target, recordId: key, action: 'delete', at: now,
          actorId: actor, oldValue: snapshot(oldValue), newValue: snapshot(deleted)
        });
      }
    };
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || req.error);
      tx.onabort = () => reject(tx.error || req.error || new Error('Delete cancelled'));
    });
    return true;
  },
  async clear(store) { await DB._pr(DB._tx(store, 'readwrite').clear()); return true; },
  async idx(store, index, value, options) {
    const values = await DB._pr(DB._tx(store, 'readonly').index(index).getAll(value));
    return options && options.includeDeleted ? values : values.filter(record => !record.deletedAt);
  },

  async bulkPut(store, arr) {
    if (store !== 'audit_log') return DB.batch(arr.map(record => ({ store, record })));
    return new Promise((resolve, reject) => {
      const tx = DB.db.transaction(store, 'readwrite');
      const os = tx.objectStore(store);
      arr.forEach(o => os.put(o));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  async batch(operations) {
    if (!operations || !operations.length) return true;
    const ops = operations.map(operation => Object.assign({}, operation, {
      store: operation.store === 'moves' ? 'stock_moves' : operation.store
    }));
    const stores = Array.from(new Set(ops.map(op => op.store).concat(ops.some(op => op.store !== 'audit_log' && op.store !== 'settings') ? ['audit_log'] : [])));
    const tx = DB.db.transaction(stores, 'readwrite');
    const actor = typeof Auth !== 'undefined' && Auth.user ? Auth.user.id : null;
    const now = U.nowISO();
    const clone = value => value == null ? null : JSON.parse(JSON.stringify(value));
    for (const op of ops) {
      const os = tx.objectStore(op.store);
      const logs = stores.includes('audit_log') ? tx.objectStore('audit_log') : null;
      if (op.store === 'audit_log') {
        if (op.action === 'delete') os.delete(op.id);
        else os.put(op.record);
        continue;
      }
      if (op.action === 'delete') {
        const req = os.get(op.id);
        req.onsuccess = () => {
          const oldValue = req.result;
          if (!oldValue || oldValue.deletedAt) return;
          const deleted = Object.assign({}, oldValue, { deletedAt: now, deletedBy: actor, updatedAt: now, updatedBy: actor });
          os.put(deleted);
          if (logs) logs.add({ id: U.uid(), store: op.store, recordId: op.id, action: 'delete', at: now, actorId: actor, oldValue: clone(oldValue), newValue: clone(deleted) });
        };
      } else {
        const record = op.record;
        if (op.store !== 'settings' && !record.id) record.id = U.uid();
        const key = op.store === 'settings' ? record.key : record.id;
        const req = os.get(key);
        req.onsuccess = () => {
          const oldValue = req.result || null;
          if (op.store !== 'settings') {
            if (!record.createdAt) record.createdAt = oldValue && oldValue.createdAt || now;
            if (!record.date) record.date = now;
            if (!record.createdBy) record.createdBy = oldValue && oldValue.createdBy || actor;
            const restoring = !!(oldValue && oldValue.deletedAt);
            if (restoring) { delete record.deletedAt; delete record.deletedBy; }
            record.updatedAt = now;
            record.updatedBy = actor;
            os.put(record);
            if (logs) logs.add({ id: U.uid(), store: op.store, recordId: record.id, action: restoring ? 'restore' : oldValue ? 'update' : 'create', at: now, actorId: actor, oldValue: clone(oldValue), newValue: clone(record) });
          } else os.put(record);
        };
      }
    }
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('Save failed'));
      tx.onabort = () => reject(tx.error || new Error('Save cancelled'));
    });
    return true;
  },

  async bulkDel(store, keys) {
    if (store !== 'audit_log') return DB.batch(keys.map(id => ({ store, action: 'delete', id })));
    return new Promise((resolve, reject) => {
      const tx = DB.db.transaction(store, 'readwrite');
      const os = tx.objectStore(store);
      keys.forEach(k => os.delete(k));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }
};
