//  use usbService
//  receive raw data
// pass to parser
// return clean readings to app/store
// BRIDGE BETWEEN USB AND APP LOGIC

import { saveAnalysisRecord } from "../store/analysisStore";
import { buildAnalysisRecord } from "./analysisService";
import { parseArduinoResultBlock } from "./parser";
import {
  ArduinoReadProgress,
  collectSingleArduinoResultWithProgress,
} from "./usbService";
import { AnalysisRecord } from "../types/analysis";

/**
 * Placeholder lang muna.
 * Later dito mo ilalagay:
 * - OTG device connection
 * - sensor reading retrieval
 * - parsing raw values
 * - save to local DB / Supabase
 */
export async function readSensorData(
  onProgress?: (progress: ArduinoReadProgress) => void
): Promise<AnalysisRecord | null> {
  const rawSerialText = await collectSingleArduinoResultWithProgress("1", onProgress);
  return readSensorDataFromRawSerial(rawSerialText);
}

export async function readSensorDataFromRawSerial(
  rawSerialText: string,
  options?: {
    coffeeType?: string;
    stomachState?: AnalysisRecord["stomachState"];
    note?: string;
  }
): Promise<AnalysisRecord | null> {
  const reading = parseArduinoResultBlock(rawSerialText);
  if (!reading) return null;

  const record = buildAnalysisRecord(reading, options);
  await saveAnalysisRecord(record);
  return record;
}
