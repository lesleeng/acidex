import 'react-native-url-polyfill/auto.js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import process from "node:process";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

let persistAuthSession = true

function isSupabaseAuthKey(key: string) {
  return key.includes('auth-token') && key.startsWith('sb-')
}

async function removePersistedAuthSession() {
  const keys = AsyncStorage.getAllKeys() || []
  const authKeys = keys.filter(isSupabaseAuthKey)
  if (authKeys.length > 0) {
    await AsyncStorage.multiRemove(authKeys)
  }
}

const authStorage = {
  getItem: async (key: string) => {
    return AsyncStorage.getItem(key)
  },
  setItem: async (key: string, value: string) => {
    if (!persistAuthSession && isSupabaseAuthKey(key)) {
      return
    }

    return AsyncStorage.setItem(key, value)
  },
  removeItem: async (key: string) => {
    return AsyncStorage.removeItem(key)
  },
}

export function setAuthSessionPersistenceEnabled(enabled: boolean) {
  persistAuthSession = enabled
}

export async function clearPersistedAuthSession() {
  await removePersistedAuthSession()
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    //storage: authStorage,
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    // Use implicit flow for password reset to work properly
    // PKCE flow can cause issues with password reset tokens
    flowType: 'pkce',
  },
})
