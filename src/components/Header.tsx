import React from 'react';
import {
  ShoppingBag,
  MapPin,
  ExternalLink,
  Lock,
  Instagram,
  Phone,
  Search,
  Sparkles,
} from 'lucide-react';
import { Language, CartItem } from '../types';
import { STORE_INFO } from '../data/storeInfo';

interface HeaderProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  cartItems: CartItem[];
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onLanguageChange,
  cartItems,
  onOpenCart,
  onOpenAdmin,
  searchQuery,
  onSearchChange,
}) => {
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-[#0d0f14]/95 backdrop-blur-md border-b border-amber-500/25 shadow-xl">
      {/* Top Bar: Address, 2GIS Button, WhatsApp & Instagram */}
      <div className="border-b border-white/5 bg-black/50 text-xs sm:text-sm text-slate-300">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
          {/* Address & 2GIS Route button */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3.5">
            <div className="flex items-center gap-2 text-slate-200">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold text-xs sm:text-sm">{STORE_INFO.address}</span>
            </div>

            {/* User Requested: "Кнопка «📍 2GIS Маршрут» в шапке сайта рядом с адресом" */}
            <a
              id="btn-header-2gis-route"
              href={STORE_INFO.twoGisUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#00a046]/20 hover:bg-[#00a046]/35 text-[#4ade80] border border-[#00a046]/60 shadow-sm transition-all hover:scale-105"
              title="Открыть маршрут к ТД Дина Байзар бутик №24 в 2GIS"
            >
              <span className="text-[14px] leading-none">📍</span>
              <span className="tracking-wide">2GIS Маршрут</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>

          {/* Social Contacts & Language & Admin */}
          <div className="flex items-center gap-3 ml-auto">
            {/* WhatsApp link */}
            <a
              id="link-header-whatsapp"
              href={`https://wa.me/${STORE_INFO.phoneRaw}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 text-slate-200 hover:text-emerald-400 font-semibold text-xs sm:text-sm transition-colors"
            >
              <div className="w-5 h-5 rounded-md bg-[#25D366]/20 flex items-center justify-center text-[#25D366]">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <span>{STORE_INFO.phone}</span>
            </a>

            {/* User Requested: "Нужно сделать иконку Инстаграма покрупнее, что-то она маленькая слишком, значок Инстаграма" */}
            <a
              id="link-header-instagram"
              href={STORE_INFO.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-amber-500/20 hover:from-pink-500/30 hover:via-purple-500/30 hover:to-amber-500/30 border border-pink-500/50 hover:border-pink-400 text-white transition-all shadow-md hover:scale-105 active:scale-95 group"
              title="Instagram: @muslim_shop_atyrau"
            >
              {/* Prominent Large Instagram Icon with Official Gradient */}
              <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/40 group-hover:rotate-6 transition-transform">
                <Instagram className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.3]" />
              </div>
              <span className="font-bold text-xs sm:text-sm text-pink-100 group-hover:text-pink-300">
                {STORE_INFO.instagram}
              </span>
            </a>

            {/* Language Switcher RU / KZ */}
            <div className="inline-flex items-center rounded-xl bg-slate-900 border border-amber-500/40 p-1 shadow-inner">
              <button
                id="btn-lang-ru"
                onClick={() => onLanguageChange('ru')}
                className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  lang === 'ru'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                RU
              </button>
              <button
                id="btn-lang-kz"
                onClick={() => onLanguageChange('kz')}
                className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  lang === 'kz'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                KZ
              </button>
            </div>

            {/* Admin Panel Entry */}
            <button
              id="btn-open-admin-pin"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition-colors text-xs px-2.5 py-1 rounded-lg border border-transparent hover:border-amber-500/30"
              title={lang === 'kz' ? 'Әкімші панелі' : 'Панель администратора'}
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden lg:inline font-medium">{lang === 'kz' ? 'Әкімші' : 'Админ'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar: Brand, Search, Cart */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-amber-700 text-black shadow-[0_0_15px_rgba(217,119,6,0.35)] ring-1 ring-amber-300/40">
              <span className="font-serif text-xl sm:text-2xl font-black tracking-wider">M</span>
              <Sparkles className="w-3.5 h-3.5 absolute -top-1 -right-1 text-amber-300 fill-amber-300" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif tracking-widest text-lg sm:text-2xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
                  {STORE_INFO.name}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {STORE_INFO.city}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-200/80 hidden sm:block font-medium">
                {lang === 'kz'
                  ? '«Дина Байзар» СО, 24-бутик • Түпнұсқа iHerb дәрумендері мен Ислам тауарлары'
                  : 'ТД «Дина Байзар», бутик №24 • Оригинал iHerb витамины и товары Сунны'}
              </p>
            </div>
          </div>

          {/* Search Bar - Larger, comfortable reading */}
          <div className="hidden md:flex flex-1 max-w-lg mx-4 relative">
            <input
              id="input-global-search"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                lang === 'kz'
                  ? 'Тауарлар, iHerb дәрумендері, қара зере майы, жайнамаз...'
                  : 'Поиск товаров, витаминов iHerb, тмина, жайнамаза...'
              }
              className="w-full pl-11 pr-10 py-2.5 rounded-xl bg-slate-900/95 border border-amber-500/30 focus:border-amber-400 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all shadow-inner"
            />
            <Search className="w-5 h-5 text-amber-400/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Cart Button */}
          <div className="flex items-center gap-3">
            <button
              id="btn-header-cart"
              onClick={onOpenCart}
              className="relative flex items-center gap-3 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm sm:text-base shadow-[0_4px_20px_rgba(217,119,6,0.35)] transition-all transform active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 text-black stroke-[2.5]" />
              <span className="hidden sm:inline">
                {lang === 'kz' ? 'Себет' : 'Корзина'}
              </span>
              {totalCartCount > 0 ? (
                <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-black text-amber-400 text-xs sm:text-sm font-black ring-2 ring-amber-400">
                  {totalCartCount}
                </span>
              ) : (
                <span className="hidden sm:inline text-xs opacity-85 font-medium">
                  0 ₸
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar - Larger text */}
        <div className="mt-3 md:hidden relative">
          <input
            id="input-mobile-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              lang === 'kz'
                ? 'Тауарлар, iHerb дәрумендері, қара зере...'
                : 'Поиск товаров, витаминов iHerb, масел...'
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-amber-500/30 focus:border-amber-400 text-sm text-white placeholder-slate-400 focus:outline-none shadow-inner"
          />
          <Search className="w-4 h-4 text-amber-400/80 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>
    </header>
  );
};
