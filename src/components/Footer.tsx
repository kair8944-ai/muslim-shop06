import React from 'react';
import {
  MapPin,
  ExternalLink,
  Phone,
  Instagram,
  Lock,
  Heart,
  Truck,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { Language } from '../types';
import { STORE_INFO } from '../data/storeInfo';

interface FooterProps {
  lang: Language;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ lang, onOpenAdmin }) => {
  return (
    <footer className="bg-[#0b0d12] border-t border-amber-500/20 text-slate-400 text-xs mt-16">
      {/* Benefits Strip */}
      <div className="border-b border-slate-800/80 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-100 text-xs">
                {lang === 'kz' ? 'Атырау бойынша жеткізу' : 'Доставка по Атырау'}
              </div>
              <div className="text-[11px] text-slate-400">
                {lang === 'kz' ? '15 000 ₸ жоғары — ТЕГІН' : 'От 15 000 ₸ — БЕСПЛАТНО'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-100 text-xs">
                {lang === 'kz' ? '100% Түпнұсқа iHerb' : '100% Оригинал iHerb'}
              </div>
              <div className="text-[11px] text-slate-400">
                {lang === 'kz' ? 'АҚШ-тан тікелей келеді' : 'Прямые поставки из США'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-100 text-xs">
                {lang === 'kz' ? 'ТД «Дина Байзар», 24-бутик' : 'ТД «Дина Байзар», бутик №24'}
              </div>
              <div className="text-[11px] text-slate-400">
                {lang === 'kz' ? 'Атырау қаласы, дүкенде бар' : 'Самовывоз и примерка'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-100 text-xs">
                {lang === 'kz' ? 'Күн сайын 10:00 - 20:00' : 'Ежедневно 10:00 - 20:00'}
              </div>
              <div className="text-[11px] text-slate-400">
                {lang === 'kz' ? 'Демалыссыз жұмыс істейміз' : 'Без выходных и перерывов'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Info */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Store Bio */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-serif tracking-widest text-xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
                {STORE_INFO.name}
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                Атырау
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-md">
              {lang === 'kz'
                ? '«MUSLIM SHOP» — Атырау қаласындағы адал ислам дүкені. Түпнұсқа iHerb дәрумендері, емдік майлар, Сүннет өнімдері, араб әтірлері, кітаптар мен киімдер.'
                : '«MUSLIM SHOP» — надёжный исламский магазин в г. Атырау. Оригинальные витамины iHerb из США, товары Сунны, благородные аттары, Коран и одежда.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              {/* 2GIS Button */}
              <a
                href={STORE_INFO.twoGisUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00a046]/20 hover:bg-[#00a046]/30 text-[#4ade80] border border-[#00a046]/50 transition-colors"
              >
                <span>📍 2GIS Маршрут</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {/* WhatsApp Button */}
              <a
                href={`https://wa.me/${STORE_INFO.phoneRaw}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/50 transition-all shadow-sm"
              >
                <div className="w-5 h-5 rounded-md bg-[#25D366]/30 flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                </div>
                <span>WhatsApp: {STORE_INFO.phone}</span>
              </a>

              {/* Instagram Button - Larger, prominent, stylish */}
              <a
                href={STORE_INFO.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-amber-500/20 hover:from-pink-500/30 hover:via-purple-500/30 hover:to-amber-500/30 text-white border border-pink-500/50 hover:border-pink-400 transition-all shadow-md group"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 text-white shadow-sm group-hover:rotate-6 transition-transform">
                  <Instagram className="w-4 h-4 stroke-[2.3]" />
                </div>
                <span className="text-pink-100 group-hover:text-pink-300">{STORE_INFO.instagram}</span>
              </a>
            </div>
          </div>

          {/* Col 2: Address & Working Hours */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-100 text-xs uppercase tracking-wider text-amber-400">
              {lang === 'kz' ? 'Мекен-жайымыз' : 'Наш адрес'}
            </h4>
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-white">{STORE_INFO.address}</p>
              <p className="text-slate-400">
                {lang === 'kz' ? STORE_INFO.workHoursKz : STORE_INFO.workHoursRu}
              </p>
              <p className="text-amber-400/90 pt-1">
                {lang === 'kz'
                  ? '🚗 Қала бойынша жедел жеткізу'
                  : '🚗 Быстрая доставка курьером по городу'}
              </p>
            </div>
          </div>

          {/* Col 3: Delivery & Service */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-100 text-xs uppercase tracking-wider text-amber-400">
              {lang === 'kz' ? 'Жеткізу және қызмет' : 'Доставка и сервис'}
            </h4>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <p className="font-semibold text-white">
                  {lang === 'kz' ? 'Атырау бойынша жеткізу' : 'Курьерская доставка'}
                </p>
                <p className="text-[11px] text-emerald-400">
                  {lang === 'kz' ? '15 000 ₸ жоғары — ТЕГІН' : 'От 15 000 ₸ — БЕСПЛАТНО'}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <p className="font-semibold text-white">
                  {lang === 'kz' ? 'ТД «Дина Байзар»' : 'ТД «Дина Байзар», 24-бутик'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {lang === 'kz' ? 'Дүкенде тауарды көріп таңдау' : 'Самовывоз и примерка'}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-400 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{lang === 'kz' ? 'Әкімші панелі' : 'Панель администратора'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} MUSLIM SHOP • г. Атырау, ТД «Дина Байзар», бутик №24.
          </div>

          <div className="flex items-center gap-1 text-amber-400/90 font-medium">
            <span>Берекелі сауда тілейміз!</span>
            <Heart className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
};
