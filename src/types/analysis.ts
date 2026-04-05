// where to put the shared types such as :
// SensorReading
// AnalysisRecord
// PhClassification


export type PHClassification =
  | "Low Acidic"
  | "Moderate"
  | "Highly Acidic";

export type RiskLevel = "Low Risk" | "Moderate Risk" | "High Risk";
export type BinaryAcidityLabel = "Acidic" | "Non-Acidic";
export type MlModelKey = "logistic_regression";

export interface AnalysisNarrative {
  summary: string;
  likelyEffectTitle: string;
  likelyEffectItems: string[];
  advisory: string;
  tips: string[];
  safeTiming: string;
  impactItems: string[];
  source: "rules" | "llm";
  model?: string;
  generatedAt?: string;
}

export interface SensorReading {
  sampleId: string;
  averageVoltage: number;
  ph: number;
  samplesCollected: number;
  stabilizationTimeSec: number;
}

export interface AnalysisRecord {
  id: string;
  createdAt: string;
  coffeeType: string;
  ph: number;
  classification: PHClassification;
  binaryLabel?: BinaryAcidityLabel;
  mlConfidence?: number;
  mlModelKey?: MlModelKey;
  mlModelName?: string;
  stabilizationTimeSec?: number;
  averageVoltage?: number;
  samplesCollected?: number;
  sampleId?: string;
  note?: string;
  stomachState?: "Empty stomach" | "After meal";
  cupsToday?: number;
  riskLevel?: RiskLevel;
  narrative?: AnalysisNarrative;
}

// calculation of mV using nern's equation
