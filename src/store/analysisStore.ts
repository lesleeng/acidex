import AsyncStorage from "@react-native-async-storage/async-storage";

import { AnalysisRecord } from "../types/analysis";

const LATEST_ANALYSIS_KEY = "acidex_latest_analysis";
const ANALYSIS_HISTORY_KEY = "acidex_analysis_history";

export async function getLatestStoredAnalysis(): Promise<AnalysisRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(LATEST_ANALYSIS_KEY);
    return raw ? (JSON.parse(raw) as AnalysisRecord) : null;
  } catch (error) {
    console.log("getLatestStoredAnalysis error:", error);
    return null;
  }
}

export async function getStoredAnalysisHistory(): Promise<AnalysisRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(ANALYSIS_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as AnalysisRecord[]) : [];
  } catch (error) {
    console.log("getStoredAnalysisHistory error:", error);
    return [];
  }
}

export async function saveAnalysisRecord(record: AnalysisRecord): Promise<void> {
  try {
    const history = await getStoredAnalysisHistory();
    const dedupedHistory = history.filter((item) => item.id !== record.id);
    const nextHistory = [record, ...dedupedHistory].slice(0, 100);

    await AsyncStorage.multiSet([
      [LATEST_ANALYSIS_KEY, JSON.stringify(record)],
      [ANALYSIS_HISTORY_KEY, JSON.stringify(nextHistory)],
    ]);
  } catch (error) {
    console.log("saveAnalysisRecord error:", error);
  }
}
