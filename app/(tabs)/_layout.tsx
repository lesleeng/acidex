import { Tabs } from 'expo-router';
import React from 'react';
import 'expo-crypto';


import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'dashboard',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="dashboard.icon" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'history',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="history.icon" color={color} />,
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: 'results',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="result.icon" color={color} />,
        }}
      />

    </Tabs>
  );
}

