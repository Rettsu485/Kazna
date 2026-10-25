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

/** Сокращённое форматирование: 652 000 → 652К, 1 500 000 → 1.5М */
export function formatMoneyShort(amountMinor: number): string {
  const value = Math.abs(amountMinor) / 100;
  const sign = amountMinor < 0 ? '−' : '';
  
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const formatted = millions >= 10 ? millions.toFixed(0) : millions.toFixed(1);
    return `${sign}${formatted.replace('.', ',')} млн ₽`;
  }
  if (value >= 10_000) {
    const thousands = Math.round(value / 1000);
    return `${sign}${thousands}К ₽`;
  }
  if (value >= 1_000) {
    const thousands = value / 1000;
    const formatted = thousands >= 10 ? thousands.toFixed(0) : thousands.toFixed(1);
    return `${sign}${formatted.replace('.', ',')}К ₽`;
  }
  return `${sign}${value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`;
}

/** Парсинг строки с суммой в копейки */
export function parseMoneyToMinor(value: string): number {
  if (!value) return 0;
  let cleaned = value
    .replace(/[₽$€£\s\u00A0\u2009]/g, '')
    .trim();
  
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/,/g, '');
  } else if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    if (parts[parts.length - 1].length === 3 && parts.length > 2) {
      cleaned = cleaned.replace(/,/g, '');
    } else {
      cleaned = cleaned.replace(',', '.');
    }
  }
  
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function addMoney(a: number, b: number): number {
  return a + b;
}

export function subtractMoney(a: number, b: number): number {
  return a - b;
}

export function percentOf(amount: number, percent: number): number {
  return Math.round(amount * percent / 100);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function yearlyToMonthly(amountMinor: number): number {
  return Math.round(amountMinor / 12);
}

export function calculateAmortization(totalMinor: number, months: number): number {
  if (months <= 0) return totalMinor;
  return Math.round(totalMinor / months);
}
