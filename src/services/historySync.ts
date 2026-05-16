import { supabase } from "@/lib/supabase";

import { AnalysisRecord } from "@/src/types/analysis";

type HistoryRow = {
  id: string;
  profile_id: string;
  created_at: string;
  coffee_type: string;
  ph: number;
  classification: AnalysisRecord["classification"];
  binary_label: AnalysisRecord["binaryLabel"] | null;
  ml_confidence: number | null;
  ml_model_key: AnalysisRecord["mlModelKey"] | null;
  ml_model_name: AnalysisRecord["mlModelName"] | null;
  stabilization_time_sec: number | null;
  average_voltage: number | null;
  samples_collected: number | null;
  sample_id: string | null;
  note: string | null;
  stomach_state: AnalysisRecord["stomachState"] | null;
  cups_today: number | null;
  risk_level: AnalysisRecord["riskLevel"] | null;
  narrative: AnalysisRecord["narrative"] | null;
  is_bookmarked: boolean;
};

function toHistoryRow(record: AnalysisRecord, profileId: string, isBookmarked: boolean): HistoryRow {
  return {
    id: record.id,
    profile_id: profileId,
    created_at: record.createdAt,
    coffee_type: record.coffeeType,
    ph: record.ph,
    classification: record.classification,
    binary_label: record.binaryLabel ?? null,
    ml_confidence: record.mlConfidence ?? null,
    ml_model_key: record.mlModelKey ?? null,
    ml_model_name: record.mlModelName ?? null,
    stabilization_time_sec: record.stabilizationTimeSec ?? null,
    average_voltage: record.averageVoltage ?? null,
    samples_collected: record.samplesCollected ?? null,
    sample_id: record.sampleId ?? null,
    note: record.note ?? null,
    stomach_state: record.stomachState ?? null,
    cups_today: record.cupsToday ?? null,
    risk_level: record.riskLevel ?? null,
    narrative: record.narrative ?? null,
    is_bookmarked: isBookmarked,
  };
}

export async function syncHistoryRecordToSupabase(
  record: AnalysisRecord,
  isBookmarked: boolean,
): Promise<void> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.log("syncHistoryRecordToSupabase getUser error:", error.message);
      return;
    }

    const user = data.user;
    if (!user) return;

    const { error: upsertError } = await supabase
      .from("history")
      .upsert(toHistoryRow(record, user.id, isBookmarked), {
        onConflict: "id",
      });

    if (upsertError) {
      console.log("syncHistoryRecordToSupabase upsert error:", upsertError.message);
    }
  } catch (error) {
    console.log("syncHistoryRecordToSupabase error:", error);
  }
}