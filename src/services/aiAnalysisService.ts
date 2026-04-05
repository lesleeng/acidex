import { supabase } from "@/lib/supabase";

import { saveAnalysisRecord } from "../store/analysisStore";
import { AnalysisNarrative, AnalysisRecord } from "../types/analysis";
import { buildRuleBasedNarrative } from "./analysisService";

const ANALYSIS_LLM_FUNCTION_NAME =
  process.env.EXPO_PUBLIC_ANALYSIS_LLM_FUNCTION_NAME || "analysis-llm";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

type InvokePayload = {
  record: {
    coffeeType: AnalysisRecord["coffeeType"];
    ph: AnalysisRecord["ph"];
    classification: AnalysisRecord["classification"];
    riskLevel: AnalysisRecord["riskLevel"];
    stomachState: AnalysisRecord["stomachState"];
    cupsToday: AnalysisRecord["cupsToday"];
    stabilizationTimeSec: AnalysisRecord["stabilizationTimeSec"];
    averageVoltage: AnalysisRecord["averageVoltage"];
    samplesCollected: AnalysisRecord["samplesCollected"];
  };
};

async function invokeAnalysisLlm(payload: InvokePayload) {
  let result = await supabase.functions.invoke(ANALYSIS_LLM_FUNCTION_NAME, {
    body: payload,
  });

  const statusCode =
    (result.error as any)?.statusCode ||
    (result.error as any)?.status ||
    (result.error as any)?.context?.status ||
    (result.error as any)?.response?.status;

  if (statusCode === 401 && SUPABASE_ANON_KEY) {
    // Retry once with explicit anon auth to bypass stale/invalid session token headers.
    result = await supabase.functions.invoke(ANALYSIS_LLM_FUNCTION_NAME, {
      body: payload,
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });
  }

  return result;
}

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
  
  // Extract fields from LLM response, allowing for flexible formatting
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

  // Require at least the core summary field from LLM
  if (!summary) {
    return null;
  }

  return {
    summary,
    likelyEffectTitle: likelyEffectTitle || "Effects",
    likelyEffectItems: likelyEffectItems.length > 0 ? likelyEffectItems : ["See summary for details"],
    advisory: advisory || "Consult health professionals if needed",
    tips: tips.length > 0 ? tips : ["Monitor your intake"],
    safeTiming: safeTiming || "As needed",
    impactItems: impactItems.length > 0 ? impactItems : ["Individual results may vary"],
    source: "llm",
    model: typeof value.model === "string" ? value.model : undefined,
    generatedAt:
      typeof value.generatedAt === "string" ? value.generatedAt : new Date().toISOString(),
  };
}

export function getNarrativeWithFallback(record: AnalysisRecord): AnalysisNarrative {
  if (record.narrative?.source === "llm") {
    return record.narrative;
  }

  return buildRuleBasedNarrative(record);
}

export async function maybeEnrichAnalysisRecordWithLlm(
  record: AnalysisRecord
): Promise<AnalysisRecord> {
  if (record.narrative?.source === "llm") {
    return record;
  }

  try {
    const invokePromise = invokeAnalysisLlm({
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
    });

    const { data, error } = await withTimeout(invokePromise, 8000);
    if (error) {
      // Log detailed error information
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("LLM invocation failed:", {
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }

    const narrative = normalizeNarrative(data);
    if (!narrative) {
      console.warn("LLM returned invalid narrative structure, falling back to rules");
      return record.narrative ? record : { ...record, narrative: buildRuleBasedNarrative(record) };
    }

    const enriched = { ...record, narrative };
    await saveAnalysisRecord(enriched);
    return enriched;
  } catch (error) {
    const errorObj = error as any;
    const errorMsg = errorObj instanceof Error ? errorObj.message : String(errorObj);
    
    // Extract status code from various possible locations in FunctionsHttpError
    const statusCode = 
      errorObj?.statusCode ||
      errorObj?.status ||
      errorObj?.context?.status ||
      errorObj?.response?.status ||
      "unknown";

    const responseBody =
      errorObj?.context?.error ||
      errorObj?.context?.message ||
      errorObj?.response?._bodyText ||
      undefined;
    
    // Extract more context if available
    const errorContext = {
      error: errorMsg,
      statusCode,
      responseBody,
      timestamp: new Date().toISOString(),
      functionName: ANALYSIS_LLM_FUNCTION_NAME,
      coffeetype: record.coffeeType,
      ph: record.ph,
    };
    
    console.warn("maybeEnrichAnalysisRecordWithLlm falling back to rule-based narrative", errorContext);
    
    if (record.narrative) return record;

    const withRules = { ...record, narrative: buildRuleBasedNarrative(record) };
    await saveAnalysisRecord(withRules);
    return withRules;
  }
}
