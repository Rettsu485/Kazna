// ===== Хранилище данных приложения =====
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Account, Actor, Category, Tag, Transaction, Budget, Debt, DebtPayment, RecurringRule, Goal, AppSettings } from '../types';

// ===== Демо-данные =====
const DEMO_CATEGORIES: Category[] = [
  { id: 'cat-housing', name: 'Жильё', parentId: null, kind: 'expense', budgetable: true, includeInExpense: true, icon: '🏠', color: '#8B5CF6', notes: '' },
  { id: 'cat-rent', name: 'Аренда квартиры', parentId: 'cat-housing', kind: 'expense', budgetable: true, includeInExpense: true, icon: '🔑', color: '#8B5CF6', notes: '' },
  { id: 'cat-food', name: 'Еда', parentId: null, kind: 'expense', budgetable: true, includeInExpense: true, icon: '🍕', color: '#F59E0B', notes: '' },
  { id: 'cat-groceries', name: 'Супермаркеты', parentId: 'cat-food', kind: 'expense', budgetable: true, includeInExpense: true, icon: '🛒', color: '#F59E0B', notes: '' },
  { id: 'cat-cafe', name: 'Кафе и рестораны', parentId: 'cat-food', kind: 'expense', budgetable: true, includeInExpense: true, icon: '🍽️', color: '#F59E0B', notes: '' },
  { id: 'cat-transport', name: 'Транспорт', parentId: null, kind: 'expense', budgetable: true, includeInExpense: true, icon: '🚌', color: '#3B82F6', notes: '' },
  { id: 'cat-health', name: 'Здоровье', parentId: null, kind: 'expense', budgetable: true, includeInExpense: true, icon: '💊', color: '#EF4444', notes: '' },
  { id: 'cat-communication', name: 'Связь и интернет', parentId: null, kind: 'expense', budgetable: true, includeInExpense: true, icon: '📱', color: '#06B6D4', notes: '' },
  { id: 'cat-subscriptions', name: 'Подписки и цифровой контент', parentId: null, kind: 'expense', budgetable: true, includeInExpense: true, icon: '📺', color: '#8B5CF6', notes: '' },
  { id: 'cat-marketplace', name: 'Маркетплейсы и покупки', parentId: null, kind: 'expense', budgetable: true, includeInExpense: true, icon: '📦', color: '#F97316', notes: '' },
  { id: 'cat-home', name: 'Дом и ремонт', parentId: null, kind: 'expense', budgetable: true, includeInExpense: true, icon: '🔧', color: '#84CC16', notes: '' },
  { id: 'cat-beauty', name: 'Красота', parentId: null, kind: 'expense', budgetable: true, includeInExpense: true, icon: '💅', color: '#EC4899', notes: '' },
  { id: 'cat-entertainment', name: 'Развлечения', parentId: null, kind: 'expense', budgetable: true, includeInExpense: true, icon: '🎮', color: '#A855F7', notes: '' },
  { id: 'cat-gifts', name: 'Подарки', parentId: null, kind: 'expense', budgetable: true, includeInExpense: true, icon: '🎁', color: '#F43F5E', notes: '' },
  { id: 'cat-finance', name: 'Финансы и кредиты', parentId: null, kind: 'expense', budgetable: false, includeInExpense: true, icon: '💰', color: '#6366F1', notes: '' },
  { id: 'cat-transfers', name: 'Переводы', parentId: null, kind: 'transfer', budgetable: false, includeInExpense: false, icon: '↔️', color: '#64748B', notes: '' },
  { id: 'cat-income', name: 'Доходы', parentId: null, kind: 'income', budgetable: false, includeInExpense: false, icon: '💵', color: '#22C55E', notes: '' },
  { id: 'cat-salary', name: 'Зарплата', parentId: 'cat-income', kind: 'income', budgetable: false, includeInExpense: false, icon: '💼', color: '#22C55E', notes: '' },
  { id: 'cat-other', name: 'Прочее', parentId: null, kind: 'expense', budgetable: false, includeInExpense: true, icon: '📋', color: '#94A3B8', notes: '' },
];

