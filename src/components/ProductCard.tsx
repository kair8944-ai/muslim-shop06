import React from 'react';
import { ShoppingBag, Zap, Star, ShieldCheck } from 'lucide-react';
import { Product, Language } from '../types';
import { STORE_INFO } from '../data/storeInfo';
import { getLocalizedText } from '../utils/translator';

interface ProductCardProps {
  product: Product;
  lang: Language;
  onAddToCart: (product: Product) => void;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  lang,
  onAddToCart,
  onOpenDetails,
}) => {
  const productName = getLocalizedText(product.name, lang);
  const badgeText = product.badge ? getLocalizedText(product.badge, lang) : null;
  const unitText = product.unit ? getLocalizedText(product.unit, lang) : null;

  // Format price nicely
  const formatPrice = (val: number) => val.toLocaleString('ru-RU') + ' ₸';

  // 1-Click WhatsApp link
  const handleOneClickOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg =
      lang === 'kz'
        ? `Сәлеметсіз бе! Тауарға тапсырыс бергім келеді: ${productName}, бағасы ${formatPrice(product.price)}`
        : `Здравствуйте! Хочу заказать товар: ${productName}, цена ${formatPrice(product.price)}`;

    const waUrl = `https://wa.me/${STORE_INFO.phoneRaw}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => onOpenDetails(product)}
      className="group relative flex flex-col rounded-2xl bg-gradient-to-b from-[#161a24] to-[#10131c] border border-amber-500/20 hover:border-amber-400/60 shadow-lg hover:shadow-[0_10px_30px_rgba(217,119,6,0.22)] transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1"
    >
      {/* Image Container */}
      <div className="relative w-full aspect-square bg-[#0b0d12] overflow-hidden">
        <img
          src={product.image}
          alt={productName}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Subtle gold sheen gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#10131c]/60 via-transparent to-black/30 pointer-events-none" />

        {/* Badge */}
        {badgeText && (
          <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-lg text-xs font-black tracking-wide uppercase bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black shadow-md">
            {badgeText}
          </div>
        )}

        {/* Category Pill */}
        {product.category === 'iherb' && (
          <div className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 backdrop-blur-sm shadow-md flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>iHerb USA</span>
          </div>
        )}

        {/* Stock status overlay if out of stock */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-red-950/90 text-red-300 border border-red-500/40 shadow-lg">
              {lang === 'kz' ? 'Тапсырыспен' : 'Под заказ'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-4">
        {/* Rating and Unit */}
        <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span className="font-bold text-slate-100 text-xs">
              {product.rating ? product.rating.toFixed(1) : '5.0'}
            </span>
            {product.reviewsCount && (
              <span className="text-[11px] text-slate-400 font-medium">
                ({product.reviewsCount})
              </span>
            )}
          </div>

          {unitText && (
            <span className="text-xs text-amber-300/80 font-medium truncate max-w-[110px] bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              {unitText}
            </span>
          )}
        </div>

        {/* Product Title - Bigger, clearer, pleasing for clients' eyes */}
        <h3 className="font-bold text-[15px] sm:text-[16px] text-white line-clamp-2 mb-2.5 group-hover:text-amber-300 transition-colors leading-snug min-h-[44px]">
          {productName}
        </h3>

        {/* Price Row */}
        <div className="mt-auto pt-2 flex items-baseline gap-2 mb-3.5">
          <span className="font-extrabold text-xl sm:text-2xl text-amber-400 tracking-tight">
            {formatPrice(product.price)}
          </span>
          {product.oldPrice && product.oldPrice > product.price && (
            <span className="text-xs sm:text-sm text-slate-400 line-through">
              {formatPrice(product.oldPrice)}
            </span>
          )}
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
          {/* User Requested: "Кнопка «⚡ В 1 клик» под каждым товаром в каталоге: открывает WhatsApp" */}
          <button
            id={`btn-oneclick-${product.id}`}
            onClick={handleOneClickOrder}
            className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/40 hover:border-[#25D366]/80 transition-all transform active:scale-95 shadow-sm cursor-pointer"
            title={
              lang === 'kz'
                ? 'WhatsApp арқылы 1 басумен тапсырыс беру'
                : 'Заказать в 1 клик через WhatsApp'
            }
          >
            <Zap className="w-4 h-4 fill-[#25D366]" />
            <span className="truncate">
              {lang === 'kz' ? '⚡ 1 басу' : '⚡ В 1 клик'}
            </span>
          </button>

          {/* Add to Cart Button */}
          <button
            id={`btn-addtocart-${product.id}`}
            onClick={handleAddToCart}
            className="flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-md shadow-amber-500/20 transition-all transform active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-black stroke-[2.5]" />
            <span className="truncate">
              {lang === 'kz' ? 'Себетке' : 'В корзину'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
