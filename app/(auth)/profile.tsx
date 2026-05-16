import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Appearance, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { getStoredThemeMode, saveThemeMode } from "@/src/data/themeStore";

const DEFAULT_AVATARS = [
  require("../../assets/images/avatars/avatar1.png"),
  require("../../assets/images/avatars/avatar2.png"),
  require("../../assets/images/avatars/avatar3.png"),
  require("../../assets/images/avatars/avatar4.png"),
];

function MenuHeader({
  icon,
  title,
  subtitle,
  open,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  open: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuHeader} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.headerIconWrap}>
        <Ionicons name={icon} size={18} color="#6B7280" />
      </View>
      <View style={styles.headerTextCol}>
        <ThemedText style={styles.headerTitle}>{title}</ThemedText>
        <ThemedText style={styles.headerSubtitle}>{subtitle}</ThemedText>
      </View>
      <Ionicons
        name="chevron-down"
        size={18}
        color="#6B7280"
        style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
      />
    </TouchableOpacity>
  );
}

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  trailing,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={styles.menuRow} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.rowIconWrap}>
        <Ionicons name={icon} size={18} color="#6B7280" />
      </View>
      <View style={styles.rowTextCol}>
        <ThemedText style={styles.rowTitle}>{title}</ThemedText>
        <ThemedText style={styles.rowSubtitle}>{subtitle}</ThemedText>
      </View>
      {trailing ?? (onPress ? <Ionicons name="chevron-forward" size={18} color="#6B7280" /> : null)}
    </Wrapper>
  );
}

export default function ProfileScreen() {
  const router = useRouter();

  const text = useThemeColor({}, "text");

  const [email, setEmail] = useState("username");
  const [fullName, setFullName] = useState("full name");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(null);
  const [avatarIndex, setAvatarIndex] = useState<number>(0);

  useEffect(() => {
    const loadProfile = async () => {
      const storedTheme = await getStoredThemeMode();
      if (storedTheme) {
        setIsDarkMode(storedTheme === "dark");
      } else {
        setIsDarkMode((Appearance.getColorScheme() ?? "light") === "dark");
      }

      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.log("getUser error:", error.message);
        return;
      }

      const user = data.user;
      if (!user) return;

      setEmail(user.email ?? "username");
      setFullName(user.user_metadata?.full_name ?? "full name");

      const avatarSource = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
      setGoogleAvatarUrl(typeof avatarSource === "string" ? avatarSource : null);

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

  const handleThemeToggle = async (enabled: boolean) => {
    setIsDarkMode(enabled);
    await saveThemeMode(enabled ? "dark" : "light");
    Appearance.setColorScheme?.(enabled ? "dark" : "light");
  };

  const handleSwitchAccount = async () => {
    try {
      await supabase.auth.signOut();
      router.replace("/(auth)/login");
    } catch (error) {
      console.log("switch account error:", error);
      router.replace("/(auth)/login");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();

      router.replace("/(auth)/login");
    } catch (error) {
      console.log("logout error:", error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
            <ThemedText style={[styles.backText, { color: text }]}>←</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.profileRow}>
          <View style={[styles.avatarRing, { borderColor: text }]}>
            {googleAvatarUrl ? (
              <Image source={{ uri: googleAvatarUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
              <Image source={DEFAULT_AVATARS[avatarIndex]} style={styles.avatar} contentFit="cover" />
            )}
          </View>

          <View style={styles.nameCol}>
            <ThemedText style={[styles.fullName, { color: text }]}>{fullName}</ThemedText>
            <ThemedText style={[styles.username, { color: text, opacity: 0.6 }]}>{email}</ThemedText>
          </View>
        </View>

        <View style={styles.listSection}>
          <MenuHeader
            icon="settings-outline"
            title="settings & privacy"
            subtitle="your app preferences"
            open={settingsOpen}
            onPress={() => setSettingsOpen((value) => !value)}
          />
          {settingsOpen ? (
            <View style={styles.menuContent}>
              <MenuRow
                icon="moon-outline"
                title="dark mode"
                subtitle="switch the app between light and dark"
                trailing={
                  <Switch
                    value={isDarkMode}
                    onValueChange={handleThemeToggle}
                    trackColor={{ false: "#D1D5DB", true: "#6B7280" }}
                    thumbColor={isDarkMode ? "#F5F5F5" : "#FFFFFF"}
                  />
                }
              />
              <MenuRow
                icon="shield-checkmark-outline"
                title="privacy policy"
                subtitle="what we collect and how it's used"
                onPress={() => router.push("/policy")}
              />
              <MenuRow
                icon="document-text-outline"
                title="terms of use"
                subtitle="rules for using Acidex"
                onPress={() => router.push("/terms")}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.bottomGroup}>
          <TouchableOpacity style={styles.bottomRow} onPress={handleSwitchAccount} activeOpacity={0.8}>
            <View style={styles.bottomIconWrap}>
              <Ionicons name="person-add-outline" size={18} color="#6B7280" />
            </View>
            <View style={styles.rowTextCol}>
              <ThemedText style={styles.rowTitle}>add account</ThemedText>
              <ThemedText style={styles.rowSubtitle}>sign in with another account</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomRow} onPress={handleLogout} activeOpacity={0.8}>
            <View style={styles.bottomIconWrap}>
              <Ionicons name="log-out-outline" size={18} color="#6B7280" />
            </View>
            <View style={styles.rowTextCol}>
              <ThemedText style={styles.rowTitle}>log out</ThemedText>
              <ThemedText style={styles.rowSubtitle}>end this session on this device</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingTop: 35, paddingBottom: 24 },

  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 18,
    paddingHorizontal: 15,
  },
  backButton: { paddingLeft: 0 },
  backText: { fontSize: 30, fontWeight: "700" },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 70,
    paddingHorizontal: 15,
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

  listSection: { marginTop: 8 },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.12)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.12)",
  },
  headerIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  headerTextCol: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  headerSubtitle: { marginTop: 2, fontSize: 12, color: "#6B7280" },
  menuContent: {
    marginLeft: 0,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.12)",
  },
  rowIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rowTextCol: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937", textTransform: "none" },
  rowSubtitle: { marginTop: 2, fontSize: 12, color: "#6B7280" },

  bottomGroup: {
    marginTop: 0,
    paddingBottom: 8,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.12)",
  },
  bottomIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
});
