// ===== Денежные утилиты =====
// Все суммы хранятся в минорных единицах (копейках)

const formatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Форматирование суммы из копеек в рубли с символом ₽ */
export function formatMoney(amountMinor: number): string {
  return formatter.format(amountMinor / 100);
}

/** Форматирование числа из копеек */
export function formatNumber(amountMinor: number): string {
  return numberFormatter.format(amountMinor / 100);
}

/** Парсинг строки с суммой в копейки */
export function parseMoneyToMinor(value: string): number {
  if (!value) return 0;
  // Удаляем символы валюты, пробелы, неразрывные пробелы
  let cleaned = value
    .replace(/[₽$€£\s\u00A0\u2009]/g, '')
    .trim();
  
  // Определяем формат: если запятая и после неё 3 цифры — разделитель тысяч
  // Если запятая и после неё 2 цифры — десятичный разделитель
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Оба есть: запятая — тысячи, точка — десятичные
    cleaned = cleaned.replace(/,/g, '');
  } else if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    if (parts[parts.length - 1].length === 3 && parts.length > 2) {
      // Запятая как разделитель тысяч
      cleaned = cleaned.replace(/,/g, '');
    } else {
      // Запятая как десятичный разделитель
      cleaned = cleaned.replace(',', '.');
    }
  }
  
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/** Сложение в минорных единицах */
export function addMoney(a: number, b: number): number {
  return a + b;
}

/** Вычитание в минорных единицах */
export function subtractMoney(a: number, b: number): number {
  return a - b;
}

/** Процент от суммы */
export function percentOf(amount: number, percent: number): number {
  return Math.round(amount * percent / 100);
}

/** Форматирование процента */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/** Расчёт месячного эквивалента годовой подписки */
export function yearlyToMonthly(amountMinor: number): number {
  return Math.round(amountMinor / 12);
}

/** Расчёт амортизации */
export function calculateAmortization(totalMinor: number, months: number): number {
  if (months <= 0) return totalMinor;
  return Math.round(totalMinor / months);
}
