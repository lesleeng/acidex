import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Colors from "@/constants/colors";
import { useThemeColor } from "@/hooks/use-theme-color";
import { mockAnalysisRecords } from "@/src/data/analysisMock";

type Classification = "Low Acidic" | "Moderate" | "Highly Acidic";

type AnalysisRecord = {
  id: string;
  createdAt: string;
  coffeeType: string;
  ph: number;
  classification: Classification;
  note?: string;
  stomachState?: "Empty stomach" | "After meal";
  cupsToday?: number;
  riskLevel?: "Low Risk" | "Moderate Risk" | "High Risk";
};

const FILTERS = ["All", "Espresso", "Brewed", "Instant", "Latte"];

export default function HistoryScreen() {
  const coffee = useThemeColor({}, "coffee");
  const text = useThemeColor({}, "text");

  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(
    mockAnalysisRecords[0]?.id ?? null
  );

  const sortedRecords = useMemo(() => {
    return [...(mockAnalysisRecords as AnalysisRecord[])].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, []);

  const filteredRecords = useMemo(() => {
    return sortedRecords.filter((item) => {
      const matchesFilter =
        selectedFilter === "All" || item.coffeeType === selectedFilter;

      const q = search.trim().toLowerCase();

      const matchesSearch =
        q.length === 0 ||
        item.coffeeType.toLowerCase().includes(q) ||
        item.classification.toLowerCase().includes(q) ||
        (item.note ?? "").toLowerCase().includes(q) ||
        formatCardDate(item.createdAt).toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [sortedRecords, selectedFilter, search]);

  function formatHeaderDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatCardDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    if (isToday) return `Today, ${time}`;

    return `${date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    })}, ${time}`;
  }

  function formatDetailDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getBadgeStyle(classification: Classification) {
    if (classification === "Highly Acidic") return styles.badgeHigh;
    if (classification === "Moderate") return styles.badgeModerate;
    return styles.badgeLow;
  }

  function getHealthAdvisory(item: AnalysisRecord) {
    if (item.riskLevel === "High Risk") {
      return "High likelihood of discomfort: Consider reducing intake or drinking after meals.";
    }

    if (item.riskLevel === "Moderate Risk") {
      return "Possible discomfort: Better timing and hydration may help reduce irritation.";
    }

    return "Lower likelihood of discomfort: Continue monitoring your response and drink in moderation.";
  }

  function getRoastLabel(item: AnalysisRecord) {
    if (item.coffeeType === "Espresso") return "Dark";
    if (item.coffeeType === "Brewed") return "Medium";
    if (item.coffeeType === "Instant") return "Medium";
    if (item.coffeeType === "Latte") return "Light";
    return "Medium";
  }

  function renderCollapsedCard(item: AnalysisRecord) {
    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.9}
        style={styles.card}
        onPress={() => setExpandedId(item.id)}
      >
        <View style={styles.cardTopRow}>
          <ThemedText style={[styles.cardDate, { color: text }]}>
            {formatCardDate(item.createdAt)}
          </ThemedText>
          <Ionicons name="chevron-down" size={18} color="#8A6F63" />
        </View>

        <View style={styles.cardBodyRow}>
          <View style={styles.coffeeIconWrap}>
            <MaterialCommunityIcons name="coffee" size={28} color={coffee} />
          </View>

          <View style={styles.cardMain}>
            <View style={styles.titleBadgeRow}>
              <ThemedText style={[styles.coffeeName, { color: text }]}>
                {item.coffeeType}
              </ThemedText>

              <View style={[styles.badge, getBadgeStyle(item.classification)]}>
                <ThemedText style={styles.badgeText}>
                  {item.classification}
                </ThemedText>
              </View>
            </View>

            <ThemedText style={styles.phText}>
              pH {item.ph.toFixed(1)} • {item.ph.toFixed(1)}
            </ThemedText>

            {!!item.note && (
              <ThemedText style={styles.notePreview}>{item.note}</ThemedText>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function renderExpandedCard(item: AnalysisRecord) {
    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.9}
        onPress={() => setExpandedId(null)}
      >
        <ThemedView style={styles.expandedCard}>
          <View style={styles.cardTopRow}>
            <ThemedText style={[styles.expandedDate, { color: text }]}>
              {formatDetailDate(item.createdAt)}
            </ThemedText>
            <Ionicons name="chevron-up" size={18} color="#8A6F63" />
          </View>

          <View style={styles.expandedMainBlock}>
            <View style={styles.expandedRow}>
              <MaterialCommunityIcons name="coffee-outline" size={22} color={coffee} />
              <ThemedText style={[styles.expandedCoffeeName, { color: text }]}>
                {item.coffeeType}
              </ThemedText>
            </View>

            <View style={styles.expandedRow}>
              <MaterialCommunityIcons name="flag-variant-outline" size={18} color="#8A6F63" />
              <ThemedText style={styles.subInfoText}>{getRoastLabel(item)}</ThemedText>
            </View>

            <View style={styles.phBadgeRow}>
              <ThemedText style={[styles.expandedPh, { color: text }]}>
                pH {item.ph.toFixed(1)}
              </ThemedText>

              <View style={[styles.badge, getBadgeStyle(item.classification)]}>
                <ThemedText style={styles.badgeText}>{item.classification}</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.advisoryCard}>
            <View style={styles.advisoryHeader}>
              <Ionicons name="warning-outline" size={20} color="#C28A4B" />
              <ThemedText style={[styles.advisoryTitle, { color: text }]}>
                Health Advisory
              </ThemedText>
            </View>

            <ThemedText style={styles.advisoryBody}>
              {getHealthAdvisory(item)}
            </ThemedText>
          </View>

          <View style={styles.notesSection}>
            <ThemedText style={[styles.notesTitle, { color: text }]}>
              Personal Notes
            </ThemedText>
            <ThemedText style={styles.notesText}>
              • {item.note || "No notes added."}
            </ThemedText>
          </View>

          <TouchableOpacity activeOpacity={0.85} style={styles.csvButton}>
            <ThemedText style={[styles.csvButtonText, { color: coffee }]}>
              Download CSV
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </TouchableOpacity>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView
          style={[
            styles.header,
            { backgroundColor: Colors.light.background },
          ]}
        >
          <View style={styles.headerMiddle}>
            <ThemedText style={[styles.title, { color: coffee }]}>
              history.
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              your full analysis log
            </ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={styles.searchCard}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={20} color="#8A6F63" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search history"
              placeholderTextColor="#A08C82"
              style={styles.searchInput}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            style={styles.filterScroll}
          >
            {FILTERS.map((filter) => {
              const isActive = selectedFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  activeOpacity={0.85}
                  onPress={() => setSelectedFilter(filter)}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {filter}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </ThemedView>

        {filteredRecords.length === 0 ? (
          <ThemedView style={styles.emptyCard}>
            <ThemedText style={styles.emptyText}>
              No analysis records found.
            </ThemedText>
          </ThemedView>
        ) : (
          filteredRecords.map((item) =>
            expandedId === item.id
              ? renderExpandedCard(item)
              : renderCollapsedCard(item)
          )
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F2F0",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
  },

  // headerSide: {
  //   flex: 1,
  //   justifyContent: "center",
  //   alignItems: "flex-start",
  // },

  // headerSideRight: {
  //   alignItems: "flex-end",
  // },

  headerMiddle: {
    flex: 1.6,
    alignItems: "center",
    justifyContent: "center"
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center",
    paddingTop: 1,
  },

  subtitle: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "center",
  },

  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#231815",
  },

  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  contentContainer: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },

  searchCard: {
    backgroundColor: "#F4ECE9",
    borderRadius: 22,
    marginTop: 8,
    marginBottom: 14,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
    marginHorizontal: 0,
    marginBottom: 14,
    borderColor: "#E0D1CB",
    borderWidth: 1,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 5,
  },
  
  filterScroll: {
    marginHorizontal: 0,
    marginBottom: 14,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#4B3A33",
    marginHorizontal: 10,
    paddingVertical: 0,
  },

  filterRow: {
    paddingTop: 2,
    paddingBottom: 2,
  },

  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#EDE2DE",
    marginRight: 10,
  },

  filterChipActive: {
    backgroundColor: "#8A6F63",
  },

  filterChipText: {
    fontSize: 14,
    color: "#7F675B",
    fontWeight: "500",
  },

  filterChipTextActive: {
    color: "#FFF",
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  cardDate: {
    fontSize: 15,
    fontWeight: "600",
  },

  cardBodyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  coffeeIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F4ECE9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  cardMain: {
    flex: 1,
  },

  titleBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  coffeeName: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },

  phText: {
    fontSize: 14,
    color: "#8A6F63",
    marginBottom: 8,
  },

  notePreview: {
    fontSize: 14,
    color: "#6A574E",
    lineHeight: 20,
  },

  badge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },

  badgeHigh: {
    backgroundColor: "#DF7E72",
  },

  badgeModerate: {
    backgroundColor: "#E7BC67",
  },

  badgeLow: {
    backgroundColor: "#A9C7A0",
  },

  badgeText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },

  expandedCard: {
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  expandedDate: {
    fontSize: 17,
    fontWeight: "600",
  },

  expandedMainBlock: {
    marginBottom: 16,
  },

  expandedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  expandedCoffeeName: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 10,
  },

  subInfoText: {
    fontSize: 15,
    color: "#7E675B",
    marginLeft: 10,
  },

  phBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  expandedPh: {
    fontSize: 18,
    fontWeight: "600",
    marginRight: 12,
  },

  advisoryCard: {
    backgroundColor: "#F4ECE9",
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },

  advisoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  advisoryTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 10,
  },

  advisoryBody: {
    fontSize: 15,
    lineHeight: 24,
    color: "#5E4A40",
  },

  notesSection: {
    marginBottom: 16,
  },

  notesTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },

  notesText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6B584F",
  },

  csvButton: {
    backgroundColor: "#F7F2F0",
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  csvButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  emptyCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  emptyText: {
    fontSize: 15,
    color: "#8A6F63",
  },
});