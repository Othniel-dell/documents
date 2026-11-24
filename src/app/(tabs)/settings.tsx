import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { useDocuments } from '@/context/DocumentContext';
import { type ThemeMode, useThemePreference } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: 'sunny-outline' | 'moon-outline' | 'phone-portrait-outline' }[] = [
  { mode: 'light', label: 'White', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export default function SettingsScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = Colors[scheme];
  const { documents, savedSignatures, setHasSeenOnboarding } = useDocuments();
  const { themeMode, setThemeMode } = useThemePreference();

  const signedCount = documents.filter((d) => d.isSigned).length;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

        {/* Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: theme.navy }]}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{documents.length}</Text>
            <Text style={styles.statLabel}>Documents</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{signedCount}</Text>
            <Text style={styles.statLabel}>Signed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{savedSignatures.length}</Text>
            <Text style={styles.statLabel}>Signatures</Text>
          </View>
        </View>

        {/* Saved Signatures */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Saved Signatures</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          {savedSignatures.map((sig) => (
            <View key={sig.id} style={styles.sigRow}>
              <View style={styles.sigPreview}>
                <Svg width={150} height={52} viewBox="0 0 170 60">
                  {sig.paths.map((p, idx) => (
                    <Path
                      key={idx}
                      d={p}
                      stroke={sig.color}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  ))}
                </Svg>
              </View>
              <Text style={[styles.sigName, { color: theme.textSecondary }]}>{sig.name}</Text>
            </View>
          ))}
        </View>

        {/* Appearance (White / Dark / System) */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
        <View
          style={[
            styles.themeRow,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          {THEME_OPTIONS.map((opt) => {
            const active = themeMode === opt.mode;
            return (
              <Pressable
                key={opt.mode}
                onPress={() => setThemeMode(opt.mode)}
                style={[
                  styles.themeChip,
                  active && { backgroundColor: theme.navy },
                ]}>
                <Ionicons
                  name={opt.icon}
                  size={16}
                  color={active ? '#FFFFFF' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.themeChipText,
                    { color: active ? '#FFFFFF' : theme.text },
                  ]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* General Options */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <Pressable
            onPress={() => setHasSeenOnboarding(false)}
            style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="sparkles-outline" size={20} color={theme.navy} />
              <Text style={[styles.optionText, { color: theme.text }]}>
                View Welcome Onboarding
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Pressable
            onPress={() => router.push('/ai-chat')}
            style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.aiBlue} />
              <Text style={[styles.optionText, { color: theme.text }]}>
                AI PDF Assistant
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 18, gap: 16 },
  title: { fontSize: 26, fontWeight: '800' },
  statsCard: {
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCol: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  statLabel: { color: '#CBD5E1', fontSize: 12 },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  sigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sigPreview: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sigName: { fontSize: 13, fontWeight: '600' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionText: { fontSize: 15, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth },
  themeRow: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 6,
    gap: 6,
  },
  themeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  themeChipText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});
