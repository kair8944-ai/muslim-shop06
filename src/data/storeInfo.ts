import { StoreInfo, Category } from '../types';

export const STORE_INFO: StoreInfo = {
  name: 'MUSLIM SHOP',
  city: 'Атырау',
  address: 'г. Атырау, ТД «Дина Байзар», бутик №24',
  phone: '+7 778 175 42 41',
  phoneRaw: '77781754241',
  instagram: '@musliim_shop06',
  instagramUrl: 'https://instagram.com/musliim_shop06',
  twoGisUrl: 'https://2gis.kz/atyrau/geo/70000001094546376',
  workHoursRu: 'Ежедневно с 10:00 до 20:00 (без выходных)',
  workHoursKz: 'Күн сайын 10:00-ден 20:00-ге дейін (демалыссыз)',
  adminPin: '505534',
  freeDeliveryThreshold: 15000,
};

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'all',
    name: { ru: 'Все товары', kz: 'Барлық тауарлар' },
    icon: '✨',
  },
  {
    id: 'cat-hits',
    name: { ru: 'Хиты', kz: 'Хиттер' },
    icon: '🔥',
  },
  {
    id: 'cat-health',
    name: { ru: 'Здоровье', kz: 'Денсаулық' },
    icon: '❤️',
  },
  {
    id: 'cat-beauty',
    name: { ru: 'Красота', kz: 'Сұлулық' },
    icon: '✨',
  },
  {
    id: 'cat-iherb',
    name: { ru: 'iHerb Витамины', kz: 'iHerb Витаминдер' },
    icon: '💊',
  },
  {
    id: 'cat-men',
    name: { ru: 'Мужское здоровье', kz: 'Ерлер денсаулығы' },
    icon: '💪',
  },
  {
    id: 'cat-women',
    name: { ru: 'Женское здоровье', kz: 'Әйелдер денсаулығы' },
    icon: '🌸',
  },
  {
    id: 'cat-diet',
    name: { ru: 'Похудение', kz: 'Арықтау' },
    icon: '⚖️',
  },
  {
    id: 'cat-muslim',
    name: { ru: 'Для мусульман', kz: 'Мұсылмандарға' },
    icon: '🕌',
  },
  {
    id: 'cat-natural',
    name: { ru: 'Натуральные продукты', kz: 'Табиғи өнімдер' },
    icon: '🌿',
  },
  {
    id: 'cat-new',
    name: { ru: 'Новинки', kz: 'Жаңалықтар' },
    icon: '🌟',
  },
  {
    id: 'cat-misc',
    name: { ru: 'Разное', kz: 'Басқа' },
    icon: '📦',
  },
];

export const CATEGORIES = DEFAULT_CATEGORIES;