const DEMO_ACCOUNTS: Account[] = [
  { id: 'acc-vtb-card', name: 'Карта ВТБ', type: 'debit_card', ownerType: 'personal', ownerName: '', currency: 'RUB', openingBalanceMinor: 0, currentBalanceMinor: 14500000, creditLimitMinor: 0, debtBalanceMinor: 0, interestRate: 0, paymentDay: 0, graceDays: 0, isActive: true, notes: '', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'acc-vtb-checking', name: 'Текущий счёт ВТБ', type: 'checking', ownerType: 'personal', ownerName: '', currency: 'RUB', openingBalanceMinor: 0, currentBalanceMinor: 8900000, creditLimitMinor: 0, debtBalanceMinor: 0, interestRate: 0, paymentDay: 0, graceDays: 0, isActive: true, notes: '', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'acc-vtb-deposit', name: 'Вклад ВТБ', type: 'deposit', ownerType: 'personal', ownerName: '', currency: 'RUB', openingBalanceMinor: 50000000, currentBalanceMinor: 52300000, creditLimitMinor: 0, debtBalanceMinor: 0, interestRate: 16, paymentDay: 0, graceDays: 0, isActive: true, notes: '16% годовых', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'acc-vtb-credit', name: 'Кредитная карта ВТБ', type: 'credit_card', ownerType: 'personal', ownerName: '', currency: 'RUB', openingBalanceMinor: 0, currentBalanceMinor: -7500000, creditLimitMinor: 30000000, debtBalanceMinor: 7500000, interestRate: 24.9, paymentDay: 15, graceDays: 100, isActive: true, notes: 'Грейс 100 дней', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'acc-sber-credit', name: 'Кредитная карта Сбер', type: 'credit_card', ownerType: 'personal', ownerName: '', currency: 'RUB', openingBalanceMinor: 0, currentBalanceMinor: -4500000, creditLimitMinor: 15000000, debtBalanceMinor: 4500000, interestRate: 21.9, paymentDay: 20, graceDays: 50, isActive: true, notes: '', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'acc-cash', name: 'Наличные', type: 'cash', ownerType: 'personal', ownerName: '', currency: 'RUB', openingBalanceMinor: 0, currentBalanceMinor: 1500000, creditLimitMinor: 0, debtBalanceMinor: 0, interestRate: 0, paymentDay: 0, graceDays: 0, isActive: true, notes: '', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'acc-stentran', name: 'Stentran', type: 'wallet', ownerType: 'other_person', ownerName: 'Stentran', currency: 'RUB', openingBalanceMinor: 0, currentBalanceMinor: -2500000, creditLimitMinor: 0, debtBalanceMinor: 2500000, interestRate: 0, paymentDay: 0, graceDays: 0, isActive: true, notes: 'Займ Stentran', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'acc-irina', name: 'Деньги Ирины', type: 'wallet', ownerType: 'other_person', ownerName: 'Ирина', currency: 'RUB', openingBalanceMinor: 0, currentBalanceMinor: 500000, creditLimitMinor: 0, debtBalanceMinor: 0, interestRate: 0, paymentDay: 0, graceDays: 0, isActive: true, notes: '', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'acc-dana', name: 'Деньги Дани', type: 'wallet', ownerType: 'other_person', ownerName: 'Даня', currency: 'RUB', openingBalanceMinor: 0, currentBalanceMinor: 300000, creditLimitMinor: 0, debtBalanceMinor: 0, interestRate: 0, paymentDay: 0, graceDays: 0, isActive: true, notes: '', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
];

const DEMO_ACTORS: Actor[] = [
  { id: 'act-rettsu', name: 'Rettsu', type: 'person', role: '', color: '#3B82F6', notes: '', isActive: true },
  { id: 'act-lina', name: 'Лина', type: 'person', role: '', color: '#EC4899', notes: '', isActive: true },
  { id: 'act-mama', name: 'Мама', type: 'person', role: '', color: '#F59E0B', notes: '', isActive: true },
  { id: 'act-stentran', name: 'Stentran', type: 'person', role: '', color: '#8B5CF6', notes: 'Займ', isActive: true },
  { id: 'act-brother', name: 'Брат', type: 'person', role: '', color: '#22C55E', notes: '', isActive: true },
];

const DEMO_TAGS: Tag[] = [
  { id: 'tag-ozon', name: 'Ozon', color: '#005BFF' },
  { id: 'tag-wildberries', name: 'Wildberries', color: '#CB11AB' },
  { id: 'tag-yandex', name: 'Яндекс', color: '#FC3F1D' },
  { id: 'tag-vk', name: 'VK', color: '#0077FF' },
  { id: 'tag-telegram', name: 'Telegram', color: '#26A5E4' },
];

const DEMO_DEBTS: Debt[] = [
  { id: 'debt-vtb-credit', name: 'Кредитная карта ВТБ', type: 'credit_card', direction: 'liability', principalBalanceMinor: 7500000, interestRate: 24.9, monthlyPaymentMinor: 3000000, minPaymentMinor: 1500000, paymentDay: 15, dueDate: '2025-12-31', status: 'active', accountId: 'acc-vtb-credit', notes: 'Грейс 100 дней' },
  { id: 'debt-sber-credit', name: 'Кредитная карта Сбер', type: 'credit_card', direction: 'liability', principalBalanceMinor: 4500000, interestRate: 21.9, monthlyPaymentMinor: 2500000, minPaymentMinor: 1000000, paymentDay: 20, dueDate: '2025-11-30', status: 'active', accountId: 'acc-sber-credit', notes: '' },
  { id: 'debt-stentran', name: 'Займ Stentran', type: 'personal_debt', direction: 'liability', principalBalanceMinor: 2500000, interestRate: 0, monthlyPaymentMinor: 500000, minPaymentMinor: 500000, paymentDay: 1, dueDate: '2025-08-01', status: 'active', accountId: null, notes: 'Другу без процентов' },
  { id: 'debt-loan', name: 'Потребительский кредит', type: 'loan', direction: 'liability', principalBalanceMinor: 45000000, interestRate: 14.9, monthlyPaymentMinor: 5343850, minPaymentMinor: 5343850, paymentDay: 10, dueDate: '2027-06-10', status: 'active', accountId: null, notes: 'Ежемесячный платёж' },
];

const DEMO_BUDGETS: Budget[] = [
  { id: 'bud-food', categoryId: 'cat-food', actorId: null, tagId: null, period: 'month', amountLimitMinor: 3500000, startDate: '2025-01-01', endDate: '2025-12-31', isActive: true },
  { id: 'bud-transport', categoryId: 'cat-transport', actorId: null, tagId: null, period: 'month', amountLimitMinor: 1500000, startDate: '2025-01-01', endDate: '2025-12-31', isActive: true },
  { id: 'bud-entertainment', categoryId: 'cat-entertainment', actorId: null, tagId: null, period: 'month', amountLimitMinor: 1000000, startDate: '2025-01-01', endDate: '2025-12-31', isActive: true },
  { id: 'bud-subscriptions', categoryId: 'cat-subscriptions', actorId: null, tagId: null, period: 'month', amountLimitMinor: 150000, startDate: '2025-01-01', endDate: '2025-12-31', isActive: true },
];

const DEMO_RECURRING: RecurringRule[] = [
  { id: 'rec-rent', name: 'Аренда квартиры', frequency: 'monthly', dayOfMonth: 1, interval: 1, amountMinor: 6500000, accountId: 'acc-vtb-card', categoryId: 'cat-rent', actorId: null, nextDate: '2025-07-01', isActive: true, type: 'payment' },
  { id: 'rec-internet', name: 'Уфанет интернет', frequency: 'monthly', dayOfMonth: 5, interval: 1, amountMinor: 70000, accountId: 'acc-vtb-card', categoryId: 'cat-communication', actorId: null, nextDate: '2025-07-05', isActive: true, type: 'subscription' },
  { id: 'rec-mobile', name: 'Мобильная связь Т2', frequency: 'monthly', dayOfMonth: 10, interval: 1, amountMinor: 50000, accountId: 'acc-vtb-card', categoryId: 'cat-communication', actorId: null, nextDate: '2025-07-10', isActive: true, type: 'subscription' },
  { id: 'rec-mama', name: 'Маме на питание', frequency: 'monthly', dayOfMonth: 15, interval: 1, amountMinor: 1000000, accountId: 'acc-vtb-card', categoryId: 'cat-food', actorId: 'act-mama', nextDate: '2025-07-15', isActive: true, type: 'payment' },
  { id: 'rec-yandex', name: 'Яндекс Плюс', frequency: 'monthly', dayOfMonth: 20, interval: 1, amountMinor: 29900, accountId: 'acc-vtb-card', categoryId: 'cat-subscriptions', actorId: null, nextDate: '2025-07-20', isActive: true, type: 'subscription' },
  { id: 'rec-loan', name: 'Платёж по кредиту', frequency: 'monthly', dayOfMonth: 10, interval: 1, amountMinor: 5343850, accountId: 'acc-vtb-card', categoryId: 'cat-finance', actorId: null, nextDate: '2025-07-10', isActive: true, type: 'payment' },
];

const DEMO_GOALS: Goal[] = [
  { id: 'goal-vacation', name: 'Отпуск', targetAmountMinor: 15000000, currentAmountMinor: 8500000, deadline: '2025-08-01', priority: 1, status: 'active' },
  { id: 'goal-car', name: 'Новый автомобиль', targetAmountMinor: 200000000, currentAmountMinor: 45000000, deadline: '2026-06-01', priority: 2, status: 'active' },
  { id: 'goal-safety', name: 'Подушка безопасности', targetAmountMinor: 50000000, currentAmountMinor: 35000000, deadline: '2025-12-31', priority: 3, status: 'active' },
];

// Генерация демо-транзакций за текущий месяц
function generateDemoTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  const addTx = (day: number, amount: number, type: Transaction['type'], catId: string, note: string, actorId?: string) => {
    const date = new Date(year, month, day);
    transactions.push({
      id: uuidv4(),
      date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      weekNumber: 1,
      monthNumber: month,
      monthName: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'][month],
      year,
      type,
      amountMinor: amount,
      currency: 'RUB',
      accountId: 'acc-vtb-card',
      toAccountId: null,
      categoryId: catId,
      actorId: actorId || null,
      note,
      status: 'confirmed',
      isRecurring: false,
      amortizationEnabled: false,
      amortizationMonths: 1,
      excludeFromBudget: type === 'transfer' || type === 'debt_payment',
      externalId: null,
      tags: [],
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    });
  };
  
  // Доходы
  addTx(1, 28277030, 'income', 'cat-salary', 'Зарплата за месяц');
  addTx(15, 5000000, 'income', 'cat-income', 'Фриланс');
  
  // Обязательные расходы
  addTx(1, 6500000, 'expense', 'cat-rent', 'Аренда квартиры');
  addTx(5, 70000, 'expense', 'cat-communication', 'Уфанет интернет');
  addTx(10, 50000, 'expense', 'cat-communication', 'Мобильная связь Т2');
  addTx(15, 1000000, 'expense', 'cat-food', 'Маме на питание', 'act-mama');
  addTx(10, 5343850, 'debt_payment', 'cat-finance', 'Платёж по кредиту');
  addTx(20, 29900, 'expense', 'cat-subscriptions', 'Яндекс Плюс');
  
  // Расходы
  addTx(2, 250000, 'expense', 'cat-groceries', 'Магнит');
  addTx(3, 180000, 'expense', 'cat-cafe', 'Обед');
  addTx(4, 52000, 'expense', 'cat-transport', 'Такси');
  addTx(5, 340000, 'expense', 'cat-groceries', 'Перекрёсток');
  addTx(6, 199000, 'expense', 'cat-subscriptions', 'ТГ на год', undefined);
  addTx(7, 450000, 'expense', 'cat-marketplace', 'Ozon - заказ');
  addTx(8, 85000, 'expense', 'cat-transport', 'Whoosh');
  addTx(9, 120000, 'expense', 'cat-entertainment', 'Кино');
  addTx(10, 280000, 'expense', 'cat-groceries', 'Пятёрочка');
  addTx(11, 4794000, 'expense', 'cat-health', 'Стоматология Dantistoff');
  addTx(12, 65000, 'expense', 'cat-transport', 'Метро');
  addTx(13, 150000, 'expense', 'cat-cafe', 'Кофейня');
  addTx(14, 89000, 'expense', 'cat-beauty', 'Стрижка');
  
  // Переводы
  addTx(1, 3000000, 'transfer', 'cat-transfers', 'На кредитку Сбер');
  addTx(5, 500000, 'transfer', 'cat-transfers', 'Снятие наличных');
  
  // Помечаем транзакцию ТГ на год как амортизируемую
  const tgTx = transactions.find(t => t.note === 'ТГ на год');
  if (tgTx) {
    tgTx.amortizationEnabled = true;
    tgTx.amortizationMonths = 12;
  }
  
  return transactions;
}

