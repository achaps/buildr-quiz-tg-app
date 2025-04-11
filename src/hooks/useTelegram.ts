import { useContext } from 'react';
import { TelegramContext } from '@/components/layout/TelegramProvider';

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
}; 