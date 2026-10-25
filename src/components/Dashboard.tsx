// ===== Dashboard в стиле Material Design 3 =====
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { formatMoney, formatMoneyShort } from '../utils/money';
import { formatDateShort, relativeDate } from '../utils/dates';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, CreditCard, AlertTriangle, CheckCircle, ArrowRight, Calendar, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const { accounts, transactions, budgets, debts, categories, recurringRules, goals } = useStore();

  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalBalance = accounts
      .filter(a => a.isActive && a.ownerType === 'personal')
      .reduce((sum, a) => sum + a.currentBalanceMinor, 0);

    const assets = accounts
      .filter(a => a.isActive && a.currentBalanceMinor > 0)
      .reduce((sum, a) => sum + a.currentBalanceMinor, 0);

    const liabilities = accounts
      .filter(a => a.isActive && a.currentBalanceMinor < 0)
      .reduce((sum, a) => sum + Math.abs(a.currentBalanceMinor), 0);

    const netWorth = assets - liabilities;

    const monthTxs = transactions.filter(t => t.monthNumber === currentMonth && t.year === currentYear);

    const income = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amountMinor, 0);
    const expenses = monthTxs.filter(t => t.type === 'expense' && !t.excludeFromBudget).reduce((sum, t) => sum + t.amountMinor, 0);
    const delta = income - expenses;

    const mandatoryPayments = recurringRules.filter(r => r.isActive && r.type === 'payment').reduce((sum, r) => sum + r.amountMinor, 0);
    const debtPayments = debts.filter(d => d.status === 'active' && d.direction === 'liability').reduce((sum, d) => sum + d.monthlyPaymentMinor, 0);
    const freeMoney = income - mandatoryPayments - debtPayments;

    const creditLoad = income > 0 ? (debtPayments / income) * 100 : 0;
    const mandatoryLoad = income > 0 ? (mandatoryPayments / income) * 100 : 0;

    const totalDebt = debts.filter(d => d.status === 'active' && d.direction === 'liability').reduce((sum, d) => sum + d.principalBalanceMinor, 0);

    const needsReview = transactions.filter(t => t.status === 'needs_review').length;

    const categoryExpenses: Record<string, number> = {};
    monthTxs.filter(t => t.type === 'expense').forEach(t => {
      const catName = categories.find(c => c.id === t.categoryId)?.name || 'Без категории';
      categoryExpenses[catName] = (categoryExpenses[catName] || 0) + t.amountMinor;
    });
    const topCategories = Object.entries(categoryExpenses).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const weeklyExpenses: Record<number, number> = {};
    monthTxs.filter(t => t.type === 'expense').forEach(t => {
      weeklyExpenses[t.weekNumber] = (weeklyExpenses[t.weekNumber] || 0) + t.amountMinor;
    });
    const weeklyData = Object.entries(weeklyExpenses).map(([week, amount]) => ({
      name: `Н${week}`,
      amount: amount / 100,
    }));

    const subscriptionsTotal = recurringRules.filter(r => r.isActive && r.type === 'subscription').reduce((sum, r) => sum + r.amountMinor, 0);

    return {
      totalBalance, netWorth, income, expenses, delta,
      mandatoryPayments, debtPayments, freeMoney,
      creditLoad, mandatoryLoad, totalDebt, needsReview,
      topCategories, weeklyData, subscriptionsTotal,
    };
  }, [accounts, transactions, budgets, debts, categories, recurringRules]);

  const pieData = metrics.topCategories.map(([name, amount]) => ({ name, value: amount / 100 }));
  const COLORS = ['#6750A4', '#7D5260', '#B3261E', '#006A6A', '#006E1C', '#984062', '#555E68'];

  const budgetProgress = budgets.filter(b => b.isActive).map(b => {
    const cat = categories.find(c => c.id === b.categoryId);
    const now = new Date();
    const monthTxs = transactions.filter(t =>
      t.categoryId === b.categoryId && t.type === 'expense' &&
      t.monthNumber === now.getMonth() && t.year === now.getFullYear()
    );
    const spent = monthTxs.reduce((sum, t) => sum + t.amountMinor, 0);
    const percent = b.amountLimitMinor > 0 ? (spent / b.amountLimitMinor) * 100 : 0;
    return { name: cat?.name || 'Бюджет', spent, limit: b.amountLimitMinor, percent, icon: cat?.icon };
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero card — баланс */}
      <div
        className="rounded-3xl p-5 md-elevation-2"
        style={{
          background: 'linear-gradient(135deg, var(--md-primary) 0%, var(--md-primary-container) 100%)',
          color: 'var(--md-on-primary)',
        }}
      >
        <div className="flex items-center gap-2 mb-1 opacity-80">
          <Wallet size={16} />
          <span className="text-xs font-medium uppercase tracking-wider">Общий баланс</span>
        </div>
        <p className="text-3xl md:text-4xl font-bold tabular-nums tracking-tight">
          {formatMoneyShort(metrics.totalBalance)}
        </p>
        <p className="text-sm opacity-80 mt-1 tabular-nums">
          {formatMoney(metrics.totalBalance)}
        </p>
        <div className="flex items-center gap-4 mt-3 text-xs opacity-90">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
            Чистая стоимость: {formatMoneyShort(metrics.netWorth)}
          </span>
        </div>
      </div>

      {/* Предупреждение */}
      {metrics.needsReview > 0 && (
        <Link
          to="/transactions?status=needs_review"
          className="flex items-center gap-3 p-4 rounded-2xl md-elevation-1 transition-transform active:scale-[0.98]"
          style={{ backgroundColor: 'var(--md-error-container)', color: 'var(--md-on-error-container)' }}
        >
          <AlertTriangle size={20} />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {metrics.needsReview} {metrics.needsReview === 1 ? 'операция требует' : 'операций требуют'} проверки
            </p>
          </div>
          <ChevronRight size={18} />
        </Link>
      )}

      {/* Метрики — одна колонка */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          title="Доходы"
          value={formatMoneyShort(metrics.income)}
          icon={<TrendingUp size={18} />}
          tone="positive"
        />
        <MetricCard
          title="Расходы"
          value={formatMoneyShort(metrics.expenses)}
          icon={<TrendingDown size={18} />}
          tone="negative"
        />
        <MetricCard
          title="Дельта"
          value={formatMoneyShort(metrics.delta)}
          subtitle={metrics.delta >= 0 ? 'Профицит' : 'Дефицит'}
          icon={metrics.delta >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          tone={metrics.delta >= 0 ? 'positive' : 'negative'}
        />
        <MetricCard
          title="Свободные"
          value={formatMoneyShort(metrics.freeMoney)}
          subtitle="До конца месяца"
          icon={<CheckCircle size={18} />}
          tone="neutral"
        />
      </div>

      {/* Обязательные платежи и долг */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          title="Обязательные"
          value={formatMoneyShort(metrics.mandatoryPayments)}
          subtitle={`${metrics.mandatoryLoad.toFixed(0)}% дохода`}
          icon={<Calendar size={18} />}
          tone="warning"
        />
        <MetricCard
          title="Долг"
          value={formatMoneyShort(metrics.totalDebt)}
          subtitle={`Нагрузка ${metrics.creditLoad.toFixed(0)}%`}
          icon={<CreditCard size={18} />}
          tone="negative"
        />
      </div>

      {/* График расходов по неделям */}
      <Card title="Расходы по неделям">
        {metrics.weeklyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={metrics.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--md-outline-variant)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--md-on-surface-variant)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--md-on-surface-variant)' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--md-surface-container-high)',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`, 'Расходы']}
              />
              <Bar dataKey="amount" fill="var(--md-primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState text="Нет данных за этот месяц" />
        )}
      </Card>

      {/* Топ категорий */}
      <Card title="Топ категорий">
        {pieData.length > 0 ? (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="45%" height={160}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={40} paddingAngle={2}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--md-surface-container-high)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₽`]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {metrics.topCategories.map(([name, amount], i) => (
                <div key={name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="flex-1 truncate" style={{ color: 'var(--md-on-surface-variant)' }}>{name}</span>
                  <span className="font-semibold tabular-nums">{formatMoneyShort(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState text="Нет расходов" />
        )}
      </Card>

      {/* Бюджеты */}
      <Card title="Бюджеты" action={<Link to="/budgets" className="text-xs font-medium" style={{ color: 'var(--md-primary)' }}>Все</Link>}>
        <div className="space-y-3">
          {budgetProgress.map(b => (
            <div key={b.name}>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <span>{b.icon}</span>
                  {b.name}
                </span>
                <span className={`tabular-nums ${b.percent > 100 ? 'font-semibold' : ''}`} style={{ color: b.percent > 100 ? 'var(--md-error)' : 'var(--md-on-surface-variant)' }}>
                  {formatMoneyShort(b.spent)} / {formatMoneyShort(b.limit)}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--md-surface-container-highest)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(b.percent, 100)}%`,
                    backgroundColor: b.percent > 100 ? 'var(--md-error)' : b.percent > 80 ? '#E8A000' : 'var(--md-primary)',
                  }}
                />
              </div>
            </div>
          ))}
          {budgetProgress.length === 0 && <EmptyState text="Нет активных бюджетов" />}
        </div>
      </Card>

      {/* Ближайшие платежи */}
      <Card title="Ближайшие платежи">
        <div className="space-y-1">
          {recurringRules
            .filter(r => r.isActive)
            .sort((a, b) => a.nextDate.localeCompare(b.nextDate))
            .slice(0, 5)
            .map(rule => (
              <div key={rule.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
                <div>
                  <p className="text-sm font-medium">{rule.name}</p>
                  <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>{relativeDate(rule.nextDate)}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums">{formatMoney(rule.amountMinor)}</span>
              </div>
            ))}
          {recurringRules.filter(r => r.isActive).length === 0 && <EmptyState text="Нет регулярных платежей" />}
        </div>
      </Card>

      {/* Цели */}
      <Card title="Цели" action={<Link to="/goals" className="text-xs font-medium" style={{ color: 'var(--md-primary)' }}>Все</Link>}>
        <div className="space-y-3">
          {goals.map(goal => {
            const percent = goal.targetAmountMinor > 0 ? (goal.currentAmountMinor / goal.targetAmountMinor) * 100 : 0;
            return (
              <div key={goal.id} className="p-3 rounded-2xl" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
                <div className="flex justify-between items-center mb-1.5">
                  <p className="text-sm font-medium">{goal.name}</p>
                  <span className="text-xs tabular-nums font-medium" style={{ color: 'var(--md-on-surface-variant)' }}>{percent.toFixed(0)}%</span>
                </div>
                <p className="text-xs mb-2 tabular-nums" style={{ color: 'var(--md-on-surface-variant)' }}>
                  {formatMoneyShort(goal.currentAmountMinor)} / {formatMoneyShort(goal.targetAmountMinor)}
                </p>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--md-surface-container-highest)' }}>
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${Math.min(percent, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Подписки */}
      <Card title={`Подписки: ${formatMoneyShort(metrics.subscriptionsTotal)}/мес`}>
        <div className="flex flex-wrap gap-2">
          {recurringRules
            .filter(r => r.isActive && r.type === 'subscription')
            .map(rule => (
              <span
                key={rule.id}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: 'var(--md-tertiary-container)', color: 'var(--md-on-tertiary-container)' }}
              >
                {rule.name} • {formatMoneyShort(rule.amountMinor)}
              </span>
            ))}
          {recurringRules.filter(r => r.isActive && r.type === 'subscription').length === 0 && <EmptyState text="Нет подписок" />}
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div
      className="rounded-3xl p-4 md-elevation-1"
      style={{ backgroundColor: 'var(--md-surface-container-low)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon, tone }: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  tone: 'positive' | 'negative' | 'neutral' | 'warning';
}) {
  const tones = {
    positive: { bg: '#E8F5E9', color: '#1B5E20', darkBg: '#1B3B1F', darkColor: '#81C784' },
    negative: { bg: '#FFEBEE', color: '#B71C1C', darkBg: '#3B1F1F', darkColor: '#EF9A9A' },
    neutral: { bg: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)', darkBg: 'var(--md-primary-container)', darkColor: 'var(--md-on-primary-container)' },
    warning: { bg: '#FFF3E0', color: '#E65100', darkBg: '#3B2F1F', darkColor: '#FFB74D' },
  };
  const t = tones[tone];

  return (
    <div
      className="rounded-2xl p-3 md-elevation-1"
      style={{ backgroundColor: 'var(--md-surface-container-low)' }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: t.bg, color: t.color }}
        >
          {icon}
        </div>
        <span className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>{title}</span>
      </div>
      <p className="text-lg font-bold tabular-nums tracking-tight truncate">{value}</p>
      {subtitle && <p className="text-[10px] mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>{subtitle}</p>}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-center py-6 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>{text}</p>
  );
}
