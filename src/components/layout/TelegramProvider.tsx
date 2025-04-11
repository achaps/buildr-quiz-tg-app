'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { TelegramWebApp, TgUser } from '@/types/telegram';

declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
    };
  }
}

interface TelegramContextType {
  webApp: TelegramWebApp | null;
  user: TgUser | null;
  isReady: boolean;
}

const TelegramContext = createContext<TelegramContextType>({
  webApp: null,
  user: null,
  isReady: false,
});

interface TelegramProviderProps {
  children: React.ReactNode;
  overrideWebApp?: TelegramWebApp;
  overrideUser?: TgUser;
}

export function TelegramProvider({ children, overrideWebApp, overrideUser }: TelegramProviderProps) {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TgUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (overrideWebApp && overrideUser) {
      setWebApp(overrideWebApp);
      setUser(overrideUser);
      setIsReady(true);
      return;
    }

    if (typeof window !== 'undefined') {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        setWebApp(tg);
        setUser(tg.initDataUnsafe?.user ?? null);
        setIsReady(true);
        tg.expand();
      }
    }
  }, [overrideWebApp, overrideUser]);

  return (
    <TelegramContext.Provider value={{ webApp, user, isReady }}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  return useContext(TelegramContext);
} 