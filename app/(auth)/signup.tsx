import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { supabase } from '@/lib/supabase'

import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native'
import { router } from 'expo-router'

export default function SignUpScreen() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignUp = async () => {
    console.log('SIGN UP CLICKED')

    if (!email || !name || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)
    console.log('START SIGNUP', { email, name })

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })

      console.log('SIGNUP RESPONSE DATA:', data)
      console.log('SIGNUP RESPONSE ERROR:', error)

      if (error) throw error

      Alert.alert('Success', 'Account created successfully! Please check your email.')
      router.replace('/(auth)/login')
    } catch (err: any) {
      console.log('SIGNUP CATCH ERROR:', err)

      const msg =
        err?.message ||
        err?.error_description ||
        err?.error ||
        JSON.stringify(err)

      if (msg.toLowerCase().includes('password should contain')) {
        Alert.alert(
          'Weak Password',
          'Use at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character.'
        )
        return
      }

      if (
        msg.toLowerCase().includes('already registered') ||
        msg.toLowerCase().includes('already been registered')
      ) {
        Alert.alert('Email Exists', 'This email is already registered. Please log in instead.')
        return
      }

      Alert.alert('Sign Up Failed', msg)
    } finally {
      console.log('SIGNUP FINALLY')
      setLoading(false)
    }
  }

const runOAuth = async (provider: 'google' | 'facebook') => {
  if (loading) return
  setLoading(true)

  try {
    WebBrowser.maybeCompleteAuthSession()

    // ✅ callback route is app/callback.tsx -> /callback
    const redirectTo =
      Platform.OS === 'web'
        ? `${window.location.origin}/callback`
        : Linking.createURL('callback')

    console.log(`OAUTH provider=${provider} redirectTo:`, redirectTo)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        // ✅ only native should use skipBrowserRedirect
        ...(Platform.OS !== 'web' ? { skipBrowserRedirect: true } : {}),
      },
    })

    if (error) throw error
    if (!data?.url) throw new Error('No OAuth URL returned')

    // ✅ WEB: redirect current tab to provider; provider will return to /callback in same tab
    if (Platform.OS === 'web') {
      window.location.assign(data.url)
      return
    }

    // ✅ NATIVE: open auth session (in-app browser)
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
    console.log('OAUTH result:', result)

    if (result.type !== 'success') {
      Alert.alert(
        `${provider === 'google' ? 'Google' : 'Facebook'} Sign In`,
        'Cancelled or failed.'
      )
      return
    }

    // ✅ Do NOT exchange here if your callback.tsx handles it.
    // Your callback screen will exchangeCodeForSession() using the incoming URL.
  } catch (err: any) {
    console.log('OAUTH ERROR:', err)
    Alert.alert(
      `${provider === 'google' ? 'Google' : 'Facebook'} Sign Up Failed`,
      err?.message ?? 'Unknown error'
    )
  } finally {
    setLoading(false)
  }
}


  const handleGoogleSignUp = async () => runOAuth('google')
  const handleFacebookSignUp = async () => runOAuth('facebook')

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>log in</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>sign up</Text>

          <View style={styles.form}>
            <Text style={styles.label}>your email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="enter your email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="enter your name"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />

            <Text style={styles.label}>password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="enter your password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.signUpButton, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={styles.signUpButtonText}>
                {loading ? 'signing up...' : 'sign up'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.divider}>or sign up with social account</Text>

            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignUp} disabled={loading}>
                <Text style={styles.socialButtonText}>G Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialButton} onPress={handleFacebookSignUp} disabled={loading}>
                <Text style={styles.socialButtonText}>f Facebook</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              by signing up, you agree to our <Text style={styles.termsLink}>terms of use</Text>
              {'\n'}and <Text style={styles.termsLink}>privacy policy</Text>.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: { padding: 5 },
  backText: { fontSize: 24, color: '#000' },
  loginLink: { fontSize: 14, color: '#666' },
  title: { fontSize: 28, fontWeight: '600', marginBottom: 30 },
  form: { flex: 1 },
  label: { fontSize: 12, color: '#999', marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  passwordContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  passwordInput: { flex: 1, padding: 15 },
  eyeButton: { padding: 15 },
  eyeIcon: { fontSize: 18 },
  signUpButton: {
    backgroundColor: '#3D3D3D',
    borderRadius: 25,
    padding: 16,
    marginTop: 30,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  signUpButtonText: { color: '#FFF', fontSize: 16 },
  divider: { textAlign: 'center', color: '#999', marginVertical: 25 },
  socialButtons: { flexDirection: 'row', gap: 15 },
  socialButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 25,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  socialButtonText: { fontSize: 14, fontWeight: '500' },
  termsContainer: { marginTop: 40, marginBottom: 20 },
  termsText: { textAlign: 'center', fontSize: 11, color: '#999' },
  termsLink: { textDecorationLine: 'underline' },
})
