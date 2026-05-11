import { supabase } from "@/lib/supabase";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

import {
  applyDeviceSideCalibrationFromVoltages,
  getStoredCalibration,
  measureCalibrationBuffer,
  type BufferMeasurement,
} from "@/src/services/calibrationService";

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

  const [lowBuffer, setLowBuffer] = useState<BufferMeasurement | null>(null);
  const [highBuffer, setHighBuffer] = useState<BufferMeasurement | null>(null);
  const [calStatus, setCalStatus] = useState<string | null>(null);
  const [storedSlope, setStoredSlope] = useState<number | null>(null);
  const [storedIntercept, setStoredIntercept] = useState<number | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);

  const LOW_BUFFER_PH = 4.0;
  const HIGH_BUFFER_PH = 7.0;

  const estimatePhFromVoltage = (voltage: number): number | null => {
    if (!Number.isFinite(voltage)) return null;
    if (storedSlope === null || storedIntercept === null) return null;
    if (!Number.isFinite(storedSlope) || !Number.isFinite(storedIntercept) || storedSlope === 0) {
      return null;
    }

    const ph = (voltage - storedIntercept) / storedSlope;
    return Number.isFinite(ph) ? ph : null;
  };

  const formatPh2 = (ph: number | undefined, voltage?: number): string => {
    const direct = typeof ph === "number" && Number.isFinite(ph) ? ph : null;
    const fallback = typeof voltage === "number" ? estimatePhFromVoltage(voltage) : null;
    const resolved = direct ?? fallback;
    return resolved === null ? "(unknown)" : resolved.toFixed(2);
  };

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

    (async () => {
      const stored = await getStoredCalibration();
      if (stored) {
        setStoredSlope(stored.slope);
        setStoredIntercept(stored.intercept);
      }
    })();
  }, []);

  const handleMeasureBuffer = async (buffer: "low" | "high") => {
    try {
      setIsCalibrating(true);
      setCalStatus(`measuring ${buffer} buffer...`);
      const result = await measureCalibrationBuffer(buffer);
      if (buffer === "low") setLowBuffer(result);
      else setHighBuffer(result);
      setCalStatus(
        `${buffer} buffer captured (V=${result.voltage.toFixed(4)}, pH=${formatPh2(result.ph, result.voltage)})`
      );
    } catch (e) {
      setCalStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setIsCalibrating(false);
    }
  };

  const handleApplyCalibration = async () => {
    if (!lowBuffer || !highBuffer) {
      setCalStatus("measure both low and high buffers first");
      return;
    }

    try {
      setIsCalibrating(true);
      setCalStatus("sending voltages to device for calibration...");

      const updated = await applyDeviceSideCalibrationFromVoltages({
        lowVoltage: lowBuffer.voltage,
        highVoltage: highBuffer.voltage,
      });

      if (updated.type === "updated") {
        setStoredSlope(updated.slope);
        setStoredIntercept(updated.intercept);
      }
      setCalStatus("calibration applied");
    } catch (e) {
      setCalStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setIsCalibrating(false);
    }
  };

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
      <View style={styles.calBlock}>
        <ThemedText style={[styles.calTitle, { color: text }]}>calibration</ThemedText>
        <ThemedText style={[styles.calMeta, { color: text, opacity: 0.7 }]}>buffer pH assumed: {LOW_BUFFER_PH.toFixed(2)} and {HIGH_BUFFER_PH.toFixed(2)}</ThemedText>

        {!!lowBuffer && (
          <ThemedText style={[styles.calMeta, { color: text, opacity: 0.75 }]}>
            low: V={lowBuffer.voltage.toFixed(4)} • pH={formatPh2(lowBuffer.ph, lowBuffer.voltage)}
          </ThemedText>
        )}
        {!!highBuffer && (
          <ThemedText style={[styles.calMeta, { color: text, opacity: 0.75 }]}>
            high: V={highBuffer.voltage.toFixed(4)} • pH={formatPh2(highBuffer.ph, highBuffer.voltage)}
          </ThemedText>
        )}

        <View style={styles.calRow}>
          <TouchableOpacity
            style={[styles.calBtn, { borderColor: text, opacity: isCalibrating ? 0.6 : 1 }]}
            disabled={isCalibrating}
            onPress={() => handleMeasureBuffer("low")}
          >
            <ThemedText style={[styles.calBtnText, { color: text }]}>measure low</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.calBtn, { borderColor: text, opacity: isCalibrating ? 0.6 : 1 }]}
            disabled={isCalibrating}
            onPress={() => handleMeasureBuffer("high")}
          >
            <ThemedText style={[styles.calBtnText, { color: text }]}>measure high</ThemedText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.calApplyBtn, { backgroundColor: coffee, opacity: isCalibrating ? 0.6 : 1 }]}
          disabled={isCalibrating}
          onPress={handleApplyCalibration}
        >
          <ThemedText style={styles.primaryText}>apply calibration</ThemedText>
        </TouchableOpacity>

        {!!calStatus && (
          <ThemedText style={[styles.calMeta, { color: text, opacity: 0.8 }]}>{calStatus}</ThemedText>
        )}
      </View>

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

  calBlock: { marginTop: 26, gap: 10 },
  calTitle: { fontSize: 16, fontWeight: "800" },
  calMeta: { fontSize: 13, fontWeight: "500" },
  calRow: { flexDirection: "row", gap: 10 },
  calBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  calBtnText: { fontSize: 14, fontWeight: "700" },
  calApplyBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

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