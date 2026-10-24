// ===== Утилиты для работы с датами =====
import { format, parse, getISOWeek, getMonth, getYear, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek, differenceInDays, addMonths, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';

export { format, parse, getISOWeek, getMonth, getYear, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek, differenceInDays, addMonths, subMonths };

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

/** Форматирование даты в ДД.ММ.ГГГГ */
export function formatDateRu(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return format(date, 'dd.MM.yyyy');
}

/** Форматирование даты в ДД.ММ */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return format(date, 'dd.MM');
}

/** Название месяца на русском */
export function getMonthNameRu(month: number): string {
  return MONTH_NAMES[month] || '';
}

/** Парсинг даты из формата M/D/YY (американский формат из Excel) */
export function parseExcelDate(value: string | number): string | null {
  if (!value) return null;
  
  const str = String(value).trim();
  
  // Формат M/D/YY или M/D/YYYY
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    const month = parseInt(match[1]);
    const day = parseInt(match[2]);
    let year = parseInt(match[3]);
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  
  // Формат YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return str;
  }
  
  // Формат DD.MM.YYYY
  const ruMatch = str.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (ruMatch) {
    return `${ruMatch[3]}-${ruMatch[2]}-${ruMatch[1]}`;
  }
  
  return null;
}

/** Сегодняшняя дата в формате YYYY-MM-DD */
export function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Текущий месяц */
export function currentMonth(): number {
  return getMonth(new Date());
}

/** Текущий год */
export function currentYear(): number {
  return getYear(new Date());
}

/** ISO неделя */
export function isoWeek(dateStr: string): number {
  const date = new Date(dateStr + 'T00:00:00');
  return getISOWeek(date);
}

/** Начало месяца */
export function getMonthStart(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return format(startOfMonth(date), 'yyyy-MM-dd');
}

/** Конец месяца */
export function getMonthEnd(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return format(endOfMonth(date), 'yyyy-MM-dd');
}

/** Дней до конца месяца */
export function daysUntilMonthEnd(dateStr: string): number {
  const date = new Date(dateStr + 'T00:00:00');
  const end = endOfMonth(date);
  return differenceInDays(end, date);
}

/** Относительная дата для отображения */
export function relativeDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const diff = differenceInDays(date, now);
  
  if (diff === 0) return 'Сегодня';
  if (diff === 1) return 'Завтра';
  if (diff === -1) return 'Вчера';
  if (diff > 0 && diff <= 7) return `Через ${diff} дн.`;
  if (diff < 0 && diff >= -7) return `${Math.abs(diff)} дн. назад`;
  
  return formatDateRu(dateStr);
}
