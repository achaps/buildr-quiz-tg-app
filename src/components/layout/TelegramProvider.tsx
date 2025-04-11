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
      console.log('Using override WebApp and User:', { overrideWebApp, overrideUser });
      setWebApp(overrideWebApp);
      setUser(overrideUser);
      setIsReady(true);
      return;
    }

    if (typeof window !== 'undefined') {
      console.log('Window object available');
      const tg = window.Telegram?.WebApp;
      console.log('Telegram WebApp object:', tg);
      
      if (tg) {
        console.log('Telegram WebApp found, initializing...');
        console.log('Init data:', tg.initDataUnsafe);
        console.log('User data:', tg.initDataUnsafe?.user);
        
        setWebApp(tg);
        setUser(tg.initDataUnsafe?.user ?? null);
        setIsReady(true);
        tg.expand();
      } else {
        console.log('Telegram WebApp not found. Make sure you are running in Telegram.');
      }
    } else {
      console.log('Window object not available (server-side rendering)');
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