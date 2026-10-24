// ===== Страница целей =====
import { useState } from 'react';
import { useStore } from '../store';
import { formatMoney } from '../utils/money';
import { formatDateRu } from '../utils/dates';
import { Target, Plus, Trophy } from 'lucide-react';

export default function Goals() {
  const { goals, updateGoal, addGoal } = useStore();
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
    setNewName('');
    setNewTarget('');
    setNewDeadline('');
    setShowAdd(false);
  };

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmountMinor, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmountMinor, 0);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Общий прогресс */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-5 text-white">
        <p className="text-sm opacity-80">Общий прогресс целей</p>
        <p className="text-3xl font-bold mt-1">{formatMoney(totalSaved)}</p>
        <p className="text-sm opacity-80">из {formatMoney(totalTarget)}</p>
        <div className="mt-3 h-2 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full"
            style={{ width: `${totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Кнопка добавления */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        <Plus size={16} />
        Новая цель
      </button>

      {showAdd && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 space-y-3">
          <input
            type="text"
            placeholder="Название цели"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
          />
          <input
            type="text"
            placeholder="Целевая сумма (₽)"
            value={newTarget}
            onChange={e => setNewTarget(e.target.value.replace(/[^0-9.,]/g, ''))}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
            inputMode="decimal"
          />
          <input
            type="date"
            value={newDeadline}
            onChange={e => setNewDeadline(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">Отмена</button>
            <button onClick={handleAdd} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm">Создать</button>
          </div>
        </div>
      )}

      {/* Список целей */}
      <div className="space-y-3">
        {goals.map(goal => {
          const percent = goal.targetAmountMinor > 0 ? (goal.currentAmountMinor / goal.targetAmountMinor) * 100 : 0;
          const remaining = goal.targetAmountMinor - goal.currentAmountMinor;
          
          return (
            <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {percent >= 100 ? <Trophy size={20} className="text-yellow-500" /> : <Target size={20} className="text-purple-500" />}
                  <span className="font-medium">{goal.name}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  goal.status === 'completed' ? 'bg-green-100 text-green-700' :
                  goal.status === 'paused' ? 'bg-gray-100 text-gray-600' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {goal.status === 'active' ? 'Активна' : goal.status === 'completed' ? 'Достигнута' : 'На паузе'}
                </span>
              </div>
              
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">{formatMoney(goal.currentAmountMinor)} / {formatMoney(goal.targetAmountMinor)}</span>
                <span className="font-medium">{percent.toFixed(0)}%</span>
              </div>
              
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${percent >= 100 ? 'bg-green-500' : 'bg-purple-500'}`}
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
              
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Осталось: {formatMoney(Math.max(remaining, 0))}</span>
                <span>Дедлайн: {formatDateRu(goal.deadline)}</span>
              </div>
            </div>
          );
        })}
        
        {goals.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Target size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg mb-2">Нет целей</p>
            <p className="text-sm">Создайте первую финансовую цель</p>
          </div>
        )}
      </div>
    </div>
  );
}
