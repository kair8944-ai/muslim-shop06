import { Product, Category } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import { DEFAULT_CATEGORIES } from '../data/storeInfo';
import { saveProductsToIDB } from './idbStorage';

export const PRIMARY_STORAGE_KEY = 'muslim_shop_products_v2';

export const LEGACY_STORAGE_KEYS = [
  'muslim_shop_products',
  'products',
  'muslim_shop_catalog',
  'store_products',
  'muslim_shop_products_backup',
] as const;

export const KNOWN_STORAGE_KEYS = [
  PRIMARY_STORAGE_KEY,
  ...LEGACY_STORAGE_KEYS,
] as const;

/**
 * Removes duplicate legacy keys from localStorage to prevent quota overflow
 */
export function purgeLegacyStorageDuplicates(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      for (const key of LEGACY_STORAGE_KEYS) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn('Could not purge legacy storage keys:', e);
  }
}

/**
 * Robust sanitizer for products coming from various storage keys or legacy formats.
 * Handles both plain strings (name: "Масло") and localized objects (name: { ru: "...", kz: "..." }).
 */
export function sanitizeProduct(item: unknown, index = 0): Product | null {
  if (!item || typeof item !== 'object') return null;

  const raw = item as Record<string, unknown>;

  // Normalize Name
  let nameRu = '';
  let nameKz = '';
  if (typeof raw.name === 'object' && raw.name !== null) {
    const n = raw.name as Record<string, unknown>;
    nameRu = typeof n.ru === 'string' ? n.ru.trim() : '';
    nameKz = typeof n.kz === 'string' ? n.kz.trim() : nameRu;
  } else if (typeof raw.name === 'string') {
    nameRu = raw.name.trim();
    nameKz = raw.name.trim();
  }

  if (!nameRu && !nameKz) {
    nameRu = `Товар ${index + 1}`;
    nameKz = `Тауар ${index + 1}`;
  }

  // Normalize Description
  let descRu = '';
  let descKz = '';
  if (typeof raw.description === 'object' && raw.description !== null) {
    const d = raw.description as Record<string, unknown>;
    descRu = typeof d.ru === 'string' ? d.ru.trim() : '';
    descKz = typeof d.kz === 'string' ? d.kz.trim() : descRu;
  } else if (typeof raw.description === 'string') {
    descRu = raw.description.trim();
    descKz = raw.description.trim();
  }

  // Normalize Price
  const price = Number(raw.price) || 0;
  const oldPrice = raw.oldPrice ? Number(raw.oldPrice) : undefined;

  // Normalize Category
  const allowedCategories = ['all', 'iherb', 'health', 'perfume', 'clothes', 'books', 'accessories'];
  let category = typeof raw.category === 'string' ? raw.category : 'health';
  if (!allowedCategories.includes(category)) {
    category = 'health';
  }

  // Normalize Image
  const image =
    typeof raw.image === 'string' && raw.image.trim()
      ? raw.image.trim()
      : 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800';

  // Normalize InStock & Quantity
  const inStock = raw.inStock !== false;
  const stockQuantity = typeof raw.stockQuantity === 'number' ? raw.stockQuantity : 10;

  // Normalize Badge
  let badge: Product['badge'] = undefined;
  if (typeof raw.badge === 'object' && raw.badge !== null) {
    const b = raw.badge as Record<string, unknown>;
    if (typeof b.ru === 'string' && b.ru.trim()) {
      badge = {
        ru: b.ru.trim(),
        kz: typeof b.kz === 'string' && b.kz.trim() ? b.kz.trim() : b.ru.trim(),
      };
    }
  } else if (typeof raw.badge === 'string' && raw.badge.trim()) {
    badge = { ru: raw.badge.trim(), kz: raw.badge.trim() };
  }

  // Normalize Unit
  let unit: Product['unit'] = { ru: 'шт', kz: 'дана' };
  if (typeof raw.unit === 'object' && raw.unit !== null) {
    const u = raw.unit as Record<string, unknown>;
    if (typeof u.ru === 'string' && u.ru.trim()) {
      unit = {
        ru: u.ru.trim(),
        kz: typeof u.kz === 'string' && u.kz.trim() ? u.kz.trim() : 'дана',
      };
    }
  } else if (typeof raw.unit === 'string' && raw.unit.trim()) {
    unit = { ru: raw.unit.trim(), kz: 'дана' };
  }

  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `prod-${Date.now()}-${index}`;

  return {
    id,
    name: { ru: nameRu, kz: nameKz || nameRu },
    description: { ru: descRu, kz: descKz || descRu },
    price,
    oldPrice,
    category: category as Product['category'],
    image,
    inStock,
    stockQuantity,
    badge,
    unit,
    rating: typeof raw.rating === 'number' ? raw.rating : 5.0,
    reviewsCount: typeof raw.reviewsCount === 'number' ? raw.reviewsCount : 1,
  };
}

