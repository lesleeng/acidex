//  use usbService
//  receive raw data
// pass to parser
// return clean readings to app/store
// BRIDGE BETWEEN USB AND APP LOGIC

import { AnalysisRecord } from "../types/analysis";

/**
 * Placeholder lang muna.
 * Later dito mo ilalagay:
 * - OTG device connection
 * - sensor reading retrieval
 * - parsing raw values
 * - save to local DB / Supabase
 */
export async function readSensorData(): Promise<AnalysisRecord | null> {
  return null;
}