import { AnalysisRecord } from "../types/analysis";

export const mockAnalysisRecords: AnalysisRecord[] = [
  {
    id: "1",
    createdAt: "2026-03-10T08:20:00",
    coffeeType: "Espresso",
    ph: 4.7,
    classification: "Highly Acidic",
    note: "Strong and sharp taste",
    stomachState: "empty stomach",
    riskLevel: "High Risk",
    cupsToday: undefined
  },
  {
    id: "2",
    createdAt: "2026-03-11T09:10:00",
    coffeeType: "Brewed",
    ph: 5.0,
    classification: "Moderate",
    note: "Balanced",
    stomachState: "after meal",
    riskLevel: "Low Risk",
    cupsToday: undefined
  },
  {
    id: "3",
    createdAt: "2026-03-12T07:45:00",
    coffeeType: "Latte",
    ph: 4.9,
    classification: "Moderate",
    note: "Smooth",
    stomachState: "after meal",
    riskLevel: "Low Risk",
    cupsToday: undefined
  },
  {
    id: "4",
    createdAt: "2026-03-13T10:15:00",
    coffeeType: "Instant",
    ph: 5.2,
    classification: "Moderate",
    note: "Slightly mild",
    stomachState: "empty stomach",
    riskLevel: "Moderate Risk",
    cupsToday: undefined
  },
  {
    id: "5",
    createdAt: "2026-03-14T11:00:00",
    coffeeType: "Espresso",
    ph: 4.6,
    classification: "Highly Acidic",
    note: "Very acidic",
    stomachState: "empty stomach",
    riskLevel: "High Risk",
    cupsToday: undefined
  },
  {
    id: "6",
    createdAt: "2026-03-15T14:30:00",
    coffeeType: "Latte",
    ph: 5.1,
    classification: "Moderate",
    note: "Creamy",
    stomachState: "after meal",
    riskLevel: "Low Risk",
    cupsToday: undefined
  },
  {
    id: "7",
    createdAt: "2026-03-16T16:10:00",
    coffeeType: "Instant",
    ph: 5.3,
    classification: "Low Acidic",
    note: "Less acidic",
    stomachState: "after meal",
    riskLevel: "Low Risk",
    cupsToday: undefined
  },
  {
    id: "8",
    createdAt: "2026-03-17T09:25:00",
    coffeeType: "Brewed",
    ph: 4.8,
    classification: "Highly Acidic",
    note: "Bit bright",
    stomachState: "empty stomach",
    riskLevel: "Moderate Risk",
    cupsToday: undefined
  },
  {
    id: "9",
    createdAt: "2026-03-18T18:40:00",
    coffeeType: "Latte",
    ph: 4.9,
    classification: "Moderate",
    note: "Good for afternoon",
    stomachState: "after meal",
    riskLevel: "Low Risk",
    cupsToday: undefined
  },
];