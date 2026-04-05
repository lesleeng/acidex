import { mlTrainingSet, TrainingSample } from "../data/mlTrainingSet";
import { mockAnalysisRecords } from "../data/analysisMock";
import {
  AnalysisRecord,
  AnalysisNarrative,
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

const LOGISTIC_REGRESSION_MODEL_KEY: MlModelKey = "logistic_regression";
const LOGISTIC_REGRESSION_MODEL_NAME = "Logistic Regression";

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

function getMean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / (values.length || 1);
}

function getStandardDeviation(values: number[], mean: number) {
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length || 1);
  return Math.sqrt(variance) || 1;
}

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value));
}

type LogisticRegressionModel = {
  intercept: number;
  phWeight: number;
  stabilizationWeight: number;
  phMean: number;
  phStd: number;
  stabilizationMean: number;
  stabilizationStd: number;
};

function trainLogisticRegression(trainingSet: TrainingSample[]): LogisticRegressionModel {
  const phValues = trainingSet.map((item) => item.ph);
  const stabilizationValues = trainingSet.map((item) => item.stabilizationTimeSec);
  const phMean = getMean(phValues);
  const phStd = getStandardDeviation(phValues, phMean);
  const stabilizationMean = getMean(stabilizationValues);
  const stabilizationStd = getStandardDeviation(
    stabilizationValues,
    stabilizationMean
  );

  let intercept = 0;
  let phWeight = 0;
  let stabilizationWeight = 0;

  const learningRate = 0.15;
  const iterations = 2500;

  for (let i = 0; i < iterations; i++) {
    let interceptGradient = 0;
    let phGradient = 0;
    let stabilizationGradient = 0;

    trainingSet.forEach((sample) => {
      const normalizedPh = (sample.ph - phMean) / phStd;
      const normalizedStabilization =
        (sample.stabilizationTimeSec - stabilizationMean) / stabilizationStd;
      const expected = sample.label === "Acidic" ? 1 : 0;
      const predicted = sigmoid(
        intercept + phWeight * normalizedPh + stabilizationWeight * normalizedStabilization
      );
      const error = predicted - expected;

      interceptGradient += error;
      phGradient += error * normalizedPh;
      stabilizationGradient += error * normalizedStabilization;
    });

    intercept -= (learningRate * interceptGradient) / trainingSet.length;
    phWeight -= (learningRate * phGradient) / trainingSet.length;
    stabilizationWeight -= (learningRate * stabilizationGradient) / trainingSet.length;
  }

  return {
    intercept,
    phWeight,
    stabilizationWeight,
    phMean,
    phStd,
    stabilizationMean,
    stabilizationStd,
  };
}

function predictWithLogisticRegression(
  reading: Pick<SensorReading, "ph" | "stabilizationTimeSec">,
  model: LogisticRegressionModel
): BinaryClassificationResult {
  const normalizedPh = (reading.ph - model.phMean) / model.phStd;
  const normalizedStabilization =
    (reading.stabilizationTimeSec - model.stabilizationMean) / model.stabilizationStd;
  const acidicProbability = sigmoid(
    model.intercept +
      model.phWeight * normalizedPh +
      model.stabilizationWeight * normalizedStabilization
  );

  return {
    label: acidicProbability >= 0.5 ? "Acidic" : "Non-Acidic",
    confidence: Math.max(acidicProbability, 1 - acidicProbability),
    modelKey: LOGISTIC_REGRESSION_MODEL_KEY,
    modelName: LOGISTIC_REGRESSION_MODEL_NAME,
  };
}

function classifyBinaryAcidityWithTrainingSet(
  reading: Pick<SensorReading, "ph" | "stabilizationTimeSec">,
  trainingSet: TrainingSample[]
): BinaryClassificationResult {
  const model = trainLogisticRegression(trainingSet);
  return predictWithLogisticRegression(reading, model);
}

function evaluateLogisticRegression(
  trainingSet: TrainingSample[],
  evaluationMode: "self_test" | "leave_one_out"
): ModelEvaluationResult {

  const matrix = trainingSet.reduce<ConfusionMatrix>(
    (acc, sample, index) => {
      const subset =
        evaluationMode === "leave_one_out"
          ? trainingSet.filter((_, sampleIndex) => sampleIndex !== index)
          : trainingSet;

      const predicted = classifyBinaryAcidityWithTrainingSet(sample, subset).label;

      if (predicted === "Acidic" && sample.label === "Acidic") acc.tp++;
      else if (predicted === "Non-Acidic" && sample.label === "Non-Acidic") acc.tn++;
      else if (predicted === "Acidic" && sample.label === "Non-Acidic") acc.fp++;
      else acc.fn++;

      return acc;
    },
    { tp: 0, tn: 0, fp: 0, fn: 0 }
  );

  return {
    key: LOGISTIC_REGRESSION_MODEL_KEY,
    name: LOGISTIC_REGRESSION_MODEL_NAME,
    metrics: buildMetrics(matrix),
  };
}

export function classifyBinaryAcidity(
  reading: Pick<SensorReading, "ph" | "stabilizationTimeSec">
) {
  const prediction = classifyBinaryAcidityWithTrainingSet(reading, mlTrainingSet);

  return {
    ...prediction,
    validationMetrics: evaluateTrainingSetLeaveOneOut(),
  };
}

function divideSafe(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : numerator / denominator;
}

function buildMetrics(matrix: ConfusionMatrix): ClassificationMetrics {
  const total = matrix.tp + matrix.tn + matrix.fp + matrix.fn;
  const precision = divideSafe(matrix.tp, matrix.tp + matrix.fp);
  const recall = divideSafe(matrix.tp, matrix.tp + matrix.fn);

  return {
    ...matrix,
    accuracy: divideSafe(matrix.tp + matrix.tn, total),
    precision,
    recall,
    f1Score: divideSafe(2 * precision * recall, precision + recall),
    total,
  };
}

export function evaluateTrainingSetSelfTest(): ClassificationMetrics {
  return evaluateLogisticRegression(mlTrainingSet, "self_test").metrics;
}

export function evaluateTrainingSetLeaveOneOut(): ClassificationMetrics {
  return evaluateLogisticRegression(mlTrainingSet, "leave_one_out").metrics;
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
