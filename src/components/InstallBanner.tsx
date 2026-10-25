import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export function InstallBanner() {
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();

  if (isInstalled || !canInstall) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl p-4 md-elevation-3 animate-fade-in"
      style={{ backgroundColor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
        >
          <Download size={20} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm mb-1">Установить Казну</p>
          <p className="text-xs opacity-80 mb-3">
            Добавьте на главный экран для быстрого доступа
          </p>
          <div className="flex gap-2">
            <button
              onClick={promptInstall}
              className="px-4 py-2 rounded-full text-xs font-medium md-elevation-1"
              style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
            >
              Установить
            </button>
            <button
              onClick={() => {
                localStorage.setItem('install-dismissed', new Date().toISOString());
                window.location.reload();
              }}
              className="px-4 py-2 rounded-full text-xs font-medium"
              style={{ color: 'var(--md-on-primary-container)' }}
            >
              Позже
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
