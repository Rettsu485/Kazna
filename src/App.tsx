import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import { TransactionList, NewTransaction } from './components/Transactions';
import Accounts from './components/Accounts';
import Budgets from './components/Budgets';
import Debts from './components/Debts';
import Analytics from './components/Analytics';
import Goals from './components/Goals';
import SettingsPage from './components/Settings';

function App() {
  const { isAuthenticated, initialize, settings } = useStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Применяем тему
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
          <div className="text-5xl mb-4">💰</div>
          <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ФинТрекер
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Личный финансовый трекер с бюджетами, долгами, аналитикой и PWA
          </p>
          <button
            onClick={() => useStore.getState().login()}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Начать
          </button>
          <p className="text-xs text-gray-400 mt-4">
            Данные хранятся локально в вашем браузере
          </p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<TransactionList />} />
          <Route path="/transactions/new" element={<NewTransaction />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/debts" element={<Debts />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
