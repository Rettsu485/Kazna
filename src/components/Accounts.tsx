// ===== Страница счетов =====
import { useState } from 'react';
import { useStore } from '../store';
import { formatMoney } from '../utils/money';
import { CreditCard, Plus, X, Wallet, Building2, Banknote } from 'lucide-react';
import type { AccountType } from '../types';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Наличные', debit_card: 'Дебетовая карта', checking: 'Текущий счёт',
  deposit: 'Вклад', credit_card: 'Кредитная карта', wallet: 'Кошелёк',
  business: 'Бизнес', other: 'Другое',
};

const ACCOUNT_ICONS: Record<string, string> = {
  cash: '💵', debit_card: '💳', checking: '🏦', deposit: '🏧',
  credit_card: '💳', wallet: '👛', business: '🏢', other: '📋',
};

export default function Accounts() {
  const { accounts, addAccount, updateAccount } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AccountType>('debit_card');

  const activeAccounts = accounts.filter(a => a.isActive);
  const totalBalance = activeAccounts
    .filter(a => a.ownerType === 'personal')
    .reduce((sum, a) => sum + a.currentBalanceMinor, 0);

  const handleAdd = () => {
    if (!newName) return;
    addAccount({
      name: newName,
      type: newType,
      ownerType: 'personal',
      ownerName: '',
      currency: 'RUB',
      openingBalanceMinor: 0,
      currentBalanceMinor: 0,
      creditLimitMinor: 0,
      debtBalanceMinor: 0,
      interestRate: 0,
      paymentDay: 0,
      graceDays: 0,
      isActive: true,
      notes: '',
    });
    setNewName('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Общий баланс */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-5 text-white">
        <p className="text-sm opacity-80">Общий баланс</p>
        <p className="text-3xl font-bold mt-1">{formatMoney(totalBalance)}</p>
        <p className="text-sm opacity-80 mt-1">{activeAccounts.length} активных счетов</p>
      </div>

      {/* Кнопка добавления */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <Plus size={16} />
        Добавить счёт
      </button>

      {/* Форма добавления */}
      {showAdd && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 space-y-3">
          <input
            type="text"
            placeholder="Название счёта"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
            autoFocus
          />
          <select
            value={newType}
            onChange={e => setNewType(e.target.value as AccountType)}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
          >
            {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">Отмена</button>
            <button onClick={handleAdd} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm">Добавить</button>
          </div>
        </div>
      )}

      {/* Список счетов */}
      <div className="space-y-2">
        {activeAccounts.map(account => (
          <div key={account.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{ACCOUNT_ICONS[account.type] || '📋'}</span>
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-xs text-gray-500">{ACCOUNT_TYPE_LABELS[account.type]} {account.ownerName && `• ${account.ownerName}`}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${account.currentBalanceMinor >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600'}`}>
                  {formatMoney(account.currentBalanceMinor)}
                </p>
                {account.type === 'credit_card' && account.creditLimitMinor > 0 && (
                  <p className="text-xs text-gray-500">
                    Лимит: {formatMoney(account.creditLimitMinor)} • Долг: {formatMoney(account.debtBalanceMinor)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
