export type Language = 'ru' | 'kz';

export interface LocalizedString {
  ru: string;
  kz: string;
}

export type CategoryId = string;

export interface Category {
  id: CategoryId;
  name: LocalizedString;
  icon: string;
}

export interface Product {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  price: number;
  oldPrice?: number;
  category: CategoryId;
  image: string;
  images?: string[];
  inStock: boolean;
  stockQuantity?: number;
  badge?: LocalizedString;
  rating?: number;
  reviewsCount?: number;
  unit?: LocalizedString;
  isHit?: boolean;
  isNew?: boolean;
  specs?: LocalizedString;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PrayerTimeItem {
  id: string;
  nameRu: string;
  nameKz: string;
  nameAr: string;
  timeStr: string; // "05:18"
  isNext?: boolean;
  isCurrent?: boolean;
}

export interface StoreInfo {
  name: string;
  city: string;
  address: string;
  phone: string;
  phoneRaw: string;
  instagram: string;
  instagramUrl: string;
  twoGisUrl: string;
  workHoursRu: string;
  workHoursKz: string;
  adminPin: string;
  freeDeliveryThreshold: number;
}
