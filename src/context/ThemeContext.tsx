import React, { createContext, useContext, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemePreferenceContextValue {
  themeMode: ThemeMode;
  resolvedScheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme() === 'dark' ? 'dark' : 'light';
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  const resolvedScheme: 'light' | 'dark' =
    themeMode === 'system' ? systemScheme : themeMode;

  const toggleTheme = () => {
    setThemeMode((prev) => {
      const current = prev === 'system' ? systemScheme : prev;
      return current === 'dark' ? 'light' : 'dark';
    });
  };

  return (
    <ThemePreferenceContext.Provider
      value={{ themeMode, resolvedScheme, setThemeMode, toggleTheme }}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) {
    return {
      themeMode: 'light' as ThemeMode,
      resolvedScheme: 'light' as const,
      setThemeMode: () => {},
      toggleTheme: () => {},
    };
  }
  return ctx;
}
