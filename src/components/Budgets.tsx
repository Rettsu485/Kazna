// ===== Бюджеты в стиле Material Design 3 =====
import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { formatMoney, formatMoneyShort } from '../utils/money';
import { Plus, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Budgets() {
  const { budgets, categories, transactions, addBudget } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newCatId, setNewCatId] = useState('');
  const [newLimit, setNewLimit] = useState('');

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const budgetData = useMemo(() => {
    return budgets.filter(b => b.isActive).map(b => {
      const cat = categories.find(c => c.id === b.categoryId);
      const monthTxs = transactions.filter(t =>
        t.categoryId === b.categoryId && t.type === 'expense' &&
        t.monthNumber === currentMonth && t.year === currentYear
      );
      const spent = monthTxs.reduce((sum, t) => sum + t.amountMinor, 0);
      const remaining = b.amountLimitMinor - spent;
      const percent = b.amountLimitMinor > 0 ? (spent / b.amountLimitMinor) * 100 : 0;
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const dayOfMonth = now.getDate();
      const projectedSpent = daysInMonth > 0 ? (spent / dayOfMonth) * daysInMonth : spent;
      const willExceed = projectedSpent > b.amountLimitMinor;
      return { budget: b, category: cat, spent, remaining, percent, projectedSpent, willExceed };
    });
  }, [budgets, categories, transactions, currentMonth, currentYear]);

  const totalBudget = budgetData.reduce((sum, b) => sum + b.budget.amountLimitMinor, 0);
  const totalSpent = budgetData.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  const handleAdd = () => {
    if (!newCatId || !newLimit) return;
    const limitMinor = Math.round(parseFloat(newLimit) * 100);
    addBudget({
      categoryId: newCatId, actorId: null, tagId: null, period: 'month',
      amountLimitMinor: limitMinor,
      startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`,
      isActive: true,
    });
    setNewCatId(''); setNewLimit(''); setShowAdd(false);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero */}
      <div
        className="rounded-3xl p-5 md-elevation-2"
        style={{
          background: 'linear-gradient(135deg, #006E1C 0%, #9EF77A 100%)',
          color: 'white',
        }}
      >
        <p className="text-xs opacity-80 uppercase tracking-wider font-medium">Бюджет на месяц</p>
        <p className="text-3xl font-bold mt-1 tabular-nums tracking-tight">{formatMoneyShort(totalBudget)}</p>
        <div className="flex justify-between mt-2 text-sm opacity-90 tabular-nums">
          <span>Потрачено: {formatMoneyShort(totalSpent)}</span>
          <span>Осталось: {formatMoneyShort(totalRemaining)}</span>
        </div>
        <div className="mt-3 h-2 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0}%` }} />
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="flex items-center gap-2 px-5 py-3 rounded-full font-medium text-sm md-elevation-2"
        style={{ backgroundColor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
      >
        <Plus size={18} />
        Добавить бюджет
      </button>

      {showAdd && (
        <div className="rounded-3xl p-4 space-y-3 md-elevation-2 animate-fade-in" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
          <select
            value={newCatId}
            onChange={e => setNewCatId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
          >
            <option value="">Выберите категорию</option>
            {categories.filter(c => c.budgetable).map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Лимит в рублях"
            value={newLimit}
            onChange={e => setNewLimit(e.target.value.replace(/[^0-9.,]/g, ''))}
            className="w-full px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
            inputMode="decimal"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-full text-sm font-medium" style={{ backgroundColor: 'var(--md-surface-container-high)', color: 'var(--md-on-surface)' }}>Отмена</button>
            <button onClick={handleAdd} className="flex-1 py-3 rounded-full text-sm font-medium" style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>Добавить</button>
          </div>
        </div>
      )}

      {/* Список бюджетов */}
      <div className="space-y-2">
        {budgetData.map(({ budget, category, spent, remaining, percent, projectedSpent, willExceed }) => (
          <div
            key={budget.id}
            className="p-4 rounded-2xl md-elevation-1"
            style={{ backgroundColor: 'var(--md-surface-container-low)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{category?.icon || '📋'}</span>
                <span className="font-medium text-sm">{category?.name || 'Бюджет'}</span>
              </div>
              {percent >= 100 ? (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--md-error-container)', color: 'var(--md-on-error-container)' }}>
                  <AlertTriangle size={10} /> Превышен
                </span>
              ) : willExceed ? (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFF3E0', color: '#E65100' }}>
                  <AlertTriangle size={10} /> Риск
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }}>
                  <CheckCircle size={10} /> OK
                </span>
              )}
            </div>

            <div className="flex justify-between text-xs mb-2 tabular-nums" style={{ color: 'var(--md-on-surface-variant)' }}>
              <span>{formatMoneyShort(spent)} / {formatMoneyShort(budget.amountLimitMinor)}</span>
              <span className={remaining < 0 ? 'text-red-600 font-semibold' : ''}>
                {remaining >= 0 ? `осталось ${formatMoneyShort(remaining)}` : `перерасход ${formatMoneyShort(Math.abs(remaining))}`}
              </span>
            </div>

            <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--md-surface-container-highest)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(percent, 100)}%`,
                  backgroundColor: percent > 100 ? 'var(--md-error)' : percent > 80 ? '#E8A000' : 'var(--md-primary)',
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] tabular-nums" style={{ color: 'var(--md-on-surface-variant)' }}>
              <span>{percent.toFixed(0)}%</span>
              {willExceed && <span>Прогноз: {formatMoneyShort(projectedSpent)}</span>}
            </div>
          </div>
        ))}

        {budgetData.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--md-on-surface-variant)' }}>
            <p className="text-lg mb-1">Нет бюджетов</p>
            <p className="text-sm">Создайте первый бюджет</p>
          </div>
        )}
      </div>
    </div>
  );
}
