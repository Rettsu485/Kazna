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

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, var(--md-primary) 0%, var(--md-primary-container) 100%)',
        }}
      >
        <div
          className="rounded-[28px] p-8 max-w-sm w-full text-center md-elevation-3"
          style={{ backgroundColor: 'var(--md-surface-container-low)' }}
        >
          <div
            className="w-20 h-20 mx-auto mb-5 rounded-[20px] flex items-center justify-center text-4xl"
            style={{ backgroundColor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
          >
            💰
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight" style={{ color: 'var(--md-on-surface)' }}>
            Казна
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--md-on-surface-variant)' }}>
            Личный финансовый трекер с бюджетами, долгами, аналитикой и PWA
          </p>
          <button
            onClick={() => useStore.getState().login()}
            className="w-full py-4 rounded-full font-medium text-sm md-elevation-1"
            style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
          >
            Начать
          </button>
          <p className="text-xs mt-4" style={{ color: 'var(--md-on-surface-variant)' }}>
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
