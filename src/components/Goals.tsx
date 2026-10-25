// ===== Цели в стиле Material Design 3 =====
import { useState } from 'react';
import { useStore } from '../store';
import { formatMoney, formatMoneyShort } from '../utils/money';
import { formatDateRu } from '../utils/dates';
import { Target, Plus, Trophy } from 'lucide-react';

export default function Goals() {
  const { goals, addGoal } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  const handleAdd = () => {
    if (!newName || !newTarget) return;
    addGoal({
      name: newName,
      targetAmountMinor: Math.round(parseFloat(newTarget) * 100),
      currentAmountMinor: 0,
      deadline: newDeadline || '2026-12-31',
      priority: goals.length + 1,
      status: 'active',
    });
    setNewName(''); setNewTarget(''); setNewDeadline(''); setShowAdd(false);
  };

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmountMinor, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmountMinor, 0);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero */}
      <div
        className="rounded-3xl p-5 md-elevation-2"
        style={{
          background: 'linear-gradient(135deg, #6750A4 0%, #EADDFF 100%)',
          color: 'white',
        }}
      >
        <p className="text-xs opacity-80 uppercase tracking-wider font-medium">Накопления</p>
        <p className="text-3xl font-bold mt-1 tabular-nums tracking-tight">{formatMoneyShort(totalSaved)}</p>
        <p className="text-sm opacity-80 tabular-nums">из {formatMoneyShort(totalTarget)}</p>
        <div className="mt-3 h-2 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full" style={{ width: `${totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0}%` }} />
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="flex items-center gap-2 px-5 py-3 rounded-full font-medium text-sm md-elevation-2"
        style={{ backgroundColor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
      >
        <Plus size={18} />
        Новая цель
      </button>

      {showAdd && (
        <div className="rounded-3xl p-4 space-y-3 md-elevation-2 animate-fade-in" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
          <input type="text" placeholder="Название цели" value={newName} onChange={e => setNewName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }} />
          <input type="text" placeholder="Целевая сумма (₽)" value={newTarget} onChange={e => setNewTarget(e.target.value.replace(/[^0-9.,]/g, ''))}
            className="w-full px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }} inputMode="decimal" />
          <input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }} />
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-full text-sm font-medium" style={{ backgroundColor: 'var(--md-surface-container-high)', color: 'var(--md-on-surface)' }}>Отмена</button>
            <button onClick={handleAdd} className="flex-1 py-3 rounded-full text-sm font-medium" style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>Создать</button>
          </div>
        </div>
      )}

      {/* Список целей */}
      <div className="space-y-2">
        {goals.map(goal => {
          const percent = goal.targetAmountMinor > 0 ? (goal.currentAmountMinor / goal.targetAmountMinor) * 100 : 0;
          const remaining = goal.targetAmountMinor - goal.currentAmountMinor;
          return (
            <div key={goal.id} className="p-4 rounded-2xl md-elevation-1" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {percent >= 100 ? <Trophy size={18} className="text-yellow-500" /> : <Target size={18} style={{ color: 'var(--md-primary)' }} />}
                  <span className="font-medium text-sm">{goal.name}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}>
                  {percent.toFixed(0)}%
                </span>
              </div>
              <p className="text-xs mb-2 tabular-nums" style={{ color: 'var(--md-on-surface-variant)' }}>
                {formatMoneyShort(goal.currentAmountMinor)} / {formatMoneyShort(goal.targetAmountMinor)}
              </p>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--md-surface-container-highest)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(percent, 100)}%`, background: percent >= 100 ? 'linear-gradient(90deg, #22C55E, #16A34A)' : 'linear-gradient(90deg, #6750A4, #D0BCFF)' }} />
              </div>
              <p className="text-[10px] mt-1.5 tabular-nums" style={{ color: 'var(--md-on-surface-variant)' }}>
                Осталось: {formatMoneyShort(Math.max(remaining, 0))} • Дедлайн: {formatDateRu(goal.deadline)}
              </p>
            </div>
          );
        })}
        {goals.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--md-on-surface-variant)' }}>
            <Target size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-lg mb-1">Нет целей</p>
            <p className="text-sm">Создайте первую финансовую цель</p>
          </div>
        )}
      </div>
    </div>
  );
}
