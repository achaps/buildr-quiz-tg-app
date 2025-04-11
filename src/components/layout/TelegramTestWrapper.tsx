'use client';

import { TelegramProvider } from './TelegramProvider';
import { TelegramWebApp } from '@/types/telegram';

const mockUser = {
  id: '12345',
  first_name: 'Test',
  last_name: 'User',
  username: 'testuser',
  language_code: 'en',
};

const mockTelegramWebApp: TelegramWebApp = {
  platform: 'test',
  version: '6.0',
  colorScheme: 'light' as const,
  themeParams: {
    bg_color: '#ffffff',
    text_color: '#000000',
    hint_color: '#999999',
    link_color: '#2481cc',
    button_color: '#2481cc',
    button_text_color: '#ffffff',
  },
  viewportHeight: 800,
  viewportStableHeight: 800,
  isExpanded: true,
  initDataUnsafe: {
    user: mockUser
  },
  MainButton: {
    text: '',
    color: '#2481cc',
    textColor: '#ffffff',
    isVisible: false,
    isActive: true,
    isProgressVisible: false,
    setText: (text: string) => {
      console.log('Set main button text:', text);
      mockTelegramWebApp.MainButton.text = text;
    },
    show: () => {
      console.log('Show main button');
      mockTelegramWebApp.MainButton.isVisible = true;
    },
    hide: () => {
      console.log('Hide main button');
      mockTelegramWebApp.MainButton.isVisible = false;
    },
    enable: () => {
      console.log('Enable main button');
      mockTelegramWebApp.MainButton.isActive = true;
    },
    disable: () => {
      console.log('Disable main button');
      mockTelegramWebApp.MainButton.isActive = false;
    },
    showProgress: (leaveActive: boolean) => {
      console.log('Show main button progress:', leaveActive);
      mockTelegramWebApp.MainButton.isProgressVisible = true;
    },
    hideProgress: () => {
      console.log('Hide main button progress');
      mockTelegramWebApp.MainButton.isProgressVisible = false;
    },
    setParams: (params: Partial<typeof mockTelegramWebApp.MainButton>) => {
      console.log('Set main button params:', params);
      Object.assign(mockTelegramWebApp.MainButton, params);
    },
    onClick: () => {
      console.log('Add main button click handler');
      return () => console.log('Remove main button click handler');
    },
    offClick: () => {
      console.log('Remove main button click handler');
      return () => console.log('Add main button click handler');
    },
  },
  BackButton: {
    isVisible: false,
    onClick: () => {
      console.log('Add back button click handler');
      return () => console.log('Remove back button click handler');
    },
    offClick: () => {
      console.log('Remove back button click handler');
      return () => console.log('Add back button click handler');
    },
    show: () => {
      console.log('Show back button');
      mockTelegramWebApp.BackButton.isVisible = true;
    },
    hide: () => {
      console.log('Hide back button');
      mockTelegramWebApp.BackButton.isVisible = false;
    },
  },
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => console.log('Haptic feedback:', style),
    notificationOccurred: (type: 'error' | 'success' | 'warning') => console.log('Haptic notification:', type),
    selectionChanged: () => console.log('Haptic selection changed'),
  },
  expand: () => {
    console.log('Expand web app');
    mockTelegramWebApp.isExpanded = true;
  },
};

export function TelegramTestWrapper({ children }: { children: React.ReactNode }) {
  // Simuler window.Telegram.WebApp
  if (typeof window !== 'undefined') {
    if (!window.Telegram) {
      window.Telegram = { WebApp: mockTelegramWebApp };
    } else {
      window.Telegram.WebApp = mockTelegramWebApp;
    }
  }

  return (
    <TelegramProvider overrideWebApp={mockTelegramWebApp} overrideUser={mockUser}>
      {children}
    </TelegramProvider>
  );
} 