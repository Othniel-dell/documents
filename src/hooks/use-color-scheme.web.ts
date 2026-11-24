import { useSyncExternalStore } from 'react';

import { useThemePreference } from '@/context/ThemeContext';

const emptySubscribe = () => () => {};

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const { resolvedScheme } = useThemePreference();

  if (hasHydrated) {
    return resolvedScheme;
  }

  return 'light';
}
