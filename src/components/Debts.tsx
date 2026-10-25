// ===== Долги в стиле Material Design 3 =====
import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { formatMoney, formatMoneyShort } from '../utils/money';
import { Calculator, Snowflake, Flame } from 'lucide-react';

export default function Debts() {
  const { debts } = useStore();
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
  const [extraPayment, setExtraPayment] = useState('');
  const [selectedDebt, setSelectedDebt] = useState<string | null>(null);

  const activeDebts = debts.filter(d => d.status === 'active');
  const totalDebt = activeDebts.filter(d => d.direction === 'liability').reduce((sum, d) => sum + d.principalBalanceMinor, 0);
  const totalMonthly = activeDebts.filter(d => d.direction === 'liability').reduce((sum, d) => sum + d.monthlyPaymentMinor, 0);

  const sortedDebts = useMemo(() => {
    const sorted = [...activeDebts].filter(d => d.direction === 'liability');
    if (strategy === 'avalanche') sorted.sort((a, b) => b.interestRate - a.interestRate);
    else sorted.sort((a, b) => a.principalBalanceMinor - b.principalBalanceMinor);
    return sorted;
  }, [activeDebts, strategy]);

  const simulateEarlyPayoff = (debt: typeof activeDebts[0], extraMonthlyMinor: number) => {
    if (!debt || extraMonthlyMinor <= 0) return null;
    const monthlyRate = debt.interestRate / 100 / 12;
    let balance = debt.principalBalanceMinor;
    let months = 0;
    let totalInterest = 0;
    const monthlyPayment = debt.monthlyPaymentMinor + extraMonthlyMinor;
    while (balance > 0 && months < 600) {
      const interest = Math.round(balance * monthlyRate);
      totalInterest += interest;
      const principal = Math.min(monthlyPayment - interest, balance);
      balance -= principal;
      months++;
    }
    let normalBalance = debt.principalBalanceMinor;
    let normalMonths = 0;
    let normalInterest = 0;
    while (normalBalance > 0 && normalMonths < 600) {
      const interest = Math.round(normalBalance * monthlyRate);
      normalInterest += interest;
      const principal = Math.min(debt.monthlyPaymentMinor - interest, normalBalance);
      normalBalance -= principal;
      normalMonths++;
    }
    return { months, totalInterest, savedMonths: normalMonths - months, savedInterest: normalInterest - totalInterest };
  };

  const selectedDebtObj = activeDebts.find(d => d.id === selectedDebt);
  const extraMinor = extraPayment ? Math.round(parseFloat(extraPayment) * 100) : 0;
  const simulation = selectedDebtObj ? simulateEarlyPayoff(selectedDebtObj, extraMinor) : null;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero */}
      <div
        className="rounded-3xl p-5 md-elevation-2"
        style={{
          background: 'linear-gradient(135deg, #B3261E 0%, #F9DEDC 100%)',
          color: 'white',
        }}
      >
        <p className="text-xs opacity-80 uppercase tracking-wider font-medium">Общий долг</p>
        <p className="text-3xl font-bold mt-1 tabular-nums tracking-tight">{formatMoneyShort(totalDebt)}</p>
        <p className="text-sm opacity-80 mt-1 tabular-nums">Платёж: {formatMoneyShort(totalMonthly)}/мес</p>
      </div>

      {/* Стратегия — segmented control */}
      <div className="rounded-3xl p-4 md-elevation-1" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
        <h3 className="text-sm font-semibold mb-3">Стратегия погашения</h3>
        <div className="flex rounded-full p-1 gap-1" style={{ backgroundColor: 'var(--md-surface-container-high)' }}>
          <button
            onClick={() => setStrategy('avalanche')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-medium transition-all"
            style={{
              backgroundColor: strategy === 'avalanche' ? 'var(--md-secondary-container)' : 'transparent',
              color: strategy === 'avalanche' ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
            }}
          >
            <Flame size={14} /> Лавина
          </button>
          <button
            onClick={() => setStrategy('snowball')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-medium transition-all"
            style={{
              backgroundColor: strategy === 'snowball' ? 'var(--md-secondary-container)' : 'transparent',
              color: strategy === 'snowball' ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
            }}
          >
            <Snowflake size={14} /> Снежный ком
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--md-on-surface-variant)' }}>
          {strategy === 'avalanche'
            ? 'Сначала долг с максимальной ставкой — экономим на %'
            : 'Сначала самый маленький долг — быстрый результат'}
        </p>
      </div>

      {/* Список долгов */}
      <div className="space-y-2">
        {sortedDebts.map((debt, idx) => (
          <div
            key={debt.id}
            onClick={() => setSelectedDebt(debt.id === selectedDebt ? null : debt.id)}
            className="p-4 rounded-2xl md-elevation-1 cursor-pointer transition-all active:scale-[0.99]"
            style={{
              backgroundColor: debt.id === selectedDebt ? 'var(--md-primary-container)' : 'var(--md-surface-container-low)',
              color: debt.id === selectedDebt ? 'var(--md-on-primary-container)' : 'var(--md-on-surface)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {idx === 0 && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: strategy === 'avalanche' ? 'var(--md-error-container)' : 'var(--md-primary-container)',
                      color: strategy === 'avalanche' ? 'var(--md-on-error-container)' : 'var(--md-on-primary-container)',
                    }}
                  >
                    1
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{debt.name}</p>
                  <p className="text-xs" style={{ color: debt.id === selectedDebt ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)', opacity: 0.8 }}>
                    {debt.type === 'credit_card' ? 'Кредитная карта' : debt.type === 'loan' ? 'Кредит' : 'Долг'}
                    {debt.interestRate > 0 && ` • ${debt.interestRate}%`}
                    {debt.paymentDay > 0 && ` • ${debt.paymentDay} числа`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold tabular-nums">{formatMoneyShort(debt.principalBalanceMinor)}</p>
                <p className="text-xs tabular-nums" style={{ opacity: 0.7 }}>{formatMoneyShort(debt.monthlyPaymentMinor)}/мес</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Симулятор */}
      {selectedDebtObj && (
        <div className="rounded-3xl p-4 space-y-3 md-elevation-1" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Calculator size={16} />
            Досрочное погашение: «{selectedDebtObj.name}»
          </h3>
          <div>
            <label className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>Дополнительно в месяц (₽)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={extraPayment}
              onChange={e => setExtraPayment(e.target.value.replace(/[^0-9.,]/g, ''))}
              className="w-full mt-1 px-4 py-3 rounded-xl text-sm"
              style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
            />
          </div>
          {simulation && extraMinor > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl p-3" style={{ backgroundColor: '#E8F5E9' }}>
                <p className="text-[10px]" style={{ color: '#1B5E20' }}>Сокращение срока</p>
                <p className="text-lg font-bold tabular-nums" style={{ color: '#1B5E20' }}>−{simulation.savedMonths} мес</p>
              </div>
              <div className="rounded-2xl p-3" style={{ backgroundColor: '#E8F5E9' }}>
                <p className="text-[10px]" style={{ color: '#1B5E20' }}>Экономия на %</p>
                <p className="text-lg font-bold tabular-nums" style={{ color: '#1B5E20' }}>{formatMoneyShort(simulation.savedInterest)}</p>
              </div>
              <div className="rounded-2xl p-3" style={{ backgroundColor: 'var(--md-primary-container)' }}>
                <p className="text-[10px]" style={{ color: 'var(--md-on-primary-container)' }}>Новый срок</p>
                <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--md-on-primary-container)' }}>{simulation.months} мес</p>
              </div>
              <div className="rounded-2xl p-3" style={{ backgroundColor: 'var(--md-primary-container)' }}>
                <p className="text-[10px]" style={{ color: 'var(--md-on-primary-container)' }}>Всего %</p>
                <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--md-on-primary-container)' }}>{formatMoneyShort(simulation.totalInterest)}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
