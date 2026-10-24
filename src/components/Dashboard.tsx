// ===== Dashboard =====
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { formatMoney } from '../utils/money';
import { formatDateRu, formatDateShort, relativeDate } from '../utils/dates';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, CreditCard, AlertTriangle, CheckCircle, ArrowRight, Target, Calendar } from 'lucide-react';

export default function Dashboard() {
  const { accounts, transactions, budgets, debts, categories, actors, recurringRules, goals } = useStore();

  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Баланс по активным счетам
    const totalBalance = accounts
      .filter(a => a.isActive && a.ownerType === 'personal')
      .reduce((sum, a) => sum + a.currentBalanceMinor, 0);

    // Активы
    const assets = accounts
      .filter(a => a.isActive && a.currentBalanceMinor > 0)
      .reduce((sum, a) => sum + a.currentBalanceMinor, 0);

    // Обязательства
    const liabilities = accounts
      .filter(a => a.isActive && a.currentBalanceMinor < 0)
      .reduce((sum, a) => sum + Math.abs(a.currentBalanceMinor), 0);

    const netWorth = assets - liabilities;

    // Транзакции текущего месяца
    const monthTxs = transactions.filter(t => t.monthNumber === currentMonth && t.year === currentYear);
    
    const income = monthTxs
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amountMinor, 0);

    const expenses = monthTxs
      .filter(t => t.type === 'expense' && !t.excludeFromBudget)
      .reduce((sum, t) => sum + t.amountMinor, 0);

    const delta = income - expenses;

    // Обязательные платежи из регулярных правил
    const mandatoryPayments = recurringRules
      .filter(r => r.isActive && r.type === 'payment')
      .reduce((sum, r) => sum + r.amountMinor, 0);

    // Платежи по долгам
    const debtPayments = debts
      .filter(d => d.status === 'active' && d.direction === 'liability')
      .reduce((sum, d) => sum + d.monthlyPaymentMinor, 0);

    // Свободные деньги
    const freeMoney = income - mandatoryPayments - debtPayments;

    // Кредитная нагрузка
    const creditLoad = income > 0 ? (debtPayments / income) * 100 : 0;
    const mandatoryLoad = income > 0 ? (mandatoryPayments / income) * 100 : 0;

    // Общий долг
    const totalDebt = debts
      .filter(d => d.status === 'active' && d.direction === 'liability')
      .reduce((sum, d) => sum + d.principalBalanceMinor, 0);

    // Операции требующие проверки
    const needsReview = transactions.filter(t => t.status === 'needs_review').length;

    // Топ категорий расходов
    const categoryExpenses: Record<string, number> = {};
    monthTxs
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const catName = categories.find(c => c.id === t.categoryId)?.name || 'Без категории';
        categoryExpenses[catName] = (categoryExpenses[catName] || 0) + t.amountMinor;
      });
    const topCategories = Object.entries(categoryExpenses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Расходы по неделям
    const weeklyExpenses: Record<number, number> = {};
    monthTxs
      .filter(t => t.type === 'expense')
      .forEach(t => {
        weeklyExpenses[t.weekNumber] = (weeklyExpenses[t.weekNumber] || 0) + t.amountMinor;
      });
    const weeklyData = Object.entries(weeklyExpenses).map(([week, amount]) => ({
      name: `Нед. ${week}`,
      amount: amount / 100,
    }));

    // Подписки в месяц
    const subscriptionsTotal = recurringRules
      .filter(r => r.isActive && r.type === 'subscription')
      .reduce((sum, r) => sum + r.amountMinor, 0);

    return {
      totalBalance, netWorth, income, expenses, delta,
      mandatoryPayments, debtPayments, freeMoney,
      creditLoad, mandatoryLoad, totalDebt, needsReview,
      topCategories, weeklyData, subscriptionsTotal,
    };
  }, [accounts, transactions, budgets, debts, categories, actors, recurringRules]);

  // Данные для pie chart
  const pieData = metrics.topCategories.map(([name, amount]) => ({
    name,
    value: amount / 100,
  }));

  const COLORS = ['#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#22C55E', '#06B6D4', '#F97316'];

  // Ближайший платёж
  const upcomingPayment = recurringRules
    .filter(r => r.isActive)
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate))[0];

  // Бюджеты
  const budgetProgress = budgets.filter(b => b.isActive).map(b => {
    const cat = categories.find(c => c.id === b.categoryId);
    const now = new Date();
    const monthTxs = transactions.filter(t =>
      t.categoryId === b.categoryId &&
      t.type === 'expense' &&
      t.monthNumber === now.getMonth() &&
      t.year === now.getFullYear()
    );
    const spent = monthTxs.reduce((sum, t) => sum + t.amountMinor, 0);
    const percent = b.amountLimitMinor > 0 ? (spent / b.amountLimitMinor) * 100 : 0;
    return { name: cat?.name || 'Бюджет', spent, limit: b.amountLimitMinor, percent };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Основные карточки */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Баланс"
          value={formatMoney(metrics.totalBalance)}
          icon={<Wallet size={20} className="text-blue-500" />}
          color="blue"
        />
        <MetricCard
          title="Чистая стоимость"
          value={formatMoney(metrics.netWorth)}
          icon={<TrendingUp size={20} className="text-green-500" />}
          color="green"
        />
        <MetricCard
          title="Доходы месяца"
          value={formatMoney(metrics.income)}
          icon={<TrendingUp size={20} className="text-emerald-500" />}
          color="emerald"
        />
        <MetricCard
          title="Расходы месяца"
          value={formatMoney(metrics.expenses)}
          icon={<TrendingDown size={20} className="text-red-500" />}
          color="red"
        />
      </div>

      {/* Вторая строка карточек */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Дельта месяца"
          value={formatMoney(metrics.delta)}
          subtitle={metrics.delta >= 0 ? 'Профицит' : 'Дефицит'}
          icon={metrics.delta >= 0 ? <TrendingUp size={20} className="text-green-500" /> : <TrendingDown size={20} className="text-red-500" />}
          color={metrics.delta >= 0 ? 'green' : 'red'}
        />
        <MetricCard
          title="Свободные деньги"
          value={formatMoney(metrics.freeMoney)}
          subtitle="До конца месяца"
          icon={<CheckCircle size={20} className="text-blue-500" />}
          color="blue"
        />
        <MetricCard
          title="Обязательные"
          value={formatMoney(metrics.mandatoryPayments)}
          subtitle={`${metrics.mandatoryLoad.toFixed(0)}% от дохода`}
          icon={<Calendar size={20} className="text-orange-500" />}
          color="orange"
        />
        <MetricCard
          title="Общий долг"
          value={formatMoney(metrics.totalDebt)}
          subtitle={`Нагрузка ${metrics.creditLoad.toFixed(1)}%`}
          icon={<CreditCard size={20} className="text-purple-500" />}
          color="purple"
        />
      </div>

      {/* Предупреждения */}
      {metrics.needsReview > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {metrics.needsReview} {metrics.needsReview === 1 ? 'операция требует' : 'операций требуют'} проверки
            </p>
          </div>
          <Link to="/transactions?status=needs_review" className="text-sm text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1">
            Проверить <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Расходы по неделям */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold mb-4">Расходы по неделям</h3>
          {metrics.weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metrics.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `${value.toLocaleString('ru-RU')} ₽`} />
                <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Нет данных</p>
          )}
        </div>

        {/* Топ категорий */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold mb-4">Топ категорий расходов</h3>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toLocaleString('ru-RU')} ₽`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {metrics.topCategories.map(([name, amount], i) => (
                  <div key={name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="flex-1 truncate">{name}</span>
                    <span className="font-medium">{formatMoney(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Нет данных</p>
          )}
        </div>
      </div>

      {/* Бюджеты и ближайшие платежи */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Бюджеты */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Бюджеты</h3>
            <Link to="/budgets" className="text-xs text-blue-600 hover:underline">Все →</Link>
          </div>
          <div className="space-y-3">
            {budgetProgress.map(b => (
              <div key={b.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="truncate">{b.name}</span>
                  <span className={b.percent > 100 ? 'text-red-500 font-medium' : ''}>
                    {formatMoney(b.spent)} / {formatMoney(b.limit)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${b.percent > 100 ? 'bg-red-500' : b.percent > 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(b.percent, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {budgetProgress.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Нет активных бюджетов</p>
            )}
          </div>
        </div>

        {/* Ближайшие платежи */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Ближайшие платежи</h3>
          </div>
          <div className="space-y-2">
            {recurringRules
              .filter(r => r.isActive)
              .sort((a, b) => a.nextDate.localeCompare(b.nextDate))
              .slice(0, 5)
              .map(rule => (
                <div key={rule.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{rule.name}</p>
                    <p className="text-xs text-gray-500">{relativeDate(rule.nextDate)}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatMoney(rule.amountMinor)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Цели */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Цели</h3>
          <Link to="/goals" className="text-xs text-blue-600 hover:underline">Все →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {goals.map(goal => {
            const percent = goal.targetAmountMinor > 0 ? (goal.currentAmountMinor / goal.targetAmountMinor) * 100 : 0;
            return (
              <div key={goal.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm font-medium mb-1">{goal.name}</p>
                <p className="text-xs text-gray-500 mb-2">{formatMoney(goal.currentAmountMinor)} / {formatMoney(goal.targetAmountMinor)}</p>
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(percent, 100)}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{percent.toFixed(0)}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Подписки */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold mb-3">Подписки: {formatMoney(metrics.subscriptionsTotal)}/мес</h3>
        <div className="flex flex-wrap gap-2">
          {recurringRules
            .filter(r => r.isActive && r.type === 'subscription')
            .map(rule => (
              <span key={rule.id} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-md text-xs">
                {rule.name} • {formatMoney(rule.amountMinor)}
              </span>
            ))}
        </div>
      </div>

      {/* Последние операции */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Последние операции</h3>
          <Link to="/transactions" className="text-xs text-blue-600 hover:underline">Все →</Link>
        </div>
        <div className="space-y-2">
          {transactions.slice(0, 8).map(tx => {
            const cat = categories.find(c => c.id === tx.categoryId);
            const actor = actors.find(a => a.id === tx.actorId);
            return (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg">{cat?.icon || '📋'}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{tx.note || cat?.name || 'Операция'}</p>
                    <p className="text-xs text-gray-500">
                      {formatDateShort(tx.date)}
                      {actor && ` • ${actor.name}`}
                      {tx.status === 'needs_review' && ' ⚠️'}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold whitespace-nowrap ${
                  tx.type === 'income' ? 'text-green-600' :
                  tx.type === 'transfer' ? 'text-blue-600' :
                  tx.type === 'debt_payment' ? 'text-purple-600' :
                  'text-gray-900 dark:text-white'
                }`}>
                  {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '↔ ' : '-'}
                  {formatMoney(tx.amountMinor)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon, color }: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
    orange: 'bg-orange-50 dark:bg-orange-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
  };

  return (
    <div className={`${bgColors[color] || 'bg-gray-50 dark:bg-gray-800'} rounded-xl p-3 border border-gray-100 dark:border-gray-700`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-gray-500 dark:text-gray-400">{title}</span>
      </div>
      <p className="text-lg font-bold truncate">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}
