'use client';

import { useTelegram } from './TelegramProvider';
import { useEffect, useState } from 'react';

export function TelegramRoot({ children }: { children: React.ReactNode }) {
  const { webApp } = useTelegram();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !webApp) return;

    const root = document.documentElement;
    if (!root) return;

    // Apply Telegram WebApp styles
    root.style.setProperty('--tg-viewport-height', `${webApp.viewportHeight}px`);
    root.style.setProperty('--tg-viewport-stable-height', `${webApp.viewportStableHeight}px`);
    
    // Apply theme colors
    const { themeParams } = webApp;
    root.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
    root.style.setProperty('--tg-theme-text-color', themeParams.text_color);
    root.style.setProperty('--tg-theme-hint-color', themeParams.hint_color);
    root.style.setProperty('--tg-theme-link-color', themeParams.link_color);
    root.style.setProperty('--tg-theme-button-color', themeParams.button_color);
    root.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color);
  }, [webApp, mounted]);

  return (
    <div className="min-h-screen" style={{
      minHeight: 'var(--tg-viewport-height)',
      backgroundColor: 'var(--tg-theme-bg-color)',
      color: 'var(--tg-theme-text-color)',
    }}>
      {children}
    </div>
  );
} 