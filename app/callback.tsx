import { useEffect } from 'react'
import { View, ActivityIndicator, Text, Platform } from 'react-native'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function CallbackScreen() {
  useEffect(() => {
    const run = async () => {
      try {
        if (Platform.OS === 'web') {
          // ✅ On web, Supabase (detectSessionInUrl: true) should already process the URL.
          const { data } = await supabase.auth.getSession()
          router.replace(data.session ? '/(tabs)/home' : '/(auth)/login')
          return
        }

        // ✅ On native, we must exchange manually
        const url = await Linking.getInitialURL()
        if (!url) throw new Error('Missing callback URL')

        const { error } = await supabase.auth.exchangeCodeForSession(url)
        if (error) throw error

        const { data } = await supabase.auth.getSession()
        router.replace(data.session ? '/(tabs)/home' : '/(auth)/login')
      } catch (e) {
        router.replace('/(auth)/login')
      }
    }

    run()
  }, [])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 12 }}>Signing you in…</Text>
    </View>
  )
}