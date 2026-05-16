// app/index.tsx
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace("/(tabs)/home");
        }
      } catch (error) {
        console.log("Auth check error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#3C2C24" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* TOP SECTION (LOGO + BRAND) */}
      <View style={styles.topSection}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.brandText}>ACIDEX</Text>
        <Text style={styles.brandSubtext}>
          Coffee Acidity Intelligence System
        </Text>
      </View>

      {/* CENTER ILLUSTRATION */}
      <View style={styles.illustrationContainer}>
        <Image
          source={require("../assets/images/get-started-illustration.png")}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {/* BOTTOM SECTION */}
      <View style={styles.bottomSection}>
        <Text style={styles.title}>
          Detect your coffee’s{"\n"}
          <Text style={styles.titleBold}>acidity in real-time</Text>
        </Text>

        <Text style={styles.subtitle}>
          Powered by sensor data, ESP32 system, and machine learning{"\n"}
          we analyze pH levels and provide health-based insights.
        </Text>

        {/* FEATURE TAGS */}
        <View style={styles.tags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>⚡ Real-time pH</Text>
          </View>

          <View style={styles.tag}>
            <Text style={styles.tagText}>🤖 ML Prediction</Text>
          </View>

          <View style={styles.tag}>
            <Text style={styles.tagText}>💡 Health Insights</Text>
          </View>
        </View>

        {/* CTA BUTTON */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/(auth)/signup")}
        >
          <Text style={styles.buttonText}>Get Started</Text>

          <View style={styles.arrowCircle}>
            <Text style={styles.arrow}>➜</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5", // LIGHT_BG
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },

  /* TOP */
  topSection: {
    marginTop: 60,
    alignItems: "center",
  },

  logo: {
    width: 45,
    height: 45,
    marginBottom: 8,
  },

  brandText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#3C2C24", // DARK_COFFEE
    letterSpacing: 2,
  },

  brandSubtext: {
    fontSize: 11,
    color: "#1D1D1D",
    opacity: 0.5,
    marginTop: 4,
    textAlign: "center",
  },

  /* CENTER */
  illustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  illustration: {
    width: "92%",
    height: 300,
  },

  /* BOTTOM */
  bottomSection: {
    marginBottom: 35,
    alignItems: "center",
  },

  title: {
    fontSize: 22,
    textAlign: "center",
    color: "#1D1D1D",
    fontWeight: "400",
    lineHeight: 30,
  },

  titleBold: {
    fontWeight: "800",
    color: "#3C2C24",
  },

  subtitle: {
    fontSize: 12,
    textAlign: "center",
    color: "#1D1D1D",
    opacity: 0.55,
    marginTop: 10,
    lineHeight: 18,
  },

  /* TAGS */
  tags: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  tag: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },

  tagText: {
    fontSize: 10,
    color: "#3C2C24",
    fontWeight: "600",
  },

  /* BUTTON */
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3C2C24",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginTop: 18,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginRight: 10,
  },

  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#D4AF7A",
    justifyContent: "center",
    alignItems: "center",
  },

  arrow: {
    fontSize: 14,
    color: "#1D1D1D",
    fontWeight: "900",
  },
});
