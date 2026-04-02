import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
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

export default function ResultsScreen() {
  const coffee = useThemeColor({}, "coffee");
  const text = useThemeColor({}, "text");

  const latest = useMemo(() => {
    const sorted = [...(mockAnalysisRecords as AnalysisRecord[])].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted[0] ?? null;
  }, []);

  if (!latest) {
    return (
      <ThemedView style={styles.emptyScreen}>
        <ThemedText style={styles.emptyText}>No results yet.</ThemedText>
      </ThemedView>
    );
  }

  function getBadgeStyle(classification: Classification) {
    if (classification === "Highly Acidic") return styles.badgeHigh;
    if (classification === "Moderate") return styles.badgeModerate;
    return styles.badgeLow;
  }

  function getSummaryText(item: AnalysisRecord) {
    if (item.classification === "Highly Acidic") {
      return `Your ${item.coffeeType.toLowerCase()} tested as highly acidic, which may trigger gastric discomfort.`;
    }

    if (item.classification === "Moderate") {
      return `Your ${item.coffeeType.toLowerCase()} tested as moderately acidic, which may still cause discomfort depending on timing and intake.`;
    }

    return `Your ${item.coffeeType.toLowerCase()} tested as low acidic, which is generally gentler on the stomach.`;
  }

  function getLikelyEffectTitle(item: AnalysisRecord) {
    if (item.riskLevel === "High Risk") return "High likelihood of discomfort:";
    if (item.riskLevel === "Moderate Risk")
      return "Possible likelihood of discomfort:";
    return "Lower likelihood of discomfort:";
  }

  function getLikelyEffectItems(item: AnalysisRecord) {
    const items: string[] = [];

    items.push(`${item.coffeeType} (high acidity coffee)`);

    if (item.stomachState === "Empty stomach") {
      items.push("Empty stomach (session time)");
    } else if (item.stomachState === "After meal") {
      items.push("After meal (better timing)");
    }

    if (typeof item.cupsToday === "number") {
      items.push(
        `${item.cupsToday} cup${item.cupsToday > 1 ? "s" : ""} today (habit)`
      );
    }

    return items;
  }

  function getAdvisoryText(item: AnalysisRecord) {
    if (item.riskLevel === "High Risk") {
      return "Consider reducing intake or drinking after meals to minimize gastric discomfort.";
    }

    if (item.riskLevel === "Moderate Risk") {
      return "Try improving timing and hydration to lessen possible irritation.";
    }

    return "Current result suggests lower discomfort risk, but moderation is still recommended.";
  }

  function getTips(item: AnalysisRecord) {
    const tips = [
      "Have coffee after meals whenever possible",
      "Stay hydrated: drink water alongside coffee",
      "Limit intake: keep it to 1-2 cups/day",
    ];

    if (item.classification === "Highly Acidic") {
      tips.push("Switch to lower-acidity coffee types like brewed or decaf");
    } else {
      tips.push("Avoid drinking coffee too quickly to reduce irritation");
    }

    return tips;
  }

  function getSafeTimingText(item: AnalysisRecord) {
    if (item.stomachState === "Empty stomach") {
      return "Best to drink coffee 30-45 minutes after eating to lessen irritation.";
    }

    return "Continue drinking coffee after meals for better stomach comfort.";
  }

  function getImpactItems(item: AnalysisRecord) {
    const impacts: string[] = [];

    impacts.push(`${item.coffeeType} (strongest acids from darkness of roast)`);

    if (item.stomachState === "Empty stomach") {
      impacts.push("Empty stomach (magnifies irritation)");
    }

    if ((item.cupsToday ?? 0) >= 2) {
      impacts.push("Multiple cups (higher total acidity)");
    }

    if (impacts.length < 3) {
      impacts.push("Brewing method can also affect acidity level");
    }

    return impacts;
  }

  function getScaleDotPosition(item: AnalysisRecord): object {
    if (item.classification === "Highly Acidic") return { right: 22 };
    if (item.classification === "Moderate") return { left: "50%", marginLeft: -10 };
    return { left: 22 };
  }

  const tips = getTips(latest);
  const effects = getLikelyEffectItems(latest);
  const impacts = getImpactItems(latest);

  return (
    <ThemedView style={styles.screen}>
      <ThemedView
        style={[
          styles.header,
          { backgroundColor: Colors.light.background },
        ]}
      >


        <View style={styles.headerMiddle}>
          <ThemedText style={[styles.title, { color: coffee }]}>
            results.
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            your latest coffee analysis
          </ThemedText>
        </View>

      </ThemedView>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText style={[styles.cardTitle, { color: text }]}>
              Acidity Summary
            </ThemedText>
            <Ionicons name="bookmark-outline" size={20} color="#7F675B" />
          </View>

          <View style={styles.summaryInner}>
            <View style={styles.summaryTop}>
              <View style={styles.coffeeIllustrationWrap}>
                <MaterialCommunityIcons
                  name="coffee"
                  size={70}
                  color={coffee}
                />
              </View>

              <View style={styles.summaryTopRight}>
                <ThemedText style={[styles.coffeeName, { color: text }]}>
                  {latest.coffeeType}
                </ThemedText>

                <View style={styles.phAndBadgeRow}>
                  <ThemedText style={[styles.phBigText, { color: text }]}>
                    pH {latest.ph.toFixed(1)}
                  </ThemedText>

                  <View
                    style={[styles.badge, getBadgeStyle(latest.classification)]}
                  >
                    <ThemedText style={styles.badgeText}>
                      {latest.classification}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.scaleBlock}>
              <View style={styles.scaleTopLabels}>
                <ThemedText style={styles.scaleLabelText}>Low</ThemedText>
                <ThemedText style={styles.scaleLabelText}>pH 5.2</ThemedText>
                <ThemedText style={[styles.scaleLabelText, { color: "#DB6E66" }]}>
                  High
                </ThemedText>
              </View>

              <View style={styles.scaleBar}>
                <View style={[styles.scaleSegment, { backgroundColor: "#C9D7C4" }]} />
                <View style={[styles.scaleSegment, { backgroundColor: "#E7CFAB" }]} />
                <View style={[styles.scaleSegment, { backgroundColor: "#E49B92" }]} />
                <View style={[styles.scaleDot, getScaleDotPosition(latest)]} />
              </View>

              <View style={styles.scaleBottomLabels}>
                <ThemedText style={styles.scaleBottomText}>pH 5.2</ThemedText>
                <ThemedText style={styles.scaleBottomText}>Moderate</ThemedText>
                <ThemedText style={styles.scaleBottomText}>
                  pH {latest.ph.toFixed(1)}
                </ThemedText>
              </View>
            </View>

            <ThemedText style={styles.summaryText}>
              {getSummaryText(latest)}
            </ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText style={[styles.cardTitle, { color: text }]}>
              Likely Effects & Advisory
            </ThemedText>
            <Ionicons name="bookmark-outline" size={20} color="#7F675B" />
          </View>

          <View style={styles.infoSoftCard}>
            <View style={styles.warningRow}>
              <Ionicons name="warning-outline" size={22} color="#C38C49" />
              <ThemedText style={[styles.warningTitle, { color: text }]}>
                {getLikelyEffectTitle(latest)}
              </ThemedText>
            </View>

            {effects.map((item, index) => (
              <View key={index} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <ThemedText style={styles.bulletText}>{item}</ThemedText>
              </View>
            ))}

            <ThemedText style={styles.advisoryText}>
              {getAdvisoryText(latest)}
            </ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText style={[styles.cardTitle, { color: text }]}>
              Tips to Minimize Discomfort
            </ThemedText>
            <Ionicons name="bookmark-outline" size={20} color="#7F675B" />
          </View>

          <View style={styles.infoSoftCard}>
            {tips.map((tip, index) => (
              <View key={index} style={styles.tipRow}>
                <MaterialCommunityIcons
                  name={
                    index === 0
                      ? "food"
                      : index === 1
                      ? "cup-water"
                      : index === 2
                      ? "coffee-outline"
                      : "coffee-maker-outline"
                  }
                  size={22}
                  color="#8A6F63"
                />
                <ThemedText style={styles.tipText}>{tip}</ThemedText>
              </View>
            ))}
          </View>
        </ThemedView>

        <ThemedView style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText style={[styles.cardTitle, { color: text }]}>
              Safe Coffee Timing
            </ThemedText>
            <Ionicons name="ellipsis-horizontal" size={20} color="#7F675B" />
          </View>

          <View style={styles.timingRow}>
            <Ionicons name="time-outline" size={24} color="#7F675B" />
            <ThemedText style={styles.timingText}>
              {getSafeTimingText(latest)}
            </ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText style={[styles.cardTitle, { color: text }]}>
              What’s Coffee Acidity?
            </ThemedText>
            <Ionicons name="bookmark-outline" size={20} color="#7F675B" />
          </View>

          <ThemedText style={[styles.questionTitle, { color: text }]}>
            What is coffee acidity?
          </ThemedText>

          <ThemedText style={styles.infoParagraph}>
            Coffee acidity refers to the acidic content of the drink, measured
            as pH. Lower pH means higher acidity.
          </ThemedText>

          <View style={styles.innerInfoCard}>
            <View style={styles.cardHeader}>
              <ThemedText style={[styles.questionTitle, { color: text }]}>
                What impacts acidity?
              </ThemedText>
              <Ionicons name="bookmark-outline" size={20} color="#7F675B" />
            </View>

            {impacts.map((item, index) => (
              <View key={index} style={styles.bulletRow}>
                <View style={styles.dotBullet} />
                <ThemedText style={styles.bulletText}>{item}</ThemedText>
              </View>
            ))}
          </View>
        </ThemedView>

        <TouchableOpacity activeOpacity={0.85} style={styles.okayButton}>
          <ThemedText style={[styles.okayButtonText, { color: coffee }]}>
            Okay
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F2F0",
  },

  emptyScreen: {
    flex: 1,
    backgroundColor: "#F7F2F0",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    fontSize: 15,
    color: "#8A6F63",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
  },

  headerSide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerSideRight: {
    alignItems: "flex-end",
  },

  headerMiddle: {
    flex: 1.6,
    alignItems: "center",
    justifyContent: "center",
  },

  brand: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 2,
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
  },

  contentContainer: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  summaryInner: {
    backgroundColor: "#F4ECE9",
    borderRadius: 18,
    padding: 14,
  },

  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  coffeeIllustrationWrap: {
    width: 110,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryTopRight: {
    flex: 1,
  },

  coffeeName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  phAndBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },

  phBigText: {
    fontSize: 18,
    fontWeight: "500",
  },

  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  badgeHigh: {
    backgroundColor: "#D97870",
  },

  badgeModerate: {
    backgroundColor: "#E4BA67",
  },

  badgeLow: {
    backgroundColor: "#A8C69F",
  },

  badgeText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },

  scaleBlock: {
    marginBottom: 14,
  },

  scaleTopLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  scaleLabelText: {
    fontSize: 13,
    color: "#8A6F63",
  },

  scaleBar: {
    flexDirection: "row",
    height: 16,
    borderRadius: 999,
    overflow: "hidden",
    position: "relative",
    marginBottom: 8,
  },

  scaleSegment: {
    flex: 1,
  },

  scaleDot: {
    position: "absolute",
    top: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#DB6E66",
    borderWidth: 2,
    borderColor: "#CC5E56",
  },

  scaleBottomLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  scaleBottomText: {
    fontSize: 13,
    color: "#7E675B",
  },

  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#4B3A33",
  },

  infoSoftCard: {
    backgroundColor: "#F4ECE9",
    borderRadius: 18,
    padding: 14,
  },

  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  warningTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 10,
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C9A191",
    marginTop: 8,
    marginRight: 10,
  },

  dotBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#B88B76",
    marginTop: 8,
    marginRight: 10,
  },

  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#4E3D35",
  },

  advisoryText: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 24,
    color: "#4B3A33",
  },

  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  tipText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    lineHeight: 24,
    color: "#4E3D35",
  },

  timingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  timingText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    lineHeight: 24,
    color: "#4E3D35",
  },

  questionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
  },

  infoParagraph: {
    fontSize: 16,
    lineHeight: 25,
    color: "#4B3A33",
    marginBottom: 16,
  },

  innerInfoCard: {
    backgroundColor: "#F4ECE9",
    borderRadius: 18,
    padding: 14,
  },

  okayButton: {
    marginTop: 14,
    marginBottom: 18,
    backgroundColor: "#F4ECE9",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  okayButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
});