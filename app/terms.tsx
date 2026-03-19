import Colors from '@/constants/colors'
import { router } from 'expo-router'

import React from 'react'
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Terms of Use</Text>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using this application, you accept and agree to be bound 
            by the terms and provision of this agreement.
          </Text>

          <Text style={styles.sectionTitle}>2. Use License</Text>
          <Text style={styles.paragraph}>
            Permission is granted to temporarily use this application for personal, 
            non-commercial use only.
          </Text>

          <Text style={styles.sectionTitle}>3. User Account</Text>
          <Text style={styles.paragraph}>
            You are responsible for maintaining the confidentiality of your account 
            and password. You agree to accept responsibility for all activities 
            that occur under your account.
          </Text>

          <Text style={styles.sectionTitle}>4. Privacy</Text>
          <Text style={styles.paragraph}>
            Your privacy is important to us. Please review our Privacy Policy to 
            understand how we collect and use your information.
          </Text>

          <Text style={styles.sectionTitle}>5. Termination</Text>
          <Text style={styles.paragraph}>
            We reserve the right to terminate your access to the application without 
            notice if you violate these terms.
          </Text>

          <Text style={styles.sectionTitle}>6. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these Terms of Use, please contact us.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 35,
    marginBottom: 20,
  },
  backButton: {
    paddingLeft: 0,
  },
  backText: {
    fontSize: 30,
    color: Colors.light.text,
  },
  title: {
    color: Colors.light.text,
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 30,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 20,
  },
  paragraph: {
    color: '#666',
    fontSize: 14,
    lineHeight: 22,
  },
})