export const DEMO_PRODUCT_IDS = new Set([
  'prod-1',
  'prod-2',
  'prod-3',
  'prod-4',
  'prod-5',
  'prod-6',
  'prod-7',
  'prod-8',
  'iherb-1',
  'iherb-2',
  'iherb-3',
  'iherb-4',
  'iherb-5',
  'perfume-1',
  'perfume-2',
  'perfume-3',
  'health-1',
  'health-2',
  'health-3',
  'books-1',
  'books-2',
  'clothes-1',
  'clothes-2',
  'acc-1',
  'acc-2',
]);

export function isDemoProductId(id: string): boolean {
  if (!id) return false;
  if (DEMO_PRODUCT_IDS.has(id)) return true;
  if (/^prod-[1-8]$/.test(id)) return true;
  return false;
}

/**
 * Checks how many custom (non-demo) user products are in a list
 */
export function countCustomUserProducts(list: Product[]): number {
  return list.filter((p) => !isDemoProductId(p.id)).length;
}

/**
 * Scans all known and unknown localStorage and sessionStorage keys,
 * strips away any old initial demo products, and returns only real user-created products.
 */
export function loadAndSyncAllStoredProducts(): {
  products: Product[];
  sourceKey: string | null;
  recoveredCount: number;
  hasCustomProducts: boolean;
} {
  let bestProducts: Product[] = [];
  let sourceKey: string | null = null;
  let maxCustomCount = -1;

  // Gather all candidate keys: known keys first, then all keys present in localStorage and sessionStorage
  const candidateKeys = new Set<string>(KNOWN_STORAGE_KEYS);

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) candidateKeys.add(k);
      }
    }
  } catch (e) {
    console.warn('Could not list localStorage keys:', e);
  }

  // Also check sessionStorage
  const sessionCandidates = new Set<string>();
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k) sessionCandidates.add(k);
      }
    }
  } catch (e) {
    console.warn('Could not list sessionStorage keys:', e);
  }

  const checkRawValue = (raw: string | null, keyName: string) => {
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      let list: unknown[] = [];

      if (Array.isArray(parsed)) {
        list = parsed;
      } else if (
        parsed &&
        typeof parsed === 'object' &&
        Array.isArray((parsed as { products?: unknown[] }).products)
      ) {
        list = (parsed as { products: unknown[] }).products;
      }

      if (list.length > 0) {
        const sanitizedList: Product[] = [];
        for (let i = 0; i < list.length; i++) {
          const item = sanitizeProduct(list[i], i);
          // Strip out initial demo products
          if (item && !isDemoProductId(item.id)) {
            sanitizedList.push(item);
          }
        }

        if (sanitizedList.length > 0) {
          const customCount = countCustomUserProducts(sanitizedList);

          // Priority rule:
          // 1. Lists with more custom user-entered products ALWAYS win
          // 2. If equal custom products, the longer list wins
          const isBetter =
            customCount > maxCustomCount ||
            (customCount === maxCustomCount && sanitizedList.length > bestProducts.length);

          if (isBetter) {
            bestProducts = sanitizedList;
            maxCustomCount = customCount;
            sourceKey = keyName;
          }
        }
      }
    } catch {
      // Ignore non-JSON storage items (e.g. simple strings)
    }
  };

  // Inspect localStorage candidates
  for (const key of candidateKeys) {
    try {
      checkRawValue(localStorage.getItem(key), `localStorage:${key}`);
    } catch (e) {
      console.warn(`Error reading key "${key}":`, e);
    }
  }

  // Inspect sessionStorage candidates
  for (const key of sessionCandidates) {
    try {
      checkRawValue(sessionStorage.getItem(key), `sessionStorage:${key}`);
    } catch (e) {
      console.warn(`Error reading session key "${key}":`, e);
    }
  }

  // Strip out any residual demo products
  const cleanedProducts = bestProducts.filter((p) => !isDemoProductId(p.id));

  // If stored products are empty or fewer than the authentic 42 Firebase products in INITIAL_PRODUCTS,
  // ensure all 42 authentic products are loaded while preserving any new user-added products
  if (cleanedProducts.length === 0 || maxCustomCount < INITIAL_PRODUCTS.length) {
    const mergedMap = new Map<string, Product>();
    for (const p of INITIAL_PRODUCTS) {
      mergedMap.set(p.id, p);
    }
    for (const p of cleanedProducts) {
      mergedMap.set(p.id, p);
    }
    cleanedProducts.length = 0;
    cleanedProducts.push(...Array.from(mergedMap.values()));
    sourceKey = 'FIREBASE_INITIAL_PRODUCTS';
  }

  const hasCustom = cleanedProducts.length > 0;

  // Always purge legacy storage keys so they do not duplicate data or exhaust quota
  purgeLegacyStorageDuplicates();

  // Always save cleaned state to primary key and IndexedDB
  saveProductsToAllKeys(cleanedProducts);

  return {
    products: cleanedProducts,
    sourceKey,
    recoveredCount: cleanedProducts.length,
    hasCustomProducts: hasCustom,
  };
}

