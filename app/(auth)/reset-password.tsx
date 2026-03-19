 import React, { useState, useEffect } from 'react'
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
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'

import Colors from '@/constants/colors'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [passwordFocused, setPasswordFocused] = useState(false)
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if user has a valid session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('Session check:', !!session, error)

        if (session) {
          setIsReady(true)
        } else {
          // No session - user needs to go through forgot password flow
          Alert.alert(
            'Session Expired', 
            'Please request a new password reset link.',
            [{ text: 'OK', onPress: () => router.replace('/(auth)/forgot-password') }]
          )
        }
      } catch (error: any) {
        console.log('Error checking session:', error)
        Alert.alert('Error', 'Failed to verify session. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      Alert.alert(
        'Success',
        'Your password has been reset successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      )
    } catch (error: any) {
      Alert.alert('Error', error?.message ?? 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const showPasswordLabel = passwordFocused || password.length > 0
  const showConfirmPasswordLabel = confirmPasswordFocused || confirmPassword.length > 0

  if (loading && !isReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.coffee} />
          <Text style={styles.loadingText}>Preparing...</Text>
        </View>
      </SafeAreaView>
    )
  }

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
          </View>

          <Text style={styles.title}>new password</Text>
          <Text style={styles.subtitle}>
            Enter your new password below.
          </Text>

          <View style={styles.form}>
            <View style={styles.fieldBlock}>
              <Text style={[styles.floatingLabel, passwordFocused && styles.floatingLabelActive]}>
                password
              </Text>
              <View style={[styles.passwordUnderlineWrap, passwordFocused && styles.underlineInputActive]}>
                <TextInput
                  style={styles.passwordUnderlineInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={showPasswordLabel ? '' : 'enter new password'}
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
                  <Text style={styles.eyeIcon}>
                    {showPassword ? '🙈' : '👁️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={[styles.floatingLabel, confirmPasswordFocused && styles.floatingLabelActive]}>
                confirm password
              </Text>
              <View style={[styles.passwordUnderlineWrap, confirmPasswordFocused && styles.underlineInputActive]}>
                <TextInput
                  style={styles.passwordUnderlineInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={showConfirmPasswordLabel ? '' : 'confirm new password'}
                  placeholderTextColor="#999"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.resetButton, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={styles.resetButtonText}>
                {loading ? 'resetting...' : 'reset password'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.backToLoginText}>back to log in</Text>
            </TouchableOpacity>
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
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 35,
  },

  backButton: { paddingLeft: 0 },
  backText: { fontSize: 30, color: Colors.light.text },

  title: {
    color: Colors.light.text,
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 30,
  },

  subtitle: {
    color: '#999',
    fontSize: 14,
    marginBottom: 30,
    lineHeight: 20,
  },

  form: { flex: 1, paddingTop: 20 },

  fieldBlock: {
    position: 'relative',
    height: 60,
    justifyContent: 'flex-end',
    marginBottom: 20,
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

  underlineInputActive: {
    borderBottomColor: Colors.light.coffee,
  },

  eyeButton: {
    paddingLeft: 10,
    paddingBottom: 8,
  },

  eyeIcon: {
    fontSize: 18,
  },

  resetButton: {
    backgroundColor: Colors.light.button,
    borderRadius: 25,
    padding: 16,
    marginTop: 20,
    alignItems: 'center',
  },

  buttonDisabled: { opacity: 0.6 },

  resetButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: '600',
  },

  backToLogin: {
    alignItems: 'center',
    marginTop: 25,
  },

  backToLoginText: {
    color: Colors.light.coffee,
    fontSize: 14,
    fontWeight: '500',
  },
})

