import React, { useState, useRef } from 'react';
import {
  X,
  Lock,
  Package,
  PlusCircle,
  Database,
  Search,
  Trash2,
  Edit2,
  Check,
  LogOut,
  Save,
  KeyRound,
  Download,
  Upload,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Product, Language, CategoryId, Category } from '../types';
import { STORE_INFO } from '../data/storeInfo';
import { BackupExportTab } from './BackupExportTab';
import { CategoriesManagerTab } from './CategoriesManagerTab';
import { exportProductsToJson, parseProductsJsonFile } from '../utils/exportImport';
import { saveProductsToAllKeys } from '../utils/storageSync';
import { translateToKazakh, ensureProductKazakh } from '../utils/translator';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  lang: Language;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onRestoreProducts: (restoredList: Product[]) => void;
  onResetToDefault: () => void;
  onSaveCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onResetCategoriesToDefault: () => void;
  onCategoriesUpdated: (categories: Category[]) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  lang,
  onSaveProduct,
  onDeleteProduct,
  onRestoreProducts,
  onResetToDefault,
  onSaveCategory,
  onDeleteCategory,
  onResetCategoriesToDefault,
  onCategoriesUpdated,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Active Tab: 'products' | 'add' | 'categories' | 'backup'
  const [activeTab, setActiveTab] = useState<'products' | 'add' | 'categories' | 'backup'>('backup');
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Editing state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // New product form state
  const defaultCategory = categories.find((c) => c.id !== 'all')?.id || 'cat-beauty';
  const initialFormState: Omit<Product, 'id'> = {
    name: { ru: '', kz: '' },
    description: { ru: '', kz: '' },
    price: 0,
    oldPrice: undefined,
    category: defaultCategory,
    image: '',
    inStock: true,
    stockQuantity: 10,
    badge: { ru: '', kz: '' },
    unit: { ru: 'шт', kz: 'дана' },
    rating: 5.0,
    reviewsCount: 1,
  };
  const [formData, setFormData] = useState<Omit<Product, 'id'>>(initialFormState);
  const [formSuccess, setFormSuccess] = useState(false);
  const quickFileInputRef = useRef<HTMLInputElement>(null);
  const [quickNotification, setQuickNotification] = useState<string | null>(null);

  const showQuickNotify = (msg: string) => {
    setQuickNotification(msg);
    setTimeout(() => setQuickNotification(null), 4000);
  };

  const handleQuickDownload = () => {
    exportProductsToJson(products);
    showQuickNotify(
      lang === 'kz'
        ? `Барлық ${products.length} тауар .JSON файлына сақталды!`
        : `Все ${products.length} товаров успешно скачаны в JSON!`
    );
  };

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await parseProductsJsonFile(file);
    if (result.success && result.products) {
      // User request: ensure full Kazakh translations for all products
      const translatedProducts = result.products.map(ensureProductKazakh);
      saveProductsToAllKeys(translatedProducts);
      onRestoreProducts(translatedProducts);
      showQuickNotify(
        lang === 'kz'
          ? `🎉 ${result.count} тауар (толық қазақша аудармасымен) 1 кликпен сәтті жүктелді!`
          : `🎉 ${result.count} товаров (с автопереводом на казахский) успешно восстановлено!`
      );
      if (quickFileInputRef.current) quickFileInputRef.current.value = '';
    } else {
      alert(result.error || 'Ошибка загрузки JSON файла');
    }
  };

  if (!isOpen) return null;

  // Handle PIN submit
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === STORE_INFO.adminPin) {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  // Start editing existing product
  const handleStartEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: { ...product.name },
      description: { ...product.description },
      price: product.price,
      oldPrice: product.oldPrice,
      category: product.category,
      image: product.image,
      inStock: product.inStock,
      stockQuantity: product.stockQuantity,
      badge: product.badge ? { ...product.badge } : undefined,
      unit: product.unit ? { ...product.unit } : { ru: 'шт', kz: 'дана' },
      rating: product.rating || 5.0,
      reviewsCount: product.reviewsCount || 1,
    });
    setActiveTab('add');
  };

  // User requested: auto-translate product descriptions and names to Kazakh
  const handleAutoTranslateForm = () => {
    if (!formData.name.ru && !formData.description.ru) {
      alert(
        lang === 'kz'
          ? 'Алдымен орысша атауын немесе сипаттамасын енгізіңіз'
          : 'Сначала введите русское название или описание товара'
      );
      return;
    }
    setFormData((prev) => ({
      ...prev,
      name: {
        ru: prev.name.ru,
        kz: translateToKazakh(prev.name.ru),
      },
      description: {
        ru: prev.description.ru,
        kz: translateToKazakh(prev.description.ru),
      },
      badge: prev.badge?.ru
        ? {
            ru: prev.badge.ru,
            kz: translateToKazakh(prev.badge.ru),
          }
        : prev.badge,
    }));
  };

  // Submit add or edit form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.ru.trim()) {
      alert(lang === 'kz' ? 'Тауар атауын жазыңыз' : 'Укажите название товара');
      return;
    }

    // Auto-translate to Kazakh if not provided
    const kazakhName =
      formData.name.kz.trim() || translateToKazakh(formData.name.ru.trim());
    const kazakhDesc =
      formData.description.kz.trim() ||
      translateToKazakh(formData.description.ru.trim());
    const kazakhBadge = formData.badge?.ru
      ? {
          ru: formData.badge.ru.trim(),
          kz:
            formData.badge.kz?.trim() ||
            translateToKazakh(formData.badge.ru.trim()),
        }
      : undefined;

    const savedProduct: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: {
        ru: formData.name.ru.trim(),
        kz: kazakhName,
      },
      description: {
        ru: formData.description.ru.trim(),
        kz: kazakhDesc,
      },
      price: Number(formData.price) || 0,
      oldPrice: formData.oldPrice ? Number(formData.oldPrice) : undefined,
      category: formData.category,
      image:
        formData.image.trim() ||
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
      inStock: formData.inStock,
      stockQuantity: Number(formData.stockQuantity) || 1,
      badge: kazakhBadge,
      unit: formData.unit?.ru ? formData.unit : { ru: 'шт', kz: 'дана' },
      rating: formData.rating || 5.0,
      reviewsCount: formData.reviewsCount || 1,
    };

    onSaveProduct(savedProduct);
    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setEditingProduct(null);
      setFormData(initialFormState);
      setActiveTab('products');
    }, 1200);
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      categoryFilter === 'all' || p.category === categoryFilter;
    const q = searchFilter.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.ru.toLowerCase().includes(q) ||
      p.name.kz.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-5xl rounded-2xl bg-[#11141b] border border-amber-500/30 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0c0e13] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-black font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  {lang === 'kz'
                    ? '«MUSLIM SHOP» Әкімші панелі'
                    : 'Панель управления «MUSLIM SHOP»'}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  Атырау • ТД «Дина Байзар»
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {lang === 'kz'
                  ? 'Тауарларды басқару, iHerb дәрумендері және сақтық көшірме'
                  : 'Управление каталогом, витамины iHerb и резервное копирование'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  setPinInput('');
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700"
                title="Шығу / Выйти"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Выйти</span>
              </button>
            )}

            <button
              id="btn-close-admin-modal"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PIN Screen if not authenticated */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-[0_0_20px_rgba(217,119,6,0.2)]">
              <KeyRound className="w-8 h-8" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-100 mb-1">
              {lang === 'kz'
                ? 'Әкімші PIN-кодын енгізіңіз'
                : 'Введите PIN-код администратора'}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              {lang === 'kz'
                ? 'Тауарлар базасы мен сақтық көшірмені басқару үшін PIN-кодты енгізіңіз'
                : 'Для доступа к управлению магазином и выгрузке базы введите ваш PIN-код'}
            </p>

            <form onSubmit={handlePinSubmit} className="w-full space-y-4">
              <div>
                <input
                  id="input-admin-pin"
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••••"
                  autoFocus
                  className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3 px-4 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 text-amber-400 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                {pinError && (
                  <p className="text-xs text-red-400 font-medium mt-2">
                    {lang === 'kz'
                      ? 'Қате PIN-код! Қолжетімділік жоқ.'
                      : 'Неверный PIN-код! Доступ запрещен.'}
                  </p>
                )}
              </div>

              <button
                id="btn-submit-admin-pin"
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                {lang === 'kz' ? 'Кіру' : 'Войти в панель'}
              </button>
            </form>
          </div>
        ) : (
          /* Main Authenticated Admin Tabs & Content */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Navigation */}
            <div className="px-4 pt-3 pb-0 border-b border-slate-800 bg-[#0e1117] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                {/* Tab 1: Products */}
                <button
                  id="tab-admin-products"
                  onClick={() => {
                    setActiveTab('products');
                    setEditingProduct(null);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === 'products'
                      ? 'bg-amber-500 text-black shadow'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>
                    {lang === 'kz' ? 'Тауарлар' : 'Товары'} ({products.length})
                  </span>
                </button>

                {/* Tab 2: Add / Edit Product */}
                <button
                  id="tab-admin-add"
                  onClick={() => {
                    setActiveTab('add');
                    if (!editingProduct) setFormData(initialFormState);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === 'add'
                      ? 'bg-amber-500 text-black shadow'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>
                    {editingProduct
                      ? lang === 'kz'
                        ? 'Өңдеу'
                        : 'Редактировать'
                      : lang === 'kz'
                      ? 'Тауар қосу'
                      : 'Добавить товар'}
                  </span>
                </button>

                {/* Tab: Categories Management (User requested) */}
                <button
                  id="tab-admin-categories"
                  onClick={() => {
                    setActiveTab('categories');
                    setEditingProduct(null);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === 'categories'
                      ? 'bg-amber-500 text-black shadow'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>
                    {lang === 'kz' ? 'Санаттар' : 'Категории'} ({categories.length})
                  </span>
                </button>

                {/* User Requested: "В админ-панели добавить яркий раздел / вкладку «💾 Резервное копирование и экспорт»" */}
                <button
                  id="tab-admin-backup"
                  onClick={() => {
                    setActiveTab('backup');
                    setEditingProduct(null);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${
                    activeTab === 'backup'
                      ? 'bg-gradient-to-r from-emerald-500 via-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-300'
                      : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/40 shadow-sm'
                  }`}
                >
                  <Database className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    💾 {lang === 'kz' ? 'Резервтік көшірме және экспорт' : 'Резервное копирование и экспорт'}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </button>
              </div>

              {/* User Requested: Quick 1-click Export and Import Buttons */}
              <div className="flex items-center gap-2 ml-auto pb-2 sm:pb-0">
                <input
                  type="file"
                  ref={quickFileInputRef}
                  onChange={handleQuickUpload}
                  accept=".json,application/json"
                  className="hidden"
                  id="admin-quick-file-upload"
                />

                <button
                  id="btn-admin-quick-download-json"
                  onClick={handleQuickDownload}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 shadow-sm transition-all active:scale-95"
                  title="Скачать все товары в JSON на телефон или компьютер"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">📥 Скачать все товары в JSON</span>
                  <span className="md:hidden">📥 Скачать JSON</span>
                </button>

                <button
                  id="btn-admin-quick-upload-json"
                  onClick={() => quickFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/50 shadow-sm transition-all active:scale-95"
                  title="Загрузить товары из JSON в 1 клик"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">📤 Загрузить товары из JSON</span>
                  <span className="md:hidden">📤 Загрузить JSON</span>
                </button>
              </div>
            </div>

            {/* Quick action notification banner */}
            {quickNotification && (
              <div className="px-4 py-2 bg-emerald-950/90 border-b border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center justify-between">
                <span>{quickNotification}</span>
                <button
                  onClick={() => setQuickNotification(null)}
                  className="text-emerald-400 hover:text-white text-xs ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#11141b]">
              {/* TAB: BACKUP & EXPORT (Bright, prominently styled) */}
              {activeTab === 'backup' && (
                <BackupExportTab
                  products={products}
                  categories={categories}
                  lang={lang}
                  onRestoreProducts={onRestoreProducts}
                  onResetToDefault={onResetToDefault}
                  onCategoriesUpdated={onCategoriesUpdated}
                />
              )}

              {/* TAB: CATEGORIES MANAGEMENT (User requested: create & delete categories) */}
              {activeTab === 'categories' && (
                <CategoriesManagerTab
                  categories={categories}
                  products={products}
                  lang={lang}
                  onSaveCategory={onSaveCategory}
                  onDeleteCategory={onDeleteCategory}
                  onResetCategoriesToDefault={onResetCategoriesToDefault}
                />
              )}

              {/* TAB 1: PRODUCTS LIST */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  {/* Search and Filters */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1 min-w-[220px] relative">
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder={
                          lang === 'kz'
                            ? 'Атауы бойынша іздеу...'
                            : 'Поиск по названию или категории...'
                        }
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="all">
                        {lang === 'kz' ? 'Барлық санаттар' : 'Все категории'}
                      </option>
                      {categories
                        .filter((c) => c.id !== 'all')
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.icon} {c.name[lang] || c.name.ru}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Products Table / Cards */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                          <tr>
                            <th className="p-3">Фото</th>
                            <th className="p-3">Название</th>
                            <th className="p-3">Категория</th>
                            <th className="p-3">Цена</th>
                            <th className="p-3">Склад</th>
                            <th className="p-3 text-right">Действия</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {filteredProducts.map((p) => (
                            <tr
                              key={p.id}
                              className="hover:bg-slate-900/50 transition-colors"
                            >
                              <td className="p-3">
                                <img
                                  src={p.image}
                                  alt=""
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 object-cover rounded-lg bg-slate-800 border border-slate-700"
                                />
                              </td>
                              <td className="p-3 max-w-xs">
                                <div className="font-semibold text-slate-100 truncate">
                                  {p.name.ru}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {p.name.kz}
                                </div>
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    p.category === 'iherb'
                                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  {p.category === 'iherb'
                                    ? '💊 iHerb'
                                    : p.category}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                                {p.price.toLocaleString('ru-RU')} ₸
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <span
                                  className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                                    p.inStock ? 'bg-emerald-400' : 'bg-red-400'
                                  }`}
                                />
                                <span>{p.stockQuantity} шт.</span>
                              </td>
                              <td className="p-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleStartEdit(p)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                                    title="Редактировать"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `Удалить товар "${p.name.ru}"?`
                                        )
                                      ) {
                                        onDeleteProduct(p.id);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                                    title="Удалить"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ADD / EDIT PRODUCT FORM */}
              {activeTab === 'add' && (
                <form
                  onSubmit={handleSaveForm}
                  className="max-w-3xl mx-auto space-y-4 bg-slate-900/60 p-5 sm:p-6 rounded-2xl border border-slate-800"
                >
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
                    <h3 className="font-bold text-base text-slate-100">
                      {editingProduct
                        ? `Редактирование: ${editingProduct.name.ru}`
                        : 'Добавление нового товара в каталог'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAutoTranslateForm}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 shadow-sm transition-all"
                        title="Автоматически перевести название и описание на казахский язык"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>⚡ Қазақшаға аудару (Автоперевод)</span>
                      </button>

                      {editingProduct && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(null);
                            setFormData(initialFormState);
                          }}
                          className="text-xs text-slate-400 hover:text-white underline ml-2"
                        >
                          Сбросить
                        </button>
                      )}
                    </div>
                  </div>

                  {formSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Товар успешно сохранен в базе данных!</span>
                    </div>
                  )}

                  {/* Names RU / KZ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Название на русском *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name.ru}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            name: { ...formData.name, ru: e.target.value },
                          })
                        }
                        placeholder="Например: Now Foods Омега-3 (200 капсул)"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Атауы қазақша (немесе көшірмесі)
                      </label>
                      <input
                        type="text"
                        value={formData.name.kz}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            name: { ...formData.name, kz: e.target.value },
                          })
                        }
                        placeholder="Now Foods Омега-3 (200 капсула)"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Category, Price, Old Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Категория *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            category: e.target.value as CategoryId,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                      >
                        {categories
                          .filter((c) => c.id !== 'all')
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.icon} {c.name[lang] || c.name.ru}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Цена (₸) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.price || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price: Number(e.target.value),
                          })
                        }
                        placeholder="7800"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-mono font-bold text-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Старая цена (₸) для скидки
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.oldPrice || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            oldPrice: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        placeholder="9200"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Image URL & Badge */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Ссылка на фото (URL)
                      </label>
                      <input
                        type="url"
                        value={formData.image}
                        onChange={(e) =>
                          setFormData({ ...formData, image: e.target.value })
                        }
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Бейдж (например: Хит iHerb, Сунна)
                      </label>
                      <input
                        type="text"
                        value={formData.badge?.ru || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            badge: {
                              ru: e.target.value,
                              kz: e.target.value,
                            },
                          })
                        }
                        placeholder="Хит iHerb"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Stock Quantity and InStock checkbox */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Остаток на складе в Атырау (бутик 24)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stockQuantity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stockQuantity: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="inStockCheck"
                        checked={formData.inStock}
                        onChange={(e) =>
                          setFormData({ ...formData, inStock: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
                      />
                      <label
                        htmlFor="inStockCheck"
                        className="text-xs font-semibold text-slate-200 cursor-pointer"
                      >
                        Товар в наличии в г. Атырау
                      </label>
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Описание (RU)
                      </label>
                      <textarea
                        rows={3}
                        value={formData.description.ru}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: {
                              ...formData.description,
                              ru: e.target.value,
                            },
                          })
                        }
                        placeholder="Подробное описание полезных свойств, дозировка..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Сипаттамасы (KZ)
                      </label>
                      <textarea
                        rows={3}
                        value={formData.description.kz}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: {
                              ...formData.description,
                              kz: e.target.value,
                            },
                          })
                        }
                        placeholder="Тауардың пайдалы қасиеттері, қабылдау тәсілі..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      id="btn-admin-save-product"
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      <span>
                        {editingProduct
                          ? 'Сохранить изменения'
                          : 'Добавить товар в магазин'}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
