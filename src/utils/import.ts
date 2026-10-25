// ===== Импорт/экспорт данных =====
import * as XLSX from 'xlsx';
import { parseExcelDate } from './dates';
import { parseMoneyToMinor } from './money';
import type { Transaction, Category, Actor } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getISOWeek, getMonth, getYear, format } from 'date-fns';

// Правила нормализации категорий
const CATEGORY_RULES: Record<string, string> = {
  'аренда кваритры': 'Аренда квартиры',
  'аренда квартиры': 'Аренда квартиры',
  'услуги связи': 'Связь и интернет',
  'сотовая связь': 'Связь и интернет',
  'транспорт': 'Транспорт',
  'такси': 'Транспорт',
  'whoosh': 'Транспорт',
  'цифровой контент': 'Подписки и цифровой контент',
  'маркетплейсы': 'Маркетплейсы и покупки',
  'аптеки': 'Здоровье',
  'здоровье': 'Здоровье',
  'кафе и рестораны': 'Еда',
  'супермаркеты': 'Еда',
  'перевод': 'Переводы',
  'между счетами': 'Переводы',
  'платежи и переводы': 'Переводы',
  'кредиты': 'Финансы и кредиты',
  'операции с наличными': 'Переводы',
  'проценты и комиссии': 'Финансы и кредиты',
  'другие расходы': 'Прочее',
};

// Правила определения типа по примечанию
const NOTE_RULES: Array<{ pattern: RegExp; category?: string; type?: string; actor?: string }> = [
  { pattern: /маме\s*(на\s*)?билайн/i, category: 'Связь и интернет', actor: 'Мама' },
  { pattern: /^т2$/i, category: 'Связь и интернет' },
  { pattern: /уфанет/i, category: 'Связь и интернет' },
  { pattern: /яндекс[\s.]*плюс/i, category: 'Подписки и цифровой контент' },
  { pattern: /вк\s*музыка/i, category: 'Подписки и цифровой контент' },
  { pattern: /тг\s*(на\s*год|премиум)/i, category: 'Подписки и цифровой контент' },
  { pattern: /boosty/i, category: 'Подписки и цифровой контент' },
  { pattern: /whoosh/i, category: 'Транспорт' },
  { pattern: /dantistoff/i, category: 'Здоровье' },
  { pattern: /озон|ozon/i, category: 'Маркетплейсы и покупки' },
  { pattern: /магнит/i, category: 'Еда' },
  { pattern: /на\s*кредитку\s*сбер/i, type: 'debt_payment' },
  { pattern: /день\s*рождени/i, category: 'Подарки' },
  { pattern: /займ/i, type: 'debt_given' },
  { pattern: /такси/i, category: 'Транспорт' },
  { pattern: /продукты|еда|магнит|пятёрочка|перекрёсток/i, category: 'Еда' },
];

export function normalizeCategory(raw: string): string {
  if (!raw) return 'Прочее';
  const lower = raw.toLowerCase().trim();
  return CATEGORY_RULES[lower] || raw.trim();
}

export function detectFromNote(note: string): { category?: string; type?: string; actor?: string; amortMonths?: number } {
  if (!note) return {};
  const result: { category?: string; type?: string; actor?: string; amortMonths?: number } = {};
  
  for (const rule of NOTE_RULES) {
    if (rule.pattern.test(note)) {
      if (rule.category) result.category = rule.category;
      if (rule.type) result.type = rule.type;
      if (rule.actor) result.actor = rule.actor;
      break;
    }
  }
  
  // Определяем амортизацию для годовых подписок
  if (/на\s*год|годов/i.test(note)) {
    result.amortMonths = 12;
  }
  
  return result;
}

export function detectTransactionType(category: string, note: string, amount: number): string {
  const lowerCat = category.toLowerCase();
  const lowerNote = note.toLowerCase();
  
  if (lowerCat === 'переводы' || lowerNote.includes('между счетами') || lowerNote.includes('перевод')) {
    if (lowerNote.includes('кредитк') || lowerNote.includes('кредит')) return 'debt_payment';
    return 'transfer';
  }
  if (lowerCat.includes('доход') || lowerCat.includes('зарплат') || amount > 0) {
    if (amount > 0) return 'income';
  }
  if (lowerCat.includes('финансы') || lowerNote.includes('кредит')) return 'debt_payment';
  
  return 'expense';
}

