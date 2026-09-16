import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ShoppingBag,
  Zap,
  ShieldCheck,
  Truck,
  Check,
  Search,
  Package,
  PlusCircle,
} from 'lucide-react';
import { Product, Language, CartItem, CategoryId, Category } from './types';
import { STORE_INFO, DEFAULT_CATEGORIES } from './data/storeInfo';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import { Header } from './components/Header';
import { PrayerWidget } from './components/PrayerWidget';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { AdminPanelModal } from './components/AdminPanelModal';
import { ExitConfirmModal } from './components/ExitConfirmModal';
import { Footer } from './components/Footer';
import {
  loadAndSyncAllStoredProducts,
  saveProductsToAllKeys,
  KNOWN_STORAGE_KEYS,
  loadStoredCategories,
  saveStoredCategories,
  resetStoredCategories,
} from './utils/storageSync';
import { loadProductsFromIDB } from './utils/idbStorage';
import { fetchProductsFromFirestore } from './utils/firebaseSync';
import { storageService } from './services/storageService';

const STORAGE_KEY_CART = 'muslim_shop_cart_v2';
const STORAGE_KEY_LANG = 'muslim_shop_lang';

export default function App() {
  // Language RU / KZ
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LANG);
    return saved === 'kz' ? 'kz' : 'ru';
  });

  // Dynamic Categories state (User requested: create & delete categories in admin)
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      return loadStoredCategories();
    } catch (e) {
      console.error('Error loading stored categories:', e);
      return DEFAULT_CATEGORIES;
    }
  });

  // Products state with multi-key auto-recovery (muslim_shop_products, muslim_shop_products_v2, products)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const syncResult = loadAndSyncAllStoredProducts();
      return syncResult.products;
    } catch (e) {
      console.error('Error during multi-key product sync:', e);
      return INITIAL_PRODUCTS;
    }
  });

  // Cart state with localStorage persistence
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CART);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading cart from cache:', e);
    }
    return [];
  });

  // Navigation & Modals
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Browser/Mobile back-button exit confirmation guard
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const isExitingRef = useRef(false);

  useEffect(() => {
    // Push an initial guard entry to history stack
    window.history.pushState({ guard: 'exit_confirm' }, '', window.location.href);

    const handlePopState = () => {
      if (isExitingRef.current) return;

      // Show exit confirmation modal asking "Выйти из магазина?"
      setShowExitConfirm(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleConfirmExit = () => {
    isExitingRef.current = true;
    setShowExitConfirm(false);
    // Navigate back to the previous website or close
    window.history.back();
    setTimeout(() => {
      try {
        window.close();
      } catch {}
    }, 150);
  };

  const handleCancelExit = () => {
    // User chose "Нет" - keep them on the site and re-arm the history guard
    window.history.pushState({ guard: 'exit_confirm' }, '', window.location.href);
    setShowExitConfirm(false);
  };

  // Sync language
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LANG, lang);
  }, [lang]);

  // Sync products safely across primary storage and IndexedDB
  useEffect(() => {
    saveProductsToAllKeys(products);
  }, [products]);

  // Background check with IndexedDB for high-res offline catalog
  useEffect(() => {
    loadProductsFromIDB()
      .then((idbProducts) => {
        if (idbProducts && Array.isArray(idbProducts) && idbProducts.length >= products.length) {
          // If IDB has full products, preserve them
          setProducts((curr) => (idbProducts.length >= curr.length ? idbProducts : curr));
        }
      })
      .catch(() => {});
  }, []);

  // Live cloud sync with Firebase Firestore (muslim-shop-55c12)
  useEffect(() => {
    fetchProductsFromFirestore()
      .then((cloudProducts) => {
        if (cloudProducts && cloudProducts.length > 0) {
          setProducts((curr) => {
            const map = new Map<string, Product>();
            // Keep existing products
            for (const p of curr) {
              map.set(p.id, p);
            }
            // Merge/update with cloud products
            for (const cp of cloudProducts) {
              map.set(cp.id, cp);
            }
            const merged = Array.from(map.values());
            if (merged.length >= curr.length) {
              return merged;
            }
            return curr;
          });
        }
      })
      .catch((err) => {
        console.warn('Background Firestore sync error:', err);
      });
  }, []);

  // Sync cart
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cartItems));
  }, [cartItems]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Cart handlers
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(
      lang === 'kz'
        ? `«${product.name[lang] || product.name.ru}» себетке қосылды`
        : `«${product.name[lang] || product.name.ru}» добавлен в корзину`
    );
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Admin handlers
  const handleSaveProduct = (savedProduct: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === savedProduct.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedProduct;
        return next;
      }
      return [savedProduct, ...prev];
    });
    showToast(
      lang === 'kz'
        ? 'Тауар каталогта жаңартылды'
        : 'Товар сохранен в каталоге'
    );
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    showToast(lang === 'kz' ? 'Тауар жойылды' : 'Товар удален');
  };

  const handleRestoreProducts = (restoredList: Product[]) => {
    setProducts(restoredList);
    showToast(
      lang === 'kz'
        ? `${restoredList.length} тауар сәтті қалпына келтірілді!`
        : `${restoredList.length} товаров успешно восстановлено из копии!`
    );
  };

  const handleResetToDefault = () => {
    storageService.resetToDefaults();
    setProducts(INITIAL_PRODUCTS);
    showToast(
      lang === 'kz'
        ? 'Каталог бастапқы күйге келтірілді'
        : 'Каталог сброшен к исходному'
    );
  };

  // Category management handlers (User requested: create & delete categories in admin)
  const handleSaveCategory = (category: Category) => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === category.id);
      let nextList: Category[];
      if (idx >= 0) {
        nextList = [...prev];
        nextList[idx] = category;
      } else {
        nextList = [...prev, category];
      }
      saveStoredCategories(nextList);
      return nextList;
    });
    showToast(
      lang === 'kz'
        ? `«${category.name[lang] || category.name.ru}» санаты сақталды`
        : `Категория «${category.name[lang] || category.name.ru}» сохранена`
    );
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategories((prev) => {
      const nextList = prev.filter((c) => c.id !== categoryId);
      saveStoredCategories(nextList);
      return nextList;
    });
    if (selectedCategory === categoryId) {
      setSelectedCategory('all');
    }
    showToast(lang === 'kz' ? 'Санат сәтті өшірілді' : 'Категория удалена');
  };

  const handleResetCategoriesToDefault = () => {
    const defaultList = resetStoredCategories();
    setCategories(defaultList);
    showToast(
      lang === 'kz'
        ? 'Санаттар қалпына келтірілді'
        : 'Категории сброшены к стандартным'
    );
  };

  const handleCategoriesUpdated = (newCategories: Category[]) => {
    setCategories(newCategories);
    saveStoredCategories(newCategories);
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const nameRu = product.name.ru.toLowerCase();
    const nameKz = product.name.kz.toLowerCase();
    const descRu = product.description.ru.toLowerCase();
    const descKz = product.description.kz.toLowerCase();
    const matchesSearch =
      !q ||
      nameRu.includes(q) ||
      nameKz.includes(q) ||
      descRu.includes(q) ||
      descKz.includes(q) ||
      product.category.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const iherbProductsCount = products.filter((p) => p.category === 'iherb').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0e14] text-slate-100 selection:bg-amber-500/30 selection:text-amber-300 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold text-xs sm:text-sm shadow-2xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Store Header */}
      <Header
        lang={lang}
        onLanguageChange={setLang}
        cartItems={cartItems}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* User Requested: "Виджет времени намаза для г. Атырау с обратным отсчетом до следующего намаза" */}
      <PrayerWidget lang={lang} />

      {/* Hero Banner with Islamic Motifs */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#141824] via-[#10131b] to-[#0c0e14] border-b border-amber-500/20 py-8 sm:py-12">
        {/* Subtle decorative gold ambient light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left text column */}
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>
                  {lang === 'kz'
                    ? 'Атырау • ТД «Дина Байзар», 24-бутик'
                    : 'г. Атырау • ТД «Дина Байзар», бутик №24'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                <span className="font-serif bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
                  MUSLIM SHOP
                </span>{' '}
                —{' '}
                <span className="text-slate-200">
                  {lang === 'kz'
                    ? 'Атыраудағы сапалы Ислам тауарлары мен түпнұсқа iHerb'
                    : 'Исламские товары и оригинальные витамины iHerb'}
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {lang === 'kz'
                  ? 'Табиғи қара зере майы, қыст әл-хинди, араб майлы әтірлері, жайнамаздар, Құран кітаптары және АҚШ-тан тікелей жеткізілетін iHerb дәрумендері.'
                  : 'Широкий ассортимент: оригинальные американские витамины iHerb, масло черного тмина холодного отжима, кыст аль-хинди, стойкие арабские миски, молитвенные коврики и Коран.'}
              </p>

              {/* Quick Info Badges: Free Delivery & Promos */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                  <Truck className="w-4 h-4" />
                  <span>
                    {lang === 'kz'
                      ? 'Атырау бойынша 15 000 ₸-ден ТЕГІН жеткізу'
                      : 'Бесплатная доставка по Атырау от 15 000 ₸'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'kz'
                      ? '100% Түпнұсқа iHerb және Сүннет өнімдері'
                      : '100% Оригинал iHerb и товары Сунны'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-950/60 border border-sky-500/40 text-sky-300 text-xs font-semibold">
                  <Zap className="w-3.5 h-3.5 fill-sky-400" />
                  <span>
                    {lang === 'kz'
                      ? 'WhatsApp арқылы «⚡ 1 басумен» тапсырыс'
                      : 'Заказ «⚡ В 1 клик» через WhatsApp'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Quick Action Card */}
            <div className="lg:col-span-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#1b202c] to-[#141822] border border-amber-500/30 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                    {lang === 'kz' ? 'Дүкен туралы' : 'Информация о бутике'}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                    {lang === 'kz' ? 'Ашық' : 'Открыто'}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-300">
                  <p className="font-semibold text-white">
                    📍 {STORE_INFO.address}
                  </p>
                  <p className="text-slate-400">
                    🕒 {lang === 'kz' ? STORE_INFO.workHoursKz : STORE_INFO.workHoursRu}
                  </p>
                  <p className="text-slate-400">
                    📞 WhatsApp: <strong className="text-slate-200">{STORE_INFO.phone}</strong>
                  </p>
                  <p className="text-slate-400">
                    📸 Instagram: <strong className="text-slate-200">{STORE_INFO.instagram}</strong>
                  </p>
                </div>

                <div className="pt-2 grid grid-cols-2 gap-2">
                  {/* User Requested: "Кнопка «📍 2GIS Маршрут» в шапке сайта рядом с адресом (ссылка на маршрут к ТД «Дина Байзар», бутик №24)" */}
                  <a
                    id="btn-hero-2gis"
                    href={STORE_INFO.twoGisUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-[#00a046]/20 hover:bg-[#00a046]/35 text-[#4ade80] border border-[#00a046]/50 transition-all text-center"
                  >
                    <span>📍 2GIS Маршрут</span>
                  </a>

                  <a
                    id="btn-hero-whatsapp"
                    href={`https://wa.me/${STORE_INFO.phoneRaw}?text=${encodeURIComponent(
                      lang === 'kz'
                        ? 'Сәлеметсіз бе! «MUSLIM SHOP» (Атырау, Дина Байзар) бойынша сұрағым бар еді'
                        : 'Здравствуйте! У меня вопрос по товарам в магазине «MUSLIM SHOP» (Атырау, Дина Байзар)'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-[#25D366]/20 hover:bg-[#25D366]/35 text-[#25D366] border border-[#25D366]/50 transition-all text-center"
                  >
                    <span>💬 WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Category Tabs (User Requested: "Новая категория в каталоге: «💊 iHerb Витамины»") */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>{lang === 'kz' ? 'Каталог санаттары' : 'Категории каталога'}</span>
              <span className="text-xs font-normal text-slate-400">
                ({filteredProducts.length}{' '}
                {lang === 'kz' ? 'тауар табылды' : 'товаров'})
              </span>
            </h2>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-amber-400 hover:underline"
              >
                {lang === 'kz' ? 'Іздеуді тазарту' : 'Очистить поиск'}
              </button>
            )}
          </div>

          {/* Categories Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const catName = cat.name[lang] || cat.name.ru;

              return (
                <button
                  key={cat.id}
                  id={`cat-btn-${cat.id}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? cat.id === 'iherb'
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-black shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-300'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/25 ring-1 ring-amber-300'
                      : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{catName}</span>
                  {cat.id === 'iherb' && !isActive && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40">
                      {iherbProductsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
            {products.length === 0 ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400 mb-3 shadow-inner">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-1">
                  {lang === 'kz' ? 'Каталог жаңартылуда' : 'Каталог готов к вашим товарам'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
                  {lang === 'kz'
                    ? 'Бастапқы демо-тауарлар жойылды. Өз тауарларыңызды қосу үшін әкімші панелін ашыңыз немесе JSON файлынан жүктеңіз.'
                    : 'Изначальные демо-товары удалены. Чтобы добавить ваши товары в магазин, откройте панель управления или загрузите файл JSON.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    id="btn-empty-open-admin"
                    onClick={() => setIsAdminOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{lang === 'kz' ? 'Тауар қосу (Әкімші панелі)' : 'Добавить товары (Админка)'}</span>
                  </button>
                  <a
                    id="btn-empty-whatsapp"
                    href={`https://wa.me/${STORE_INFO.phoneRaw}?text=${encodeURIComponent(
                      lang === 'kz'
                        ? 'Сәлеметсіз бе! «MUSLIM SHOP» дүкеніне тауарлар сұрағы бойынша'
                        : 'Здравствуйте! Вопрос по наличию товаров в «MUSLIM SHOP»'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                  >
                    <span>💬 {lang === 'kz' ? 'WhatsApp-қа жазу' : 'Написать в WhatsApp'}</span>
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500 mb-3">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-200 mb-1">
                  {lang === 'kz' ? 'Тауарлар табылмады' : 'Товары не найдены'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  {lang === 'kz'
                    ? 'Іздеу сұранысын өзгертіп немесе басқа санатты таңдап көріңіз'
                    : 'Попробуйте изменить поисковый запрос или выберите другую категорию каталога'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-colors"
                >
                  {lang === 'kz' ? 'Барлық тауарларды көрсету' : 'Показать все товары'}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                lang={lang}
                onAddToCart={(p) => handleAddToCart(p, 1)}
                onOpenDetails={(p) => setDetailProduct(p)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Cart Button for Mobile */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-5 left-4 right-4 z-40 sm:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold shadow-2xl shadow-amber-500/30 active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
              <span>{lang === 'kz' ? 'Себетті ашу' : 'Открыть корзину'}</span>
              <span className="px-2 py-0.5 rounded-full bg-black text-amber-300 text-xs">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            </div>
            <span className="font-mono text-base">
              {cartItems
                .reduce((acc, i) => acc + i.product.price * i.quantity, 0)
                .toLocaleString('ru-RU')}{' '}
              ₸
            </span>
          </button>
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={detailProduct}
        lang={lang}
        onClose={() => setDetailProduct(null)}
        onAddToCart={(p, qty) => handleAddToCart(p, qty)}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        lang={lang}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
      />

      {/* Admin Panel Modal (PIN protected, includes Backup & Export, Categories Manager) */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        categories={categories}
        lang={lang}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
        onRestoreProducts={handleRestoreProducts}
        onResetToDefault={handleResetToDefault}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
        onResetCategoriesToDefault={handleResetCategoriesToDefault}
        onCategoriesUpdated={handleCategoriesUpdated}
      />

      {/* Store Footer */}
      <Footer lang={lang} onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Exit Confirmation Modal for Back Button */}
      <ExitConfirmModal
        isOpen={showExitConfirm}
        lang={lang}
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
      />
    </div>
  );
}
