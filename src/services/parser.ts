import { SensorReading } from "../types/analysis";

function extractNumber(raw: string, label: string): number | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = raw.match(new RegExp(`${escaped}\\s*:?\\s*(-?\\d+(?:\\.\\d+)?)`, "i"));
  if (!match) return null;

  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function extractText(raw: string, label: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = raw.match(new RegExp(`${escaped}\\s*:?\\s*([^\\r\\n]+)`, "i"));
  return match?.[1]?.trim() ?? null;
}

export function parseArduinoResultBlock(raw: string): SensorReading | null {
  const jsonMatch = raw.match(/RESULT_JSON:(\{.*?\})/s);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]) as {
        sample?: string;
        avgVoltage?: number;
        pH?: number;
        samplesCollected?: number;
        stabilizationTimeSec?: number;
      };

      if (
        parsed.sample &&
        typeof parsed.avgVoltage === "number" &&
        typeof parsed.pH === "number" &&
        typeof parsed.samplesCollected === "number" &&
        typeof parsed.stabilizationTimeSec === "number" &&
        parsed.stabilizationTimeSec >= 0
      ) {
        return {
          sampleId: parsed.sample,
          averageVoltage: parsed.avgVoltage,
          ph: parsed.pH,
          samplesCollected: parsed.samplesCollected,
          stabilizationTimeSec: parsed.stabilizationTimeSec,
        };
      }
    } catch (error) {
      console.error("parseArduinoResultBlock JSON parse error:", {
        error: error instanceof Error ? error.message : String(error),
        raw: raw.substring(0, 200),
      });
    }
  }

  if (!raw.includes("=== RESULT ===")) return null;

  const sampleId = extractText(raw, "Sample");
  const averageVoltage = extractNumber(raw, "Avg Voltage");
  const ph = extractNumber(raw, "Calculated pH");
  const samplesCollected = extractNumber(raw, "Samples Collected");
  const stabilizationTimeSec = extractNumber(raw, "Voltage stabilized at");

  if (
    !sampleId ||
    averageVoltage === null ||
    ph === null ||
    samplesCollected === null ||
    stabilizationTimeSec === null
  ) {
    return null;
  }

  return {
    sampleId,
    averageVoltage,
    ph,
    samplesCollected,
    stabilizationTimeSec,
  };
}
