// ===== Страница операций в стиле Material Design 3 =====
import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { formatMoney, formatMoneyShort } from '../utils/money';
import { formatDateShort, today } from '../utils/dates';
import { Search, Filter, Plus, Trash2, X, ArrowUpDown, Check } from 'lucide-react';
import type { TransactionType } from '../types';

const TYPE_LABELS: Record<string, string> = {
  expense: 'Расход', income: 'Доход', transfer: 'Перевод',
  debt_payment: 'Платёж по долгу', debt_given: 'Выданный долг',
  debt_received: 'Полученный долг', investment: 'Инвестиция',
  savings: 'Накопления', correction: 'Корректировка',
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
    if (typeFilter !== 'all') result = result.filter(t => t.type === typeFilter);
    if (categoryFilter !== 'all') result = result.filter(t => t.categoryId === categoryFilter);
    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);

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
    <div className="space-y-3 animate-fade-in">
      {/* Поиск */}
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-full md-elevation-1"
        style={{ backgroundColor: 'var(--md-surface-container-high)' }}
      >
        <Search size={18} style={{ color: 'var(--md-on-surface-variant)' }} />
        <input
          type="text"
          placeholder="Поиск операций..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'var(--md-on-surface)' }}
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-1.5 rounded-full"
          style={{
            backgroundColor: showFilters ? 'var(--md-secondary-container)' : 'transparent',
            color: showFilters ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
          }}
        >
          <Filter size={16} />
        </button>
      </div>

      {/* Фильтры */}
      {showFilters && (
        <div
          className="rounded-2xl p-4 space-y-3 md-elevation-1 animate-fade-in"
          style={{ backgroundColor: 'var(--md-surface-container-low)' }}
        >
          <div className="grid grid-cols-2 gap-2">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm"
              style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
            >
              <option value="all">Все типы</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm"
              style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
            >
              <option value="all">Все категории</option>
              {categories.filter(c => c.parentId === null).map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm"
              style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
            >
              <option value="all">Все статусы</option>
              <option value="confirmed">Подтверждённые</option>
              <option value="needs_review">Требуют проверки</option>
              <option value="imported">Импортированные</option>
              <option value="archived">Архив</option>
            </select>
            <button
              onClick={() => { setTypeFilter('all'); setCategoryFilter('all'); setStatusFilter('all'); setSearch(''); }}
              className="px-3 py-2.5 rounded-xl text-sm font-medium"
              style={{ color: 'var(--md-primary)' }}
            >
              Сбросить
            </button>
          </div>
        </div>
      )}

      {/* Итоги */}
      <div className="flex items-center justify-between px-2 text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
        <span>{filtered.length} операций</span>
        <button
          onClick={() => { setSortBy(sortBy === 'date' ? 'amount' : 'date'); setSortDir(sortDir === 'desc' ? 'asc' : 'desc'); }}
          className="flex items-center gap-1"
        >
          <ArrowUpDown size={12} />
          {sortBy === 'date' ? 'По дате' : 'По сумме'} {sortDir === 'desc' ? '↓' : '↑'}
        </button>
      </div>

      {/* Список */}
      <div className="space-y-1.5">
        {filtered.map(tx => {
          const cat = categories.find(c => c.id === tx.categoryId);
          const actor = actors.find(a => a.id === tx.actorId);
          const account = accounts.find(a => a.id === tx.accountId);

          return (
            <div
              key={tx.id}
              className="flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-[0.99]"
              style={{
                backgroundColor: tx.status === 'needs_review'
                  ? 'var(--md-error-container)'
                  : 'var(--md-surface-container-low)',
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: 'var(--md-surface-container-highest)' }}
              >
                {cat?.icon || '📋'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate">{tx.note || cat?.name || 'Операция'}</p>
                  {tx.status === 'needs_review' && (
                    <span className="px-1.5 py-0.5 text-[9px] rounded-full font-medium" style={{ backgroundColor: 'var(--md-error)', color: 'var(--md-on-error)' }}>
                      проверить
                    </span>
                  )}
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--md-on-surface-variant)' }}>
                  {formatDateShort(tx.date)}
                  {cat && ` • ${cat.name}`}
                  {actor && ` • ${actor.name}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-bold tabular-nums whitespace-nowrap"
                  style={{
                    color: tx.type === 'income' ? '#1B5E20' : tx.type === 'transfer' ? 'var(--md-primary)' : 'var(--md-on-surface)',
                  }}
                >
                  {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '↔' : '−'}
                  {formatMoneyShort(tx.amountMinor)}
                </span>
                <div className="flex gap-0.5">
                  {tx.status === 'needs_review' && (
                    <button
                      onClick={() => updateTransaction(tx.id, { status: 'confirmed' })}
                      className="p-1.5 rounded-full"
                      style={{ color: '#1B5E20' }}
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteTransaction(tx.id)}
                    className="p-1.5 rounded-full"
                    style={{ color: 'var(--md-on-surface-variant)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--md-on-surface-variant)' }}>
            <p className="text-lg mb-1">Нет операций</p>
            <p className="text-sm">Добавьте первую операцию</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Форма добавления операции =====
export function NewTransaction() {
  const navigate = useNavigate();
  const { accounts, categories, actors, addTransaction } = useStore();

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

  const typeButtons = [
    { value: 'expense', label: 'Расход', color: '#B3261E' },
    { value: 'income', label: 'Доход', color: '#1B5E20' },
    { value: 'transfer', label: 'Перевод', color: 'var(--md-primary)' },
    { value: 'debt_payment', label: 'Долг', color: '#6A1B9A' },
  ];

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Тип операции — segmented button */}
        <div
          className="flex rounded-full p-1 gap-1"
          style={{ backgroundColor: 'var(--md-surface-container-high)' }}
        >
          {typeButtons.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value as TransactionType)}
              className="flex-1 py-2 rounded-full text-xs font-medium transition-all"
              style={{
                backgroundColor: type === t.value ? 'var(--md-secondary-container)' : 'transparent',
                color: type === t.value ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Сумма */}
        <div
          className="rounded-3xl p-6 md-elevation-2 text-center"
          style={{ backgroundColor: 'var(--md-surface-container-low)' }}
        >
          <label className="block text-xs mb-2" style={{ color: 'var(--md-on-surface-variant)' }}>Сумма</label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
              className="w-full text-4xl font-bold bg-transparent outline-none text-center tabular-nums"
              style={{ color: 'var(--md-on-surface)' }}
              autoFocus
            />
            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-2xl" style={{ color: 'var(--md-on-surface-variant)' }}>₽</span>
          </div>
        </div>

        {/* Дата и счёт */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1 ml-2" style={{ color: 'var(--md-on-surface-variant)' }}>Дата</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-3 rounded-xl text-sm"
              style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1 ml-2" style={{ color: 'var(--md-on-surface-variant)' }}>Счёт</label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="w-full px-3 py-3 rounded-xl text-sm"
              style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
            >
              {accounts.filter(a => a.isActive).map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Куда (для перевода) */}
        {type === 'transfer' && (
          <div>
            <label className="block text-xs mb-1 ml-2" style={{ color: 'var(--md-on-surface-variant)' }}>Куда</label>
            <select
              value={toAccountId}
              onChange={e => setToAccountId(e.target.value)}
              className="w-full px-3 py-3 rounded-xl text-sm"
              style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
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
          <label className="block text-xs mb-2 ml-2" style={{ color: 'var(--md-on-surface-variant)' }}>Категория</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {quickCategories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className="px-3 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5"
                style={{
                  backgroundColor: categoryId === cat.id ? 'var(--md-secondary-container)' : 'var(--md-surface-container)',
                  color: categoryId === cat.id ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Актор и примечание */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1 ml-2" style={{ color: 'var(--md-on-surface-variant)' }}>Актор</label>
            <select
              value={actorId}
              onChange={e => setActorId(e.target.value)}
              className="w-full px-3 py-3 rounded-xl text-sm"
              style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
            >
              <option value="">Не указан</option>
              {actors.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1 ml-2" style={{ color: 'var(--md-on-surface-variant)' }}>Примечание</label>
            <input
              type="text"
              placeholder="Описание..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-3 rounded-xl text-sm"
              style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
            />
          </div>
        </div>

        {/* Амортизация */}
        <div className="flex items-center gap-3 px-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={amortizationEnabled}
              onChange={e => setAmortizationEnabled(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--md-primary)' }}
            />
            <span className="text-sm">Амортизация</span>
          </label>
          {amortizationEnabled && (
            <select
              value={amortizationMonths}
              onChange={e => setAmortizationMonths(Number(e.target.value))}
              className="px-2 py-1 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
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
            className="flex-1 py-3.5 rounded-full font-medium text-sm"
            style={{ backgroundColor: 'var(--md-surface-container-high)', color: 'var(--md-primary)' }}
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={!amount || parseFloat(amount.replace(',', '.')) <= 0}
            className="flex-1 py-3.5 rounded-full font-medium text-sm disabled:opacity-40"
            style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
          >
            Сохранить
          </button>
        </div>
      </form>
    </div>
  );
}
