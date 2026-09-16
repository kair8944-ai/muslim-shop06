import { Product } from '../types';
import { sanitizeProduct } from './storageSync';

export function exportProductsToJson(products: Product[]): void {
  const exportData = {
    store: 'MUSLIM SHOP',
    city: 'Атырау',
    address: 'г. Атырау, ТД «Дина Байзар», бутик №24',
    phone: '+7 778 175 42 41',
    instagram: '@musliim_shop06',
    exportedAt: new Date().toISOString(),
    totalProducts: products.length,
    products,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `muslim_shop_products_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportProductsToCsv(products: Product[]): void {
  // UTF-8 BOM for Microsoft Excel compatibility with Cyrillic characters
  const BOM = '\uFEFF';
  const headers = [
    'ID',
    'Название (RU)',
    'Атауы (KZ)',
    'Категория',
    'Цена (₸)',
    'Старая цена (₸)',
    'В наличии',
    'Остаток на складе',
    'Единица изм.',
    'Описание (RU)',
    'Сипаттамасы (KZ)',
    'Ссылка на фото',
  ];

  const escapeCsv = (str: string | number | boolean | undefined | null) => {
    if (str === undefined || str === null) return '""';
    const text = String(str).replace(/"/g, '""');
    return `"${text}"`;
  };

  const rows = products.map((p) => [
    escapeCsv(p.id),
    escapeCsv(p.name.ru),
    escapeCsv(p.name.kz),
    escapeCsv(p.category),
    p.price,
    p.oldPrice || '',
    p.inStock ? 'Да' : 'Нет',
    p.stockQuantity,
    escapeCsv(p.unit?.ru || 'шт'),
    escapeCsv(p.description.ru),
    escapeCsv(p.description.kz),
    escapeCsv(p.image),
  ]);

  const csvContent = BOM + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `muslim_shop_catalog_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function parseProductsJsonFile(file: File): Promise<{
  success: boolean;
  products?: Product[];
  count?: number;
  error?: string;
}> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    let rawList: unknown[] = [];
    if (Array.isArray(data)) {
      rawList = data;
    } else if (data && typeof data === 'object' && Array.isArray((data as { products?: unknown[] }).products)) {
      rawList = (data as { products: unknown[] }).products;
    } else {
      return {
        success: false,
        error: 'Неверный формат файла: отсутствует массив товаров "products"',
      };
    }

    if (rawList.length === 0) {
      return {
        success: false,
        error: 'Файл пуст или не содержит товаров',
      };
    }

    // Validate and sanitize products using robust normalizer
    const parsedProducts: Product[] = [];
    for (let i = 0; i < rawList.length; i++) {
      const sanitized = sanitizeProduct(rawList[i], i);
      if (sanitized) {
        parsedProducts.push(sanitized);
      }
    }

    if (parsedProducts.length === 0) {
      return {
        success: false,
        error: 'В файле не найдено корректных товаров для восстановления',
      };
    }

    return {
      success: true,
      products: parsedProducts,
      count: parsedProducts.length,
    };
  } catch (err) {
    return {
      success: false,
      error: 'Ошибка при чтении или парсинге JSON: ' + (err instanceof Error ? err.message : String(err)),
    };
  }
}

export async function copyProductsJsonToClipboard(products: Product[]): Promise<boolean> {
  try {
    const exportData = {
      store: 'MUSLIM SHOP',
      city: 'Атырау',
      address: 'г. Атырау, ТД «Дина Байзар», бутик №24',
      exportedAt: new Date().toISOString(),
      totalProducts: products.length,
      products,
    };
    const jsonString = JSON.stringify(exportData, null, 2);
    await navigator.clipboard.writeText(jsonString);
    return true;
  } catch (e) {
    console.error('Clipboard copy failed:', e);
    return false;
  }
}
