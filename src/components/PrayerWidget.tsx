import React, { useState, useEffect } from 'react';
import { Clock, ChevronDown, ChevronUp, MapPin, Compass } from 'lucide-react';
import { Language } from '../types';
import { calculateNextPrayer, getPrayerName } from '../utils/prayerTimes';

interface PrayerWidgetProps {
  lang: Language;
}

export const PrayerWidget: React.FC<PrayerWidgetProps> = ({ lang }) => {
  const [prayerData, setPrayerData] = useState(() => calculateNextPrayer(new Date()));
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Update countdown every second
    const timer = setInterval(() => {
      setPrayerData(calculateNextPrayer(new Date()));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const { nextPrayer, formattedCountdown, items } = prayerData;
  const nextPrayerName = nextPrayer ? getPrayerName(nextPrayer, lang) : '';

  return (
    <div className="relative z-20 border-y border-amber-500/20 bg-gradient-to-r from-[#12151b] via-[#1a1f29] to-[#12151b] text-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 text-xs sm:text-sm">
          {/* Next Prayer Countdown Bar */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-[260px]">
            <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
              <Clock className="w-4 h-4" />
            </span>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-slate-400">
                {lang === 'kz' ? 'Атырау' : 'Атырау'}:
              </span>
              <span className="text-slate-300 font-medium">
                {lang === 'kz' ? 'Келесі намаз' : 'Следующий намаз'}:
              </span>
              <span className="text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30">
                {nextPrayerName} ({nextPrayer?.timeStr})
              </span>
              <span className="text-slate-400">
                {lang === 'kz' ? 'қалды:' : 'осталось:'}
              </span>
              <span className="font-mono font-bold tracking-wider text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-amber-500/20">
                {formattedCountdown}
              </span>
            </div>
          </div>

          {/* Actions: View full schedule toggle */}
          <div className="flex items-center gap-2">
            <button
              id="btn-toggle-prayer-schedule"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isExpanded
                  ? lang === 'kz'
                    ? 'Кестені жабу'
                    : 'Скрыть расписание'
                  : lang === 'kz'
                  ? 'Толық намаз уақыты'
                  : 'Все время намаза'}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Daily Prayer Times Grid */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-amber-500/20 animate-fadeIn">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs text-amber-400/90 font-medium">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {lang === 'kz'
                    ? 'Атырау қаласы бойынша бүгінгі намаз кестесі (UTC+5)'
                    : 'Расписание намазов для г. Атырау на сегодня (UTC+5)'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {new Date().toLocaleDateString(lang === 'kz' ? 'kk-KZ' : 'ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    item.isNext
                      ? 'bg-gradient-to-b from-amber-500/20 to-amber-950/40 border-amber-500/60 shadow-[0_0_12px_rgba(217,119,6,0.25)]'
                      : 'bg-black/30 border-slate-800 hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-arabic text-amber-400/80">{item.nameAr}</span>
                    {item.isNext && (
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500 text-black font-bold">
                        {lang === 'kz' ? 'Келесі' : 'След.'}
                      </span>
                    )}
                  </div>
                  <div className="font-medium text-slate-200 text-xs truncate">
                    {getPrayerName(item, lang)}
                  </div>
                  <div
                    className={`font-mono text-base font-bold mt-0.5 ${
                      item.isNext ? 'text-amber-300' : 'text-slate-100'
                    }`}
                  >
                    {item.timeStr}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
