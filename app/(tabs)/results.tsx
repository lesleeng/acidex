import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  Animated,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Colors from "@/constants/colors";
import { useThemeColor } from "@/hooks/use-theme-color";
import { mockAnalysisRecords } from "@/src/data/analysisMock";
import { AnalysisRecord } from "@/src/types/analysis";
import { BookmarkStore } from "@/src/data/bookmarkStore";

// ─── Classification helpers ───────────────────────────────────────────────────

const CLASSIFICATION_COLORS = {
  "Highly Acidic": { bg: "#FCDEDE", text: "#8C1A1A", badge: "#E74C3C", dot: "#E74C3C" },
  "Moderate":      { bg: "#FEF0D6", text: "#7A4A00", badge: "#F39C12", dot: "#F39C12" },
  "Low Acidic":    { bg: "#DCF0E4", text: "#1A5C34", badge: "#27AE60", dot: "#27AE60" },
};

const RISK_COLORS = {
  "High Risk":     { bg: "#FCDEDE", text: "#8C1A1A" },
  "Moderate Risk": { bg: "#FEF0D6", text: "#7A4A00" },
  "Low Risk":      { bg: "#DCF0E4", text: "#1A5C34" },
};

// ─── Content helpers ──────────────────────────────────────────────────────────

function getSummaryText(item: AnalysisRecord): string {
  if (item.classification === "Highly Acidic")
    return `Your ${item.coffeeType.toLowerCase()} tested as highly acidic, which may trigger gastric discomfort.`;
  if (item.classification === "Moderate")
    return `Your ${item.coffeeType.toLowerCase()} tested as moderately acidic — may cause some discomfort depending on timing.`;
  return `Your ${item.coffeeType.toLowerCase()} tested as low acidic, generally gentler on the stomach.`;
}

function getLikelyEffectTitle(item: AnalysisRecord): string {
  if (item.riskLevel === "High Risk")     return "High likelihood of discomfort";
  if (item.riskLevel === "Moderate Risk") return "Possible discomfort";
  return "Lower likelihood of discomfort";
}

function getLikelyEffectItems(item: AnalysisRecord): string[] {
  const out: string[] = [`${item.coffeeType} (high acidity coffee)`];
  if (item.stomachState === "empty stomach") out.push("empty stomach (session time)");
  else if (item.stomachState === "after meal") out.push("after meal (better timing)");
  if (typeof item.cupsToday === "number")
    out.push(`${item.cupsToday} cup${item.cupsToday > 1 ? "s" : ""} today (habit)`);
  return out;
}

function getAdvisoryText(item: AnalysisRecord): string {
  if (item.riskLevel === "High Risk")
    return "Consider reducing intake or drinking after meals to minimize gastric discomfort.";
  if (item.riskLevel === "Moderate Risk")
    return "Try improving timing and hydration to lessen possible irritation.";
  return "Current result suggests lower discomfort risk, but moderation is still recommended.";
}

function getTips(item: AnalysisRecord): { icon: string; text: string }[] {
  const base: { icon: string; text: string }[] = [
    { icon: "food",           text: "Have coffee after meals whenever possible" },
    { icon: "cup-water",      text: "Stay hydrated: drink water alongside coffee" },
    { icon: "coffee-outline", text: "Limit intake: keep it to 1–2 cups/day" },
  ];
  if (item.classification === "Highly Acidic")
    base.push({ icon: "coffee-maker-outline", text: "Switch to lower-acidity types like brewed or decaf" });
  else
    base.push({ icon: "coffee-maker-outline", text: "Avoid drinking coffee too quickly to reduce irritation" });
  return base;
}

function getSafeTimingText(item: AnalysisRecord): string {
  if (item.stomachState === "empty stomach")
    return "Best to drink coffee 30–45 minutes after eating to lessen irritation.";
  return "Continue drinking coffee after meals for better stomach comfort.";
}

function getImpactItems(item: AnalysisRecord): string[] {
  const out: string[] = [`${item.coffeeType} (strongest acids from darkness of roast)`];
  if (item.stomachState === "empty stomach") out.push("empty stomach (magnifies irritation)");
  if ((item.cupsToday ?? 0) >= 2) out.push("Multiple cups (higher total acidity)");
  if (out.length < 3) out.push("Brewing method can also affect acidity level");
  return out;
}

