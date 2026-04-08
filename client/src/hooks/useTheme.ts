import { useEffect, useState } from 'react';
import { config } from '../store';

export function useTheme() {
  const [theme, setThemeState] = useState<'dark' | 'light'>(config.getTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = (t: 'dark' | 'light') => {
    config.setTheme(t);
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
  };

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return { theme, setTheme, toggle };
}
