// ===== Настройки в стиле Material Design 3 с управлением категориями =====
import { useState, useRef } from 'react';
import { useStore } from '../store';
import { parseExcelFile, exportToExcel, exportToCSV } from '../utils/import';
import { Upload, Download, Database, RefreshCw, FileText, Plus, Trash2, Edit3, Check, X } from 'lucide-react';
import type { Transaction, Category } from '../types';
import { v4 as uuidv4 } from 'uuid';

export default function SettingsPage() {
  const { settings, updateSettings, transactions, categories, actors, importTransactions, resetData, addCategory } = useStore();
  const [tab, setTab] = useState<'general' | 'categories' | 'import' | 'export' | 'data'>('general');
  const [importResult, setImportResult] = useState<{ total: number; imported: number; needsReview: number; errors: string[]; newCategories: string[]; newActors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Управление категориями
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📋');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelFile(buffer);
      const fullTransactions: Transaction[] = result.transactions.map(t => ({
        id: t.id || uuidv4(), date: t.date || '', weekNumber: t.weekNumber || 1,
        monthNumber: t.monthNumber || 0, monthName: t.monthName || '',
        year: t.year || new Date().getFullYear(), type: t.type || 'expense',
        amountMinor: t.amountMinor || 0, currency: t.currency || 'RUB',
        accountId: t.accountId || '', toAccountId: t.toAccountId || null,
        categoryId: t.categoryId || null, actorId: t.actorId || null,
        note: t.note || '', status: t.status || 'needs_review',
        isRecurring: false, amortizationEnabled: t.amortizationEnabled || false,
        amortizationMonths: t.amortizationMonths || 1,
        excludeFromBudget: t.excludeFromBudget || false,
        externalId: null, tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }));
      importTransactions(fullTransactions);
      setImportResult({
        total: result.transactions.length, imported: result.transactions.filter(t => t.status !== 'needs_review').length,
        needsReview: result.needsReview, errors: result.errors,
        newCategories: result.newCategories, newActors: result.newActors,
      });
    } catch (err) {
      setImportResult({ total: 0, imported: 0, needsReview: 0, errors: ['Ошибка: ' + (err as Error).message], newCategories: [], newActors: [] });
    }
    setImporting(false);
  };

  const handleExportExcel = () => {
    const buffer = exportToExcel(transactions, categories, actors);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `kazna_${new Date().toISOString().slice(0, 10)}.xlsx`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(transactions, categories, actors);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `kazna_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = useStore.getState();
    const json = JSON.stringify({
      accounts: data.accounts, actors: data.actors, categories: data.categories,
      tags: data.tags, transactions: data.transactions, budgets: data.budgets,
      debts: data.debts, goals: data.goals, recurringRules: data.recurringRules, settings: data.settings,
    }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `kazna_backup_${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddCategory = () => {
    if (!newCatName) return;
    addCategory({
      name: newCatName, parentId: null, kind: 'expense', budgetable: true,
      includeInExpense: true, icon: newCatIcon, color: '#6750A4', notes: '',
    });
    setNewCatName(''); setNewCatIcon('📋'); setShowAddCat(false);
  };

  const tabs = [
    { key: 'general', label: 'Общие' },
    { key: 'categories', label: 'Категории' },
    { key: 'import', label: 'Импорт' },
    { key: 'export', label: 'Экспорт' },
    { key: 'data', label: 'Данные' },
  ] as const;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
            style={{
              backgroundColor: tab === t.key ? 'var(--md-secondary-container)' : 'transparent',
              color: tab === t.key ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Общие */}
      {tab === 'general' && (
        <div className="space-y-3">
          <div className="rounded-3xl p-4 md-elevation-1 space-y-3" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
            <h3 className="text-sm font-semibold">Профиль</h3>
            <div>
              <label className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>Имя</label>
              <input type="text" value={settings.userName} onChange={e => updateSettings({ userName: e.target.value })} placeholder="Ваше имя"
                className="w-full mt-1 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }} />
            </div>
            <div>
              <label className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>Email</label>
              <input type="email" value={settings.userEmail} onChange={e => updateSettings({ userEmail: e.target.value })} placeholder="email@example.com"
                className="w-full mt-1 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }} />
            </div>
          </div>
          <div className="rounded-3xl p-4 md-elevation-1 space-y-3" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
            <h3 className="text-sm font-semibold">Региональные настройки</h3>
            <div>
              <label className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>Тема</label>
              <select value={settings.theme} onChange={e => updateSettings({ theme: e.target.value as 'light' | 'dark' | 'system' })}
                className="w-full mt-1 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}>
                <option value="light">Светлая</option>
                <option value="dark">Тёмная</option>
                <option value="system">Системная</option>
              </select>
            </div>
          </div>
          <div className="rounded-3xl p-4 md-elevation-1" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
            <h3 className="text-sm font-semibold mb-2">Статистика</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span style={{ color: 'var(--md-on-surface-variant)' }}>Операций:</span> <span className="font-semibold tabular-nums">{transactions.length}</span></div>
              <div><span style={{ color: 'var(--md-on-surface-variant)' }}>Счетов:</span> <span className="font-semibold tabular-nums">{useStore.getState().accounts.length}</span></div>
              <div><span style={{ color: 'var(--md-on-surface-variant)' }}>Категорий:</span> <span className="font-semibold tabular-nums">{categories.length}</span></div>
              <div><span style={{ color: 'var(--md-on-surface-variant)' }}>Акторов:</span> <span className="font-semibold tabular-nums">{actors.length}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Категории */}
      {tab === 'categories' && (
        <div className="space-y-3">
          <button
            onClick={() => setShowAddCat(!showAddCat)}
            className="flex items-center gap-2 px-5 py-3 rounded-full font-medium text-sm md-elevation-2"
            style={{ backgroundColor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
          >
            <Plus size={18} />
            Добавить категорию
          </button>

          {showAddCat && (
            <div className="rounded-3xl p-4 space-y-3 md-elevation-2 animate-fade-in" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Эмодзи"
                  value={newCatIcon}
                  onChange={e => setNewCatIcon(e.target.value)}
                  className="w-16 px-3 py-3 rounded-xl text-sm text-center"
                  style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
                />
                <input
                  type="text"
                  placeholder="Название категории"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl text-sm"
                  style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddCat(false)} className="flex-1 py-3 rounded-full text-sm font-medium" style={{ backgroundColor: 'var(--md-surface-container-high)', color: 'var(--md-on-surface)' }}>Отмена</button>
                <button onClick={handleAddCategory} className="flex-1 py-3 rounded-full text-sm font-medium" style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>Добавить</button>
              </div>
            </div>
          )}

          <div className="rounded-3xl p-4 md-elevation-1" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
            <h3 className="text-sm font-semibold mb-3">Все категории ({categories.length})</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--md-on-surface-variant)' }}>
              Нажмите на категорию для редактирования названия
            </p>
            <div className="space-y-1">
              {categories.filter(c => c.parentId === null).map(cat => (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 py-2.5 px-2 rounded-xl"
                  style={{ borderBottom: '1px solid var(--md-outline-variant)' }}
                >
                  <span className="text-lg">{cat.icon}</span>
                  {editingCatId === cat.id ? (
                    <>
                      <input
                        type="text"
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        className="flex-1 px-2 py-1 rounded-lg text-sm"
                        style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
                        autoFocus
                      />
                      <button onClick={() => setEditingCatId(null)} className="p-1" style={{ color: 'var(--md-on-surface-variant)' }}>
                        <X size={16} />
                      </button>
                      <button onClick={() => {
                        // Обновляем название категории через store
                        const store = useStore.getState();
                        const updated = store.categories.map(c => c.id === cat.id ? { ...c, name: editingName } : c);
                        useStore.setState({ categories: updated });
                        setEditingCatId(null);
                      }} className="p-1" style={{ color: 'var(--md-primary)' }}>
                        <Check size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium">{cat.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface-variant)' }}>
                        {cat.kind === 'income' ? 'доход' : cat.kind === 'transfer' ? 'перевод' : 'расход'}
                      </span>
                      <button
                        onClick={() => { setEditingCatId(cat.id); setEditingName(cat.name); }}
                        className="p-1"
                        style={{ color: 'var(--md-on-surface-variant)' }}
                      >
                        <Edit3 size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Подкатегории */}
          <div className="rounded-3xl p-4 md-elevation-1" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
            <h3 className="text-sm font-semibold mb-3">Подкатегории</h3>
            <div className="space-y-1">
              {categories.filter(c => c.parentId !== null).map(cat => {
                const parent = categories.find(c => c.id === cat.parentId);
                return (
                  <div key={cat.id} className="flex items-center gap-3 py-2.5 px-2" style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
                    <span className="text-lg">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{cat.name}</p>
                      <p className="text-[10px]" style={{ color: 'var(--md-on-surface-variant)' }}>{parent?.icon} {parent?.name}</p>
                    </div>
                    <button
                      onClick={() => { setEditingCatId(cat.id); setEditingName(cat.name); }}
                      className="p-1"
                      style={{ color: 'var(--md-on-surface-variant)' }}
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Импорт */}
      {tab === 'import' && (
        <div className="space-y-3">
          <div className="rounded-3xl p-6 md-elevation-1 text-center" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
            <Upload size={36} className="mx-auto mb-3" style={{ color: 'var(--md-on-surface-variant)' }} />
            <p className="text-sm font-medium mb-1">Загрузите файл Excel или CSV</p>
            <p className="text-xs mb-4" style={{ color: 'var(--md-on-surface-variant)' }}>Формат: .xlsx, .xls, .csv</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="px-6 py-3 rounded-full text-sm font-medium md-elevation-2"
              style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
            >
              {importing ? 'Импорт...' : 'Выбрать файл'}
            </button>
          </div>

          {importResult && (
            <div className="rounded-3xl p-4 space-y-3 md-elevation-1" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
              <h3 className="text-sm font-semibold">Результат импорта</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl p-3" style={{ backgroundColor: 'var(--md-primary-container)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--md-on-primary-container)' }}>Всего строк</p>
                  <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--md-on-primary-container)' }}>{importResult.total}</p>
                </div>
                <div className="rounded-2xl p-3" style={{ backgroundColor: '#E8F5E9' }}>
                  <p className="text-[10px]" style={{ color: '#1B5E20' }}>Импортировано</p>
                  <p className="text-xl font-bold tabular-nums" style={{ color: '#1B5E20' }}>{importResult.imported}</p>
                </div>
                <div className="rounded-2xl p-3" style={{ backgroundColor: '#FFF3E0' }}>
                  <p className="text-[10px]" style={{ color: '#E65100' }}>Требуют проверки</p>
                  <p className="text-xl font-bold tabular-nums" style={{ color: '#E65100' }}>{importResult.needsReview}</p>
                </div>
                <div className="rounded-2xl p-3" style={{ backgroundColor: 'var(--md-error-container)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--md-on-error-container)' }}>Ошибки</p>
                  <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--md-on-error-container)' }}>{importResult.errors.length}</p>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto">
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-xs" style={{ color: 'var(--md-error)' }}>{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Экспорт */}
      {tab === 'export' && (
        <div className="space-y-2">
          {[
            { onClick: handleExportExcel, icon: <Download size={20} style={{ color: '#006E1C' }} />, title: 'Экспорт в Excel', desc: 'Все операции в формате .xlsx' },
            { onClick: handleExportCSV, icon: <FileText size={20} style={{ color: 'var(--md-primary)' }} />, title: 'Экспорт в CSV', desc: 'Таблица в формате CSV (UTF-8)' },
            { onClick: handleExportJSON, icon: <Database size={20} style={{ color: '#6750A4' }} />, title: 'Полный бэкап JSON', desc: 'Все данные для восстановления' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              className="w-full flex items-center gap-3 p-4 rounded-2xl md-elevation-1 text-left transition-all active:scale-[0.99]"
              style={{ backgroundColor: 'var(--md-surface-container-low)' }}
            >
              {item.icon}
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Данные */}
      {tab === 'data' && (
        <div className="space-y-3">
          <div className="rounded-3xl p-4 md-elevation-1" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
            <h3 className="text-sm font-semibold mb-2">Локальное хранилище</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--md-on-surface-variant)' }}>
              Все данные хранятся локально в вашем браузере.
            </p>
            <button
              onClick={() => { if (confirm('Сбросить все данные и загрузить демо?')) resetData(); }}
              className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium"
              style={{ backgroundColor: '#FFF3E0', color: '#E65100' }}
            >
              <RefreshCw size={16} />
              Сбросить и загрузить демо
            </button>
          </div>
          <div className="rounded-3xl p-4 md-elevation-1" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
            <h3 className="text-sm font-semibold mb-2">О приложении</h3>
            <div className="space-y-1 text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
              <p>Казна — личный финансовый трекер v1.0</p>
              <p>Хранение: localStorage</p>
              <p>Локаль: ru-RU • Валюта: {settings.currency}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
