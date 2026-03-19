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

export default function PolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Privacy Policy</Text>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect information you provide directly to us, including your name, 
            email address, and any other information you choose to provide.
          </Text>

          <Text style={styles.sectionTitle}>2. How We Use Information</Text>
          <Text style={styles.paragraph}>
            We use the information we collect to provide, maintain, and improve our 
            services, and to communicate with you about your account.
          </Text>

          <Text style={styles.sectionTitle}>3. Data Security</Text>
          <Text style={styles.paragraph}>
            We take reasonable measures to protect your personal information from 
            unauthorized access, use, or disclosure.
          </Text>

          <Text style={styles.sectionTitle}>4. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy, please contact us.
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

