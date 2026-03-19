import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

const DEFAULT_AVATARS = [
  require("../../assets/images/avatars/avatar1.png"),
  require("../../assets/images/avatars/avatar2.png"),
  require("../../assets/images/avatars/avatar3.png"),
  require("../../assets/images/avatars/avatar4.png"),
];

export default function ProfileScreen() {
  const router = useRouter();

  const coffee = useThemeColor({}, "coffee");
  const text = useThemeColor({}, "text");

  const [email, setEmail] = useState("username");
  const [fullName, setFullName] = useState("full name");

  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(null);
  const [avatarIndex, setAvatarIndex] = useState<number>(0);

  useEffect(() => {
    const loadProfile = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.log("getUser error:", error.message);
        return;
      }

      const user = data.user;
      if (!user) return;

      setEmail(user.email ?? "username");
      setFullName(user.user_metadata?.full_name ?? "full name");

      // ✅ Google avatar override (if present)
      const ga =
        user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

      setGoogleAvatarUrl(typeof ga === "string" ? ga : null);

      // ✅ Fetch avatar_index already set during login
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("avatar_index")
        .eq("id", user.id)
        .single();

      if (profileErr) {
        console.log("profile fetch error:", profileErr.message);
        return;
      }

      const idx = Number(profile?.avatar_index);
      if (!Number.isNaN(idx) && idx >= 0 && idx < DEFAULT_AVATARS.length) {
        setAvatarIndex(idx);
      }
    };

    loadProfile();
  }, []);

  const handleSwitchAccount = async () => {
    try {
      // Clear cached Google account so chooser appears next time
      await GoogleSignin.signOut();
      // Clear Supabase session too
      await supabase.auth.signOut();
      router.replace("/(auth)/login");
    } catch (e) {
      console.log("switch account error:", e);
      router.replace("/(auth)/login");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();

      // Also clear Google cached account (safe to ignore errors)
      try {
        await GoogleSignin.signOut();
      } catch {}

      router.replace("/(auth)/login");
    } catch (e) {
      console.log("logout error:", e);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ThemedText style={[styles.back, { color: text }]}>←</ThemedText>
        </TouchableOpacity>
        <View style={{ width: 24 }} />
      </View>

      {/* Profile row */}
      <View style={styles.profileRow}>
        <View style={[styles.avatarRing, { borderColor: text }]}>
          {googleAvatarUrl ? (
            <Image
              source={{ uri: googleAvatarUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <Image
              source={DEFAULT_AVATARS[avatarIndex]}
              style={styles.avatar}
              contentFit="cover"
            />
          )}
        </View>

        <View style={styles.nameCol}>
          <ThemedText style={[styles.fullName, { color: text }]}>
            {fullName}
          </ThemedText>
          <ThemedText style={[styles.username, { color: text, opacity: 0.6 }]}>
            {email}
          </ThemedText>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.bottomArea}>
        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: text }]}
          onPress={handleSwitchAccount}
        >
          <ThemedText style={[styles.secondaryText, { color: text }]}>
            switch account
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: coffee }]}
          onPress={handleLogout}
        >
          <ThemedText style={styles.primaryText}>logout</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 14 },

  header: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: { fontSize: 22, fontWeight: "700" },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    gap: 14,
  },
  avatarRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: { width: 72, height: 72, borderRadius: 36 },

  nameCol: { flex: 1 },
  fullName: { fontSize: 28, fontWeight: "800", lineHeight: 32 },
  username: { marginTop: 2, fontSize: 16, fontWeight: "500" },

  bottomArea: { marginTop: "auto", paddingBottom: 26, gap: 12 },
  secondaryBtn: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { fontSize: 16, fontWeight: "600" },
  primaryBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});