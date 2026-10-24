// ===== Страница настроек =====
import { useState, useRef } from 'react';
import { useStore } from '../store';
import { formatMoney } from '../utils/money';
import { parseExcelFile, exportToExcel, exportToCSV } from '../utils/import';
import { Upload, Download, Database, RefreshCw, FileText, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Transaction } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getISOWeek, getMonth, getYear } from 'date-fns';

export default function SettingsPage() {
  const { settings, updateSettings, transactions, categories, actors, importTransactions, resetData } = useStore();
  const [tab, setTab] = useState<'general' | 'import' | 'export' | 'data'>('general');
  const [importResult, setImportResult] = useState<{
    total: number; imported: number; needsReview: number; errors: string[]; newCategories: string[]; newActors: string[];
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelFile(buffer);
      
      // Преобразуем partial transactions в полные
      const fullTransactions: Transaction[] = result.transactions.map(t => ({
        id: t.id || uuidv4(),
        date: t.date || '',
        weekNumber: t.weekNumber || 1,
        monthNumber: t.monthNumber || 0,
        monthName: t.monthName || '',
        year: t.year || new Date().getFullYear(),
        type: t.type || 'expense',
        amountMinor: t.amountMinor || 0,
        currency: t.currency || 'RUB',
        accountId: t.accountId || '',
        toAccountId: t.toAccountId || null,
        categoryId: t.categoryId || null,
        actorId: t.actorId || null,
        note: t.note || '',
        status: t.status || 'needs_review',
        isRecurring: false,
        amortizationEnabled: t.amortizationEnabled || false,
        amortizationMonths: t.amortizationMonths || 1,
        excludeFromBudget: t.excludeFromBudget || false,
        externalId: null,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      importTransactions(fullTransactions);
      
      setImportResult({
        total: result.transactions.length,
        imported: result.transactions.filter(t => t.status !== 'needs_review').length,
        needsReview: result.needsReview,
        errors: result.errors,
        newCategories: result.newCategories,
        newActors: result.newActors,
      });
    } catch (err) {
      setImportResult({
        total: 0, imported: 0, needsReview: 0,
        errors: ['Ошибка чтения файла: ' + (err as Error).message],
        newCategories: [], newActors: [],
      });
    }
    setImporting(false);
  };

  const handleExportExcel = () => {
    const buffer = exportToExcel(transactions, categories, actors);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finances_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(transactions, categories, actors);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finances_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = useStore.getState();
    const json = JSON.stringify({
      accounts: data.accounts,
      actors: data.actors,
      categories: data.categories,
      tags: data.tags,
      transactions: data.transactions,
      budgets: data.budgets,
      debts: data.debts,
      goals: data.goals,
      recurringRules: data.recurringRules,
      settings: data.settings,
    }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Табы */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'general', label: 'Общие', icon: '⚙️' },
          { key: 'import', label: 'Импорт', icon: '📥' },
          { key: 'export', label: 'Экспорт', icon: '📤' },
          { key: 'data', label: 'Данные', icon: '💾' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              tab === t.key
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Общие настройки */}
      {tab === 'general' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 space-y-4">
            <h3 className="text-sm font-semibold">Профиль</h3>
            <div>
              <label className="text-xs text-gray-500">Имя</label>
              <input
                type="text"
                value={settings.userName}
                onChange={e => updateSettings({ userName: e.target.value })}
                placeholder="Ваше имя"
                className="w-full mt-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Email</label>
              <input
                type="email"
                value={settings.userEmail}
                onChange={e => updateSettings({ userEmail: e.target.value })}
                placeholder="email@example.com"
                className="w-full mt-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 space-y-4">
            <h3 className="text-sm font-semibold">Региональные настройки</h3>
            <div>
              <label className="text-xs text-gray-500">Валюта</label>
              <select
                value={settings.currency}
                onChange={e => updateSettings({ currency: e.target.value })}
                className="w-full mt-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
              >
                <option value="RUB">₽ Российский рубль</option>
                <option value="USD">$ Доллар США</option>
                <option value="EUR">€ Евро</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Тема</label>
              <select
                value={settings.theme}
                onChange={e => updateSettings({ theme: e.target.value as 'light' | 'dark' | 'system' })}
                className="w-full mt-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
              >
                <option value="light">Светлая</option>
                <option value="dark">Тёмная</option>
                <option value="system">Системная</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold mb-2">Статистика</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Операций:</span> <span className="font-medium">{transactions.length}</span></div>
              <div><span className="text-gray-500">Счетов:</span> <span className="font-medium">{useStore.getState().accounts.length}</span></div>
              <div><span className="text-gray-500">Категорий:</span> <span className="font-medium">{categories.length}</span></div>
              <div><span className="text-gray-500">Акторов:</span> <span className="font-medium">{actors.length}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Импорт */}
      {tab === 'import' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 text-center">
            <Upload size={40} className="mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium mb-1">Загрузите файл Excel или CSV</p>
            <p className="text-xs text-gray-500 mb-4">Поддерживаются форматы: .xlsx, .xls, .csv</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {importing ? 'Импорт...' : 'Выбрать файл'}
            </button>
          </div>

          {importResult && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 space-y-3">
              <h3 className="text-sm font-semibold">Результат импорта</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Всего строк</p>
                  <p className="text-xl font-bold text-blue-600">{importResult.total}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Импортировано</p>
                  <p className="text-xl font-bold text-green-600">{importResult.imported}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Требуют проверки</p>
                  <p className="text-xl font-bold text-amber-600">{importResult.needsReview}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Ошибки</p>
                  <p className="text-xl font-bold text-red-600">{importResult.errors.length}</p>
                </div>
              </div>

              {importResult.newCategories.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Новые категории:</p>
                  <div className="flex flex-wrap gap-1">
                    {importResult.newCategories.map(c => (
                      <span key={c} className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded text-xs">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {importResult.newActors.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Новые акторы:</p>
                  <div className="flex flex-wrap gap-1">
                    {importResult.newActors.map(a => (
                      <span key={a} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {importResult.errors.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ошибки:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-500">{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Формат файла */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold mb-2">Ожидаемый формат файла</h3>
            <p className="text-xs text-gray-500 mb-2">Колонки: Дата, Неделя, Месяц, Год, Сумма, Актор, Категория, Амортизация, Примечание</p>
            <p className="text-xs text-gray-500">Формат даты: M/D/YY (например, 9/26/26 = 26 сентября 2026)</p>
          </div>
        </div>
      )}

      {/* Экспорт */}
      {tab === 'export' && (
        <div className="space-y-3">
          <button
            onClick={handleExportExcel}
            className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-300 transition-colors"
          >
            <Download size={20} className="text-green-500" />
            <div className="text-left">
              <p className="text-sm font-medium">Экспорт в Excel</p>
              <p className="text-xs text-gray-500">Все операции в формате .xlsx</p>
            </div>
          </button>
          <button
            onClick={handleExportCSV}
            className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-300 transition-colors"
          >
            <FileText size={20} className="text-blue-500" />
            <div className="text-left">
              <p className="text-sm font-medium">Экспорт в CSV</p>
              <p className="text-xs text-gray-500">Таблица в формате CSV (UTF-8)</p>
            </div>
          </button>
          <button
            onClick={handleExportJSON}
            className="w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-300 transition-colors"
          >
            <Database size={20} className="text-purple-500" />
            <div className="text-left">
              <p className="text-sm font-medium">Полный бэкап JSON</p>
              <p className="text-xs text-gray-500">Все данные приложения для восстановления</p>
            </div>
          </button>
        </div>
      )}

      {/* Управление данными */}
      {tab === 'data' && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold mb-2">Локальное хранилище</h3>
            <p className="text-xs text-gray-500 mb-3">
              Все данные хранятся локально в вашем браузере. Регулярно делайте бэкапы.
            </p>
            <button
              onClick={() => {
                if (confirm('Сбросить все данные и загрузить демо-данные?')) {
                  resetData();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-medium"
            >
              <RefreshCw size={16} />
              Сбросить и загрузить демо-данные
            </button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold mb-2">О приложении</h3>
            <div className="space-y-1 text-xs text-gray-500">
              <p>Личный финансовый трекер v1.0</p>
              <p>Хранение: localStorage браузера</p>
              <p>Локаль: ru-RU</p>
              <p>Валюта: {settings.currency}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
