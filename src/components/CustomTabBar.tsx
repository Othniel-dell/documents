import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Tabs } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

export function CustomTabBar({ state, descriptors }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = Colors[scheme];

  const handleScanPress = () => {
    router.push('/scanner');
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: theme.backgroundElement,
          borderTopColor: theme.border,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? String(options.tabBarLabel)
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        // Render elevated center Scan button on the 'scan-placeholder' route
        if (route.name === 'scan-placeholder') {
          return (
            <View key={route.key} style={styles.centerSlot}>
              <Pressable
                onPress={handleScanPress}
                style={({ pressed }) => [
                  styles.scanButton,
                  {
                    backgroundColor: theme.navy,
                    transform: [{ scale: pressed ? 0.94 : 1 }],
                  },
                ]}>
                <Ionicons name="camera" size={26} color="#FFFFFF" />
              </Pressable>
              <Text style={[styles.label, { color: theme.textSecondary, marginTop: 4 }]}>
                Scan
              </Text>
            </View>
          );
        }

        const onPress = () => {
          if (!isFocused) {
            const targetPath = route.name === 'index' ? '/(tabs)' : `/(tabs)/${route.name}`;
            router.navigate(targetPath as never);
          }
        };

        let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
        if (route.name === 'index') {
          iconName = isFocused ? 'home' : 'home-outline';
        } else if (route.name === 'documents') {
          iconName = isFocused ? 'folder' : 'folder-outline';
        } else if (route.name === 'settings') {
          iconName = isFocused ? 'settings' : 'settings-outline';
        }

        const color = isFocused ? theme.navy : theme.textSecondary;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabItem}>
            <Ionicons name={iconName} size={22} color={color} />
            <Text style={[styles.label, { color, fontWeight: isFocused ? '700' : '500' }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: Platform.OS === 'web' ? -18 : -24,
  },
  scanButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#16325B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  label: {
    fontSize: 11,
  },
});
