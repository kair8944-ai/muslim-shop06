import { PrayerTimeItem, Language } from '../types';

export interface NextPrayerInfo {
  nextPrayer: PrayerTimeItem;
  remainingSeconds: number;
  formattedCountdown: string;
  items: PrayerTimeItem[];
}

// Prayer times calculation for Atyrau (Lat: 47.116, Lon: 51.883, TimeZone: UTC+5)
export function getAtyrauPrayerTimes(date: Date = new Date()): PrayerTimeItem[] {
  // Day of year calculation for solar declination & equation of time
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Solar angle approximations for Atyrau (47.1° N)
  // Base mid-day (Zhur) around 13:18 - 13:30 (since UTC+5 in KZ)
  // Day length variation through seasons:
  // In summer: Fajr ~04:10, Sunrise ~05:50, Dhuhr ~13:25, Asr ~17:35, Maghrib ~21:05, Isha ~22:45
  // In winter: Fajr ~07:15, Sunrise ~08:45, Dhuhr ~13:20, Asr ~15:55, Maghrib ~17:55, Isha ~19:25
  // In spring/autumn (September/March):
  // Fajr ~05:30, Sunrise ~07:00, Dhuhr ~13:20, Asr ~16:55, Maghrib ~19:40, Isha ~21:10

  // Sinusoidal curve for day length oscillation:
  const gamma = (2 * Math.PI * (dayOfYear - 80)) / 365;
  const dayShift = Math.sin(gamma); // -1 in winter, +1 in summer

  // Minutes offsets from seasonal baseline:
  const fajrMinutes = Math.round(330 - dayShift * 85);      // ~5:30 in spring, 4:05 in summer, 6:55 in winter
  const sunriseMinutes = Math.round(420 - dayShift * 80);   // ~7:00 in spring, 5:40 in summer, 8:20 in winter
  const dhuhrMinutes = 800;                                 // ~13:20
  const asrMinutes = Math.round(1015 + dayShift * 45);      // ~16:55 in spring, 17:40 in summer, 16:10 in winter
  const maghribMinutes = Math.round(1180 + dayShift * 80);  // ~19:40 in spring, 21:00 in summer, 18:20 in winter
  const ishaMinutes = Math.round(1270 + dayShift * 85);     // ~21:10 in spring, 22:35 in summer, 19:45 in winter

  const formatTime = (mins: number) => {
    const norm = (mins + 1440) % 1440;
    const h = Math.floor(norm / 60).toString().padStart(2, '0');
    const m = Math.floor(norm % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  return [
    {
      id: 'fajr',
      nameRu: 'Фаджр',
      nameKz: 'Таң намазы',
      nameAr: 'الفجر',
      timeStr: formatTime(fajrMinutes),
    },
    {
      id: 'sunrise',
      nameRu: 'Восход',
      nameKz: 'Күн шығу',
      nameAr: 'الشروق',
      timeStr: formatTime(sunriseMinutes),
    },
    {
      id: 'dhuhr',
      nameRu: 'Зухр',
      nameKz: 'Бесін',
      nameAr: 'الظهر',
      timeStr: formatTime(dhuhrMinutes),
    },
    {
      id: 'asr',
      nameRu: 'Аср',
      nameKz: 'Екінті',
      nameAr: 'العصر',
      timeStr: formatTime(asrMinutes),
    },
    {
      id: 'maghrib',
      nameRu: 'Магриб',
      nameKz: 'Ақшам',
      nameAr: 'المغرب',
      timeStr: formatTime(maghribMinutes),
    },
    {
      id: 'isha',
      nameRu: 'Иша',
      nameKz: 'Құптан',
      nameAr: 'العشاء',
      timeStr: formatTime(ishaMinutes),
    },
  ];
}

export function calculateNextPrayer(now: Date = new Date()): NextPrayerInfo {
  const items = getAtyrauPrayerTimes(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

  // Convert prayer items to minutes
  const prayerMinutesList = items.map((item) => {
    const [h, m] = item.timeStr.split(':').map(Number);
    return { ...item, totalMinutes: h * 60 + m };
  });

  // Find next prayer (ignoring sunrise for next prayer countdown if desired, or including it)
  // Usually Muslims count down to the next prayer (Fajr, Dhuhr, Asr, Maghrib, Isha).
  // Let's include the actual next event:
  let next = prayerMinutesList.find((p) => p.totalMinutes > currentMinutes);
  let remainingMinutes = 0;

  if (next) {
    remainingMinutes = next.totalMinutes - currentMinutes;
  } else {
    // Past Isha -> next is Fajr tomorrow
    const tomorrowFajr = prayerMinutesList[0];
    next = tomorrowFajr;
    remainingMinutes = 24 * 60 - currentMinutes + tomorrowFajr.totalMinutes;
  }

  const remainingSeconds = Math.max(0, Math.floor(remainingMinutes * 60));
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const formattedCountdown = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const updatedItems = items.map((item) => ({
    ...item,
    isNext: item.id === next?.id,
  }));

  return {
    nextPrayer: next,
    remainingSeconds,
    formattedCountdown,
    items: updatedItems,
  };
}

export function getPrayerName(item: PrayerTimeItem, lang: Language): string {
  return lang === 'kz' ? item.nameKz : item.nameRu;
}
