import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#111827',
    background: '#F7F9FC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E8EEF5',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    navy: '#16325B',
    navyDark: '#0F2342',
    tealAccent: '#0EA5E9',
    aquaTop: '#B8ECF4',
    aquaMid: '#E3F7FA',
    aiBlue: '#2563EB',
    aiPurple: '#A855F7',
  },
  dark: {
    text: '#F8FAFC',
    background: '#0B1120',
    backgroundElement: '#162032',
    backgroundSelected: '#1E293B',
    textSecondary: '#94A3B8',
    border: '#1E293B',
    navy: '#2563EB',
    navyDark: '#1D4ED8',
    tealAccent: '#38BDF8',
    aquaTop: '#0F2942',
    aquaMid: '#132238',
    aiBlue: '#3B82F6',
    aiPurple: '#C084FC',
  },
} as const;

export const DocBadgeColors = {
  pdf: { bg: '#FEE2E2', accent: '#E53935', label: 'PDF' },
  docx: { bg: '#DBEAFE', accent: '#2563EB', label: 'W' },
  xlsx: { bg: '#DCFCE7', accent: '#16A34A', label: 'X' },
  pptx: { bg: '#FFEDD5', accent: '#EA580C', label: 'P' },
  scan: { bg: '#E0E7FF', accent: '#16325B', label: 'SCAN' },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 82, android: 76 }) ?? 76;
export const MaxContentWidth = 800;
