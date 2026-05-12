import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    CalibrationBuffer,
    CalibrationEvent,
    parseArduinoCalibrationBlock,
} from "./parser";
import { runArduinoCalibrationCommandWithProgress } from "./usbService";

const CAL_SLOPE_KEY = "acidex_cal_slope";
const CAL_INTERCEPT_KEY = "acidex_cal_intercept";
const CAL_UPDATED_AT_KEY = "acidex_cal_updated_at";

export type StoredCalibration = {
  slope: number;
  intercept: number;
  updatedAt: string;
};

export async function getStoredCalibration(): Promise<StoredCalibration | null> {
  try {
    const [slopeRaw, interceptRaw, updatedAt] = await AsyncStorage.multiGet([
      CAL_SLOPE_KEY,
      CAL_INTERCEPT_KEY,
      CAL_UPDATED_AT_KEY,
    ]).then((pairs) => pairs.map(([, value]) => value));

    const slope = slopeRaw ? Number(slopeRaw) : NaN;
    const intercept = interceptRaw ? Number(interceptRaw) : NaN;

    if (!Number.isFinite(slope) || !Number.isFinite(intercept) || !updatedAt) {
      return null;
    }

    return { slope, intercept, updatedAt };
  } catch {
    return null;
  }
}

export async function saveStoredCalibration(cal: {
  slope: number;
  intercept: number;
}): Promise<StoredCalibration> {
  const updatedAt = new Date().toISOString();
  await AsyncStorage.multiSet([
    [CAL_SLOPE_KEY, String(cal.slope)],
    [CAL_INTERCEPT_KEY, String(cal.intercept)],
    [CAL_UPDATED_AT_KEY, updatedAt],
  ]);

  return { slope: cal.slope, intercept: cal.intercept, updatedAt };
}

export type BufferMeasurement = {
  buffer: CalibrationBuffer;
  voltage: number;
  ph?: number;
  samplesCollected: number;
  stabilizationTimeSec: number;
};

export async function measureCalibrationBuffer(
  buffer: CalibrationBuffer,
  options?: {
    onProgress?: Parameters<typeof runArduinoCalibrationCommandWithProgress>[1];
  }
): Promise<BufferMeasurement> {
  const command = buffer === "low" ? "L" : "H";
  const raw = await runArduinoCalibrationCommandWithProgress(command, options?.onProgress);
  const parsed = parseArduinoCalibrationBlock(raw);

  if (!parsed || parsed.type !== "buffer" || parsed.buffer !== buffer) {
    throw new Error("Failed to parse buffer measurement from device output.");
  }

  return {
    buffer: parsed.buffer,
    voltage: parsed.voltage,
    ph: parsed.ph,
    samplesCollected: parsed.samplesCollected,
    stabilizationTimeSec: parsed.stabilizationTimeSec,
  };
}

export async function applyDeviceSideCalibrationFromVoltages(input: {
  lowVoltage: number;
  highVoltage: number;
  onProgress?: Parameters<typeof runArduinoCalibrationCommandWithProgress>[1];
}): Promise<CalibrationEvent> {
  if (!Number.isFinite(input.lowVoltage) || !Number.isFinite(input.highVoltage)) {
    throw new Error("Invalid voltage values for calibration.");
  }

  // Firmware computes slope/intercept internally and stores it (ESP32 NVS).
  const cmd = `C ${input.lowVoltage} ${input.highVoltage}` as const;
  const raw = await runArduinoCalibrationCommandWithProgress(cmd, input.onProgress);
  const parsed = parseArduinoCalibrationBlock(raw);

  if (!parsed || parsed.type !== "updated") {
    throw new Error("Device did not confirm calibration update.");
  }

  // Mirror the device calibration locally so the app can remember it across restarts.
  await saveStoredCalibration({ slope: parsed.slope, intercept: parsed.intercept });
  return parsed;
}
