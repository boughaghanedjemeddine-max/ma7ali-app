import { useState, useEffect } from 'react';
import { settingsDB } from '@/lib/db';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  // Load theme from settings
  useEffect(() => {
    const loadTheme = async () => {
      const settings = await settingsDB.get();
      setThemeState(settings.theme);
    };
    loadTheme();
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.remove('light');
        setResolvedTheme('dark');
      } else {
        root.classList.add('light');
        setResolvedTheme('light');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    await settingsDB.save({ theme: newTheme });
  };

  return { theme, setTheme, resolvedTheme };
}
