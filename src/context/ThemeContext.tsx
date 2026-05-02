import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export const palette = {
  light: {
    bg: '#f8f9fa',
    surface: '#ffffff',
    text: '#1a1a2e',
    textSecondary: '#636e72',
    textMuted: '#b2bec3',
    accent: '#6c5ce7',
    accentLight: '#a29bfe',
    accentBg: '#dfe6e9',
    danger: '#d63031',
    warning: '#e17055',
    success: '#00b894',
    border: '#eee',
    card: '#ffffff',
    cardShadow: '#000',
    inputBg: '#f0f0f0',
    headerBg: '#1a1a2e',
    headerText: '#ffffff',
    tabBar: '#ffffff',
    tabBarBorder: '#eee',
    chipBg: '#f0f0f0',
    chipActive: '#1a1a2e',
    chipText: '#555',
    chipTextActive: '#ffffff',
    alertBg: '#ffeaa7',
    alertText: '#2d3436',
    tokenBg: '#ffeaa7',
    tokenText: '#2d3436',
  },
  dark: {
    bg: '#0d1117',
    surface: '#161b22',
    text: '#e6edf3',
    textSecondary: '#8b949e',
    textMuted: '#484f58',
    accent: '#7c6ff7',
    accentLight: '#a29bfe',
    accentBg: '#21262d',
    danger: '#ff6b6b',
    warning: '#fab1a0',
    success: '#55efc4',
    border: '#30363d',
    card: '#161b22',
    cardShadow: '#000',
    inputBg: '#21262d',
    headerBg: '#161b22',
    headerText: '#e6edf3',
    tabBar: '#161b22',
    tabBarBorder: '#30363d',
    chipBg: '#21262d',
    chipActive: '#6c5ce7',
    chipText: '#8b949e',
    chipTextActive: '#ffffff',
    alertBg: '#21262d',
    alertText: '#ffc107',
    tokenBg: '#21262d',
    tokenText: '#ffc107',
  },
};

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  colors: typeof palette.light;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  colors: palette.light,
  toggleTheme: () => {},
  isDark: false,
});

const STORAGE_KEY = '@life-os/theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('light');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'dark' || stored === 'light') {
        setTheme(stored);
      } else if (systemScheme) {
        setTheme(systemScheme as Theme);
      }
      setLoaded(true);
    });
  }, [systemScheme]);

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }

  if (!loaded) return null;

  const colors = theme === 'dark' ? palette.dark : palette.light;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
