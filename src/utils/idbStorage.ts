import { Product } from '../types';

const DB_NAME = 'MuslimShopDatabase_v1';
const DB_VERSION = 1;
const STORE_NAME = 'catalog_store';
const PRODUCTS_KEY = 'current_products';

/**
 * Opens the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Asynchronously saves products to IndexedDB.
 * IndexedDB has virtually unlimited storage (>50MB-1GB) without localStorage quota limits.
 */
export async function saveProductsToIDB(products: Product[]): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putRequest = store.put(products, PRODUCTS_KEY);

      putRequest.onsuccess = () => {
        resolve(true);
      };

      putRequest.onerror = () => {
        console.warn('Could not save products to IndexedDB:', putRequest.error);
        resolve(false);
      };

      tx.oncomplete = () => {
        db.close();
      };
    });
  } catch (err) {
    console.warn('IndexedDB save failed:', err);
    return false;
  }
}

/**
 * Asynchronously loads products from IndexedDB
 */
export async function loadProductsFromIDB(): Promise<Product[] | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(PRODUCTS_KEY);

      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (Array.isArray(result) && result.length > 0) {
          resolve(result as Product[]);
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => {
        resolve(null);
      };

      tx.oncomplete = () => {
        db.close();
      };
    });
  } catch (err) {
    console.warn('IndexedDB load failed:', err);
    return null;
  }
}
