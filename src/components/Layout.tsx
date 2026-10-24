// ===== Layout компонент =====
import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import {
  LayoutDashboard, ArrowLeftRight, Plus, PieChart, CreditCard,
  Target, TrendingUp, Settings, Menu, X, Moon, Sun, Wallet
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Дашборд', icon: LayoutDashboard },
  { path: '/transactions', label: 'Операции', icon: ArrowLeftRight },
  { path: '/accounts', label: 'Счета', icon: CreditCard },
  { path: '/budgets', label: 'Бюджеты', icon: PieChart },
  { path: '/debts', label: 'Долги', icon: TrendingUp },
  { path: '/analytics', label: 'Аналитика', icon: Target },
  { path: '/goals', label: 'Цели', icon: Wallet },
  { path: '/settings', label: 'Настройки', icon: Settings },
];

const MOBILE_NAV = [
  { path: '/', label: 'Главная', icon: LayoutDashboard },
  { path: '/transactions', label: 'Операции', icon: ArrowLeftRight },
  { path: '/transactions/new', label: 'Добавить', icon: Plus },
  { path: '/budgets', label: 'Бюджет', icon: PieChart },
  { path: '/settings', label: 'Ещё', icon: Menu },
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { settings, updateSettings } = useStore();
  const isDark = settings.theme === 'dark';

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    updateSettings({ theme: isDark ? 'light' : 'dark' });
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Desktop Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-screen w-64 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r`}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              💰 ФинТрекер
            </h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X size={20} />
            </button>
          </div>
          
          <nav className="flex-1 space-y-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
              {isDark ? 'Светлая тема' : 'Тёмная тема'}
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className={`sticky top-0 z-20 ${isDark ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'} border-b backdrop-blur`}>
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu size={24} />
            </button>
            <div className="lg:hidden">
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                💰 ФинТрекер
              </h1>
            </div>
            <div className="hidden lg:block">
              <h2 className="text-lg font-semibold">
                {NAV_ITEMS.find(i => i.path === location.pathname)?.label || 'Финансовый трекер'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/transactions/new"
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Добавить</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 pb-20 lg:pb-4">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 z-30 lg:hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t safe-area-bottom`}>
        <div className="flex items-center justify-around py-2">
          {MOBILE_NAV.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path === '/transactions' && location.pathname === '/transactions/new');
            const isAdd = item.path === '/transactions/new';
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                  isAdd
                    ? 'text-white'
                    : isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {isAdd ? (
                  <div className="w-10 h-10 -mt-5 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <Icon size={20} />
                  </div>
                ) : (
                  <Icon size={20} />
                )}
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
