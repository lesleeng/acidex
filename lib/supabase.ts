import 'react-native-url-polyfill/auto.js'
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

export function isInvalidRefreshTokenError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const message =
    'message' in error && typeof (error as { message?: unknown }).message === 'string'
      ? (error as { message: string }).message
      : ''

  return (
    message.includes('Invalid Refresh Token') ||
    message.includes('Refresh Token Not Found') ||
    message.includes('refresh_token_not_found')
  )
}

export async function recoverFromInvalidRefreshToken(error: unknown): Promise<boolean> {
  if (!isInvalidRefreshTokenError(error)) return false
  await clearPersistedAuthSession()
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    // no-op, local session was already invalid
  }
  return true
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: authStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    // Use implicit flow for password reset to work properly
    // PKCE flow can cause issues with password reset tokens
    flowType: 'pkce',
  },
})
