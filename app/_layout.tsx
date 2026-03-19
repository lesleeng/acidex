// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser'
WebBrowser.maybeCompleteAuthSession()
import "../lib/icons";

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack 
        screenOptions={{ headerShown: false }}
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