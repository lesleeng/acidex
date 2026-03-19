import { useEffect, useRef } from 'react'
import { View, ActivityIndicator, Text, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function CallbackScreen() {
  const params = useLocalSearchParams()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    ;(async () => {
      try {
        console.log('CALLBACK params:', params)

        const qs = new URLSearchParams(params as any).toString()
        if (!qs) throw new Error('Missing callback query params (code/state)')

        // Must match your redirectTo: acidex:///callback
        const url = `acidex:///callback?${qs}`
        console.log('CALLBACK exchange URL:', url)

        const { error } = await supabase.auth.exchangeCodeForSession(url)
        console.log('CALLBACK exchange error:', error)

        if (error) {
          Alert.alert('Google Login Failed', error.message)
          router.replace('/(auth)/login')
          return
        }

        const { data } = await supabase.auth.getSession()
        console.log('CALLBACK session exists:', !!data.session)

        router.replace(data.session ? '/(tabs)/home' : '/(auth)/login')
      } catch (e: any) {
        console.log('CALLBACK catch:', e?.message ?? e)
        Alert.alert('Login Failed', e?.message ?? 'Unknown error')
        router.replace('/(auth)/login')
      }
    })()
  }, [params])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 12 }}>Signing you in…</Text>
    </View>
  )
}