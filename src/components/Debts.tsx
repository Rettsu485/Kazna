// ===== Страница долгов =====
import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { formatMoney } from '../utils/money';
import { formatDateRu, relativeDate } from '../utils/dates';
import { TrendingDown, AlertTriangle, Calculator, Snowflake, Flame } from 'lucide-react';

export default function Debts() {
  const { debts, accounts, recurringRules } = useStore();
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
  const [extraPayment, setExtraPayment] = useState('');
  const [selectedDebt, setSelectedDebt] = useState<string | null>(null);

  const activeDebts = debts.filter(d => d.status === 'active');
  const totalDebt = activeDebts
    .filter(d => d.direction === 'liability')
    .reduce((sum, d) => sum + d.principalBalanceMinor, 0);

  const totalMonthly = activeDebts
    .filter(d => d.direction === 'liability')
    .reduce((sum, d) => sum + d.monthlyPaymentMinor, 0);

  // Стратегии погашения
  const sortedDebts = useMemo(() => {
    const sorted = [...activeDebts].filter(d => d.direction === 'liability');
    if (strategy === 'avalanche') {
      sorted.sort((a, b) => b.interestRate - a.interestRate);
    } else {
      sorted.sort((a, b) => a.principalBalanceMinor - b.principalBalanceMinor);
    }
    return sorted;
  }, [activeDebts, strategy]);

  // Симулятор досрочного погашения
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

    // Обычный график
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

    return {
      months,
      totalInterest,
      savedMonths: normalMonths - months,
      savedInterest: normalInterest - totalInterest,
    };
  };

  const selectedDebtObj = activeDebts.find(d => d.id === selectedDebt);
  const extraMinor = extraPayment ? Math.round(parseFloat(extraPayment) * 100) : 0;
  const simulation = selectedDebtObj ? simulateEarlyPayoff(selectedDebtObj, extraMinor) : null;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Общий долг */}
      <div className="bg-gradient-to-r from-red-500 to-orange-600 rounded-xl p-5 text-white">
        <p className="text-sm opacity-80">Общий долг</p>
        <p className="text-3xl font-bold mt-1">{formatMoney(totalDebt)}</p>
        <p className="text-sm opacity-80 mt-1">Ежемесячный платёж: {formatMoney(totalMonthly)}</p>
      </div>

      {/* Стратегия */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold mb-3">Стратегия погашения</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setStrategy('avalanche')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium ${
              strategy === 'avalanche'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Flame size={16} /> Лавина
          </button>
          <button
            onClick={() => setStrategy('snowball')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium ${
              strategy === 'snowball'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Snowflake size={16} /> Снежный ком
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {strategy === 'avalanche'
            ? 'Сначала закрываем долг с максимальной ставкой — экономим на процентах'
            : 'Сначала закрываем самый маленький долг — быстрее видим результат'}
        </p>
      </div>

      {/* Список долгов */}
      <div className="space-y-3">
        {sortedDebts.map((debt, idx) => (
          <div
            key={debt.id}
            className={`bg-white dark:bg-gray-800 rounded-xl p-4 border cursor-pointer transition-colors ${
              debt.id === selectedDebt
                ? 'border-blue-300 dark:border-blue-700 ring-2 ring-blue-100 dark:ring-blue-900'
                : 'border-gray-100 dark:border-gray-700'
            }`}
            onClick={() => setSelectedDebt(debt.id === selectedDebt ? null : debt.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {strategy === 'avalanche' && idx === 0 && (
                  <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                )}
                {strategy === 'snowball' && idx === 0 && (
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                )}
                <div>
                  <p className="font-medium">{debt.name}</p>
                  <p className="text-xs text-gray-500">
                    {debt.type === 'credit_card' ? 'Кредитная карта' : debt.type === 'loan' ? 'Кредит' : 'Долг'}
                    {debt.interestRate > 0 && ` • ${debt.interestRate}%`}
                    {debt.paymentDay > 0 && ` • платёж ${debt.paymentDay} числа`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600">{formatMoney(debt.principalBalanceMinor)}</p>
                <p className="text-xs text-gray-500">{formatMoney(debt.monthlyPaymentMinor)}/мес</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Симулятор досрочного погашения */}
      {selectedDebtObj && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Calculator size={16} />
            Симулятор: «{selectedDebtObj.name}»
          </h3>
          <div>
            <label className="text-xs text-gray-500">Дополнительно в месяц (₽)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={extraPayment}
              onChange={e => setExtraPayment(e.target.value.replace(/[^0-9.,]/g, ''))}
              className="w-full mt-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
            />
          </div>
          {simulation && extraMinor > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <p className="text-xs text-gray-500">Сокращение срока</p>
                <p className="text-lg font-bold text-green-600">−{simulation.savedMonths} мес</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <p className="text-xs text-gray-500">Экономия на %</p>
                <p className="text-lg font-bold text-green-600">{formatMoney(simulation.savedInterest)}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <p className="text-xs text-gray-500">Новый срок</p>
                <p className="text-lg font-bold text-blue-600">{simulation.months} мес</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <p className="text-xs text-gray-500">Всего процентов</p>
                <p className="text-lg font-bold text-blue-600">{formatMoney(simulation.totalInterest)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ближайшие платежи */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold mb-3">Календарь платежей</h3>
        <div className="space-y-2">
          {activeDebts
            .filter(d => d.direction === 'liability' && d.paymentDay > 0)
            .sort((a, b) => a.paymentDay - b.paymentDay)
            .map(debt => (
              <div key={debt.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                <div>
                  <p className="text-sm font-medium">{debt.name}</p>
                  <p className="text-xs text-gray-500">{debt.paymentDay} числа каждого месяца</p>
                </div>
                <span className="text-sm font-semibold">{formatMoney(debt.monthlyPaymentMinor)}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
