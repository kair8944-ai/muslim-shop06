import React, { useState } from 'react';
import {
  PlusCircle,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Tag,
  Package,
} from 'lucide-react';
import { Category, Product, Language } from '../types';

interface CategoriesManagerTabProps {
  categories: Category[];
  products: Product[];
  lang: Language;
  onSaveCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onResetCategoriesToDefault: () => void;
}

const POPULAR_ICONS = [
  '💄', '🧴', '🧼', '✨', '💊', '🌿', '🕌', '🧕',
  '📖', '📿', '🍯', '🍵', '👕', '🎁', '👶', '🏷️',
  '📦', '🌟', '🌙', '❤️', '💎', '🍵', '🍎', '👑',
];

/**
 * Transliterates Russian string into safe slug/id
 */
function slugify(text: string): string {
  const ruToEn: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
    з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
    п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
    ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };

  return text
    .toLowerCase()
    .trim()
    .split('')
    .map((char) => ruToEn[char] || char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'category';
}

export const CategoriesManagerTab: React.FC<CategoriesManagerTabProps> = ({
  categories,
  products,
  lang,
  onSaveCategory,
  onDeleteCategory,
  onResetCategoriesToDefault,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [nameRu, setNameRu] = useState('');
  const [nameKz, setNameKz] = useState('');
  const [icon, setIcon] = useState('💄');
  const [slug, setSlug] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);

  // Delete confirm modal/state
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setNameRu('');
    setNameKz('');
    setIcon('💄');
    setSlug('');
    setAutoSlug(true);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingId(cat.id);
    setNameRu(cat.name.ru);
    setNameKz(cat.name.kz);
    setIcon(cat.icon || '🏷️');
    setSlug(cat.id);
    setAutoSlug(false);
    setIsFormOpen(true);
  };

  const handleNameRuChange = (val: string) => {
    setNameRu(val);
    if (!nameKz) setNameKz(val);
    if (autoSlug && !editingId) {
      setSlug(slugify(val));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameRu.trim()) return;

    let finalId = slug.trim() ? slugify(slug.trim()) : slugify(nameRu);
    if (!editingId && (!finalId || finalId === 'all')) {
      finalId = `cat-${Date.now().toString(36)}`;
    }

    const newCategory: Category = {
      id: editingId || finalId,
      name: {
        ru: nameRu.trim(),
        kz: (nameKz.trim() || nameRu.trim()),
      },
      icon: icon.trim() || '🏷️',
    };

    onSaveCategory(newCategory);
    setIsFormOpen(false);
    showNotification(
      lang === 'kz'
        ? `«${newCategory.name.kz}» санаты сәтті сақталды!`
        : `Категория «${newCategory.name.ru}» успешно сохранена!`
    );
  };

  const handleDeleteConfirm = () => {
    if (!categoryToDelete) return;
    const catName = categoryToDelete.name[lang] || categoryToDelete.name.ru;
    onDeleteCategory(categoryToDelete.id);
    setCategoryToDelete(null);
    showNotification(
      lang === 'kz'
        ? `«${catName}» санаты жойылды`
        : `Категория «${catName}» удалена`
    );
  };

  // Product counter map
  const productCountPerCategory: Record<string, number> = products.reduce((acc: Record<string, number>, p) => {
    const cat = p.category || 'all';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>{lang === 'kz' ? 'Санаттарды басқару' : 'Управление категориями магазина'}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'kz'
              ? 'Қалаған санаттарыңызды қосыңыз немесе өшіріңіз. Олар дүкен мәзірінде көрсетіледі.'
              : 'Создавайте любые свои категории (например, Красота, Косметика, Витамины) или удаляйте ненужные.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-admin-add-category"
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{lang === 'kz' ? 'Жаңа санат қосу' : 'Создать категорию'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Create / Edit Form Modal or Inline */}
      {isFormOpen && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-amber-500/40 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="font-bold text-sm sm:text-base text-amber-400 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <span>
                {editingId
                  ? (lang === 'kz' ? 'Санатты өңдеу' : 'Редактирование категории')
                  : (lang === 'kz' ? 'Жаңа санат құру' : 'Создание новой категории')}
              </span>
            </h4>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name RU */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Название на русском <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nameRu}
                  onChange={(e) => handleNameRuChange(e.target.value)}
                  placeholder="например: Красота и Уход"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Name KZ */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Атауы қазақша (Название на казахском)
                </label>
                <input
                  type="text"
                  value={nameKz}
                  onChange={(e) => setNameKz(e.target.value)}
                  placeholder="мысалы: Сұлулық және күтім"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Icon picker */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Иконка / Эмодзи категории
              </label>
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {POPULAR_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                      icon === emoji
                        ? 'bg-amber-500/20 border-2 border-amber-400 scale-105'
                        : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-20 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-center text-lg focus:outline-none focus:border-amber-400"
                  placeholder="💄"
                />
                <span className="text-xs text-slate-400">
                  {lang === 'kz' ? 'Кез келген эмодзиді енгізуге болады' : 'Или введите любой свой смайлик'}
                </span>
              </div>
            </div>

            {/* ID / Slug */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Системный ID / Slug (латиницей, без пробелов)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  disabled={editingId === 'all'}
                  value={slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    setSlug(e.target.value);
                  }}
                  placeholder="cat-beauty"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-400 disabled:opacity-50"
                />
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  (например: cat-beauty)
                </span>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium transition-colors"
              >
                {lang === 'kz' ? 'Болдырмау' : 'Отмена'}
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>{lang === 'kz' ? 'Сақтау' : 'Сохранить'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat) => {
          const isSystemAll = cat.id === 'all';
          const count = isSystemAll ? products.length : (productCountPerCategory[cat.id] || 0);

          return (
            <div
              key={cat.id}
              className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                cat.id === 'cat-beauty'
                  ? 'bg-gradient-to-r from-slate-900 to-amber-950/20 border-amber-500/40 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
                  {cat.icon || '🏷️'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-100 truncate">
                      {cat.name[lang] || cat.name.ru}
                    </h4>
                    {isSystemAll && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {lang === 'kz' ? 'Негізгі' : 'Главная'}
                      </span>
                    )}
                    {cat.id === 'cat-beauty' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Firebase
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                    <span className="text-slate-500">ID: {cat.id}</span>
                    <span>•</span>
                    <span className="text-amber-400/90 flex items-center gap-1">
                      <Package className="w-3 h-3 inline" />
                      {count} {lang === 'kz' ? 'тауар' : 'товаров'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  title="Редактировать"
                  onClick={() => handleOpenEdit(cat)}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {!isSystemAll && (
                  <button
                    type="button"
                    title="Удалить категорию"
                    onClick={() => setCategoryToDelete(cat)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reset Categories button */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span>
          {lang === 'kz'
            ? `Барлығы: ${categories.length} санат`
            : `Всего категорий: ${categories.length}`}
        </span>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(lang === 'kz' ? 'Санаттарды бастапқы тізімге қайтару керек пе?' : 'Сбросить список категорий к стандартному?')) {
              onResetCategoriesToDefault();
              showNotification(lang === 'kz' ? 'Санаттар қалпына келтірілді' : 'Категории сброшены к исходным');
            }
          }}
          className="flex items-center gap-1.5 text-slate-500 hover:text-amber-400 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{lang === 'kz' ? 'Бастапқы санаттарды қайтару' : 'Сбросить к начальным категориям'}</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-100">
                {lang === 'kz' ? 'Санатты өшіру' : 'Удаление категории'}
              </h4>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {lang === 'kz'
                ? `«${categoryToDelete.name.kz || categoryToDelete.name.ru}» санатын өшіргіңіз келетініне сенімдісіз бе?`
                : `Вы действительно хотите удалить категорию «${categoryToDelete.name.ru}»?`}
              {(productCountPerCategory[categoryToDelete.id] || 0) > 0 && (
                <span className="block mt-2 font-semibold text-amber-400">
                  ⚠️ {lang === 'kz'
                    ? `Бұл санатта ${productCountPerCategory[categoryToDelete.id]} тауар бар. Тауарлар каталогта қалады, бірақ бұл санат мәзірден жойылады.`
                    : `В этой категории сейчас ${productCountPerCategory[categoryToDelete.id]} товаров. Сами товары останутся в магазине, но категория исчезнет из фильтров.`}
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium transition-colors"
              >
                {lang === 'kz' ? 'Болдырмау' : 'Отмена'}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-600/20 transition-colors"
              >
                {lang === 'kz' ? 'Иә, өшіру' : 'Да, удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
