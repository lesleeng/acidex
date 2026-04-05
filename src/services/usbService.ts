import { Platform } from "react-native";
import {
  Device,
  Parity,
  UsbSerial,
  UsbSerialManager,
} from "react-native-usb-serialport-for-android";

const DEFAULT_OPEN_OPTIONS = {
  baudRate: 115200,
  parity: Parity.None,
  dataBits: 8,
  stopBits: 1,
} as const;

export type ArduinoReadStage =
  | "device-found"
  | "port-opened"
  | "waiting-before-send"
  | "command-sent"
  | "serial-received"
  | "serial-chunk"
  | "arduino-ready"
  | "arduino-stable"
  | "arduino-collecting"
  | "result-detected";

export interface ArduinoReadProgress {
  stage: ArduinoReadStage;
  message: string;
  rawChunk?: string;
}

type ProgressListener = (progress: ArduinoReadProgress) => void;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureAndroid() {
  if (Platform.OS !== "android") {
    throw new Error("USB OTG serial is only supported on Android.");
  }
}

function hexToAscii(hex: string) {
  const clean = hex.replace(/\s+/g, "");
  let output = "";

  for (let index = 0; index < clean.length - 1; index += 2) {
    const value = Number.parseInt(clean.slice(index, index + 2), 16);
    if (!Number.isNaN(value) && value !== 0) {
      output += String.fromCharCode(value);
    }
  }

  return output;
}

function asciiToHex(text: string) {
  return text
    .split("")
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function hasCompleteResultBlock(buffer: string) {
  return (
    buffer.includes("RESULT_JSON:") ||
    (
    buffer.includes("=== RESULT ===") &&
    buffer.includes("Calculated pH:") &&
    buffer.includes("Samples Collected:") &&
    buffer.includes("Voltage stabilized at:")
    )
  );
}

export async function listUsbDevices(): Promise<Device[]> {
  ensureAndroid();
  return UsbSerialManager.list();
}

export async function getFirstUsbDevice(): Promise<Device | null> {
  const devices = await listUsbDevices();
  return devices[0] ?? null;
}

export async function hasUsbDevice(): Promise<boolean> {
  const device = await getFirstUsbDevice();
  return !!device;
}

export async function openUsbConnection(device: Device): Promise<UsbSerial> {
  ensureAndroid();

  const hasPermission = await UsbSerialManager.hasPermission(device.deviceId);
  if (!hasPermission) {
    const grantedImmediately = await UsbSerialManager.tryRequestPermission(
      device.deviceId
    );

    if (!grantedImmediately) {
      throw new Error("USB permission prompt shown. Tap analyze again after allowing access.");
    }
  }

  return UsbSerialManager.open(device.deviceId, DEFAULT_OPEN_OPTIONS);
}

export async function sendAsciiCommand(port: UsbSerial, command: string): Promise<void> {
  await port.send(asciiToHex(command));
}

export async function waitForArduinoResult(
  port: UsbSerial,
  timeoutMs = 120000,
  onProgress?: ProgressListener
): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = "";
    let settled = false;
    let completeTimer: ReturnType<typeof setTimeout> | null = null;
    let hasReportedSerial = false;
    let hasReportedReady = false;
    let hasReportedStable = false;
    let hasReportedCollecting = false;
    let hasReportedResult = false;

    const finish = async (action: "resolve" | "reject", payload: string | Error) => {
      if (settled) return;
      settled = true;

      if (completeTimer) clearTimeout(completeTimer);
      timeoutHandle && clearTimeout(timeoutHandle);
      subscription.remove();

      try {
        await port.close();
      } catch (error) {
        console.log("USB close error:", error);
      }

      if (action === "resolve") {
        resolve(payload as string);
      } else {
        reject(payload);
      }
    };

    const subscription = port.onReceived((event) => {
      const chunk = hexToAscii(event.data);
      if (!chunk) return;

      buffer += chunk;

      if (!hasReportedSerial) {
        hasReportedSerial = true;
        onProgress?.({
          stage: "serial-received",
          message: "Arduino serial data detected.",
          rawChunk: chunk,
        });
      } else {
        onProgress?.({
          stage: "serial-chunk",
          message: "Arduino is still sending serial data.",
          rawChunk: chunk,
        });
      }

      if (!hasReportedReady && buffer.includes("READY SAMPLE")) {
        hasReportedReady = true;
        onProgress?.({
          stage: "arduino-ready",
          message: "Arduino acknowledged the sample command.",
          rawChunk: chunk,
        });
      }

      if (!hasReportedStable && buffer.includes("STABLE")) {
        hasReportedStable = true;
        onProgress?.({
          stage: "arduino-stable",
          message: "Arduino marked the probe reading as stable.",
          rawChunk: chunk,
        });
      }

      if (!hasReportedCollecting && buffer.includes("COLLECTING")) {
        hasReportedCollecting = true;
        onProgress?.({
          stage: "arduino-collecting",
          message: "Arduino started collecting the final sample window.",
          rawChunk: chunk,
        });
      }

      if (!hasCompleteResultBlock(buffer)) {
        return;
      }

      if (!hasReportedResult) {
        hasReportedResult = true;
        onProgress?.({
          stage: "result-detected",
          message: "Arduino result block detected.",
          rawChunk: chunk,
        });
      }

      if (completeTimer) clearTimeout(completeTimer);
      completeTimer = setTimeout(() => {
        finish("resolve", buffer);
      }, 300);
    });

    const timeoutHandle = setTimeout(() => {
      finish(
        "reject",
        new Error("Timed out while waiting for the Arduino result block.")
      );
    }, timeoutMs);
  });
}

export async function collectSingleArduinoResult(sampleCommand = "1"): Promise<string> {
  return collectSingleArduinoResultWithProgress(sampleCommand);
}

export async function collectSingleArduinoResultWithProgress(
  sampleCommand = "1",
  onProgress?: ProgressListener
): Promise<string> {
  const device = await getFirstUsbDevice();
  if (!device) {
    throw new Error("No OTG USB serial device detected.");
  }

  onProgress?.({
    stage: "device-found",
    message: "USB serial device found.",
  });

  const port = await openUsbConnection(device);
  onProgress?.({
    stage: "port-opened",
    message: "USB serial port opened.",
  });

  onProgress?.({
    stage: "waiting-before-send",
    message: "Waiting for Arduino serial to settle.",
  });

  await delay(1500);
  await sendAsciiCommand(port, sampleCommand);
  onProgress?.({
    stage: "command-sent",
    message: `Sample command ${sampleCommand} sent to Arduino.`,
  });

  return waitForArduinoResult(port, 120000, onProgress);
}