function getScalePct(item: AnalysisRecord): number {
  const clamped = Math.max(4.0, Math.min(6.0, item.ph));
  return ((6.0 - clamped) / 2.0) * 100;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastType = "save" | "bookmark" | "unbookmark";

const TOAST_CONFIG: Record<ToastType, { icon: string; color: string; bg: string; border: string; label: string }> = {
  save:       { icon: "checkmark-circle-outline", color: "#27AE60", bg: "#DCF0E4", border: "#C8DFCE", label: "notes saved"      },
  bookmark:   { icon: "bookmark",                 color: "#4A3728", bg: "#FFFAF7", border: "#EDE3DC", label: "bookmarked"        },
  unbookmark: { icon: "bookmark-outline",         color: "#A08880", bg: "#F4EEEA", border: "#E0D5CC", label: "bookmark removed"  },
};

function Toast({ visible, type }: { visible: boolean; type: ToastType }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 22, bounciness: 5 }),
        Animated.timing(opacity,    { toValue: 1, duration: 160, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 8,  duration: 150, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 0,  duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const c = TOAST_CONFIG[type];

  return (
    <Animated.View
      style={[
        r.toast,
        { opacity, transform: [{ translateY }], backgroundColor: c.bg, borderColor: c.border },
      ]}
    >
      <Ionicons name={c.icon as any} size={15} color={c.color} />
      <ThemedText style={[r.toastText, { color: c.color }]}>{c.label}</ThemedText>
    </Animated.View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title, accent = "cream", children, trailing,
}: {
  title: string;
  accent?: "cream" | "warm" | "sage" | "slate" | "peach";
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  const accentMap = {
    cream: { bg: "#FFFAF7", border: "#EDE3DC" },
    warm:  { bg: "#FDF6F0", border: "#E8D5C4" },
    sage:  { bg: "#F2F8F4", border: "#C8DFCE" },
    slate: { bg: "#F2F5F8", border: "#C8D4DF" },
    peach: { bg: "#FDF5EE", border: "#EDD8C5" },
  };
  const col = accentMap[accent];
  return (
    <View style={[r.card, { backgroundColor: col.bg, borderColor: col.border }]}>
      <View style={r.cardHeader}>
        <ThemedText style={r.cardTitle}>{title}</ThemedText>
        {trailing ?? null}
      </View>
      {children}
    </View>
  );
}

function InnerBlock({ children }: { children: React.ReactNode }) {
  return <View style={r.innerBlock}>{children}</View>;
}

function BulletItem({ text }: { text: string }) {
  return (
    <View style={r.bulletRow}>
      <View style={r.bullet} />
      <ThemedText style={r.bulletText}>{text}</ThemedText>
    </View>
  );
}

function Tag({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <View style={[r.tag, { backgroundColor: bg }]}>
      <ThemedText style={[r.tagText, { color }]}>{label}</ThemedText>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ResultsScreen() {
  const coffee = useThemeColor({}, "coffee");

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText,      setNotesText]      = useState("");
  const [toastVisible,   setToastVisible]   = useState(false);
  const [toastType,      setToastType]      = useState<ToastType>("save");
  const [isBookmarked,   setIsBookmarked]   = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const latest = useMemo<AnalysisRecord | null>(() => {
    const sorted = [...mockAnalysisRecords].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted[0] ?? null;
  }, []);

  useEffect(() => {
    if (!latest) return;
    setNotesText(latest.note ?? "");
    setIsBookmarked(BookmarkStore.isBookmarked(latest.id));
  }, [latest?.id]);

  // ── toast ────────────────────────────────────────────────────────────────────
  const showToast = (type: ToastType) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastType(type);
    setToastVisible(true);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2200);
  };

  // ── notes ────────────────────────────────────────────────────────────────────
  const handleSaveNotes = () => {
    if (!latest) return;
    const idx = mockAnalysisRecords.findIndex((rec) => rec.id === latest.id);
    if (idx !== -1) mockAnalysisRecords[idx].note = notesText.trim() || undefined;
    setIsEditingNotes(false);
    showToast("save");
  };

  const handleCancelEdit = () => {
    setNotesText(latest?.note ?? "");
    setIsEditingNotes(false);
  };

  // ── bookmark ─────────────────────────────────────────────────────────────────
  const handleBookmark = () => {
    if (!latest) return;
    if (isBookmarked) {
      BookmarkStore.remove(latest.id);
      setIsBookmarked(false);
      showToast("unbookmark");
    } else {
      BookmarkStore.add(latest);
      setIsBookmarked(true);
      showToast("bookmark");
    }
  };

  if (!latest) {
    return (
      <ThemedView style={r.emptyScreen}>
        <ThemedText style={r.emptyText}>No results yet.</ThemedText>
      </ThemedView>
    );
  }

  const clsColor  = CLASSIFICATION_COLORS[latest.classification] ?? CLASSIFICATION_COLORS["Moderate"];
  const riskColor = RISK_COLORS[latest.riskLevel ?? "Low Risk"]  ?? RISK_COLORS["Low Risk"];
  const scalePct  = getScalePct(latest);
  const tips      = getTips(latest);
  const effects   = getLikelyEffectItems(latest);
  const impacts   = getImpactItems(latest);

  const BookmarkBtn = (
    <TouchableOpacity
      onPress={handleBookmark}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons
        name={isBookmarked ? "bookmark" : "bookmark-outline"}
        size={17}
        color={isBookmarked ? "#4A3728" : "#C4A882"}
      />
    </TouchableOpacity>
  );

  return (
    <ThemedView style={r.screen}>
      <ScrollView style={r.scroll} contentContainerStyle={r.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <ThemedView style={[r.header, { backgroundColor: Colors.light.background }]}>
          <View style={r.headerMiddle}>
            <ThemedText style={[r.title, { color: coffee }]}>results.</ThemedText>
            <ThemedText style={r.subtitle}>your latest coffee analysis</ThemedText>
          </View>
        </ThemedView>

        {/* ── Acidity Summary ── */}
        <SectionCard title="Acidity Summary" accent="cream" trailing={BookmarkBtn}>
          <InnerBlock>
            <View style={r.summaryTop}>
              <View style={r.coffeeIconWrap}>
                <MaterialCommunityIcons name="coffee" size={52} color="#8B5E3C" />
              </View>
              <View style={r.summaryRight}>
                <ThemedText style={r.coffeeName}>{latest.coffeeType}</ThemedText>
                <View style={r.phRow}>
                  <ThemedText style={r.phText}>pH {latest.ph.toFixed(1)}</ThemedText>
                  <View style={[r.badge, { backgroundColor: clsColor.badge }]}>
                    <ThemedText style={r.badgeText}>{latest.classification}</ThemedText>
                  </View>
                </View>
                <View style={[r.riskTag, { backgroundColor: riskColor.bg }]}>
                  <ThemedText style={[r.riskTagText, { color: riskColor.text }]}>{latest.riskLevel}</ThemedText>
                </View>
              </View>
            </View>

            <View style={r.scaleBlock}>
              <View style={r.scaleTopLabels}>
                <ThemedText style={r.scaleLabelSmall}>Low acid</ThemedText>
                <ThemedText style={r.scaleLabelSmall}>High acid</ThemedText>
              </View>
              <View style={r.scaleBar}>
                <View style={[r.scaleSegment, { backgroundColor: "#A8C69F" }]} />
                <View style={[r.scaleSegment, { backgroundColor: "#E7CFAB" }]} />
                <View style={[r.scaleSegment, { backgroundColor: "#E49B92" }]} />
                <View style={[r.scaleDot, { left: `${Math.min(scalePct, 88)}%` as any }]} />
              </View>
              <View style={r.scaleBottomLabels}>
                <ThemedText style={r.scaleBottomSmall}>pH 6.0+</ThemedText>
                <ThemedText style={r.scaleBottomSmall}>pH {latest.ph.toFixed(1)}</ThemedText>
                <ThemedText style={r.scaleBottomSmall}>pH 4.0</ThemedText>
              </View>
            </View>

            <ThemedText style={r.summaryText}>{getSummaryText(latest)}</ThemedText>
          </InnerBlock>

          <View style={r.tagRow}>
            <Tag
              label={new Date(latest.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              bg="#F4EEEA" color="#8B6A55"
            />
            {latest.stomachState && <Tag label={latest.stomachState} bg="#F4EEEA" color="#8B6A55" />}
          </View>
        </SectionCard>

        {/* ── Notes ── */}
        <SectionCard title="Notes" accent="warm">
          <InnerBlock>
            {isEditingNotes ? (
              <View>
                <TextInput
                  style={r.notesInput}
                  value={notesText}
                  onChangeText={setNotesText}
                  placeholder="Add your notes about this coffee analysis..."
                  placeholderTextColor="#A08880"
                  multiline
                  maxLength={500}
                  autoFocus
                />
                <View style={r.notesActions}>
                  <TouchableOpacity style={[r.notesBtn, r.cancelBtn]} onPress={handleCancelEdit} activeOpacity={0.7}>
                    <ThemedText style={r.cancelBtnText}>cancel</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={[r.notesBtn, r.saveBtn]} onPress={handleSaveNotes} activeOpacity={0.7}>
                    <ThemedText style={r.saveBtnText}>save</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                {latest.note
                  ? <ThemedText style={r.notesText}>{latest.note}</ThemedText>
                  : <ThemedText style={r.noNotesText}>No notes yet. Add some thoughts about this analysis.</ThemedText>
                }
                <TouchableOpacity style={r.editNotesButton} onPress={() => setIsEditingNotes(true)} activeOpacity={0.7}>
                  <View style={r.editNotesIconCircle}>
                    <Ionicons name="pencil" size={13} color="#8B6A55" />
                  </View>
                  <ThemedText style={r.editNotesText}>{latest.note ? "edit notes" : "add notes"}</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </InnerBlock>
        </SectionCard>

        {/* ── Likely Effects ── */}
        <SectionCard title="Likely Effects & Advisory" accent="peach">
          <InnerBlock>
            <View style={r.warningRow}>
              <Ionicons name="warning-outline" size={17} color="#C38C49" />
              <ThemedText style={r.warningTitle}>{getLikelyEffectTitle(latest)}</ThemedText>
            </View>
            {effects.map((item, i) => <BulletItem key={i} text={item} />)}
            <View style={r.divider} />
            <ThemedText style={r.advisoryText}>{getAdvisoryText(latest)}</ThemedText>
          </InnerBlock>
        </SectionCard>

        {/* ── Tips ── */}
        <SectionCard title="Tips to Minimize Discomfort" accent="sage">
          <InnerBlock>
            {tips.map((tip, i) => (
              <View key={i} style={[r.tipRow, i < tips.length - 1 && r.tipRowBorder]}>
                <View style={r.tipIconCircle}>
                  <MaterialCommunityIcons name={tip.icon as any} size={16} color="#6B8F76" />
                </View>
                <ThemedText style={r.tipText}>{tip.text}</ThemedText>
              </View>
            ))}
          </InnerBlock>
        </SectionCard>

        {/* ── Safe Timing ── */}
        <SectionCard title="Safe Coffee Timing" accent="slate"
          trailing={<Ionicons name="time-outline" size={17} color="#5B7FA6" />}>
          <View style={r.timingRow}>
            <View style={r.timingIconCircle}>
              <Ionicons name="time-outline" size={16} color="#5B7FA6" />
            </View>
            <ThemedText style={r.timingText}>{getSafeTimingText(latest)}</ThemedText>
          </View>
        </SectionCard>

        {/* ── What's Acidity ── */}
        <SectionCard title="What's Coffee Acidity?" accent="warm">
          <ThemedText style={r.infoParagraph}>
            Coffee acidity refers to the acidic content of the drink, measured as pH. Lower pH means higher acidity.
          </ThemedText>
          <InnerBlock>
            <ThemedText style={r.innerBlockTitle}>What impacts acidity?</ThemedText>
            {impacts.map((item, i) => <BulletItem key={i} text={item} />)}
          </InnerBlock>
        </SectionCard>

      </ScrollView>

      {/* ── Toast ── */}
      <View style={r.toastWrapper} pointerEvents="none">
        <Toast visible={toastVisible} type={toastType} />
      </View>

    </ThemedView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const r = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: "#F6F1EC" },
  scroll:  { flex: 1 },
  content: { paddingBottom: 40 },

  emptyScreen: { flex: 1, backgroundColor: "#F6F1EC", justifyContent: "center", alignItems: "center" },
  emptyText:   { fontSize: 13, color: "#8A6F63" },

  header:       { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14 },
  title:        { fontSize: 18, fontWeight: "700", lineHeight: 20, textAlign: "center", paddingTop: 1 },
  subtitle:     { fontSize: 12, opacity: 0.6, textAlign: "center" },
  headerMiddle: { flex: 1.6, alignItems: "center", justifyContent: "center" },

  card:       { borderRadius: 20, borderWidth: 1, padding: 16, marginHorizontal: 16, marginTop: 14 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  cardTitle:  { fontSize: 14, fontWeight: "700", color: "#2E211B" },

  innerBlock:      { backgroundColor: "rgba(139,94,60,0.07)", borderRadius: 14, padding: 14 },
  innerBlockTitle: { fontSize: 13, fontWeight: "700", color: "#2E211B", marginBottom: 10 },

  summaryTop:     { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  coffeeIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(139,94,60,0.1)", alignItems: "center", justifyContent: "center", marginRight: 14 },
  summaryRight:   { flex: 1 },
  coffeeName:     { fontSize: 15, fontWeight: "700", color: "#2E211B", marginBottom: 6 },
  phRow:          { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  phText:         { fontSize: 15, fontWeight: "600", color: "#3C2C24" },
  badge:          { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:      { color: "#FFF", fontSize: 11, fontWeight: "700" },
  riskTag:        { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  riskTagText:    { fontSize: 11, fontWeight: "600" },

  scaleBlock:        { marginBottom: 14 },
  scaleTopLabels:    { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  scaleLabelSmall:   { fontSize: 11, color: "#A08880" },
  scaleBar:          { flexDirection: "row", height: 12, borderRadius: 999, overflow: "hidden", position: "relative", marginBottom: 6 },
  scaleSegment:      { flex: 1 },
  scaleDot:          { position: "absolute", top: -3, width: 18, height: 18, borderRadius: 9, backgroundColor: "#E74C3C", borderWidth: 2, borderColor: "#FFF" },
  scaleBottomLabels: { flexDirection: "row", justifyContent: "space-between" },
  scaleBottomSmall:  { fontSize: 10, color: "#A08880" },
  summaryText:       { fontSize: 13, lineHeight: 20, color: "#4B3A33", marginTop: 4 },

  tagRow:  { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  tag:     { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, fontWeight: "600" },

  bulletRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  bullet:    { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#C4905A", marginTop: 8, marginRight: 10, flexShrink: 0 },
  bulletText:{ flex: 1, fontSize: 13, lineHeight: 20, color: "#4E3D35" },

  warningRow:   { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  warningTitle: { fontSize: 13, fontWeight: "700", color: "#2E211B" },
  divider:      { height: 1, backgroundColor: "rgba(139,94,60,0.15)", marginVertical: 10 },
  advisoryText: { fontSize: 13, lineHeight: 20, color: "#4B3A33" },

  tipRow:        { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  tipRowBorder:  { borderBottomWidth: 1, borderBottomColor: "rgba(104,143,118,0.2)" },
  tipIconCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(104,143,118,0.15)", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  tipText:       { flex: 1, fontSize: 13, lineHeight: 20, color: "#4E3D35" },

  timingRow:        { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  timingIconCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(91,127,166,0.15)", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  timingText:       { flex: 1, fontSize: 13, lineHeight: 20, color: "#4E3D35" },

  infoParagraph: { fontSize: 13, lineHeight: 20, color: "#4B3A33", marginBottom: 12 },

  notesInput:         { borderWidth: 1, borderColor: "#E0D5C4", borderRadius: 10, padding: 12, fontSize: 13, color: "#2E211B", minHeight: 80, textAlignVertical: "top", backgroundColor: "#FFF" },
  notesActions:       { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 12 },
  notesBtn:           { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  cancelBtn:          { backgroundColor: "#F4EEEA" },
  cancelBtnText:      { fontSize: 13, color: "#8B6A55", fontWeight: "500", textTransform: "lowercase" },
  saveBtn:            { backgroundColor: "#4A3728" },
  saveBtnText:        { fontSize: 13, color: "#FFF", fontWeight: "600", textTransform: "lowercase" },
  notesText:          { fontSize: 13, lineHeight: 20, color: "#4B3A33" },
  noNotesText:        { fontSize: 13, color: "#A08880", fontStyle: "italic" },
  editNotesButton:    { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, alignSelf: "flex-start" },
  editNotesIconCircle:{ width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(139,94,60,0.1)", alignItems: "center", justifyContent: "center" },
  editNotesText:      { fontSize: 13, color: "#8B6A55", fontWeight: "500", textTransform: "lowercase" },

  toastWrapper: { position: "absolute", bottom: 28, left: 0, right: 0, alignItems: "center" },
  toast:        { flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  toastText:    { fontSize: 13, fontWeight: "600", textTransform: "lowercase" },
});