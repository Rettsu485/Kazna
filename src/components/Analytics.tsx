// ===== Страница аналитики =====
import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { formatMoney } from '../utils/money';
import { getMonthNameRu } from '../utils/dates';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';

const COLORS = ['#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#22C55E', '#06B6D4', '#F97316', '#EC4899', '#84CC16', '#6366F1'];

export default function Analytics() {
  const { transactions, categories, actors, accounts } = useStore();
  const [view, setView] = useState<'categories' | 'actors' | 'monthly' | 'weekly'>('categories');
  const [amortizationMode, setAmortizationMode] = useState<'cash' | 'amortized'>('cash');

  // Данные по категориям
  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        const name = cat?.name || 'Без категории';
        
        if (amortizationMode === 'amortized' && t.amortizationEnabled && t.amortizationMonths > 1) {
          data[name] = (data[name] || 0) + Math.round(t.amountMinor / t.amortizationMonths);
        } else {
          data[name] = (data[name] || 0) + t.amountMinor;
        }
      });
    return Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value: value / 100 }));
  }, [transactions, categories, amortizationMode]);

  // Данные по акторам
  const actorData = useMemo(() => {
    const data: Record<string, number> = {};
    transactions
      .filter(t => t.actorId)
      .forEach(t => {
        const actor = actors.find(a => a.id === t.actorId);
        const name = actor?.name || 'Без актора';
        data[name] = (data[name] || 0) + t.amountMinor;
      });
    return Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value: value / 100 }));
  }, [transactions, actors]);

  // Данные по месяцам
  const monthlyData = useMemo(() => {
    const data: Record<string, { income: number; expense: number }> = {};
    transactions.forEach(t => {
      const key = `${t.year}-${String(t.monthNumber + 1).padStart(2, '0')}`;
      if (!data[key]) data[key] = { income: 0, expense: 0 };
      if (t.type === 'income') data[key].income += t.amountMinor;
      if (t.type === 'expense') data[key].expense += t.amountMinor;
    });
    return Object.entries(data)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([key, val]) => {
        const [y, m] = key.split('-');
        return {
          name: `${getMonthNameRu(parseInt(m) - 1).slice(0, 3)}`,
          income: val.income / 100,
          expense: val.expense / 100,
        };
      });
  }, [transactions]);

  // Данные по неделям
  const weeklyData = useMemo(() => {
    const data: Record<number, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        data[t.weekNumber] = (data[t.weekNumber] || 0) + t.amountMinor;
      });
    return Object.entries(data)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([week, amount]) => ({
        name: `Н${week}`,
        amount: amount / 100,
      }));
  }, [transactions]);

  // Средние траты в день
  const avgDaily = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) return 0;
    const total = expenses.reduce((sum, t) => sum + t.amountMinor, 0);
    const dates = new Set(expenses.map(t => t.date));
    return Math.round(total / Math.max(dates.size, 1));
  }, [transactions]);

  const totalExpenses = categoryData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Переключатели */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'categories', label: 'Категории' },
          { key: 'actors', label: 'Акторы' },
          { key: 'monthly', label: 'По месяцам' },
          { key: 'weekly', label: 'По неделям' },
        ].map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key as typeof view)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              view === v.key
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Режим амортизации */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Режим:</span>
        <button
          onClick={() => setAmortizationMode('cash')}
          className={`px-3 py-1 rounded text-xs ${amortizationMode === 'cash' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
        >
          Фактические
        </button>
        <button
          onClick={() => setAmortizationMode('amortized')}
          className={`px-3 py-1 rounded text-xs ${amortizationMode === 'amortized' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
        >
          С амортизацией
        </button>
      </div>

      {/* Средние */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500">Среднее в день</p>
          <p className="text-xl font-bold mt-1">{formatMoney(avgDaily)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500">Всего расходов</p>
          <p className="text-xl font-bold mt-1">{formatMoney(totalExpenses * 100)}</p>
        </div>
      </div>

      {/* Графики */}
      {view === 'categories' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold mb-4">Расходы по категориям</h3>
          {categoryData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toLocaleString('ru-RU')} ₽`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full sm:w-48 space-y-1.5">
                {categoryData.slice(0, 8).map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="flex-1 truncate">{d.name}</span>
                    <span className="font-medium">{d.value.toLocaleString('ru-RU')} ₽</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-8">Нет данных</p>
          )}
        </div>
      )}

      {view === 'actors' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold mb-4">Расходы по акторам</h3>
          {actorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={actorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                <Tooltip formatter={(value: number) => `${value.toLocaleString('ru-RU')} ₽`} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-8">Нет данных</p>
          )}
        </div>
      )}

      {view === 'monthly' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold mb-4">Доходы и расходы по месяцам</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `${value.toLocaleString('ru-RU')} ₽`} />
                <Legend />
                <Bar dataKey="income" name="Доходы" fill="#22C55E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Расходы" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-8">Нет данных</p>
          )}
        </div>
      )}

      {view === 'weekly' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold mb-4">Расходы по неделям</h3>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `${value.toLocaleString('ru-RU')} ₽`} />
                <Area type="monotone" dataKey="amount" name="Расходы" fill="#3B82F6" stroke="#3B82F6" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-8">Нет данных</p>
          )}
        </div>
      )}

      {/* Топ операций */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold mb-3">Крупные расходы</h3>
        <div className="space-y-2">
          {transactions
            .filter(t => t.type === 'expense')
            .sort((a, b) => b.amountMinor - a.amountMinor)
            .slice(0, 10)
            .map(tx => {
              const cat = categories.find(c => c.id === tx.categoryId);
              return (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{cat?.icon || '📋'}</span>
                    <div className="min-w-0">
                      <p className="text-sm truncate">{tx.note || cat?.name}</p>
                      <p className="text-xs text-gray-500">{tx.date}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold whitespace-nowrap">{formatMoney(tx.amountMinor)}</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