export interface ImportResult {
  transactions: Partial<Transaction>[];
  newCategories: string[];
  newActors: string[];
  duplicates: number;
  needsReview: number;
  errors: string[];
}

export function parseExcelFile(data: ArrayBuffer): ImportResult {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  
  const result: ImportResult = {
    transactions: [],
    newCategories: [],
    newActors: [],
    duplicates: 0,
    needsReview: 0,
    errors: [],
  };
  
  const categorySet = new Set<string>();
  const actorSet = new Set<string>();
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      // Парсим дату
      const dateRaw = String(row['Дата'] || row['Date'] || row['date'] || '');
      const dateStr = parseExcelDate(dateRaw);
      if (!dateStr) {
        result.errors.push(`Строка ${i + 2}: не удалось распарсить дату "${dateRaw}"`);
        continue;
      }
      
      // Парсим сумму
      const amountRaw = String(row['Сумма'] || row['Amount'] || row['amount'] || '0');
      const amountMinor = parseMoneyToMinor(amountRaw);
      
      // Категория
      const rawCategory = String(row['Категория'] || row['Category'] || '');
      const category = normalizeCategory(rawCategory);
      if (rawCategory && !categorySet.has(category)) {
        categorySet.add(category);
        result.newCategories.push(category);
      }
      
      // Актор
      const actorName = String(row['Актор'] || row['Actor'] || '').trim();
      if (actorName && actorName !== 'Без актора' && !actorSet.has(actorName)) {
        actorSet.add(actorName);
        result.newActors.push(actorName);
      }
      
      // Примечание
      const note = String(row['Примечание'] || row['Note'] || row['note'] || '').trim();
      
      // Определяем дополнительные данные из примечания
      const noteInfo = detectFromNote(note);
      
      // Определяем тип
      const type = noteInfo.type || detectTransactionType(category, note, amountMinor);
      
      // Статус
      let status: Transaction['status'] = 'confirmed';
      if (!category || category === 'Прочее') status = 'needs_review';
      if (type === 'transfer' && !note) status = 'needs_review';
      
      // Амортизация
      const amortEnabled = !!noteInfo.amortMonths || /амортизац/i.test(note);
      const amortMonths = noteInfo.amortMonths || 1;
      
      const date = new Date(dateStr + 'T00:00:00');
      
      const transaction: Partial<Transaction> = {
        id: uuidv4(),
        date: dateStr,
        weekNumber: getISOWeek(date),
        monthNumber: getMonth(date),
        monthName: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'][getMonth(date)],
        year: getYear(date),
        type: type as Transaction['type'],
        amountMinor: Math.abs(amountMinor),
        currency: 'RUB',
        accountId: '',
        toAccountId: null,
        categoryId: null,
        actorId: null,
        note,
        status,
        isRecurring: false,
        amortizationEnabled: amortEnabled,
        amortizationMonths: amortMonths,
        excludeFromBudget: type === 'transfer' || type === 'debt_payment',
        externalId: null,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Временные поля для маппинга
        _categoryName: category,
        _actorName: actorName,
      } as any;
      
      if (status === 'needs_review') result.needsReview++;
      
      result.transactions.push(transaction);
    } catch (e) {
      result.errors.push(`Строка ${i + 2}: ошибка обработки`);
    }
  }
  
  return result;
}

export function exportToExcel(transactions: Transaction[], categories: Category[], actors: Actor[]): ArrayBuffer {
  const data = transactions.map(t => ({
    'Дата': t.date,
    'Неделя': t.weekNumber,
    'Месяц': t.monthNumber + 1,
    'Год': t.year,
    'Сумма': t.amountMinor / 100,
    'Тип': t.type,
    'Категория': categories.find(c => c.id === t.categoryId)?.name || '',
    'Актор': actors.find(a => a.id === t.actorId)?.name || '',
    'Примечание': t.note,
    'Статус': t.status,
  }));
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Операции');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

export function exportToCSV(transactions: Transaction[], categories: Category[], actors: Actor[]): string {
  const headers = ['Дата', 'Сумма', 'Тип', 'Категория', 'Актор', 'Примечание', 'Статус'];
  const rows = transactions.map(t => [
    t.date,
    (t.amountMinor / 100).toFixed(2),
    t.type,
    categories.find(c => c.id === t.categoryId)?.name || '',
    actors.find(a => a.id === t.actorId)?.name || '',
    t.note,
    t.status,
  ]);
  
  return [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
}
