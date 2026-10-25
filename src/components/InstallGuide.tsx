import { Smartphone, Chrome, Apple, CheckCircle2, ArrowRight } from 'lucide-react';

export default function InstallGuide() {
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Hero */}
      <div
        className="rounded-3xl p-6 md-elevation-2 text-center"
        style={{
          background: 'linear-gradient(135deg, var(--md-primary) 0%, var(--md-primary-container) 100%)',
          color: 'var(--md-on-primary)',
        }}
      >
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          💰
        </div>
        <h1 className="text-2xl font-bold mb-2">Установка Казны</h1>
        <p className="text-sm opacity-90">
          Казна — это PWA (Progressive Web App). Она устанавливается прямо из браузера
          и работает как обычное приложение на вашем телефоне.
        </p>
      </div>

      {/* Что такое PWA */}
      <div className="rounded-3xl p-5 md-elevation-1" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
        <h2 className="text-lg font-semibold mb-3">Что такое PWA?</h2>
        <div className="space-y-2 text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
          <p>✅ Работает как обычное приложение — иконка на главном экране</p>
          <p>✅ Открывается в полноэкранном режиме без адресной строки</p>
          <p>✅ Работает офлайн — данные хранятся на устройстве</p>
          <p>✅ Не занимает место в памяти (меньше 1 МБ)</p>
          <p>✅ Обновляется автоматически</p>
          <p>✅ Не нужна регистрация в Google Play или App Store</p>
        </div>
      </div>

      {/* Android */}
      <div className="rounded-3xl p-5 md-elevation-1" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#34A853', color: 'white' }}
          >
            <Smartphone size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Android</h2>
            <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>Chrome, Edge, Samsung Internet</p>
          </div>
        </div>

        <div className="space-y-4">
          <Step number={1} title="Откройте Казну в браузере">
            <p>Перейдите по ссылке на эту страницу в браузере Chrome (или другом).</p>
          </Step>

          <Step number={2} title="Дождитесь баннера установки">
            <p>Внизу экрана появится кнопка <strong>«Установить Казну»</strong>. Нажмите её.</p>
            <p className="mt-2 text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
              Если баннера нет — нажмите меню браузера (⋮) в правом верхнем углу.
            </p>
          </Step>

          <Step number={3} title="Подтвердите установку">
            <p>В появившемся окне нажмите <strong>«Установить»</strong>.</p>
          </Step>

          <Step number={4} title="Готово!">
            <p>Иконка 💰 <strong>Казна</strong> появится на главном экране. Откройте её — приложение запустится в полноэкранном режиме.</p>
          </Step>
        </div>

        <div className="mt-4 p-3 rounded-2xl" style={{ backgroundColor: 'var(--md-surface-container)' }}>
          <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
            💡 <strong>Альтернативный способ:</strong> Меню Chrome (⋮) → «Добавить на главный экран» или «Установить приложение»
          </p>
        </div>
      </div>

      {/* iOS */}
      <div className="rounded-3xl p-5 md-elevation-1" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#000000', color: 'white' }}
          >
            <Apple size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">iPhone / iPad</h2>
            <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>Safari</p>
          </div>
        </div>

        <div className="space-y-4">
          <Step number={1} title="Откройте Казну в Safari">
            <p>Важно: установка работает только через Safari. Chrome на iOS не поддерживает PWA.</p>
          </Step>

          <Step number={2} title="Нажмите кнопку «Поделиться»">
            <p>Это квадрат со стрелкой вверх в нижней части экрана.</p>
          </Step>

          <Step number={3} title="Прокрутите вниз и выберите «На экран Домой»">
            <p>Нажмите на эту опцию в списке действий.</p>
          </Step>

          <Step number={4} title="Подтвердите">
            <p>Нажмите <strong>«Добавить»</strong> в правом верхнем углу.</p>
          </Step>

          <Step number={5} title="Готово!">
            <p>Иконка 💰 <strong>Казна</strong> появится на главном экране.</p>
          </Step>
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-3xl p-5 md-elevation-1" style={{ backgroundColor: 'var(--md-surface-container-low)' }}>
        <h2 className="text-lg font-semibold mb-3">Частые вопросы</h2>
        <div className="space-y-3">
          <FaqItem question="Нужен ли APK-файл?">
            Нет. PWA устанавливается прямо из браузера. APK не нужен.
          </FaqItem>
          <FaqItem question="Приложение работает без интернета?">
            Да. Все данные хранятся локально на вашем устройстве.
          </FaqItem>
          <FaqItem question="Безопасно ли это?">
            Да. Данные хранятся только на вашем устройстве и не передаются на сервер.
          </FaqItem>
          <FaqItem question="Как удалить приложение?">
            Как обычное приложение: долгое нажатие на иконку → «Удалить».
          </FaqItem>
          <FaqItem question="Приложение обновляется?">
            Да. При следующем открытии загружается последняя версия.
          </FaqItem>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
      >
        {number}
      </div>
      <div className="flex-1 pt-0.5">
        <p className="font-medium text-sm mb-1">{title}</p>
        <div className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function FaqItem({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-2xl" style={{ backgroundColor: 'var(--md-surface-container)' }}>
      <p className="font-medium text-sm mb-1">{question}</p>
      <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>{children}</p>
    </div>
  );
}
