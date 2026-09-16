import { Product } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import { fetchProductsFromFirestore } from '../utils/firebaseSync';

export const STORAGE_KEYS = {
  PRODUCTS: 'muslim_shop_products_v2',
  CATEGORIES: 'muslim_shop_categories',
  CART: 'muslim_shop_cart_v2',
} as const;

export class StorageService {
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  public saveProductsLocal(products: Product[]): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn('Could not save products locally:', e);
    }
  }

  public getProducts(): Product[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public seedInitialProducts(): void {
    this.saveProductsLocal(INITIAL_PRODUCTS);
  }

  public resetToDefaults(): Product[] {
    this.seedInitialProducts();
    return INITIAL_PRODUCTS;
  }

  public subscribeProducts(callback: (products: Product[]) => void): () => void {
    let isCancelled = false;

    // First provide local cached products if any
    const local = this.getProducts();
    if (local && local.length > 0) {
      callback(local);
    }

    // Connect to Firestore (muslim-shop-55c12)
    fetchProductsFromFirestore()
      .then((cloudProducts) => {
        if (isCancelled) return;
        if (cloudProducts && cloudProducts.length > 0) {
          this.saveProductsLocal(cloudProducts);
          callback(cloudProducts);
        } else {
          callback([]);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          const cached = this.getProducts();
          if (cached && cached.length > 0) {
            callback(cached);
          } else {
            callback([]);
          }
        }
      });

    return () => {
      isCancelled = true;
    };
  }
}

export const storageService = new StorageService();
