// where to put the shared types such as :
// SensorReading
// AnalysisRecord
// PhClassification


export type PHClassification =
  | "Low Acidic"
  | "Moderate"
  | "Highly Acidic";

export type RiskLevel = "Low Risk" | "Moderate Risk" | "High Risk";

export interface AnalysisRecord {
  id: string;
  createdAt: string;
  coffeeType: string;
  ph: number;
  classification: PHClassification;
  note?: string;
  stomachState?: "Empty stomach" | "After meal";
  riskLevel?: RiskLevel;
}

// calculation of mV using nern's equation
