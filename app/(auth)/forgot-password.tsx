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

import Colors from '@/constants/colors'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address')
      return
    }

    setLoading(true)
    try {
      console.log('Sending password reset to:', email)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'acidex://reset-password',
      })

      console.log('Password reset response error:', error)

      if (error) throw error

      Alert.alert(
        'Check Your Email',
        'We sent you a password reset link. Click the link in your email to reset your password.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      )
    } catch (error: any) {
      console.log('Password reset error:', error)
      
      // Check for rate limiting
      if (error?.message?.includes('Too Many Requests') || error?.status === 429) {
        Alert.alert('Please Wait', 'Too many requests. Please wait a moment before trying again.')
      } else {
        Alert.alert('Error', error?.message ?? 'Failed to send reset email')
      }
    } finally {
      setLoading(false)
    }
  }

  const showEmailLabel = emailFocused || email.length > 0

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

          <Text style={styles.title}>reset password</Text>
          <Text style={styles.subtitle}>
            Enter your email and we&apos;ll send you a link to reset your password.
          </Text>

          <View style={styles.form}>
            <View style={styles.fieldBlock}>
              <Text style={[styles.floatingLabel, emailFocused && styles.floatingLabelActive]}>
                email
              </Text>
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

            <TouchableOpacity
              style={[styles.resetButton, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={styles.resetButtonText}>
                {loading ? 'sending...' : 'send reset link'}
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
    height: 50,
    justifyContent: 'flex-end',
    marginBottom: 30,
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

  resetButton: {
    backgroundColor: Colors.light.button,
    borderRadius: 25,
    padding: 16,
    marginTop: 10,
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

