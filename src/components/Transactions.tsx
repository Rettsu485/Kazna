// ===== Страница операций =====
import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { formatMoney } from '../utils/money';
import { formatDateRu, formatDateShort, today } from '../utils/dates';
import { Search, Filter, Plus, Edit2, Trash2, ChevronDown, X, ArrowUpDown } from 'lucide-react';
import type { TransactionType, TransactionStatus } from '../types';

const TYPE_LABELS: Record<string, string> = {
  expense: 'Расход',
  income: 'Доход',
  transfer: 'Перевод',
  debt_payment: 'Платёж по долгу',
  debt_given: 'Выданный долг',
  debt_received: 'Полученный долг',
  investment: 'Инвестиция',
  savings: 'Накопления',
  correction: 'Корректировка',
};

const TYPE_COLORS: Record<string, string> = {
  expense: 'text-red-600 dark:text-red-400',
  income: 'text-green-600 dark:text-green-400',
  transfer: 'text-blue-600 dark:text-blue-400',
  debt_payment: 'text-purple-600 dark:text-purple-400',
};

export function TransactionList() {
  const { transactions, categories, actors, accounts, updateTransaction, deleteTransaction } = useStore();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(t =>
        t.note.toLowerCase().includes(lower) ||
        categories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(lower) ||
        actors.find(a => a.id === t.actorId)?.name.toLowerCase().includes(lower)
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter(t => t.categoryId === categoryFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }

    result.sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'date') return mul * a.date.localeCompare(b.date);
      return mul * (a.amountMinor - b.amountMinor);
    });

    return result;
  }, [transactions, search, typeFilter, categoryFilter, statusFilter, sortBy, sortDir, categories, actors]);

  const totalAmount = filtered.reduce((sum, t) => {
    if (t.type === 'income') return sum + t.amountMinor;
    if (t.type === 'expense') return sum - t.amountMinor;
    return sum;
  }, 0);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Поиск и фильтры */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по примечанию..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2.5 rounded-lg border text-sm flex items-center gap-1 ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
        >
          <Filter size={16} />
          <span className="hidden sm:inline">Фильтры</span>
        </button>
      </div>

      {/* Панель фильтров */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
            >
              <option value="all">Все типы</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
            >
              <option value="all">Все категории</option>
              {categories.filter(c => c.parentId === null).map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
            >
              <option value="all">Все статусы</option>
              <option value="confirmed">Подтверждённые</option>
              <option value="needs_review">Требуют проверки</option>
              <option value="imported">Импортированные</option>
              <option value="archived">Архив</option>
            </select>
            <button
              onClick={() => { setTypeFilter('all'); setCategoryFilter('all'); setStatusFilter('all'); setSearch(''); }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Сбросить
            </button>
          </div>
        </div>
      )}

      {/* Сортировка и итоги */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {filtered.length} операций • Итого: <span className={totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}>{formatMoney(Math.abs(totalAmount))}</span>
        </p>
        <button
          onClick={() => { setSortBy(sortBy === 'date' ? 'amount' : 'date'); setSortDir(sortDir === 'desc' ? 'asc' : 'desc'); }}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <ArrowUpDown size={14} />
          {sortBy === 'date' ? 'По дате' : 'По сумме'} {sortDir === 'desc' ? '↓' : '↑'}
        </button>
      </div>

      {/* Список операций */}
      <div className="space-y-1">
        {filtered.map(tx => {
          const cat = categories.find(c => c.id === tx.categoryId);
          const actor = actors.find(a => a.id === tx.actorId);
          const account = accounts.find(a => a.id === tx.accountId);

          return (
            <div
              key={tx.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                tx.status === 'needs_review'
                  ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                  : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-xl">{cat?.icon || '📋'}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{tx.note || cat?.name || 'Операция'}</p>
                    {tx.status === 'needs_review' && (
                      <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] rounded">проверить</span>
                    )}
                    {tx.amortizationEnabled && (
                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] rounded">аморт.</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {formatDateShort(tx.date)}
                    {cat && ` • ${cat.name}`}
                    {actor && ` • ${actor.name}`}
                    {account && ` • ${account.name}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold whitespace-nowrap ${TYPE_COLORS[tx.type] || ''}`}>
                  {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '↔' : '−'}
                  {formatMoney(tx.amountMinor)}
                </span>
                <div className="flex gap-1">
                  {tx.status === 'needs_review' && (
                    <button
                      onClick={() => updateTransaction(tx.id, { status: 'confirmed' })}
                      className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                      title="Подтвердить"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    onClick={() => deleteTransaction(tx.id)}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="Удалить"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-2">Нет операций</p>
            <p className="text-sm">Добавьте первую операцию или импортируйте данные</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Форма добавления операции =====
export function NewTransaction() {
  const navigate = useNavigate();
  const { accounts, categories, actors, tags, addTransaction } = useStore();
  
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [actorId, setActorId] = useState('');
  const [note, setNote] = useState('');
  const [amortizationEnabled, setAmortizationEnabled] = useState(false);
  const [amortizationMonths, setAmortizationMonths] = useState(12);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountMinor = Math.round(parseFloat(amount.replace(',', '.')) * 100);
    if (!amountMinor || amountMinor <= 0) return;

    const d = new Date(date + 'T00:00:00');
    
    addTransaction({
      date,
      weekNumber: 1,
      monthNumber: d.getMonth(),
      monthName: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'][d.getMonth()],
      year: d.getFullYear(),
      type,
      amountMinor,
      currency: 'RUB',
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : null,
      categoryId: categoryId || null,
      actorId: actorId || null,
      note,
      status: 'confirmed',
      isRecurring: false,
      amortizationEnabled,
      amortizationMonths: amortizationEnabled ? amortizationMonths : 1,
      excludeFromBudget: type === 'transfer' || type === 'debt_payment',
      externalId: null,
      tags: [],
    });
    
    navigate('/transactions');
  };

  const quickCategories = categories.filter(c => c.parentId === null && c.kind === (type === 'income' ? 'income' : 'expense'));

  return (
    <div className="max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Тип операции */}
        <div className="flex gap-2">
          {[
            { value: 'expense', label: 'Расход', color: 'red' },
            { value: 'income', label: 'Доход', color: 'green' },
            { value: 'transfer', label: 'Перевод', color: 'blue' },
            { value: 'debt_payment', label: 'Долг', color: 'purple' },
          ].map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value as TransactionType)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                type === t.value
                  ? t.color === 'red' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : t.color === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : t.color === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Сумма */}
        <div>
          <label className="block text-sm font-medium mb-1">Сумма</label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
              className="w-full px-4 py-4 text-2xl font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              autoFocus
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">₽</span>
          </div>
        </div>

        {/* Дата */}
        <div>
          <label className="block text-sm font-medium mb-1">Дата</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
          />
        </div>

        {/* Счёт */}
        <div>
          <label className="block text-sm font-medium mb-1">Счёт</label>
          <select
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
          >
            {accounts.filter(a => a.isActive).map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {/* Куда (для перевода) */}
        {type === 'transfer' && (
          <div>
            <label className="block text-sm font-medium mb-1">Куда</label>
            <select
              value={toAccountId}
              onChange={e => setToAccountId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            >
              <option value="">Выберите счёт</option>
              {accounts.filter(a => a.isActive && a.id !== accountId).map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Быстрые категории */}
        <div>
          <label className="block text-sm font-medium mb-2">Категория</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {quickCategories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  categoryId === cat.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-2 ring-blue-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
          >
            <option value="">Без категории</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.parentId ? '  ' : ''}{c.icon} {c.name}</option>
            ))}
          </select>
        </div>

        {/* Актор */}
        <div>
          <label className="block text-sm font-medium mb-1">Актор (человек/организация)</label>
          <select
            value={actorId}
            onChange={e => setActorId(e.target.value)}
            className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
          >
            <option value="">Не указан</option>
            {actors.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {/* Примечание */}
        <div>
          <label className="block text-sm font-medium mb-1">Примечание</label>
          <input
            type="text"
            placeholder="Описание операции..."
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
          />
        </div>

        {/* Амортизация */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={amortizationEnabled}
              onChange={e => setAmortizationEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm">Амортизация</span>
          </label>
          {amortizationEnabled && (
            <select
              value={amortizationMonths}
              onChange={e => setAmortizationMonths(Number(e.target.value))}
              className="px-2 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm"
            >
              <option value={1}>1 мес</option>
              <option value={3}>3 мес</option>
              <option value={6}>6 мес</option>
              <option value={12}>12 мес</option>
              <option value={24}>24 мес</option>
            </select>
          )}
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={!amount || parseFloat(amount.replace(',', '.')) <= 0}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            Сохранить
          </button>
        </div>
      </form>
    </div>
  );
}
