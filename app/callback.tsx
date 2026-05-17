import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

export default function CallbackScreen() {
  const params = useLocalSearchParams()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    ;(async () => {
      try {
        console.log('CALLBACK params:', params)

        const codeParam = params.code
        const code = Array.isArray(codeParam) ? codeParam[0] : codeParam
        if (!code) throw new Error('Missing callback query param: code')

        console.log('CALLBACK exchange code:', code)

        const { error } = await supabase.auth.exchangeCodeForSession(code)
        console.log('CALLBACK exchange error:', error)

        if (error) {
          Alert.alert('Google Login Failed', error.message)
          router.replace('/(auth)/login')
          return
        }

        const { data } = await supabase.auth.getSession()
        console.log('CALLBACK session exists:', !!data.session)

        router.replace(data.session ? '/(tabs)/home' : '/(auth)/login')
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        console.log('CALLBACK catch:', message)
        Alert.alert('Login Failed', message)
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