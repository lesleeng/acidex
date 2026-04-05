import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Colors from "@/constants/colors";
import { useThemeColor } from "@/hooks/use-theme-color";
import { getStoredAnalysisHistory } from "@/src/store/analysisStore";
import { AnalysisRecord } from "@/src/types/analysis";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ─── Constants ────────────────────────────────────────────────────────────────

const CLASSIFICATION_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  "Highly Acidic": { bg: "#FCDEDE", text: "#8C1A1A", badge: "#E74C3C" },
  "Moderate":      { bg: "#FEF0D6", text: "#7A4A00", badge: "#F39C12" },
  "Low Acidic":    { bg: "#DCF0E4", text: "#1A5C34", badge: "#27AE60" },
};

const RISK_COLORS: Record<string, { bg: string; text: string }> = {
  "High Risk":     { bg: "#FCDEDE", text: "#8C1A1A" },
  "Moderate Risk": { bg: "#FEF0D6", text: "#7A4A00" },
  "Low Risk":      { bg: "#DCF0E4", text: "#1A5C34" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCardDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now  = new Date();
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (date.toDateString() === now.toDateString()) return `Today, ${time}`;
  return `${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}, ${time}`;
}

function formatDetailDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function getRoastLabel(item: AnalysisRecord): string {
  if (item.coffeeType === "Espresso") return "Dark roast";
  if (item.coffeeType === "Latte")    return "Light roast";
  return "Medium roast";
}

function getHealthAdvisory(item: AnalysisRecord): string {
  if (item.riskLevel === "High Risk")
    return "High likelihood of discomfort: Consider reducing intake or drinking after meals.";
  if (item.riskLevel === "Moderate Risk")
    return "Possible discomfort: Better timing and hydration may help reduce irritation.";
  return "Lower likelihood of discomfort: Continue monitoring and drink in moderation.";
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const coffee = useThemeColor({}, "coffee");
  const [records,        setRecords]        = useState<AnalysisRecord[]>([]);

  const [search,         setSearch]         = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [expandedId,     setExpandedId]     = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadRecords = async () => {
      const stored = await getStoredAnalysisHistory();
      if (!mounted) return;

      const sorted = [...stored].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecords(sorted);
      setExpandedId(sorted[0]?.id ?? null);
    };

    loadRecords();

    return () => {
      mounted = false;
    };
  }, []);

  const filters = useMemo(() => {
    const uniqueCoffeeTypes = Array.from(new Set(records.map((item) => item.coffeeType))).filter(Boolean);
    return ["All", ...uniqueCoffeeTypes];
  }, [records]);

  const sortedRecords = records;

  const filteredRecords = useMemo(() =>
    sortedRecords.filter((item) => {
      const matchFilter = selectedFilter === "All" || item.coffeeType === selectedFilter;
      const q = search.trim().toLowerCase();
      const matchSearch = !q ||
        item.coffeeType.toLowerCase().includes(q) ||
        item.classification.toLowerCase().includes(q) ||
        (item.note ?? "").toLowerCase().includes(q) ||
        formatCardDate(item.createdAt).toLowerCase().includes(q);
      return matchFilter && matchSearch;
    }), [sortedRecords, selectedFilter, search]);

  return (
    <ThemedView style={s.screen}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header (unchanged) ── */}
        <ThemedView style={[s.header, { backgroundColor: Colors.light.background }]}>
          <View style={s.headerMiddle}>
            <ThemedText style={[s.title, { color: coffee }]}>history.</ThemedText>
            <ThemedText style={s.subtitle}>your full analysis log</ThemedText>
          </View>
        </ThemedView>

        {/* ── Search + filters ── */}
        <View style={s.searchBlock}>
          {/* search bar */}
          <View style={s.searchRow}>
            <Ionicons name="search" size={16} color="#A08880" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search history"
              placeholderTextColor="#C4A882"
              style={s.searchInput}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={16} color="#C4A882" />
              </TouchableOpacity>
            )}
          </View>

          {/* filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterRow}
          >
            {filters.map((f) => {
              const active = selectedFilter === f;
              return (
                <TouchableOpacity
                  key={f}
                  activeOpacity={0.8}
                  onPress={() => setSelectedFilter(f)}
                  style={[s.filterChip, active && s.filterChipActive]}
                >
                  <ThemedText style={[s.filterChipText, active && s.filterChipTextActive]}>
                    {f}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Count row ── */}
        {filteredRecords.length > 0 && (
          <View style={s.countRow}>
            <ThemedText style={s.countText}>
              {filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""}
            </ThemedText>
          </View>
        )}

        {/* ── List ── */}
        {filteredRecords.length === 0 ? (
          <View style={s.emptyCard}>
            <ThemedText style={s.emptyText}>No analysis records found.</ThemedText>
          </View>
        ) : (
          filteredRecords.map((item) =>
            expandedId === item.id
              ? <ExpandedCard key={item.id} item={item} onCollapse={() => setExpandedId(null)} />
              : <CollapsedCard key={item.id} item={item} onExpand={() => setExpandedId(item.id)} />
          )
        )}
      </ScrollView>
    </ThemedView>
  );
}

