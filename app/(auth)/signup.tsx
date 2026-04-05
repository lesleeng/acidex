import AsyncStorage from '@react-native-async-storage/async-storage'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { Image } from 'expo-image'
import Colors from '@/constants/colors'

import React, { useEffect, useState } from 'react'
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { router } from 'expo-router'

import { supabase } from '@/lib/supabase'
import { AppIcon } from "@/components/app-icon"
import ShowPwIcon from '@/assets/images/show-pw.svg'
import HidePwIcon from '@/assets/images/hide-pw.svg'

export default function SignUpScreen() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [emailFocused, setEmailFocused] = useState(false)
  const [nameFocused, setNameFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const emailLabelAnim = useState(new Animated.Value(0))[0]
  const nameLabelAnim = useState(new Animated.Value(0))[0]
  const passwordLabelAnim = useState(new Animated.Value(0))[0]

  useEffect(() => {
    ;(async () => {
      await AsyncStorage.setItem('test_key', 'hello')
      const v = await AsyncStorage.getItem('test_key')
      console.log('AsyncStorage test:', v)
    })()

    GoogleSignin.configure({
      webClientId:
        '409625553274-rdsbj4kjv3pb5hmpv39ggl5cupgvdpl9.apps.googleusercontent.com',
    })
  }, [])

  useEffect(() => {
    Animated.timing(emailLabelAnim, {
      toValue: emailFocused || email.length > 0 ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start()
  }, [emailFocused, email])

  useEffect(() => {
    Animated.timing(nameLabelAnim, {
      toValue: nameFocused || username.length > 0 ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start()
  }, [nameFocused, username])

  useEffect(() => {
    Animated.timing(passwordLabelAnim, {
      toValue: passwordFocused || password.length > 0 ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start()
  }, [passwordFocused, password])

  const handleSignUp = async () => {
    if (!email || !username || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: username } },
      })

      console.log('SIGNUP RESPONSE DATA:', data)
      console.log('SIGNUP RESPONSE ERROR:', error)

      if (error) throw error

      Alert.alert('Success', 'Account created successfully! Please check your email.')
      router.replace('/(auth)/login')
    } catch (err: any) {
      const msg =
        err?.message || err?.error_description || err?.error || JSON.stringify(err)

      if (msg.toLowerCase().includes('password should contain')) {
        Alert.alert(
          'Weak Password',
          'Use at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character.'
        )
        return
      }

      if (msg.toLowerCase().includes('already registered')) {
        Alert.alert('Email Exists', 'This email is already registered. Please log in instead.')
        return
      }

      Alert.alert('Sign Up Failed', msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    if (loading) return
    setLoading(true)

    try {
      await GoogleSignin.hasPlayServices()
      const res = await GoogleSignin.signIn()

      const idToken = (res as any)?.data?.idToken ?? (res as any)?.idToken
      if (!idToken) throw new Error('No idToken returned by Google')

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      })

      console.log('GOOGLE signInWithIdToken data:', data)
      console.log('GOOGLE signInWithIdToken error:', error)

      if (error) throw error

      router.replace('/(tabs)/home')
    } catch (e: any) {
      console.log('Google native sign-in error:', e)
      Alert.alert('Google Sign-In Failed', e?.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const showEmailLabel = emailFocused || email.length > 0
  const showNameLabel = nameFocused || username.length > 0
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
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>log in</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>sign up</Text>

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

            {/* NAME */}
            <View style={styles.fieldBlock}>
              <Animated.Text
                style={[
                  styles.floatingLabel,
                  nameFocused && styles.floatingLabelActive,
                  {
                    opacity: nameLabelAnim,
                    transform: [
                      {
                        translateY: nameLabelAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [8, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                username
              </Animated.Text>
              <TextInput
                style={[
                  styles.underlineInput,
                  nameFocused && styles.underlineInputActive,
                ]}
                value={username}
                onChangeText={setUsername}
                placeholder={showNameLabel ? '' : 'enter your username'}
                placeholderTextColor="#999"
                autoCapitalize="words"
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
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
              <TouchableOpacity
                style={[styles.socialButton, loading && styles.buttonDisabled]}
                onPress={handleGoogleSignUp}
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

          {/* ✅ FIXED: No TouchableOpacity nested inside Text */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>by signing up, you agree to our </Text>
            <TouchableOpacity onPress={() => router.push('/terms')}>
              <Text style={styles.termsLink}>terms of use</Text>
            </TouchableOpacity>
            <Text style={styles.termsText}> and </Text>
            <TouchableOpacity onPress={() => router.push('/policy')}>
              <Text style={styles.termsLink}>privacy policy</Text>
            </TouchableOpacity>
            <Text style={styles.termsText}>.</Text>
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
  loginLink: { fontSize: 18, color: Colors.light.text },
  title: { color: Colors.light.text, fontSize: 28, fontWeight: '600', marginBottom: 10, marginTop: 30 },
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

  signUpButton: {
    backgroundColor: Colors.light.button,
    borderRadius: 25,
    padding: 16,
    marginTop: 25,
    alignItems: 'center',
  },

  buttonDisabled: { opacity: 0.6 },

  signUpButtonText: {
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

  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  termsText: { textAlign: 'center', fontSize: 13, color: '#999' },
  termsLink: { fontSize: 13, color: '#999', textDecorationLine: 'underline' },
})