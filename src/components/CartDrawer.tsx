import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Truck,
  ArrowRight,
  MessageCircle,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { CartItem, Language } from '../types';
import { STORE_INFO } from '../data/storeInfo';
import { getLocalizedText } from '../utils/translator';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  lang: Language;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  lang,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  // Customer order fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const totalToPay = subtotal;

  // Free delivery calculation
  const freeThreshold = STORE_INFO.freeDeliveryThreshold; // 15 000 ₸
  const freeRemaining = Math.max(0, freeThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeThreshold) * 100));
  const isFreeDelivery = subtotal >= freeThreshold;

  const formatPrice = (val: number) => val.toLocaleString('ru-RU') + ' ₸';

  // Checkout via WhatsApp
  const handleCheckoutWhatsApp = () => {
    const lines: string[] = [];

    lines.push(
      lang === 'kz'
        ? '🌙 Сәлеметсіз бе! «MUSLIM SHOP» интернет-дүкенінен жаңа тапсырыс:'
        : '🌙 Здравствуйте! Новый заказ в интернет-магазине «MUSLIM SHOP» (г. Атырау):'
    );
    lines.push('');

    items.forEach((item, index) => {
      const name = item.product.name[lang] || item.product.name.ru;
      lines.push(
        `${index + 1}. ${name} — ${item.quantity} шт. x ${formatPrice(
          item.product.price
        )} = ${formatPrice(item.product.price * item.quantity)}`
      );
    });

    lines.push('');
    lines.push(
      `${lang === 'kz' ? 'Тауарлар сомасы:' : 'Сумма заказа:'} ${formatPrice(
        subtotal
      )}`
    );

    lines.push(
      `${lang === 'kz' ? 'Жеткізу:' : 'Доставка:'} ${
        isFreeDelivery
          ? lang === 'kz'
            ? 'ТЕГІН (15 000 ₸ жоғары)'
            : 'БЕСПЛАТНО (акция от 15 000 ₸)'
          : deliveryType === 'pickup'
          ? lang === 'kz'
            ? 'Өзі алып кету (ТД «Дина Байзар», 24-бутик)'
            : 'Самовывоз (ТД «Дина Байзар», бутик №24)'
          : lang === 'kz'
          ? 'Атырау бойынша курьерлік жеткізу'
          : 'Доставка курьером по Атырау'
      }`
    );

    if (deliveryType === 'delivery' && deliveryAddress.trim()) {
      lines.push(
        `${lang === 'kz' ? 'Мекен-жайы:' : 'Адрес доставки:'} ${deliveryAddress.trim()}`
      );
    }

    if (customerName.trim()) {
      lines.push(
        `${lang === 'kz' ? 'Алушы:' : 'Имя клиента:'} ${customerName.trim()}`
      );
    }

    if (customerPhone.trim()) {
      lines.push(
        `${lang === 'kz' ? 'Телефон:' : 'Телефон:'} ${customerPhone.trim()}`
      );
    }

    lines.push('');
    lines.push(
      `${lang === 'kz' ? 'Төлеуге барлығы:' : 'Итого к оплате:'} *${formatPrice(
        totalToPay
      )}*`
    );
    lines.push('');
    lines.push(
      lang === 'kz'
        ? 'Тапсырысымды қабылдап, растауыңызды күтемін! Рақмет!'
        : 'Пожалуйста, подтвердите наличие и время отправки. Спасибо!'
    );

    const text = encodeURIComponent(lines.join('\n'));
    const url = `https://wa.me/${STORE_INFO.phoneRaw}?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0e1017] border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#12151f]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">
                  {lang === 'kz' ? 'Себет' : 'Корзина покупателя'}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {items.length}{' '}
                  {lang === 'kz' ? 'позиция' : 'наименований'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {items.length > 0 && (
                <button
                  onClick={onClearCart}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 text-xs transition-colors"
                  title={lang === 'kz' ? 'Себетті тазарту' : 'Очистить корзину'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Free delivery progress bar */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 to-[#121520] border-b border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Truck className="w-4 h-4 text-amber-400" />
                <span>
                  {isFreeDelivery
                    ? lang === 'kz'
                      ? '🎉 Тегін жеткізу қолжетімді!'
                      : '🎉 Бесплатная доставка по Атырау!'
                    : lang === 'kz'
                    ? 'Тегін жеткізу үшін:'
                    : 'До бесплатной доставки:'}
                </span>
              </span>

              <span className="font-bold text-amber-400">
                {isFreeDelivery
                  ? lang === 'kz'
                    ? 'ТЕГІН'
                    : 'БЕСПЛАТНО'
                  : formatPrice(freeRemaining)}
              </span>
            </div>

            {/* Progress bar line */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isFreeDelivery
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    : 'bg-gradient-to-r from-amber-500 to-amber-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="text-[10px] text-slate-400 mt-1">
              {isFreeDelivery
                ? lang === 'kz'
                  ? 'Атырау қаласы бойынша курьерлік жеткізу тегін жүзеге асады'
                  : 'Заказ на сумму от 15 000 ₸ доставляется курьером бесплатно'
                : lang === 'kz'
                ? `Тағы ${formatPrice(freeRemaining)} қалды (15 000 ₸-ден жоғары тегін)`
                : `Добавьте товаров на ${formatPrice(freeRemaining)} для бесплатной доставки`}
            </p>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-800/60">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-500">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h4 className="font-bold text-slate-300 text-sm">
                  {lang === 'kz' ? 'Себетіңіз әзірге бос' : 'Ваша корзина пуста'}
                </h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  {lang === 'kz'
                    ? 'Каталогтан қажетті дәрумендерді немесе тауарларды таңдап, себетке қосыңыз'
                    : 'Выберите нужные витамины iHerb или товары Сунны в каталоге'}
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-colors"
                >
                  {lang === 'kz' ? 'Каталогқа оралу' : 'Перейти к покупкам'}
                </button>
              </div>
            ) : (
              items.map((item) => {
                const name = item.product.name[lang] || item.product.name.ru;
                return (
                  <div
                    key={item.product.id}
                    className="pt-3 first:pt-0 flex items-center gap-3"
                  >
                    <img
                      src={item.product.image}
                      alt={name}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-900 border border-slate-800 flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs text-white line-clamp-2 leading-tight">
                        {name}
                      </h4>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-xs font-bold text-amber-400">
                          {formatPrice(item.product.price)}
                        </span>
                      </div>

                      {/* Quantity buttons */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, -1)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold font-mono text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, 1)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-[11px] text-slate-400 font-mono">
                          = {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                      title={lang === 'kz' ? 'Жою' : 'Удалить'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Area */}
          {items.length > 0 && (
            <div className="p-4 border-t border-slate-800 bg-[#0f1116] space-y-3">
              {/* Delivery Options Selection */}
              <div className="border-t border-slate-800/80 pt-1">
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold mb-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('delivery')}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                      deliveryType === 'delivery'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    🚗 {lang === 'kz' ? 'Жеткізу' : 'Доставка'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                      deliveryType === 'pickup'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    🏪 {lang === 'kz' ? 'Бутик 24 алып кету' : 'Самовывоз бутик 24'}
                  </button>
                </div>

                {deliveryType === 'delivery' ? (
                  <input
                    id="input-customer-address"
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={
                      lang === 'kz'
                        ? 'Атыраудағы мекен-жай (мысалы: Авангард 3 мкр...)'
                        : 'Адрес доставки в Атырау (мкр, улица, дом)...'
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                ) : (
                  <div className="text-[11px] text-amber-400/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    📍 {lang === 'kz' ? 'Атырау қ., ТД «Дина Байзар», 24-бутик' : 'г. Атырау, ТД «Дина Байзар», бутик №24'}
                  </div>
                )}
              </div>

              {/* Customer Contact (Optional) */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={lang === 'kz' ? 'Есіміңіз (міндетті емес)' : 'Ваше имя (необязательно)'}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder={lang === 'kz' ? 'Телефон' : 'Телефон'}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Cost Summary */}
              <div className="space-y-1 text-xs pt-2 border-t border-slate-800/80">
                <div className="flex justify-between text-slate-400">
                  <span>{lang === 'kz' ? 'Тауарлар сомасы:' : 'Сумма заказа:'}</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>{lang === 'kz' ? 'Жеткізу:' : 'Доставка:'}</span>
                  <span className={isFreeDelivery ? 'text-emerald-400 font-bold' : ''}>
                    {isFreeDelivery
                      ? lang === 'kz'
                        ? 'ТЕГІН (Акция)'
                        : 'БЕСПЛАТНО (Акция)'
                      : deliveryType === 'pickup'
                      ? lang === 'kz'
                        ? '0 ₸ (Самовывоз)'
                        : '0 ₸ (Самовывоз)'
                      : lang === 'kz'
                      ? 'Тариф бойынша'
                      : 'По тарифу курьера'}
                  </span>
                </div>

                <div className="flex justify-between text-slate-100 font-bold text-sm pt-1.5 border-t border-slate-800">
                  <span>{lang === 'kz' ? 'Төлеуге барлығы:' : 'Итого к оплате:'}</span>
                  <span className="text-base text-amber-400">{formatPrice(totalToPay)}</span>
                </div>
              </div>

              {/* Order via WhatsApp Button */}
              <button
                id="btn-cart-checkout-whatsapp"
                onClick={handleCheckoutWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-[#25D366] hover:bg-[#20bd5a] text-black shadow-lg shadow-[#25D366]/20 transition-all transform active:scale-98"
              >
                <MessageCircle className="w-4 h-4 fill-black" />
                <span>
                  {lang === 'kz'
                    ? 'WhatsApp арқылы тапсырысты растау'
                    : 'Оформить заказ в WhatsApp'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
