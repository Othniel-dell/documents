import { Tabs } from 'expo-router';
import React from 'react';

import { CustomTabBar } from '@/components/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen
        name="scan-placeholder"
        options={{ title: 'Scan' }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
          },
        }}
      />
      <Tabs.Screen name="documents" options={{ title: 'Documents' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
