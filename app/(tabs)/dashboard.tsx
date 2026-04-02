import React from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  getTrendData,
  getCoffeeTypeAverages,
  getSummaryInsights,
  getPatternInsights,
  getLatestAnalysis,
} from "@/src/services/analysisService";

const trendData = getTrendData();
const typeAverages = getCoffeeTypeAverages();
const summaryInsights = getSummaryInsights();
const patternInsights = getPatternInsights();
const latest = getLatestAnalysis();

function MiniLineChart() {
  const max = Math.max(...trendData.map((d) => d.value), 5.5);
  const min = Math.min(...trendData.map((d) => d.value), 4.5);

  return (
    <View style={styles.chartWrap}>
      <View style={styles.chartArea}>
        {trendData.map((item, index) => {
          const normalized = ((item.value - min) / (max - min || 1)) * 90;
          return (
            <View key={index} style={styles.lineColumn}>
              <View style={{ height: 100, justifyContent: "flex-end" }}>
                <View
                  style={[
                    styles.lineDot,
                    { bottom: normalized, position: "absolute" },
                  ]}
                />
              </View>
              <ThemedText style={styles.chartLabel}>{item.label}</ThemedText>
            </View>
          );
        })}
      </View>

      <View style={styles.chartBands}>
        <View style={[styles.band, { backgroundColor: "#DDE8D8" }]} />
        <View style={[styles.band, { backgroundColor: "#F3E4C9" }]} />
        <View style={[styles.band, { backgroundColor: "#F0D7D1" }]} />
      </View>
    </View>
  );
}

function MiniBarChart() {
  const max = Math.max(...typeAverages.map((d) => d.averagePh), 5.5);

  return (
    <View style={styles.barChartWrap}>
      {typeAverages.map((item, index) => {
        const height = (item.averagePh / max) * 110;
        return (
          <View key={index} style={styles.barItem}>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { height }]} />
            </View>
            <ThemedText style={styles.barLabel}>{item.coffeeType}</ThemedText>
          </View>
        );
      })}
    </View>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <ThemedView style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText style={styles.cardTitle}>{title}</ThemedText>
        <Ionicons name="ellipsis-horizontal" size={18} color="#7A675C" />
      </View>
      {children}
    </ThemedView>
  );
}

export default function DashboardScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <ThemedText style={styles.title}>dashboard.</ThemedText>
        <ThemedText style={styles.subtitle}>your coffee stats</ThemedText>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.filterChip}>
          <Ionicons name="calendar-outline" size={16} color="#FFF" />
          <ThemedText style={styles.filterChipText}>Past 30 days</ThemedText>
          <Ionicons name="chevron-down" size={14} color="#FFF" />
        </TouchableOpacity>
      </View>

      <SectionCard title="Coffee Acidity Trends">
        <MiniLineChart />
      </SectionCard>

      <SectionCard title="Coffee Types & Acidity Average">
        <MiniBarChart />
      </SectionCard>

      <ThemedView style={styles.cardSoft}>
        <ThemedText style={styles.cardTitle}>Summary Insights</ThemedText>
        {summaryInsights.map((item, index) => (
          <View key={index} style={styles.bulletRow}>
            <View style={styles.bullet} />
            <ThemedText style={styles.bulletText}>{item}</ThemedText>
          </View>
        ))}
      </ThemedView>

      <SectionCard title="Patterns & Insights">
        {patternInsights.map((item, index) => (
          <View key={index} style={styles.bulletRow}>
            <View style={styles.bullet} />
            <ThemedText style={styles.bulletText}>{item}</ThemedText>
          </View>
        ))}
      </SectionCard>

      <TouchableOpacity style={styles.historyButton}>
        <View style={styles.historyLeft}>
          <View style={styles.historyIconCircle}>
            <Ionicons name="time-outline" size={16} color="#7B624F" />
          </View>
          <ThemedText style={styles.historyText}>View Analysis History</ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#7B624F" />
      </TouchableOpacity>

      {latest && (
        <ThemedView style={styles.latestCard}>
          <ThemedText style={styles.latestText}>
            Last analyzed{" "}
            <ThemedText style={styles.latestBold}>
              {new Date(latest.createdAt).toLocaleString()}
            </ThemedText>
          </ThemedText>
          <ThemedText style={styles.latestText}>
            • {latest.coffeeType} • pH {latest.ph} ({latest.classification})
          </ThemedText>
        </ThemedView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F1EF",
  },
  contentContainer: {
    padding: 18,
    paddingBottom: 32,
  },
  header: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 18,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center",
    paddingTop: 8,
  },

  subtitle: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "center",
  },

  filterRow: {
    marginBottom: 14,
  },
  filterChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#6C5141",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardSoft: {
    backgroundColor: "#EFE6E2",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E211B",
  },
  chartWrap: {
    position: "relative",
    height: 150,
    justifyContent: "flex-end",
  },
  chartArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    zIndex: 2,
  },
  chartBands: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 22,
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 1,
  },
  band: {
    flex: 1,
  },
  lineColumn: {
    alignItems: "center",
    width: 28,
  },
  lineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#6B4E3D",
  },
  chartLabel: {
    marginTop: 6,
    fontSize: 12,
    color: "#7A675C",
  },
  barChartWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 160,
    paddingTop: 10,
  },
  barItem: {
    alignItems: "center",
    flex: 1,
  },
  barTrack: {
    width: 36,
    height: 120,
    justifyContent: "flex-end",
    backgroundColor: "#F4EEEA",
    borderRadius: 12,
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    backgroundColor: "#D7A57A",
    borderRadius: 12,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
    color: "#6F5A4F",
    textAlign: "center",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
  },
  bullet: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#A86F52",
    marginTop: 7,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#3A2B24",
  },
  historyButton: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F0E7E1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  historyText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#3C2C24",
  },
  latestCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
  },
  latestText: {
    fontSize: 14,
    color: "#6F5E55",
    lineHeight: 22,
  },
  latestBold: {
    fontWeight: "700",
    color: "#3C2C24",
  },
});