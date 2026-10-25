// ===== Layout в стиле Material Design 3 =====
import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import {
  LayoutDashboard, ArrowLeftRight, Plus, PieChart, CreditCard,
  Target, TrendingUp, Settings, Menu, X, Moon, Sun, Wallet,
  BarChart3
} from 'lucide-react';
import { InstallBanner } from './InstallBanner';

const NAV_ITEMS = [
  { path: '/', label: 'Обзор', icon: LayoutDashboard },
  { path: '/transactions', label: 'Операции', icon: ArrowLeftRight },
  { path: '/accounts', label: 'Счета', icon: CreditCard },
  { path: '/budgets', label: 'Бюджеты', icon: PieChart },
  { path: '/debts', label: 'Долги', icon: TrendingUp },
  { path: '/analytics', label: 'Аналитика', icon: BarChart3 },
  { path: '/goals', label: 'Цели', icon: Target },
  { path: '/settings', label: 'Настройки', icon: Settings },
];

const MOBILE_NAV = [
  { path: '/', label: 'Обзор', icon: LayoutDashboard },
  { path: '/transactions', label: 'Операции', icon: ArrowLeftRight },
  { path: '/transactions/new', label: '', icon: Plus },
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--md-surface)', color: 'var(--md-on-surface)' }}>
      {/* Desktop Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-72 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: 'var(--md-surface-container-low)' }}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                style={{ backgroundColor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
              >
                💰
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--md-on-surface)' }}>
                  Казна
                </h1>
                <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                  Финансовый трекер
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
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
                  className="flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all"
                  style={{
                    backgroundColor: isActive ? 'var(--md-secondary-container)' : 'transparent',
                    color: isActive ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
                  }}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Theme toggle */}
          <div className="pt-4" style={{ borderTop: '1px solid var(--md-outline-variant)' }}>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 px-4 py-3 rounded-full text-sm w-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              style={{ color: 'var(--md-on-surface-variant)' }}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
              {isDark ? 'Светлая тема' : 'Тёмная тема'}
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:ml-72">
        {/* Top bar */}
        <header
          className="sticky top-0 z-20 backdrop-blur-md"
          style={{ backgroundColor: 'color-mix(in srgb, var(--md-surface) 85%, transparent)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Menu size={22} />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <span className="text-xl">💰</span>
              <h1 className="text-lg font-bold tracking-tight">Казна</h1>
            </div>
            <div className="hidden lg:block">
              <h2 className="text-xl font-semibold tracking-tight">
                {NAV_ITEMS.find(i => i.path === location.pathname)?.label || 'Казна'}
              </h2>
            </div>
            <div className="w-10 lg:hidden" />
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 pb-24 lg:pb-6 lg:p-6 max-w-5xl mx-auto">
          {children}
        </main>
      </div>

      {/* Install banner */}
      <InstallBanner />

      {/* Mobile bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 lg:hidden safe-area-bottom"
        style={{ backgroundColor: 'var(--md-surface-container)' }}
      >
        <div className="flex items-center justify-around py-2 px-2">
          {MOBILE_NAV.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isAdd = item.path === '/transactions/new';
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-0.5 min-w-[56px]"
              >
                {isAdd ? (
                  <div
                    className="md-fab w-14 h-14 -mt-6 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
                  >
                    <Icon size={24} />
                  </div>
                ) : (
                  <>
                    <div
                      className="w-16 h-8 rounded-full flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: isActive ? 'var(--md-secondary-container)' : 'transparent',
                      }}
                    >
                      <Icon
                        size={20}
                        style={{
                          color: isActive ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
                        }}
                      />
                    </div>
                    <span
                      className="text-[11px] font-medium mt-0.5"
                      style={{
                        color: isActive ? 'var(--md-on-surface)' : 'var(--md-on-surface-variant)',
                      }}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
