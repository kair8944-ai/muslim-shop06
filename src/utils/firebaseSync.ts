import { Product, Category, CategoryId } from '../types';

export interface FirebaseConfig {
  projectId: string;
  apiKey?: string;
  appId?: string;
}

const STORAGE_KEY_FIREBASE_CFG = 'muslim_shop_firebase_cfg';
const DEFAULT_PROJECT_ID = 'muslim-shop-55c12';

export function loadSavedFirebaseConfig(): FirebaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIREBASE_CFG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.projectId === 'muslim-shop') {
        parsed.projectId = DEFAULT_PROJECT_ID;
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Could not load saved firebase config:', e);
  }
  return { projectId: DEFAULT_PROJECT_ID };
}

export function saveFirebaseConfig(cfg: FirebaseConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_FIREBASE_CFG, JSON.stringify(cfg));
  } catch (e) {
    console.warn('Could not save firebase config:', e);
  }
}

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
}

interface FirestoreDoc {
  name: string;
  fields?: Record<string, FirestoreValue>;
}

interface FirestoreListResponse {
  documents?: FirestoreDoc[];
  nextPageToken?: string;
  error?: { message?: string };
}

function parseFirestoreValue(val?: FirestoreValue): unknown {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue as string, 10);
  if ('doubleValue' in val) return val.doubleValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('arrayValue' in val) {
    return (val.arrayValue?.values || []).map(parseFirestoreValue);
  }
  if ('mapValue' in val) {
    const res: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val.mapValue?.fields || {})) {
      res[k] = parseFirestoreValue(v);
    }
    return res;
  }
  return null;
}

function mapFirestoreDocToProduct(doc: FirestoreDoc, index = 0): Product {
  const fields = doc.fields || {};
  const raw: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    raw[k] = parseFirestoreValue(v);
  }

  const id = doc.name.split('/').pop() || `prod-${Date.now()}-${index}`;
  const nameRu = (raw.titleRu as string) || (raw.nameRu as string) || (raw.title as string) || `Товар ${index + 1}`;
  const nameKz = (raw.titleKz as string) || (raw.nameKz as string) || nameRu;
  const descRu = (raw.descriptionRu as string) || (raw.descRu as string) || '';
  const descKz = (raw.descriptionKz as string) || (raw.descKz as string) || descRu;

  const rawImages = raw.images as string[] | undefined;
  const rawImage = raw.image as string | undefined;
  const image = (rawImages && rawImages[0]) || rawImage || '';
  const images = rawImages && rawImages.length > 0 ? rawImages : (image ? [image] : []);

  const price = Number(raw.price) || 0;
  const oldPrice = raw.oldPrice ? Number(raw.oldPrice) : undefined;
  const category = (raw.categoryId as CategoryId) || (raw.category as CategoryId) || 'cat-misc';

  return {
    id,
    name: { ru: nameRu, kz: nameKz },
    description: { ru: descRu, kz: descKz },
    price,
    oldPrice,
    category,
    image,
    images,
    inStock: raw.inStock !== false,
    isHit: Boolean(raw.isHit),
    isNew: Boolean(raw.isNew),
    rating: (raw.rating as number) || 5,
    reviewsCount: (raw.reviewsCount as number) || (7 + (index % 15)),
    specs: (raw.specsRu || raw.specsKz) ? {
      ru: (raw.specsRu as string) || '',
      kz: (raw.specsKz as string) || (raw.specsRu as string) || '',
    } : undefined,
  };
}

function mapFirestoreDocToCategory(doc: FirestoreDoc): Category {
  const fields = doc.fields || {};
  const raw: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    raw[k] = parseFirestoreValue(v);
  }

  const id = (raw.id as string) || doc.name.split('/').pop() || 'cat-custom';
  return {
    id: id as CategoryId,
    name: {
      ru: (raw.nameRu as string) || (raw.titleRu as string) || id,
      kz: (raw.nameKz as string) || (raw.titleKz as string) || (raw.nameRu as string) || id,
    },
    icon: (raw.icon as string) || '📦',
  };
}

