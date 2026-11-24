import { useThemePreference } from '@/context/ThemeContext';

export function useColorScheme() {
  const { resolvedScheme } = useThemePreference();
  return resolvedScheme;
}
