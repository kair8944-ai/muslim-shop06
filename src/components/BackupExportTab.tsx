import React, { useRef, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
  FileJson,
  RefreshCw,
  Info,
  Copy,
  Code2,
  HardDrive,
} from 'lucide-react';
import { Product, Language, Category } from '../types';
import {
  exportProductsToJson,
  exportProductsToCsv,
  parseProductsJsonFile,
  copyProductsJsonToClipboard,
} from '../utils/exportImport';
import {
  downloadInitialProductsTs,
  KNOWN_STORAGE_KEYS,
  saveProductsToAllKeys,
} from '../utils/storageSync';
import {
  loadSavedFirebaseConfig,
  saveFirebaseConfig,
  pullProductsFromFirebase,
  pushProductsToFirebase,
} from '../utils/firebaseSync';

interface BackupExportTabProps {
  products: Product[];
  categories?: Category[];
  lang: Language;
  onRestoreProducts: (restoredList: Product[]) => void;
  onResetToDefault: () => void;
  onCategoriesUpdated?: (categories: Category[]) => void;
}

export const BackupExportTab: React.FC<BackupExportTabProps> = ({
  products,
  categories = [],
  lang,
  onRestoreProducts,
  onResetToDefault,
  onCategoriesUpdated,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState(false);

  // Firebase config state (configured to user's exact project id muslim-shop-55c12)
  const [firebaseConfig, setFirebaseConfig] = useState(() => loadSavedFirebaseConfig());
  const [firebaseProjectId, setFirebaseProjectId] = useState(
    firebaseConfig.projectId === 'muslim-shop' ? 'muslim-shop-55c12' : (firebaseConfig.projectId || 'muslim-shop-55c12')
  );

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // 1. Download all products in JSON
  const handleDownloadJson = () => {
    try {
      exportProductsToJson(products);
      showNotification(
        'success',
        lang === 'kz'
          ? `JSON көшірмесі сәтті жүктелді! (${products.length} тауар телефонға/ПК-ге сақталды)`
          : `Файл JSON успешно скачан! (${products.length} товаров сохранены на телефон/ПК)`
      );
    } catch {
      showNotification(
        'error',
        lang === 'kz' ? 'Файлды жүктеу қатесі' : 'Ошибка при скачивании файла'
      );
    }
  };

  // 2. Export to CSV (Excel)
  const handleExportCsv = () => {
    try {
      exportProductsToCsv(products);
      showNotification(
        'success',
        lang === 'kz'
          ? `Excel (CSV) кестесі жүктелді! Microsoft Excel-де дұрыс ашылады`
          : `Таблица Excel (CSV) скачана! Корректно открывается в Microsoft Excel`
      );
    } catch {
      showNotification(
        'error',
        lang === 'kz' ? 'CSV экспорттау қатесі' : 'Ошибка при экспорте в CSV'
      );
    }
  };

  // 3. Restore / Load products from JSON
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const result = await parseProductsJsonFile(file);
    setIsProcessing(false);

    if (result.success && result.products) {
      // Save across all browser keys immediately
      saveProductsToAllKeys(result.products);
      onRestoreProducts(result.products);
      showNotification(
        'success',
        lang === 'kz'
          ? `🎉 Сәтті! ${result.count} тауар .JSON файлынан қалпына келтірілді және барлық жадқа сақталды!`
          : `🎉 Успешно! Загружено ${result.count} товаров из JSON в 1 клик и сохранено во все ключи браузера!`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      showNotification(
        'error',
        result.error ||
          (lang === 'kz'
            ? 'Файлды оқу қатесі'
            : 'Не удалось прочитать файл резервной копии')
      );
    }
  };

  // 4. Copy JSON to Clipboard
  const handleCopyClipboard = async () => {
    const ok = await copyProductsJsonToClipboard(products);
    if (ok) {
      showNotification(
        'success',
        lang === 'kz'
          ? '📋 Барлық тауарлардың JSON коды буферге көшірілді!'
          : '📋 JSON со всеми товарами скопирован в буфер обмена!'
      );
    } else {
      showNotification(
        'error',
        lang === 'kz' ? 'Буферге көшіру қатесі' : 'Не удалось скопировать в буфер'
      );
    }
  };

  // 5. Download initialProducts.ts for GitHub
  const handleDownloadGitHubTs = () => {
    try {
      downloadInitialProductsTs(products);
      showNotification(
        'success',
        lang === 'kz'
          ? '💻 initialProducts.ts файлы жүктелді! Оны GitHub репозиторийіне салып, тауарларды мәңгі сақтай аласыз.'
          : '💻 Файл initialProducts.ts скачан! Замените им файл в GitHub, чтобы товары не сбрасывались к демо-товарам при новом билде.'
      );
    } catch {
      showNotification('error', 'Ошибка генерации файла для GitHub');
    }
  };

  // Re-sync all keys manually
  const handleForceSyncKeys = () => {
    saveProductsToAllKeys(products);
    showNotification(
      'success',
      lang === 'kz'
        ? `Браузердің барлық кілттері (${KNOWN_STORAGE_KEYS.join(', ')}) сәтті синхрондалды!`
        : `Все ключи браузера (${KNOWN_STORAGE_KEYS.join(', ')}) успешно синхронизированы!`
    );
  };

  // Firebase Pull: Fetch products from Firestore (products, cat-beauty, etc.)
  const handlePullFromFirebase = async () => {
    const projId = firebaseProjectId.trim() || 'muslim-shop-55c12';
    setIsFirebaseSyncing(true);
    showNotification(
      'info',
      lang === 'kz'
        ? `«${projId}» жобасының бұлтты базасынан тауарлар мен категориялар жүктелуде...`
        : `Подключаемся к Firebase «${projId}» и сканируем коллекции товаров и категорий...`
    );

    try {
      const cfg = { ...firebaseConfig, projectId: projId };
      saveFirebaseConfig(cfg);
      setFirebaseConfig(cfg);

      const res = await pullProductsFromFirebase(cfg, ['products', 'cat-beauty', 'items', 'catalog']);
      setIsFirebaseSyncing(false);

      if (res.success && res.products.length > 0) {
        // Save to browser keys
        saveProductsToAllKeys(res.products);
        onRestoreProducts(res.products);

        // If categories found, update categories
        if (res.categories.length > 0 && onCategoriesUpdated) {
          const mergedCategories = [...categories];
          for (const newCat of res.categories) {
            if (!mergedCategories.some((c) => c.id === newCat.id)) {
              mergedCategories.push(newCat);
            }
          }
          onCategoriesUpdated(mergedCategories);
        }

        showNotification(
          'success',
          lang === 'kz'
            ? `🎉 Firebase-тен ${res.products.length} тауар сәтті тартылып, каталогқа қосылды!`
            : `🎉 Успешно подтянуто ${res.products.length} товаров из вашего облака Firebase!`
        );
      } else {
        showNotification(
          'error',
          lang === 'kz'
            ? `Firebase-тен тауарлар табылмады. Себебі: ${res.errorMessage || 'Коллекциялар бос немесе оқуға рұқсат жабық'}`
            : `Товары в Firebase не найдены. ${res.errorMessage || 'Проверьте название проекта и правила доступа Rules'}`
        );
      }
    } catch (err: any) {
      setIsFirebaseSyncing(false);
      showNotification(
        'error',
        lang === 'kz'
          ? `Firebase байланыс қатесі: ${err?.message || 'Деректерді жүктеу сәтсіз аяқталды'}`
          : `Ошибка связи с Firebase: ${err?.message || 'Не удалось загрузить данные'}`
      );
    }
  };

  // Firebase Push: Save current products into Firestore
  const handlePushToFirebase = async () => {
    const projId = firebaseProjectId.trim() || 'muslim-shop-55c12';
    setIsFirebaseSyncing(true);
    try {
      const cfg = { ...firebaseConfig, projectId: projId };
      saveFirebaseConfig(cfg);
      setFirebaseConfig(cfg);

      const res = await pushProductsToFirebase(cfg, products);
      setIsFirebaseSyncing(false);

      if (res.success) {
        showNotification(
          'success',
          lang === 'kz'
            ? `🎉 Барлық ${res.count} тауар Firebase Firestore «products» коллекциясына сақталды!`
            : `🎉 Все ${res.count} товаров сохранены в коллекцию «products» в Firebase Firestore!`
        );
      } else {
        showNotification(
          'error',
          lang === 'kz'
            ? `Firebase-ке сақтау қатесі: ${res.error || 'Қолжетімділік жабық'}`
            : `Ошибка сохранения в Firebase: ${res.error || 'Проверьте Firestore Rules'}`
        );
      }
    } catch (err: any) {
      setIsFirebaseSyncing(false);
      showNotification(
        'error',
        lang === 'kz'
          ? `Қате: ${err?.message || 'Firebase серверіне қосылу мүмкін болмады'}`
          : `Ошибка: ${err?.message || 'Не удалось подключиться к серверу Firebase'}`
      );
    }
  };

  const iherbCount = products.filter((p) => p.category === 'iherb').length;
  const inStockCount = products.filter((p) => p.inStock).length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stockQuantity, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-600/15 to-emerald-500/20 border border-amber-500/40 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500 text-black shadow-md">
              <Database className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                <span>💾 {lang === 'kz' ? 'Копия базы және экспорт' : 'Копия базы и экспорт в 1 клик'}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal border border-emerald-500/40">
                  Синхронизировано
                </span>
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed mt-0.5">
                {lang === 'kz'
                  ? 'Тауарларыңыз браузердің барлық кілттерінде (muslim_shop_products, muslim_shop_products_v2, products) автоматты түрде сақталады. Сондай-ақ телефонға JSON жүктеп немесе GitHub-қа прошивка жасай аласыз.'
                  : 'Все ваши товары сохраняются одновременно во все ключи браузера (muslim_shop_products, muslim_shop_products_v2, products). Сохраняйте резервные копии на телефон и выгружайте на GitHub без потери данных.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-lg bg-black/50 border border-amber-500/40 text-amber-300 font-mono font-bold">
              {products.length} {lang === 'kz' ? 'нақты тауар' : 'товаров в базе'}
            </span>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/50'
              : notification.type === 'error'
              ? 'bg-red-950/80 text-red-200 border border-red-500/50'
              : 'bg-amber-950/80 text-amber-200 border border-amber-500/50'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Firebase Firestore Direct Sync Card (Screenshot integration) */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900 border-2 border-amber-500/60 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Database className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm sm:text-base text-slate-100">
                  🔥 {lang === 'kz' ? 'Firebase Firestore деректер қоры' : 'Синхронизация с базой данных Firebase'}
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                  Cloud Firestore
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'kz'
                  ? '«muslim-shop-55c12» бұлтты базасымен тікелей байланыс (products, categories)'
                  : 'Прямая подтяжка товаров и категорий из облака «muslim-shop-55c12»'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono">Project ID:</span>
            <input
              type="text"
              id="input-firebase-project-id"
              value={firebaseProjectId}
              onChange={(e) => {
                setFirebaseProjectId(e.target.value);
                saveFirebaseConfig({ projectId: e.target.value });
              }}
              placeholder="muslim-shop-55c12"
              className="px-3 py-1.5 rounded-xl bg-black/70 border border-amber-500/40 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-400 w-36 sm:w-44"
              title="Firebase Project ID"
            />
          </div>
        </div>

        {/* Action Buttons for Firebase */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            id="btn-firebase-pull"
            type="button"
            disabled={isFirebaseSyncing}
            onClick={handlePullFromFirebase}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isFirebaseSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>
              {isFirebaseSyncing
                ? (lang === 'kz' ? 'Firebase-тен жүктелуде...' : 'Подтягиваем из Firebase...')
                : (lang === 'kz' ? '📥 Firebase-тен барлық тауарларды тарту' : '📥 Подтянуть все товары из Firebase')}
            </span>
          </button>

          <button
            id="btn-firebase-push"
            type="button"
            disabled={isFirebaseSyncing || products.length === 0}
            onClick={handlePushToFirebase}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>
              {lang === 'kz' ? '📤 Firebase-ке тауарларды сақтау' : '📤 Сохранить товары в Firebase'}
            </span>
          </button>
        </div>

        {/* Cloud Console Context Note */}
        <div className="p-3 rounded-xl bg-black/50 border border-amber-500/20 text-[11px] sm:text-xs text-slate-300 space-y-1">
          <div className="flex items-center justify-between gap-1.5 text-amber-400 font-semibold">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{lang === 'kz' ? 'Бұлтты база (muslim-shop-55c12):' : 'Облачная база (muslim-shop-55c12):'}</span>
            </div>
            <a
              href="https://console.firebase.google.com/u/0/project/muslim-shop-55c12/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-amber-400 hover:text-amber-300 underline font-mono"
            >
              console.firebase.google.com ↗
            </a>
          </div>
          <p className="text-slate-400 leading-relaxed">
            {lang === 'kz'
              ? 'Сіздің Firebase консоліндегі «muslim-shop-55c12» жобасының «products» және «categories» коллекцияларымен тікелей байланыс орнатылған. «📥 Firebase-тен барлық тауарларды тарту» батырмасы барлық 16+ тауарды және санаттарды бұлттан лезде жаңартады.'
              : 'Установлена прямая интеграция с вашим проектом «muslim-shop-55c12» (коллекции «products» и «categories»). Кнопка «📥 Подтянуть все товары из Firebase» синхронизирует все 16+ реальных товаров и категории прямо из вашего облака.'}
          </p>
        </div>
      </div>

      {/* Main 1-Click Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Button 1: Download all products in JSON */}
        <div className="p-5 rounded-2xl bg-[#171b24] border-2 border-amber-500/50 hover:border-amber-400 shadow-lg flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <FileJson className="w-6 h-6" />
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-amber-300 uppercase font-bold">
                В 1 КЛИК
              </span>
            </div>
            <h4 className="font-bold text-base text-slate-100 mb-1.5 group-hover:text-amber-300 transition-colors">
              📥 {lang === 'kz' ? 'Барлық тауарларды JSON-ға жүктеу' : 'Скачать все товары в JSON'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {lang === 'kz'
                ? 'Барлық нақты тауарларыңызды (баға, сурет, атау, қалдық) телефонға немесе компьютерге .JSON файлы ретінде сақтайды.'
                : 'Сохраняет файл со всеми вашими товарами, фото, ценами и описаниями на телефон или компьютер для надёжной копии.'}
            </p>
          </div>

          <button
            id="btn-admin-download-json"
            onClick={handleDownloadJson}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>
              {lang === 'kz' ? '📥 Скачать все товары в JSON' : '📥 Скачать все товары в JSON'}
            </span>
          </button>
        </div>

        {/* Button 2: Upload products from JSON (1-Click Restore) */}
        <div className="p-5 rounded-2xl bg-[#171b24] border-2 border-sky-500/50 hover:border-sky-400 shadow-lg flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40">
                <Upload className="w-6 h-6" />
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-sky-300 uppercase font-bold">
                В 1 КЛИК
              </span>
            </div>
            <h4 className="font-bold text-base text-slate-100 mb-1.5 group-hover:text-sky-300 transition-colors">
              📤 {lang === 'kz' ? 'Тауарларды JSON-нан жүктеу' : 'Загрузить товары из JSON'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {lang === 'kz'
                ? 'Бұрын сақталған файлды таңдап, кез келген құрылғыда, жаңа сайтта немесе GitHub-та барлық тауарларды 1 кликпен қалпына келтіріңіз.'
                : 'Загрузите сохранённый файл JSON на любом сайте или устройстве, чтобы моментально восстановить все свои товары.'}
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
            id="file-restore-json"
          />

          <button
            id="btn-admin-restore-json"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-black shadow-lg shadow-sky-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Upload className="w-4 h-4 stroke-[2.5]" />
            <span>
              {isProcessing
                ? lang === 'kz'
                  ? 'Оқылуда...'
                  : 'Загрузка...'
                : '📤 Загрузить товары из JSON'}
            </span>
          </button>
        </div>

        {/* Button 3: Permanent GitHub file export (initialProducts.ts) */}
        <div className="p-5 rounded-2xl bg-[#171b24] border-2 border-emerald-500/50 hover:border-emerald-400 shadow-lg flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <Code2 className="w-6 h-6" />
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-emerald-300 uppercase font-bold">
                GITHUB
              </span>
            </div>
            <h4 className="font-bold text-base text-slate-100 mb-1.5 group-hover:text-emerald-300 transition-colors">
              💻 {lang === 'kz' ? 'GitHub үшін файлды жүктеу' : 'Скачать файл для GitHub'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {lang === 'kz'
                ? 'GitHub-қа выгрузка жасағанда демо-тауарларға қайтып кетпес үшін, дайын «initialProducts.ts» файлын жүктеп, репозиторийде жаңартыңыз.'
                : 'Скачивает файл `initialProducts.ts` со всеми вашими товарами, чтобы при выгрузке на GitHub они стали постоянными.'}
            </p>
          </div>

          <button
            id="btn-admin-github-ts"
            onClick={handleDownloadGitHubTs}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>
              {lang === 'kz' ? '💻 initialProducts.ts (GitHub)' : '💻 Скачать initialProducts.ts'}
            </span>
          </button>
        </div>
      </div>

      {/* Secondary Tools: Clipboard Copy, Excel Export & Storage Sync */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Copy to Clipboard */}
        <button
          id="btn-copy-json-clipboard"
          onClick={handleCopyClipboard}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all hover:border-amber-500/40"
        >
          <Copy className="w-4 h-4 text-amber-400" />
          <span>{lang === 'kz' ? '📋 JSON-ды буферге көшіру' : '📋 Скопировать JSON товаров'}</span>
        </button>

        {/* Excel Export */}
        <button
          id="btn-admin-export-csv"
          onClick={handleExportCsv}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all hover:border-emerald-500/40"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>{lang === 'kz' ? '📊 Экспорт в Excel (CSV)' : '📊 Экспорт в Excel (CSV)'}</span>
        </button>

        {/* Sync all keys */}
        <button
          id="btn-admin-sync-keys"
          onClick={handleForceSyncKeys}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all hover:border-sky-500/40"
        >
          <HardDrive className="w-4 h-4 text-sky-400" />
          <span>{lang === 'kz' ? 'Синхронизация кілттері' : 'Синхронизировать ключи'}</span>
        </button>
      </div>

      {/* Storage Keys Status Card */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-bold flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span>
              {lang === 'kz'
                ? 'Браузердегі сақтау кілттері (авто-синхронизация):'
                : 'Ключи сохранения в браузере (авто-синхронизация):'}
            </span>
          </span>
          <span className="text-[11px] text-emerald-400 font-mono">● Активно</span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {KNOWN_STORAGE_KEYS.map((k) => (
            <span
              key={k}
              className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-black/60 border border-slate-700 text-slate-300"
            >
              ✓ {k}
            </span>
          ))}
        </div>
      </div>

      {/* Summary Statistics & Reset */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-400">
          <div>
            <span className="text-slate-500">
              {lang === 'kz' ? '💊 iHerb дәрумендері:' : '💊 iHerb Витамины:'}
            </span>{' '}
            <strong className="text-emerald-400">{iherbCount} шт.</strong>
          </div>
          <div>
            <span className="text-slate-500">
              {lang === 'kz' ? 'Қолда бар:' : 'В наличии:'}
            </span>{' '}
            <strong className="text-amber-400">{inStockCount} шт.</strong>
          </div>
          <div>
            <span className="text-slate-500">
              {lang === 'kz' ? 'Жалпы құны:' : 'Оценочная стоимость:'}
            </span>{' '}
            <strong className="text-slate-200">
              {totalValue.toLocaleString('ru-RU')} ₸
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            id="btn-reset-catalog-default"
            onClick={() => {
              if (
                window.confirm(
                  lang === 'kz'
                    ? 'Барлық тауарларды бастапқы күйге қайтаруды растайсыз ба?'
                    : 'Сбросить все товары к начальным настройкам магазина?'
                )
              ) {
                onResetToDefault();
                showNotification(
                  'info',
                  lang === 'kz'
                    ? 'Каталог бастапқы қалпына келтірілді'
                    : 'Каталог сброшен к начальным настройкам'
                );
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-amber-400 hover:bg-slate-800/80 border border-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>
              {lang === 'kz'
                ? 'Бастапқы күйге сбросить'
                : 'Сбросить все товары...'}
            </span>
          </button>
        </div>
      </div>

      {/* Helpful tip box */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {lang === 'kz'
            ? 'Маңызды: Әрбір жаңа тауар қосқан соң, бірден «📥 Скачать все товары в JSON» басып, файлды телефоныңызға сақтап қойыңыз. Осы файл арқылы тауарларыңызды кез келген уақытта 1 секундта қалпына келтіре аласыз.'
            : 'Важно: После добавления или изменения товаров нажмите «📥 Скачать все товары в JSON» и сохраните файл на телефон. Этот файл позволяет в 1 клик переносить каталог между устройствами, серверами и версиями сайта.'}
        </p>
      </div>
    </div>
  );
};