/**
 * Fetches all products directly from Firestore cloud database (default: muslim-shop-55c12)
 * Handles pagination tokens automatically to retrieve all products.
 */
export async function fetchProductsFromFirestore(projectId = DEFAULT_PROJECT_ID): Promise<Product[]> {
  const products: Product[] = [];
  let pageToken = '';
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  try {
    do {
      const url = `${baseUrl}/products?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Firestore HTTP ${response.status}`);
      }

      const data: FirestoreListResponse = await response.json();
      if (data.documents && Array.isArray(data.documents)) {
        for (let i = 0; i < data.documents.length; i++) {
          products.push(mapFirestoreDocToProduct(data.documents[i], products.length + i));
        }
      }

      pageToken = data.nextPageToken || '';
    } while (pageToken);

    return products;
  } catch (error) {
    console.warn('Could not fetch products from Firestore:', error);
    return [];
  }
}

/**
 * Fetches all categories directly from Firestore
 */
export async function fetchCategoriesFromFirestore(projectId = DEFAULT_PROJECT_ID): Promise<Category[]> {
  const categories: Category[] = [];
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  try {
    const url = `${baseUrl}/categories?pageSize=100`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data: FirestoreListResponse = await response.json();
    if (data.documents && Array.isArray(data.documents)) {
      for (const doc of data.documents) {
        categories.push(mapFirestoreDocToCategory(doc));
      }
    }
  } catch (e) {
    console.warn('Could not fetch categories from Firestore:', e);
  }

  return categories;
}

/**
 * Pulls products and categories from Firebase for BackupExportTab
 */
export async function pullProductsFromFirebase(
  cfg: FirebaseConfig,
  _collections?: string[]
): Promise<{
  success: boolean;
  products: Product[];
  categories: Category[];
  errorMessage?: string;
}> {
  const projectId = cfg.projectId?.trim() || DEFAULT_PROJECT_ID;
  try {
    const products = await fetchProductsFromFirestore(projectId);
    const categories = await fetchCategoriesFromFirestore(projectId);

    if (products.length > 0) {
      return {
        success: true,
        products,
        categories,
      };
    } else {
      return {
        success: false,
        products: [],
        categories: [],
        errorMessage: `Не удалось загрузить товары из проекта ${projectId}. Проверьте правила чтения Firestore (read: if true).`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      products: [],
      categories: [],
      errorMessage: err?.message || 'Ошибка подключения к Firestore REST API',
    };
  }
}

/**
 * Pushes products to Firestore
 */
export async function pushProductsToFirebase(
  cfg: FirebaseConfig,
  products: Product[]
): Promise<{ success: boolean; count: number; error?: string }> {
  const projectId = cfg.projectId?.trim() || DEFAULT_PROJECT_ID;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  let successCount = 0;
  try {
    for (const p of products) {
      const docId = p.id;
      const url = `${baseUrl}/products/${encodeURIComponent(docId)}`;
      const fields: Record<string, unknown> = {
        titleRu: { stringValue: p.name.ru },
        titleKz: { stringValue: p.name.kz },
        descriptionRu: { stringValue: p.description.ru },
        descriptionKz: { stringValue: p.description.kz },
        price: { integerValue: p.price.toString() },
        categoryId: { stringValue: p.category },
        inStock: { booleanValue: p.inStock },
        isHit: { booleanValue: Boolean(p.isHit) },
        isNew: { booleanValue: Boolean(p.isNew) },
        images: {
          arrayValue: {
            values: (p.images && p.images.length > 0 ? p.images : [p.image]).map((img) => ({
              stringValue: img,
            })),
          },
        },
      };

      if (p.oldPrice) {
        fields.oldPrice = { integerValue: p.oldPrice.toString() };
      }
      if (p.specs) {
        fields.specsRu = { stringValue: p.specs.ru };
        fields.specsKz = { stringValue: p.specs.kz };
      }

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });

      if (res.ok) {
        successCount++;
      }
    }

    return { success: successCount > 0, count: successCount };
  } catch (err: any) {
    return { success: false, count: successCount, error: err?.message };
  }
}
