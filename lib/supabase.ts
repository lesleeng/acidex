import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

let persistAuthSession = true

function isSupabaseAuthKey(key: string) {
  return key.includes('auth-token') && key.startsWith('sb-')
}

async function removePersistedAuthSession() {
  const keys = await AsyncStorage.getAllKeys()
  const authKeys = keys.filter(isSupabaseAuthKey)
  if (authKeys.length > 0) {
    await AsyncStorage.multiRemove(authKeys)
  }
}

const authStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => {
    if (!persistAuthSession && isSupabaseAuthKey(key)) {
      return Promise.resolve()
    }

    return AsyncStorage.setItem(key, value)
  },
  removeItem: (key: string) => AsyncStorage.removeItem(key),
}

export function setAuthSessionPersistenceEnabled(enabled: boolean) {
  persistAuthSession = enabled
}

export async function clearPersistedAuthSession() {
  await removePersistedAuthSession()
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: authStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    // Use implicit flow for password reset to work properly
    // PKCE flow can cause issues with password reset tokens
    flowType: 'implicit',
  },
})
