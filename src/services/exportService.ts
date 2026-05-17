import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { AnalysisRecord } from "../types/analysis";

function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export async function shareAnalysisPdf(record: AnalysisRecord): Promise<void> {
  const html = `
  <html>
    <body style="font-family: Arial; padding: 24px; color: #2E211B;">
      <h2 style="margin:0 0 8px 0;">Acidex Snapshot</h2>
      <p style="margin:0 0 16px 0; color:#7A675C;">${esc(record.coffeeType)} • ${new Date(record.createdAt).toLocaleString("en-US")}</p>
      <div style="border:1px solid #E5D8CB; border-radius:12px; padding:14px;">
        <p><b>pH:</b> ${record.ph.toFixed(1)}</p>
        <p><b>Classification:</b> ${esc(record.classification)}</p>
        <p><b>Risk:</b> ${esc(record.riskLevel ?? "Low Risk")}</p>
        <p><b>Stomach state:</b> ${esc(record.stomachState ?? "Not logged")}</p>
        <p><b>Cups today:</b> ${record.cupsToday ?? 1}</p>
      </div>
      <p style="margin-top:16px; color:#6C564B;">For awareness only, not medical care. This is not a diagnosis or treatment plan. For reflux, GERD, or dental concerns, consult a qualified healthcare professional.</p>
    </body>
  </html>
  `;

  const file = await Print.printToFileAsync({ html });
  if (!(await Sharing.isAvailableAsync())) return;
  await Sharing.shareAsync(file.uri, {
    UTI: ".pdf",
    mimeType: "application/pdf",
  });
}