// ─── Collapsed Card ───────────────────────────────────────────────────────────

function CollapsedCard({ item, onExpand }: { item: AnalysisRecord; onExpand: () => void }) {
  const cls  = CLASSIFICATION_COLORS[item.classification] ?? CLASSIFICATION_COLORS["Moderate"];
  const risk = RISK_COLORS[item.riskLevel ?? "Low Risk"]  ?? RISK_COLORS["Low Risk"];

  return (
    <TouchableOpacity activeOpacity={0.85} style={s.card} onPress={onExpand}>
      {/* date + chevron */}
      <View style={s.cardTopRow}>
        <ThemedText style={s.cardDate}>{formatCardDate(item.createdAt)}</ThemedText>
        <Ionicons name="chevron-down" size={16} color="#C4A882" />
      </View>

      {/* icon + info */}
      <View style={s.cardBody}>
        <View style={s.coffeeCircle}>
          <MaterialCommunityIcons name="coffee" size={22} color="#8B5E3C" />
        </View>

        <View style={s.cardMain}>
          <View style={s.nameBadgeRow}>
            <ThemedText style={s.coffeeName}>{item.coffeeType}</ThemedText>
            <View style={[s.badge, { backgroundColor: cls.badge }]}>
              <ThemedText style={s.badgeText}>{item.classification}</ThemedText>
            </View>
          </View>

          <View style={s.metaRow}>
            <ThemedText style={s.phText}>pH {item.ph.toFixed(1)}</ThemedText>
            {item.riskLevel && (
              <View style={[s.riskPill, { backgroundColor: risk.bg }]}>
                <ThemedText style={[s.riskPillText, { color: risk.text }]}>
                  {item.riskLevel}
                </ThemedText>
              </View>
            )}
          </View>

          {!!item.note && (
            <ThemedText style={s.notePreview} numberOfLines={1}>{item.note}</ThemedText>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Expanded Card ────────────────────────────────────────────────────────────

function ExpandedCard({ item, onCollapse }: { item: AnalysisRecord; onCollapse: () => void }) {
  const cls  = CLASSIFICATION_COLORS[item.classification] ?? CLASSIFICATION_COLORS["Moderate"];
  const risk = RISK_COLORS[item.riskLevel ?? "Low Risk"]  ?? RISK_COLORS["Low Risk"];

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onCollapse} style={s.expandedCard}>

      {/* date + chevron */}
      <View style={s.cardTopRow}>
        <ThemedText style={s.expandedDate}>{formatDetailDate(item.createdAt)}</ThemedText>
        <Ionicons name="chevron-up" size={16} color="#C4A882" />
      </View>

      {/* main info block */}
      <View style={s.expandedMain}>
        <View style={s.expandedIconCol}>
          <View style={s.expandedCoffeeCircle}>
            <MaterialCommunityIcons name="coffee" size={28} color="#8B5E3C" />
          </View>
        </View>

        <View style={s.expandedInfo}>
          <ThemedText style={s.expandedCoffeeName}>{item.coffeeType}</ThemedText>

          <View style={s.expandedMetaRow}>
            <Ionicons name="flame-outline" size={13} color="#A08880" />
            <ThemedText style={s.expandedMetaText}>{getRoastLabel(item)}</ThemedText>
            {item.stomachState && (
              <>
                <View style={s.metaDot} />
                <ThemedText style={s.expandedMetaText}>{item.stomachState}</ThemedText>
              </>
            )}
          </View>

          <View style={s.expandedPhRow}>
            <ThemedText style={s.expandedPh}>pH {item.ph.toFixed(1)}</ThemedText>
            <View style={[s.badge, { backgroundColor: cls.badge }]}>
              <ThemedText style={s.badgeText}>{item.classification}</ThemedText>
            </View>
            {item.riskLevel && (
              <View style={[s.riskPill, { backgroundColor: risk.bg }]}>
                <ThemedText style={[s.riskPillText, { color: risk.text }]}>
                  {item.riskLevel}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* divider */}
      <View style={s.divider} />

      {/* health advisory */}
      <View style={s.advisoryBlock}>
        <View style={s.advisoryHeader}>
          <View style={s.advisoryIconCircle}>
            <Ionicons name="warning-outline" size={14} color="#C28A4B" />
          </View>
          <ThemedText style={s.advisoryTitle}>Health Advisory</ThemedText>
        </View>
        <ThemedText style={s.advisoryBody}>{getHealthAdvisory(item)}</ThemedText>
      </View>

      {/* personal notes */}
      <View style={s.notesBlock}>
        <ThemedText style={s.notesTitle}>Personal Notes</ThemedText>
        <ThemedText style={s.notesText}>{item.note || "No notes added."}</ThemedText>
      </View>

      {/* CSV button */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={s.csvButton}
        onPress={(e) => e.stopPropagation?.()}
      >
        <Ionicons name="download-outline" size={15} color="#4A3728" />
        <ThemedText style={s.csvButtonText}>Download CSV</ThemedText>
      </TouchableOpacity>

    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: "#F6F1EC" },
  scroll:  { flex: 1, backgroundColor: "#F6F1EC" },
  content: { paddingHorizontal: 16, paddingBottom: 32 },

  // header — unchanged per request
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
  },
  headerMiddle: { flex: 1.6, alignItems: "center", justifyContent: "center" },
  title:        { fontSize: 18, fontWeight: "700", lineHeight: 20, textAlign: "center", paddingTop: 1 },
  subtitle:     { fontSize: 12, opacity: 0.6, textAlign: "center" },

  // search + filter block
  searchBlock: {
    backgroundColor: "#FFFAF7",
    borderWidth: 1, borderColor: "#EDE3DC",
    borderRadius: 20, padding: 12, marginTop: 14, marginBottom: 6,
  },
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#F4EEEA", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1, fontSize: 13, color: "#3C2C24", paddingVertical: 0,
  },
  filterRow:           { gap: 6, paddingHorizontal: 2 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
    backgroundColor: "#F4EEEA",
  },
  filterChipActive:    { backgroundColor: "#4A3728" },
  filterChipText:      { fontSize: 12, color: "#7A675C", fontWeight: "500" },
  filterChipTextActive:{ color: "#FFF", fontWeight: "600" },

  // count
  countRow:  { paddingHorizontal: 4, paddingTop: 12, paddingBottom: 4 },
  countText: { fontSize: 11, color: "#A08880", fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5 },

  // collapsed card
  card: {
    backgroundColor: "#FFFAF7",
    borderWidth: 1, borderColor: "#EDE3DC",
    borderRadius: 20, padding: 14, marginBottom: 10,
  },
  cardTopRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardDate:    { fontSize: 11, color: "#A08880", fontWeight: "500" },
  cardBody:    { flexDirection: "row", alignItems: "flex-start" },
  coffeeCircle:{
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#F4EEEA",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  cardMain:    { flex: 1 },
  nameBadgeRow:{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  coffeeName:  { fontSize: 14, fontWeight: "700", color: "#2E211B" },
  metaRow:     { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  phText:      { fontSize: 12, color: "#8B6A55", fontWeight: "600" },
  riskPill:    { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  riskPillText:{ fontSize: 10, fontWeight: "600" },
  notePreview: { fontSize: 12, color: "#A08880", lineHeight: 18 },

  badge:     { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "700" },

  // expanded card
  expandedCard: {
    backgroundColor: "#FFFAF7",
    borderWidth: 1, borderColor: "#EDE3DC",
    borderRadius: 20, padding: 16, marginBottom: 10,
  },
  expandedDate:        { fontSize: 11, color: "#A08880", fontWeight: "500" },
  expandedMain:        { flexDirection: "row", alignItems: "flex-start", marginTop: 6, marginBottom: 14 },
  expandedIconCol:     { marginRight: 14 },
  expandedCoffeeCircle:{
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "#F4EEEA",
    alignItems: "center", justifyContent: "center",
  },
  expandedInfo:        { flex: 1 },
  expandedCoffeeName:  { fontSize: 15, fontWeight: "700", color: "#2E211B", marginBottom: 6 },
  expandedMetaRow:     { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 },
  expandedMetaText:    { fontSize: 11, color: "#A08880" },
  metaDot:             { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#C4A882" },
  expandedPhRow:       { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  expandedPh:          { fontSize: 15, fontWeight: "700", color: "#3C2C24" },

  divider: { height: 1, backgroundColor: "#EDE3DC", marginBottom: 14 },

  // advisory
  advisoryBlock: {
    backgroundColor: "rgba(139,94,60,0.07)",
    borderRadius: 14, padding: 12, marginBottom: 12,
  },
  advisoryHeader:    { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  advisoryIconCircle:{
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "rgba(194,138,75,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  advisoryTitle: { fontSize: 13, fontWeight: "700", color: "#2E211B" },
  advisoryBody:  { fontSize: 12, lineHeight: 19, color: "#4B3A33" },

  // notes
  notesBlock: { marginBottom: 14 },
  notesTitle: { fontSize: 12, fontWeight: "700", color: "#2E211B", marginBottom: 6 },
  notesText:  { fontSize: 12, lineHeight: 19, color: "#7A675C" },

  // csv
  csvButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "#F4EEEA", borderRadius: 999,
    paddingVertical: 11,
  },
  csvButtonText: { fontSize: 13, fontWeight: "600", color: "#4A3728" },

  // empty
  emptyCard: {
    backgroundColor: "#FFFAF7", borderWidth: 1, borderColor: "#EDE3DC",
    borderRadius: 20, padding: 28, alignItems: "center", marginTop: 8,
  },
  emptyText: { fontSize: 13, color: "#A08880" },
});