// ===== Страница счетов в стиле Material Design 3 =====
import { useState } from 'react';
import { useStore } from '../store';
import { formatMoney, formatMoneyShort } from '../utils/money';
import { Plus } from 'lucide-react';
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
  const { accounts, addAccount } = useStore();
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
      name: newName, type: newType, ownerType: 'personal', ownerName: '',
      currency: 'RUB', openingBalanceMinor: 0, currentBalanceMinor: 0,
      creditLimitMinor: 0, debtBalanceMinor: 0, interestRate: 0,
      paymentDay: 0, graceDays: 0, isActive: true, notes: '',
    });
    setNewName('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero card */}
      <div
        className="rounded-3xl p-5 md-elevation-2"
        style={{
          background: 'linear-gradient(135deg, var(--md-tertiary) 0%, var(--md-tertiary-container) 100%)',
          color: 'var(--md-on-tertiary)',
        }}
      >
        <p className="text-xs opacity-80 uppercase tracking-wider font-medium">Общий баланс</p>
        <p className="text-3xl font-bold mt-1 tabular-nums tracking-tight">{formatMoneyShort(totalBalance)}</p>
        <p className="text-sm opacity-80 mt-1 tabular-nums">{formatMoney(totalBalance)}</p>
        <p className="text-xs opacity-70 mt-2">{activeAccounts.length} активных счетов</p>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="flex items-center gap-2 px-5 py-3 rounded-full font-medium text-sm md-elevation-2"
        style={{ backgroundColor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
      >
        <Plus size={18} />
        Добавить счёт
      </button>

      {/* Форма */}
      {showAdd && (
        <div
          className="rounded-3xl p-4 space-y-3 md-elevation-2 animate-fade-in"
          style={{ backgroundColor: 'var(--md-surface-container-low)' }}
        >
          <input
            type="text"
            placeholder="Название счёта"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
            autoFocus
          />
          <select
            value={newType}
            onChange={e => setNewType(e.target.value as AccountType)}
            className="w-full px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
          >
            {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-full text-sm font-medium" style={{ backgroundColor: 'var(--md-surface-container-high)', color: 'var(--md-on-surface)' }}>Отмена</button>
            <button onClick={handleAdd} className="flex-1 py-3 rounded-full text-sm font-medium" style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>Добавить</button>
          </div>
        </div>
      )}

      {/* Список счетов */}
      <div className="space-y-2">
        {activeAccounts.map(account => (
          <div
            key={account.id}
            className="flex items-center gap-3 p-4 rounded-2xl md-elevation-1"
            style={{ backgroundColor: 'var(--md-surface-container-low)' }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: 'var(--md-surface-container-highest)' }}
            >
              {ACCOUNT_ICONS[account.type] || '📋'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{account.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--md-on-surface-variant)' }}>
                {ACCOUNT_TYPE_LABELS[account.type]}
                {account.ownerName && ` • ${account.ownerName}`}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-base font-bold tabular-nums ${account.currentBalanceMinor < 0 ? 'text-red-600' : ''}`}>
                {formatMoneyShort(account.currentBalanceMinor)}
              </p>
              {account.type === 'credit_card' && account.creditLimitMinor > 0 && (
                <p className="text-[10px] tabular-nums" style={{ color: 'var(--md-on-surface-variant)' }}>
                  Лимит {formatMoneyShort(account.creditLimitMinor)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
