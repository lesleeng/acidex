import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Image } from 'expo-image'
import * as WebBrowser from 'expo-web-browser'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import HidePwIcon from '@/assets/images/hide-pw.svg'
import ShowPwIcon from '@/assets/images/show-pw.svg'
import Colors from '@/constants/colors'
import {
    clearPersistedAuthSession,
    setAuthSessionPersistenceEnabled,
    supabase,
} from '@/lib/supabase'

const REMEMBER_ME_KEY = 'acidex_login_remember_me'
const OAUTH_REDIRECT_URL = 'acidex://callback'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const emailLabelAnim = useState(new Animated.Value(0))[0]
  const passwordLabelAnim = useState(new Animated.Value(0))[0]

  useEffect(() => {
    const loadRememberMe = async () => {
      try {
        const stored = await AsyncStorage.getItem(REMEMBER_ME_KEY)
        if (stored !== null) {
          setRememberMe(stored === 'true')
        }
      } catch (error) {
        console.log('load remember me error:', error)
      }
    }

    loadRememberMe()
  }, [])

  useEffect(() => {
    Animated.timing(emailLabelAnim, {
      toValue: emailFocused || email.length > 0 ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start()
  }, [emailFocused, email])

  useEffect(() => {
    Animated.timing(passwordLabelAnim, {
      toValue: passwordFocused || password.length > 0 ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start()
  }, [passwordFocused, password])

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      setAuthSessionPersistenceEnabled(rememberMe)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('LOGIN data:', data)
      console.log('LOGIN error:', error)

      if (error) throw error

      if (!rememberMe) {
        await clearPersistedAuthSession()
      }

      router.replace('/(tabs)/home')
    } catch (error: any) {
      Alert.alert('Login Failed', error?.message ?? 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (loading) return
    setLoading(true)

    try {
      setAuthSessionPersistenceEnabled(rememberMe)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: OAUTH_REDIRECT_URL },
      })

      if (error) throw error
      if (!data?.url) throw new Error('No OAuth URL returned')

      await WebBrowser.openAuthSessionAsync(data.url, OAUTH_REDIRECT_URL)
    } catch (e: any) {
      console.log('Google OAuth error:', e)
      Alert.alert('Google Sign-In Failed', e?.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const showEmailLabel = emailFocused || email.length > 0
  const showPasswordLabel = passwordFocused || password.length > 0

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
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.signupLink}>sign up</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>log in</Text>

          <View style={styles.form}>
            {/* EMAIL */}
            <View style={styles.fieldBlock}>
              <Animated.Text
                style={[
                  styles.floatingLabel,
                  emailFocused && styles.floatingLabelActive,
                  {
                    opacity: emailLabelAnim,
                    transform: [
                      {
                        translateY: emailLabelAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [8, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                email
              </Animated.Text>
              <TextInput
                style={[
                  styles.underlineInput,
                  emailFocused && styles.underlineInputActive,
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder={showEmailLabel ? '' : 'enter your email'}
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            {/* PASSWORD */}
            <View style={styles.fieldBlock}>
              <Animated.Text
                style={[
                  styles.floatingLabel,
                  passwordFocused && styles.floatingLabelActive,
                  {
                    opacity: passwordLabelAnim,
                    transform: [
                      {
                        translateY: passwordLabelAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [8, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                password
              </Animated.Text>
              <View
                style={[
                  styles.passwordUnderlineWrap,
                  passwordFocused && styles.underlineInputActive,
                ]}
              >
                <TextInput
                  style={styles.passwordUnderlineInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={showPasswordLabel ? '' : 'enter your password'}
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <ShowPwIcon width={24} height={24} />
                  ) : (
                    <HidePwIcon width={24} height={24} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotPasswordText}>forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.rememberRow}
              onPress={() => {
                const nextValue = !rememberMe
                setRememberMe(nextValue)
                AsyncStorage.setItem(REMEMBER_ME_KEY, String(nextValue)).catch((error) => {
                  console.log('save remember me error:', error)
                })
              }}
            >
              <View style={[styles.rememberBox, rememberMe && styles.rememberBoxChecked]}>
                {rememberMe && <Ionicons name="checkmark" size={14} color={Colors.light.background} />}
              </View>
              <Text style={styles.rememberText}>remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'logging in...' : 'log in'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.divider}>or log in with social account</Text>

            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={[styles.socialButton, loading && styles.buttonDisabled]}
                onPress={handleGoogleLogin}
                disabled={loading}
              >
                <View style={styles.socialContent}>
                  <Image
                    source={require('@/assets/images/google.png')}
                    style={styles.googleIcon}
                    contentFit="contain"
                  />
                  <Text style={styles.socialButtonText}>
                    {loading ? 'loading...' : 'Google'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 20 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 35,
  },

  backButton: { paddingLeft: 0 },
  backText: { fontSize: 30, color: Colors.light.text },
  signupLink: { fontSize: 18, color: Colors.light.text },

  title: {
    color: Colors.light.text,
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 30,
  },

  form: { flex: 1, paddingTop: 20 },

  fieldBlock: {
    position: 'relative',
    height: 50,
    justifyContent: 'flex-end',
    marginBottom: 15,
  },

  floatingLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    fontSize: 12,
    color: '#999',
  },

  floatingLabelActive: {
    color: '#999',
  },

  underlineInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#DADADA',
    paddingTop: 15,
    paddingBottom: 4,
    paddingHorizontal: 0,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: 'transparent',
    fontWeight: '500',
  },

  underlineInputActive: {
    borderBottomColor: Colors.light.coffee,
  },

  passwordUnderlineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DADADA',
    paddingTop: 15,
  },

  passwordUnderlineInput: {
    flex: 1,
    paddingBottom: 4,
    paddingHorizontal: 0,
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },

  eyeButton: {
    paddingLeft: 10,
    paddingBottom: 8,
  },

  eyeIcon: { width: 24, height: 24 },

  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 15,
  },

  forgotPasswordText: {
    color: Colors.light.coffee,
    fontSize: 14,
    fontWeight: '500',
  },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 10,
    marginTop: 6,
    marginBottom: 10,
  },

  rememberBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C9B8AC',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  rememberBoxChecked: {
    backgroundColor: Colors.light.coffee,
    borderColor: Colors.light.coffee,
  },

  rememberText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '500',
  },

  loginButton: {
    backgroundColor: Colors.light.button,
    borderRadius: 25,
    padding: 16,
    marginTop: 25,
    alignItems: 'center',
  },

  buttonDisabled: { opacity: 0.6 },

  loginButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: '600',
  },

  divider: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 30,
  },

  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },

  socialButton: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 25,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },

  socialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  googleIcon: {
    width: 30,
    height: 30,
    marginRight: 8,
  },

  socialButtonText: {
    color: '#3D3D3D',
    fontSize: 16,
    fontWeight: '600',
  },
})
