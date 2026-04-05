import { supabase } from "@/lib/supabase";

import { saveAnalysisRecord } from "../store/analysisStore";
import { AnalysisNarrative, AnalysisRecord } from "../types/analysis";
import { buildRuleBasedNarrative } from "./analysisService";

const ANALYSIS_LLM_FUNCTION_NAME =
  process.env.EXPO_PUBLIC_ANALYSIS_LLM_FUNCTION_NAME || "analysis-llm";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("LLM analysis request timed out."));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function normalizeNarrative(data: unknown): AnalysisNarrative | null {
  if (!data || typeof data !== "object") return null;

  const value = data as Record<string, unknown>;
  const summary = typeof value.summary === "string" ? value.summary.trim() : "";
  const likelyEffectTitle =
    typeof value.likelyEffectTitle === "string" ? value.likelyEffectTitle.trim() : "";
  const advisory = typeof value.advisory === "string" ? value.advisory.trim() : "";
  const safeTiming = typeof value.safeTiming === "string" ? value.safeTiming.trim() : "";

  const likelyEffectItems = Array.isArray(value.likelyEffectItems)
    ? value.likelyEffectItems.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const tips = Array.isArray(value.tips)
    ? value.tips.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const impactItems = Array.isArray(value.impactItems)
    ? value.impactItems.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  if (
    !summary ||
    !likelyEffectTitle ||
    !advisory ||
    !safeTiming ||
    !likelyEffectItems.length ||
    !tips.length ||
    !impactItems.length
  ) {
    return null;
  }

  return {
    summary,
    likelyEffectTitle,
    likelyEffectItems,
    advisory,
    tips,
    safeTiming,
    impactItems,
    source: "llm",
    model: typeof value.model === "string" ? value.model : undefined,
    generatedAt:
      typeof value.generatedAt === "string" ? value.generatedAt : new Date().toISOString(),
  };
}

export function getNarrativeWithFallback(record: AnalysisRecord): AnalysisNarrative {
  return record.narrative ?? buildRuleBasedNarrative(record);
}

export async function maybeEnrichAnalysisRecordWithLlm(
  record: AnalysisRecord
): Promise<AnalysisRecord> {
  if (record.narrative?.source === "llm") {
    return record;
  }

  try {
    const invokePromise = supabase.functions.invoke(ANALYSIS_LLM_FUNCTION_NAME, {
      body: {
        record: {
          coffeeType: record.coffeeType,
          ph: record.ph,
          classification: record.classification,
          riskLevel: record.riskLevel,
          stomachState: record.stomachState,
          cupsToday: record.cupsToday,
          stabilizationTimeSec: record.stabilizationTimeSec,
          averageVoltage: record.averageVoltage,
          samplesCollected: record.samplesCollected,
        },
      },
    });

    const { data, error } = await withTimeout(invokePromise, 8000);
    if (error) throw error;

    const narrative = normalizeNarrative(data);
    if (!narrative) {
      return record.narrative ? record : { ...record, narrative: buildRuleBasedNarrative(record) };
    }

    const enriched = { ...record, narrative };
    await saveAnalysisRecord(enriched);
    return enriched;
  } catch (error) {
    console.log("maybeEnrichAnalysisRecordWithLlm fallback:", error);
    if (record.narrative) return record;

    const withRules = { ...record, narrative: buildRuleBasedNarrative(record) };
    await saveAnalysisRecord(withRules);
    return withRules;
  }
}
