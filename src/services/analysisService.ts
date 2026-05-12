import { mockAnalysisRecords } from "../data/analysisMock";
import {
  AnalysisNarrative,
  AnalysisRecord,
  BinaryAcidityLabel,
  MlModelKey,
  PHClassification,
  RiskLevel,
  SensorReading,
} from "../types/analysis";

export interface TrendPoint {
  label: string;
  value: number;
  classification: string;
}

export interface CoffeeTypeAverage {
  coffeeType: string;
  averagePh: number;
}

export interface ConfusionMatrix {
  tp: number;
  tn: number;
  fp: number;
  fn: number;
}

export interface ClassificationMetrics extends ConfusionMatrix {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  total: number;
}

export interface BinaryClassificationResult {
  label: BinaryAcidityLabel;
  confidence: number;
  modelKey: MlModelKey;
  modelName: string;
}

export interface ModelEvaluationResult {
  key: MlModelKey;
  name: string;
  metrics: ClassificationMetrics;
}

const DECISION_STUMP_MODEL_KEY: MlModelKey = "decision_stump";
const DECISION_STUMP_MODEL_NAME = "Decision Stump (coffee.csv)";

function sortNewestFirst(records: AnalysisRecord[]) {
  return [...records].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function roundTo1(num: number) {
  return Math.round(num * 10) / 10;
}

function roundTo3(num: number) {
  return Math.round(num * 1000) / 1000;
}

export function buildRuleBasedNarrative(
  item: Pick<
    AnalysisRecord,
    "coffeeType" | "ph" | "classification" | "riskLevel" | "stomachState" | "cupsToday"
  >
): AnalysisNarrative {
  const acidityDescriptor =
    item.classification === "Highly Acidic"
      ? "high acidity coffee"
      : item.classification === "Moderate"
        ? "moderate acidity coffee"
        : "lower acidity coffee";

  const summary =
    item.classification === "Highly Acidic"
      ? `Your ${item.coffeeType.toLowerCase()} tested as highly acidic, which may trigger gastric discomfort.`
      : item.classification === "Moderate"
        ? `Your ${item.coffeeType.toLowerCase()} tested as moderately acidic and may cause some discomfort depending on timing.`
        : `Your ${item.coffeeType.toLowerCase()} tested as low acidic and is generally gentler on the stomach.`;

  const likelyEffectTitle =
    item.riskLevel === "High Risk"
      ? "High likelihood of discomfort"
      : item.riskLevel === "Moderate Risk"
        ? "Possible discomfort"
        : "Lower likelihood of discomfort";

  const likelyEffectItems = [`${item.coffeeType} (${acidityDescriptor})`];
  if (item.stomachState === "Empty stomach") {
    likelyEffectItems.push("Empty stomach (session time)");
  } else if (item.stomachState === "After meal") {
    likelyEffectItems.push("After meal (better timing)");
  }
  if (typeof item.cupsToday === "number") {
    likelyEffectItems.push(`${item.cupsToday} cup${item.cupsToday > 1 ? "s" : ""} today (habit)`);
  }

  const advisory =
    item.riskLevel === "High Risk"
      ? "Consider reducing intake or drinking after meals to minimize gastric discomfort."
      : item.riskLevel === "Moderate Risk"
        ? "Try improving timing and hydration to lessen possible irritation."
        : "Current result suggests lower discomfort risk, but moderation is still recommended.";

  const tips = [
    "Have coffee after meals whenever possible",
    "Stay hydrated: drink water alongside coffee",
    "Limit intake: keep it to 1-2 cups per day",
    item.classification === "Highly Acidic"
      ? "Switch to lower-acidity types like brewed or decaf"
      : "Avoid drinking coffee too quickly to reduce irritation",
  ];

  const safeTiming =
    item.stomachState === "Empty stomach"
      ? "Best to drink coffee 30-45 minutes after eating to lessen irritation."
      : "Continue drinking coffee after meals for better stomach comfort.";

  const impactItems = [
    item.classification === "Highly Acidic"
      ? `${item.coffeeType} (strong acidity profile in this reading)`
      : item.classification === "Moderate"
        ? `${item.coffeeType} (moderate acidity profile in this reading)`
        : `${item.coffeeType} (milder acidity profile in this reading)`,
  ];
  if (item.stomachState === "Empty stomach") impactItems.push("Empty stomach (magnifies irritation)");
  if ((item.cupsToday ?? 0) >= 2) impactItems.push("Multiple cups (higher total acidity)");
  if (impactItems.length < 3) impactItems.push("Brewing method can also affect acidity level");

  return {
    summary,
    likelyEffectTitle,
    likelyEffectItems,
    advisory,
    tips,
    safeTiming,
    impactItems,
    source: "rules",
  };
}

export function classifyPhBand(ph: number): PHClassification {
  if (ph < 4.9) return "Highly Acidic";
  if (ph < 5.3) return "Moderate";
  return "Low Acidic";
}

export function classifyRiskLevel(
  phClassification: PHClassification,
  stomachState?: AnalysisRecord["stomachState"]
): RiskLevel {
  if (phClassification === "Highly Acidic" && stomachState === "Empty stomach") {
    return "High Risk";
  }

  if (
    phClassification === "Highly Acidic" ||
    (phClassification === "Moderate" && stomachState === "Empty stomach")
  ) {
    return "Moderate Risk";
  }

  return "Low Risk";
}

type DecisionStumpModel = {
  threshold: number;
  leftAcidicProbability: number;
  rightAcidicProbability: number;
};

// Trained offline from `coffee.csv` using `prototype_pH` only.
// Script: `node scripts/train-decision-stump-from-coffee-csv.js`
const COFFEE_CSV_DECISION_STUMP_MODEL: DecisionStumpModel = {
  threshold: 5.035,
  leftAcidicProbability: 0.9666666666666667,
  rightAcidicProbability: 0,
};

function predictWithDecisionStump(
  reading: Pick<SensorReading, "ph" | "stabilizationTimeSec">,
  model: DecisionStumpModel
): BinaryClassificationResult {
  const acidicProbability =
    reading.ph <= model.threshold ? model.leftAcidicProbability : model.rightAcidicProbability;

  return {
    label: acidicProbability >= 0.5 ? "Acidic" : "Non-Acidic",
    confidence: Math.max(acidicProbability, 1 - acidicProbability),
    modelKey: DECISION_STUMP_MODEL_KEY,
    modelName: DECISION_STUMP_MODEL_NAME,
  };
}

export function classifyBinaryAcidity(
  reading: Pick<SensorReading, "ph" | "stabilizationTimeSec">
) {
  return predictWithDecisionStump(reading, COFFEE_CSV_DECISION_STUMP_MODEL);
}

export function buildAnalysisRecord(
  reading: SensorReading,
  options?: {
    coffeeType?: string;
    stomachState?: AnalysisRecord["stomachState"];
    note?: string;
  }
): AnalysisRecord {
  const classification = classifyPhBand(reading.ph);
  const stomachState = options?.stomachState ?? "After meal";
  const binary = classifyBinaryAcidity(reading);
  const coffeeType = options?.coffeeType ?? `Sample ${reading.sampleId}`;
  const riskLevel = classifyRiskLevel(classification, stomachState);

  return {
    id: `${Date.now()}-${reading.sampleId}`,
    createdAt: new Date().toISOString(),
    coffeeType,
    ph: roundTo3(reading.ph),
    classification,
    binaryLabel: binary.label,
    mlConfidence: binary.confidence,
    mlModelKey: binary.modelKey,
    mlModelName: binary.modelName,
    stabilizationTimeSec: reading.stabilizationTimeSec,
    averageVoltage: reading.averageVoltage,
    samplesCollected: reading.samplesCollected,
    sampleId: reading.sampleId,
    note: options?.note,
    stomachState,
    riskLevel,
    narrative: buildRuleBasedNarrative({
      coffeeType,
      ph: roundTo3(reading.ph),
      classification,
      riskLevel,
      stomachState,
    }),
  };
}

export function getAllAnalysisRecords(): AnalysisRecord[] {
  return sortNewestFirst(mockAnalysisRecords);
}

export function getLatestAnalysis(): AnalysisRecord | null {
  const sorted = sortNewestFirst(mockAnalysisRecords);
  return sorted.length ? sorted[0] : null;
}

export function getTrendData(): TrendPoint[] {
  const sortedAsc = [...mockAnalysisRecords].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return sortedAsc.map((item) => {
    const date = new Date(item.createdAt);
    return {
      label: `${date.getDate()}`,
      value: item.ph,
      classification: item.classification,
    };
  });
}

export function getCoffeeTypeAverages(): CoffeeTypeAverage[] {
  const grouped: Record<string, number[]> = {};

  mockAnalysisRecords.forEach((item) => {
    if (!grouped[item.coffeeType]) grouped[item.coffeeType] = [];
    grouped[item.coffeeType].push(item.ph);
  });

  return Object.entries(grouped).map(([coffeeType, values]) => ({
    coffeeType,
    averagePh: roundTo1(
      values.reduce((sum, val) => sum + val, 0) / values.length
    ),
  }));
}

export function getSummaryInsights(): string[] {
  const total = mockAnalysisRecords.length;

  const moderateOrHigh = mockAnalysisRecords.filter(
    (item) =>
      item.classification === "Moderate" ||
      item.classification === "Highly Acidic"
  ).length;

  const percent = total ? roundTo1((moderateOrHigh / total) * 100) : 0;

  const emptyHighRisk = mockAnalysisRecords.filter(
    (item) =>
      item.stomachState === "Empty stomach" &&
      item.riskLevel === "High Risk"
  ).length;

  return [
    `${percent}% of your entries were "Moderate" or "Highly Acidic".`,
    `"Empty stomach" + high acidity showed ${emptyHighRisk} higher-risk logs.`,
  ];
}

export function getPatternInsights(): string[] {
  const averages = getCoffeeTypeAverages();

  const highest = [...averages].sort((a, b) => a.averagePh - b.averagePh)[0];
  const lowest = [...averages].sort((a, b) => b.averagePh - a.averagePh)[0];

  return [
    highest
      ? `${highest.coffeeType} had the strongest acidity tendency.`
      : "No acidity pattern yet.",
    lowest
      ? `${lowest.coffeeType} appeared milder on average.`
      : "No coffee type comparison yet.",
  ];
}
