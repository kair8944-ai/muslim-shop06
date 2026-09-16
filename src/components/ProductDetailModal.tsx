import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Zap,
  Star,
  ShieldCheck,
  MapPin,
  Check,
  Instagram,
  ExternalLink,
} from 'lucide-react';
import { Product, Language } from '../types';
import { STORE_INFO } from '../data/storeInfo';
import { getLocalizedText } from '../utils/translator';

interface ProductDetailModalProps {
  product: Product | null;
  lang: Language;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  lang,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  if (!product) return null;

  const productName = getLocalizedText(product.name, lang);
  const description = getLocalizedText(product.description, lang);
  const badgeText = product.badge ? getLocalizedText(product.badge, lang) : null;
  const unitText = product.unit ? getLocalizedText(product.unit, lang) : null;

  const formatPrice = (val: number) => val.toLocaleString('ru-RU') + ' ₸';

  // 1-Click WhatsApp link
  const handleOneClickOrder = () => {
    const msg =
      lang === 'kz'
        ? `Сәлеметсіз бе! Тауарға тапсырыс бергім келеді: ${productName}, бағасы ${formatPrice(product.price)}`
        : `Здравствуйте! Хочу заказать товар: ${productName}, цена ${formatPrice(product.price)}`;

    const waUrl = `https://wa.me/${STORE_INFO.phoneRaw}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-3xl rounded-3xl bg-gradient-to-b from-[#171b26] to-[#10131d] border border-amber-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden my-auto animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="btn-close-product-modal"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 p-2.5 rounded-full bg-black/70 hover:bg-amber-500 text-slate-300 hover:text-black border border-amber-500/30 transition-all cursor-pointer shadow-lg"
          title={lang === 'kz' ? 'Жабу' : 'Закрыть'}
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Product Image */}
          <div className="relative aspect-square md:aspect-auto bg-[#0b0d12] overflow-hidden flex items-center justify-center">
            <img
              src={product.image}
              alt={productName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center max-h-[440px]"
            />
            {badgeText && (
              <div className="absolute top-3.5 left-3.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase bg-gradient-to-r from-amber-400 to-amber-600 text-black shadow-lg">
                {badgeText}
              </div>
            )}
            {product.category === 'iherb' && (
              <div className="absolute bottom-3.5 left-3.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 backdrop-blur-md shadow flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Original iHerb USA</span>
              </div>
            )}
          </div>

          {/* Details & Actions */}
          <div className="p-6 sm:p-7 flex flex-col justify-between">
            <div>
              {/* Rating & Availability */}
              <div className="flex items-center justify-between text-sm mb-3">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-bold text-white text-sm">
                    {product.rating ? product.rating.toFixed(1) : '5.0'}
                  </span>
                  <span className="text-slate-400 text-xs">
                    ({product.reviewsCount || 48} {lang === 'kz' ? 'пікір' : 'отзывов'})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {lang === 'kz' ? 'Түпнұсқа сапасы' : '100% Оригинал'}
                  </span>
                </div>
              </div>

              {/* Title - Large & readable */}
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-snug tracking-tight">
                {productName}
              </h2>

              {/* In Boutique 24 Badge */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-300/95 mb-4 bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 rounded-xl">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium">
                  {lang === 'kz'
                    ? 'Атырау қ., ТД «Дина Байзар», 24-бутикте қолда бар'
                    : 'В наличии в Атырау, ТД «Дина Байзар», бутик №24'}
                </span>
              </div>

              {/* Description - Rich, large, comfortable font */}
              <div className="text-sm sm:text-[15px] text-slate-200 leading-relaxed mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                <p className="whitespace-pre-line">{description}</p>
              </div>
            </div>

            <div>
              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
                  {formatPrice(product.price)}
                </span>
                {product.oldPrice && product.oldPrice > product.price && (
                  <span className="text-base text-slate-400 line-through">
                    {formatPrice(product.oldPrice)}
                  </span>
                )}
                {unitText && (
                  <span className="text-xs sm:text-sm text-amber-300/80 ml-auto bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                    {unitText}
                  </span>
                )}
              </div>

              {/* Quantity Stepper & Add to cart */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center border border-slate-700 rounded-xl bg-slate-900/90 shadow-inner">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 py-2.5 text-slate-300 hover:text-amber-400 text-base font-bold transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 text-base font-bold text-white min-w-[28px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3.5 py-2.5 text-slate-300 hover:text-amber-400 text-base font-bold transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  id="btn-modal-add-to-cart"
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/25 transition-all active:scale-95 cursor-pointer"
                >
                  {justAdded ? (
                    <>
                      <Check className="w-5 h-5 stroke-[3]" />
                      <span>{lang === 'kz' ? 'Себетке қосылды!' : 'Добавлено в корзину!'}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                      <span>
                        {lang === 'kz' ? 'Себетке қосу' : 'Добавить в корзину'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* 1-Click WhatsApp Button */}
              <button
                id="btn-modal-oneclick"
                onClick={handleOneClickOrder}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm sm:text-base bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/50 hover:border-[#25D366]/80 transition-all active:scale-95 shadow-sm cursor-pointer mb-2.5"
              >
                <Zap className="w-4 h-4 fill-[#25D366]" />
                <span>
                  {lang === 'kz'
                    ? '⚡ WhatsApp арқылы 1 басумен тапсырыс беру'
                    : '⚡ Заказать в 1 клик через WhatsApp'}
                </span>
              </button>

              {/* Instagram link for product */}
              <a
                href={STORE_INFO.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-amber-500/15 hover:from-pink-500/25 hover:via-purple-500/25 hover:to-amber-500/25 text-pink-300 border border-pink-500/40 hover:border-pink-400 transition-all shadow-sm"
              >
                <div className="p-1 rounded-lg bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 text-white">
                  <Instagram className="w-4 h-4" />
                </div>
                <span>
                  {lang === 'kz'
                    ? 'Бейнешолуды Instagram-нан қарау'
                    : 'Смотреть видеообзор в Instagram'}
                </span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
