/**
 * js/indexed-db.js
 * Inicialización y abstracción para IndexedDB de FieldForce.
 */

const DB_NAME = 'FieldForceDB';
const DB_VERSION = 2;

const STORES = {
  CONFIG: 'config',
  CATALOG_STORES: 'catalog_stores',
  CATALOG_PRODUCTS: 'catalog_products',
  CATALOG_ROUTES: 'catalog_routes',
  CATALOG_FORMS: 'catalog_forms',
  VISITS: 'visits',
  VISIT_PRODUCTS: 'visit_products',
  COMPETITOR_PRICES: 'competitor_prices',
  PENDING_PHOTOS: 'pending_photos',
  SYNC_QUEUE: 'sync_queue',
  LOCAL_SESSION: 'local_session'
};

const IndexedDB = {
  _db: null,

  async init() {
    return new Promise((resolve, reject) => {
      if (this._db) return resolve(this._db);

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => reject(event.target.error);
      
      request.onblocked = (event) => {
        console.warn("IndexedDB upgrade blocked. Please close other tabs.");
        reject(new Error("Database upgrade blocked by another tab. Close all tabs and reopen."));
      };

      request.onsuccess = (event) => {
        this._db = event.target.result;
        this._db.onversionchange = () => {
          this._db.close();
          this._db = null;
          console.warn("Database version changed in another tab. Connection closed.");
        };
        resolve(this._db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(STORES.CONFIG)) {
          db.createObjectStore(STORES.CONFIG, { keyPath: 'setting_id' });
        }
        if (!db.objectStoreNames.contains(STORES.CATALOG_STORES)) {
          db.createObjectStore(STORES.CATALOG_STORES, { keyPath: 'store_id' });
        }
        if (!db.objectStoreNames.contains(STORES.CATALOG_PRODUCTS)) {
          db.createObjectStore(STORES.CATALOG_PRODUCTS, { keyPath: 'product_id' });
        }
        if (!db.objectStoreNames.contains(STORES.CATALOG_ROUTES)) {
          db.createObjectStore(STORES.CATALOG_ROUTES, { keyPath: 'route_id' });
        }
        if (!db.objectStoreNames.contains(STORES.CATALOG_FORMS)) {
          db.createObjectStore(STORES.CATALOG_FORMS, { keyPath: 'form_id' });
        }
        if (!db.objectStoreNames.contains(STORES.LOCAL_SESSION)) {
          db.createObjectStore(STORES.LOCAL_SESSION, { keyPath: 'session_id' });
        }
        if (!db.objectStoreNames.contains(STORES.VISITS)) {
          db.createObjectStore(STORES.VISITS, { keyPath: 'visit_id' });
        }
        if (!db.objectStoreNames.contains(STORES.VISIT_PRODUCTS)) {
          const vpStore = db.createObjectStore(STORES.VISIT_PRODUCTS, { keyPath: 'visit_product_id' });
          vpStore.createIndex('visit_id', 'visit_id', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.COMPETITOR_PRICES)) {
          const cpStore = db.createObjectStore(STORES.COMPETITOR_PRICES, { keyPath: 'competitor_price_id' });
          cpStore.createIndex('visit_id', 'visit_id', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.PENDING_PHOTOS)) {
          const photoStore = db.createObjectStore(STORES.PENDING_PHOTOS, { keyPath: 'photo_id' });
          photoStore.createIndex('visit_id', 'visit_id', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const queueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'queue_id', autoIncrement: true });
          queueStore.createIndex('client_request_id', 'client_request_id', { unique: true });
          queueStore.createIndex('sync_status', 'sync_status', { unique: false });
          queueStore.createIndex('depends_on', 'depends_on', { unique: false });
        }
      };
    });
  },

  async get(storeName, key) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAll(storeName) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getByIndex(storeName, indexName, key) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async put(storeName, value) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async delete(storeName, key) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clear(storeName) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

window.IndexedDB = IndexedDB;
window.STORES = STORES;