// ===== Store =====
interface AppStore {
  accounts: Account[];
  actors: Actor[];
  categories: Category[];
  tags: Tag[];
  transactions: Transaction[];
  budgets: Budget[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  recurringRules: RecurringRule[];
  goals: Goal[];
  settings: AppSettings;
  isAuthenticated: boolean;
  isInitialized: boolean;
  
  // Actions
  initialize: () => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addAccount: (acc: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  addCategory: (cat: Omit<Category, 'id'>) => void;
  addActor: (actor: Omit<Actor, 'id'>) => void;
  addTag: (tag: Omit<Tag, 'id'>) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  addDebt: (debt: Omit<Debt, 'id'>) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  addDebtPayment: (payment: Omit<DebtPayment, 'id'>) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  addRecurringRule: (rule: Omit<RecurringRule, 'id'>) => void;
  importTransactions: (txs: Transaction[]) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  login: () => void;
  logout: () => void;
  resetData: () => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      accounts: [],
      actors: [],
      categories: [],
      tags: [],
      transactions: [],
      budgets: [],
      debts: [],
      debtPayments: [],
      recurringRules: [],
      goals: [],
      settings: {
        locale: 'ru-RU',
        timezone: 'Europe/Moscow',
        currency: 'RUB',
        theme: 'light',
        userName: '',
        userEmail: '',
      },
      isAuthenticated: false,
      isInitialized: false,
      
      initialize: () => {
        const state = get();
        if (state.isInitialized) return;
        set({
          accounts: DEMO_ACCOUNTS,
          actors: DEMO_ACTORS,
          categories: DEMO_CATEGORIES,
          tags: DEMO_TAGS,
          transactions: generateDemoTransactions(),
          budgets: DEMO_BUDGETS,
          debts: DEMO_DEBTS,
          debtPayments: [],
          recurringRules: DEMO_RECURRING,
          goals: DEMO_GOALS,
          isAuthenticated: true,
          isInitialized: true,
        });
      },
      
      addTransaction: (tx) => {
        const newTx: Transaction = {
          ...tx,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(state => ({ transactions: [newTx, ...state.transactions] }));
      },
      
      updateTransaction: (id, updates) => {
        set(state => ({
          transactions: state.transactions.map(t =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        }));
      },
      
      deleteTransaction: (id) => {
        set(state => ({
          transactions: state.transactions.filter(t => t.id !== id),
        }));
      },
      
      addAccount: (acc) => {
        const newAcc: Account = {
          ...acc,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(state => ({ accounts: [...state.accounts, newAcc] }));
      },
      
      updateAccount: (id, updates) => {
        set(state => ({
          accounts: state.accounts.map(a =>
            a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
          ),
        }));
      },
      
      addCategory: (cat) => {
        set(state => ({
          categories: [...state.categories, { ...cat, id: uuidv4() }],
        }));
      },
      
      addActor: (actor) => {
        set(state => ({
          actors: [...state.actors, { ...actor, id: uuidv4() }],
        }));
      },
      
      addTag: (tag) => {
        set(state => ({
          tags: [...state.tags, { ...tag, id: uuidv4() }],
        }));
      },
      
      addBudget: (budget) => {
        set(state => ({
          budgets: [...state.budgets, { ...budget, id: uuidv4() }],
        }));
      },
      
      updateBudget: (id, updates) => {
        set(state => ({
          budgets: state.budgets.map(b => b.id === id ? { ...b, ...updates } : b),
        }));
      },
      
      addDebt: (debt) => {
        set(state => ({
          debts: [...state.debts, { ...debt, id: uuidv4() }],
        }));
      },
      
      updateDebt: (id, updates) => {
        set(state => ({
          debts: state.debts.map(d => d.id === id ? { ...d, ...updates } : d),
        }));
      },
      
      addDebtPayment: (payment) => {
        set(state => ({
          debtPayments: [...state.debtPayments, { ...payment, id: uuidv4() }],
        }));
      },
      
      addGoal: (goal) => {
        set(state => ({
          goals: [...state.goals, { ...goal, id: uuidv4() }],
        }));
      },
      
      updateGoal: (id, updates) => {
        set(state => ({
          goals: state.goals.map(g => g.id === id ? { ...g, ...updates } : g),
        }));
      },
      
      addRecurringRule: (rule) => {
        set(state => ({
          recurringRules: [...state.recurringRules, { ...rule, id: uuidv4() }],
        }));
      },
      
      importTransactions: (txs) => {
        set(state => ({
          transactions: [...txs, ...state.transactions],
        }));
      },
      
      updateSettings: (settings) => {
        set(state => ({
          settings: { ...state.settings, ...settings },
        }));
      },
      
      login: () => set({ isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false }),
      
      resetData: () => {
        set({
          accounts: DEMO_ACCOUNTS,
          actors: DEMO_ACTORS,
          categories: DEMO_CATEGORIES,
          tags: DEMO_TAGS,
          transactions: generateDemoTransactions(),
          budgets: DEMO_BUDGETS,
          debts: DEMO_DEBTS,
          debtPayments: [],
          recurringRules: DEMO_RECURRING,
          goals: DEMO_GOALS,
        });
      },
    }),
    {
      name: 'finance-tracker-storage',
    }
  )
);
