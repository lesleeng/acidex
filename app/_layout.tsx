// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import 'react-native-reanimated';
import "../lib/icons";
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import Colors from '@/constants/colors';
import { BookmarkStore } from '@/src/data/bookmarkStore';
import { CollectionStore } from '@/src/data/collectionStore';
import { flushQueuedHistorySync, loadSyncStatus } from '@/src/services/historySync';

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useEffect(() => {
    void BookmarkStore.load();
    void CollectionStore.load();
    void loadSyncStatus();
    void flushQueuedHistorySync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack 
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 160,
          gestureEnabled: true,
          contentStyle: { backgroundColor: Colors.light.background },
        }}
        initialRouteName="index"
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/signup" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/forgot-password" />
        <Stack.Screen name="(auth)/reset-password" />
        <Stack.Screen name="callback"/>
        {/* If you moved modal.tsx into (tabs), remove this line */}
        {/* If you kept modal.tsx at root, keep it here: */}
        {/* <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} /> */}
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
