// ===== Страница бюджетов =====
import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { formatMoney } from '../utils/money';
import { Plus, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

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
        t.categoryId === b.categoryId &&
        t.type === 'expense' &&
        t.monthNumber === currentMonth &&
        t.year === currentYear
      );
      const spent = monthTxs.reduce((sum, t) => sum + t.amountMinor, 0);
      const remaining = b.amountLimitMinor - spent;
      const percent = b.amountLimitMinor > 0 ? (spent / b.amountLimitMinor) * 100 : 0;
      
      // Прогноз: дней прошло / дней в месяце * лимит
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const dayOfMonth = now.getDate();
      const projectedSpent = daysInMonth > 0 ? (spent / dayOfMonth) * daysInMonth : spent;
      const willExceed = projectedSpent > b.amountLimitMinor;

      return { budget: b, category: cat, spent, remaining, percent, projectedSpent, willExceed };
    });
  }, [budgets, categories, transactions, currentMonth, currentYear, now]);

  const totalBudget = budgetData.reduce((sum, b) => sum + b.budget.amountLimitMinor, 0);
  const totalSpent = budgetData.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  const handleAdd = () => {
    if (!newCatId || !newLimit) return;
    const limitMinor = Math.round(parseFloat(newLimit) * 100);
    addBudget({
      categoryId: newCatId,
      actorId: null,
      tagId: null,
      period: 'month',
      amountLimitMinor: limitMinor,
      startDate: `${currentYear}-01-01`,
      endDate: `${currentYear}-12-31`,
      isActive: true,
    });
    setNewCatId('');
    setNewLimit('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Общий бюджет */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-5 text-white">
        <p className="text-sm opacity-80">Бюджет на месяц</p>
        <p className="text-3xl font-bold mt-1">{formatMoney(totalBudget)}</p>
        <div className="flex justify-between mt-2 text-sm">
          <span>Потрачено: {formatMoney(totalSpent)}</span>
          <span>Осталось: {formatMoney(totalRemaining)}</span>
        </div>
        <div className="mt-2 h-2 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full"
            style={{ width: `${totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0}%` }}
          />
        </div>
      </div>

      {/* Кнопка добавления */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        <Plus size={16} />
        Добавить бюджет
      </button>

      {showAdd && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 space-y-3">
          <select
            value={newCatId}
            onChange={e => setNewCatId(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
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
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
            inputMode="decimal"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">Отмена</button>
            <button onClick={handleAdd} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm">Добавить</button>
          </div>
        </div>
      )}

      {/* Список бюджетов */}
      <div className="space-y-3">
        {budgetData.map(({ budget, category, spent, remaining, percent, projectedSpent, willExceed }) => (
          <div key={budget.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{category?.icon || '📋'}</span>
                <span className="font-medium text-sm">{category?.name || 'Бюджет'}</span>
              </div>
              <div className="flex items-center gap-2">
                {willExceed ? (
                  <span className="flex items-center gap-1 text-xs text-amber-600">
                    <AlertTriangle size={12} /> Превышение
                  </span>
                ) : percent >= 100 ? (
                  <span className="flex items-center gap-1 text-xs text-red-600">
                    <AlertTriangle size={12} /> Превышен
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle size={12} /> В норме
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">{formatMoney(spent)} из {formatMoney(budget.amountLimitMinor)}</span>
              <span className={`font-medium ${remaining < 0 ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>
                {remaining >= 0 ? `осталось ${formatMoney(remaining)}` : `перерасход ${formatMoney(Math.abs(remaining))}`}
              </span>
            </div>
            
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  percent > 100 ? 'bg-red-500' : percent > 80 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-400">
              <span>{percent.toFixed(0)}%</span>
              {willExceed && <span>Прогноз: {formatMoney(projectedSpent)}</span>}
            </div>
          </div>
        ))}
        
        {budgetData.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-2">Нет бюджетов</p>
            <p className="text-sm">Создайте первый бюджет для контроля расходов</p>
          </div>
        )}
      </div>
    </div>
  );
}