/**
 * Saves products reliably without exceeding localStorage quota:
 * 1. Purges legacy duplicate keys so they don't consume space.
 * 2. Saves full data to IndexedDB (virtually unlimited quota).
 * 3. Saves to primary key in localStorage with quota recovery fallback.
 */
export function saveProductsToAllKeys(products: Product[]): void {
  // Always clean up legacy redundant keys
  purgeLegacyStorageDuplicates();

  // Save to IndexedDB asynchronously (safe for hundreds of MBs of data & photos)
  saveProductsToIDB(products).catch((err) => {
    console.warn('Background save to IndexedDB failed:', err);
  });

  try {
    const json = JSON.stringify(products);
    localStorage.setItem(PRIMARY_STORAGE_KEY, json);
    localStorage.setItem('muslim_shop_last_sync', new Date().toISOString());

    // Also store in sessionStorage if available
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem(PRIMARY_STORAGE_KEY, json);
      }
    } catch {
      // sessionStorage quota ignored
    }
  } catch (e) {
    console.warn('Storage quota limit reached while saving products, activating compact storage mode:', e);

    // Clean up any remaining legacy keys
    purgeLegacyStorageDuplicates();

    // Fallback: If base64 photos are too large for localStorage, create a compact version
    // for localStorage cache (full images are already safe in IndexedDB and in-memory state)
    try {
      const compactProducts = products.map((p) => {
        if (typeof p.image === 'string' && p.image.startsWith('data:image/') && p.image.length > 20000) {
          return {
            ...p,
            image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
          };
        }
        return p;
      });

      const compactJson = JSON.stringify(compactProducts);
      localStorage.setItem(PRIMARY_STORAGE_KEY, compactJson);
      localStorage.setItem('muslim_shop_last_sync', new Date().toISOString());
    } catch (compactErr) {
      console.warn('LocalStorage entirely full. Data is preserved in IndexedDB:', compactErr);
    }
  }
}

/**
 * Generates ready-to-use TypeScript code for `src/data/initialProducts.ts`.
 * This allows the user to easily copy-paste or download the file to GitHub,
 * ensuring demo products never overwrite real goods upon fresh build/deployment!
 */
export function generateInitialProductsTsCode(products: Product[]): string {
  const productsCode = JSON.stringify(products, null, 2);
  return `import { Product } from '../types';\n\n// Автоматически экспортировано из админ-панели MUSLIM SHOP\n// Дата экспорта: ${new Date().toLocaleString('ru-RU')}\n// Всего товаров: ${products.length}\nexport const INITIAL_PRODUCTS: Product[] = ${productsCode};\n`;
}

/**
 * Downloads `initialProducts.ts` directly for GitHub repository persistence.
 */
export function downloadInitialProductsTs(products: Product[]): void {
  const code = generateInitialProductsTsCode(products);
  const blob = new Blob([code], { type: 'text/typescript;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'initialProducts.ts';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const STORAGE_KEY_CATEGORIES = 'muslim_shop_categories_v2';

/**
 * Loads saved categories from localStorage or falls back to DEFAULT_CATEGORIES
 */
export function loadStoredCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Guarantee that 'all' category is always present
        const hasAll = parsed.some((c: Category) => c.id === 'all');
        const list: Category[] = hasAll ? parsed : [DEFAULT_CATEGORIES[0], ...parsed];

        // Ensure authentic categories from DEFAULT_CATEGORIES are present alongside any user-created ones
        const map = new Map<string, Category>();
        for (const cat of DEFAULT_CATEGORIES) {
          map.set(cat.id, cat);
        }
        for (const cat of list) {
          // If stored category has the same id, keep it or use defaults
          map.set(cat.id, cat);
        }
        return Array.from(map.values());
      }
    }
  } catch (e) {
    console.warn('Error loading categories from storage:', e);
  }
  return DEFAULT_CATEGORIES;
}

/**
 * Saves categories to localStorage
 */
export function saveStoredCategories(categories: Category[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving categories:', e);
  }
}

/**
 * Resets categories to DEFAULT_CATEGORIES in storage
 */
export function resetStoredCategories(): Category[] {
  try {
    localStorage.removeItem(STORAGE_KEY_CATEGORIES);
  } catch (e) {
    console.error('Error resetting categories:', e);
  }
  return DEFAULT_CATEGORIES;
}

