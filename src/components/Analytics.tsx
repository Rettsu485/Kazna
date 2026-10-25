// ===== Аналитика в стиле Material Design 3 =====
import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { formatMoney, formatMoneyShort } from '../utils/money';
import { getMonthNameRu } from '../utils/dates';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const COLORS = ['#6750A4', '#7D5260', '#B3261E', '#006A6A', '#006E1C', '#984062', '#555E68', '#0061A4', '#904D00', '#4A621C'];

export default function Analytics() {
  const { transactions, categories, actors } = useStore();
  const [view, setView] = useState<'categories' | 'actors' | 'monthly' | 'weekly'>('categories');
  const [amortizationMode, setAmortizationMode] = useState<'cash' | 'amortized'>('cash');

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const name = cat?.name || 'Без категории';
      if (amortizationMode === 'amortized' && t.amortizationEnabled && t.amortizationMonths > 1) {
        data[name] = (data[name] || 0) + Math.round(t.amountMinor / t.amortizationMonths);
      } else {
        data[name] = (data[name] || 0) + t.amountMinor;
      }
    });
    return Object.entries(data).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value: value / 100 }));
  }, [transactions, categories, amortizationMode]);

  const actorData = useMemo(() => {
    const data: Record<string, number> = {};
    transactions.filter(t => t.actorId).forEach(t => {
      const actor = actors.find(a => a.id === t.actorId);
      const name = actor?.name || 'Без актора';
      data[name] = (data[name] || 0) + t.amountMinor;
    });
    return Object.entries(data).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value: value / 100 }));
  }, [transactions, actors]);

  const monthlyData = useMemo(() => {
    const data: Record<string, { income: number; expense: number }> = {};
    transactions.forEach(t => {
      const key = `${t.year}-${String(t.monthNumber + 1).padStart(2, '0')}`;
      if (!data[key]) data[key] = { income: 0, expense: 0 };
      if (t.type === 'income') data[key].income += t.amountMinor;
      if (t.type === 'expense') data[key].expense += t.amountMinor;
    });
    return Object.entries(data).sort((a, b) => a[0].localeCompare(b[0])).slice(-12).map(([key, val]) => {
      const [y, m] = key.split('-');
      return { name: getMonthNameRu(parseInt(m) - 1).slice(0, 3), income: val.income / 100, expense: val.expense / 100 };
    });
  }, [transactions]);

  const weeklyData = useMemo(() => {
    const data: Record<number, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      data[t.weekNumber] = (data[t.weekNumber] || 0) + t.amountMinor;
    });
    return Object.entries(data).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([week, amount]) => ({
      name: `Н${week}`, amount: amount / 100,
    }));
  }, [transactions]);

  const avgDaily = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) return 0;
    const total = expenses.reduce((sum, t) => sum + t.amountMinor, 0);
    const dates = new Set(expenses.map(t => t.date));
    return Math.round(total / Math.max(dates.size, 1));
  }, [transactions]);

  const totalExpenses = categoryData.reduce((sum, d) => sum + d.value, 0);

  const views = [
    { key: 'categories', label: 'Категории' },
    { key: 'actors', label: 'Акторы' },
    { key: 'monthly', label: 'Месяцы' },
    { key: 'weekly', label: 'Недели' },
  ] as const;

  const tooltipStyle = {
    backgroundColor: 'var(--md-surface-container-high)',
    border: 'none',
    borderRadius: '12px',
    fontSize: '12px',
    color: 'var(--md-on-surface)',
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Segmented control */}
      <div className="flex rounded-full p-1 gap-1 overflow-x-auto" style={{ backgroundColor: 'var(--md-surface-container-high)' }}>
        {views.map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className="flex-1 min-w-[70px] py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
            style={{
              backgroundColor: view === v.key ? 'var(--md-secondary-container)' : 'transparent',
              color: view === v.key ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Амортизация toggle */}
      <div className="flex items-center gap-2 px-2">
        <span className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>Режим:</span>
        <button
          onClick={() => setAmortizationMode('cash')}
          className="px-3 py-1 rounded-full text-xs font-medium transition-all"
          style={{
            backgroundColor: amortizationMode === 'cash' ? 'var(--md-secondary-container)' : 'var(--md-surface-container)',
            color: amortizationMode === 'cash' ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
          }}
        >
          Фактические
        </button>
        <button
          onClick={() => setAmortizationMode('amortized')}
          className="px-3 py-1 rounded-full text-xs font-medium transition-all"
          style={{
            backgroundColor: amortizationMode === 'amortized' ? 'var(--md-secondary-container)' : 'var(--md-surface-container)',
            color: amortizationMode === 'amortized' ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
          }}
        >
          С амортизацией
        </button>
      </div>

      {/* Метрики */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 md-elevation-1" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
          <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>Среднее в день</p>
          <p className="text-xl font-bold mt-1 tabular-nums">{formatMoneyShort(avgDaily)}</p>
        </div>
        <div className="rounded-2xl p-4 md-elevation-1" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
          <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>Всего расходов</p>
          <p className="text-xl font-bold mt-1 tabular-nums">{formatMoneyShort(totalExpenses * 100)}</p>
        </div>
      </div>

      {/* Графики */}
      <div className="rounded-3xl p-4 md-elevation-1" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
        {view === 'categories' && (
          <>
            <h3 className="text-sm font-semibold mb-4">Расходы по категориям</h3>
            {categoryData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={50} paddingAngle={2}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full sm:w-48 space-y-1.5">
                  {categoryData.slice(0, 8).map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="flex-1 truncate" style={{ color: 'var(--md-on-surface-variant)' }}>{d.name}</span>
                      <span className="font-semibold tabular-nums">{d.value.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-center py-8 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>Нет данных</p>}
          </>
        )}

        {view === 'actors' && (
          <>
            <h3 className="text-sm font-semibold mb-4">Расходы по акторам</h3>
            {actorData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={actorData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--md-outline-variant)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--md-on-surface-variant)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--md-on-surface-variant)' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`]} />
                  <Bar dataKey="value" fill="var(--md-primary)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center py-8 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>Нет данных</p>}
          </>
        )}

        {view === 'monthly' && (
          <>
            <h3 className="text-sm font-semibold mb-4">Доходы и расходы по месяцам</h3>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--md-outline-variant)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--md-on-surface-variant)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--md-on-surface-variant)' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`]} />
                  <Bar dataKey="income" name="Доходы" fill="#006E1C" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expense" name="Расходы" fill="var(--md-error)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center py-8 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>Нет данных</p>}
          </>
        )}

        {view === 'weekly' && (
          <>
            <h3 className="text-sm font-semibold mb-4">Расходы по неделям</h3>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--md-outline-variant)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--md-on-surface-variant)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--md-on-surface-variant)' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`, 'Расходы']} />
                  <Area type="monotone" dataKey="amount" fill="var(--md-primary)" stroke="var(--md-primary)" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="text-center py-8 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>Нет данных</p>}
          </>
        )}
      </div>

      {/* Крупные расходы */}
      <div className="rounded-3xl p-4 md-elevation-1" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
        <h3 className="text-sm font-semibold mb-3">Крупные расходы</h3>
        <div className="space-y-1">
          {transactions
            .filter(t => t.type === 'expense')
            .sort((a, b) => b.amountMinor - a.amountMinor)
            .slice(0, 8)
            .map(tx => {
              const cat = categories.find(c => c.id === tx.categoryId);
              return (
                <div key={tx.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{cat?.icon || '📋'}</span>
                    <div className="min-w-0">
                      <p className="text-sm truncate">{tx.note || cat?.name}</p>
                      <p className="text-[10px] tabular-nums" style={{ color: 'var(--md-on-surface-variant)' }}>{tx.date}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold tabular-nums whitespace-nowrap">{formatMoneyShort(tx.amountMinor)}</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
