/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");

const CSV_PATH = path.resolve(__dirname, "..", "coffee.csv");

const labelMap = {
  ACIDIC: "Acidic",
  ACIDC: "Acidic",
  NON_ACIDIC: "Non-Acidic",
  "NON-ACIDIC": "Non-Acidic",
  "NON ACIDIC": "Non-Acidic",
  NONACIDIC: "Non-Acidic",
};

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV is empty or missing rows");
  }

  const header = lines[0].split(",").map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length !== header.length) continue;

    const row = {};
    for (let j = 0; j < header.length; j++) {
      row[header[j]] = parts[j].trim();
    }
    rows.push(row);
  }

  return rows;
}

function countAcidic(samples) {
  return samples.reduce((acc, s) => acc + (s.label === "Acidic" ? 1 : 0), 0);
}

function gini(samples) {
  if (!samples.length) return 0;
  const a = countAcidic(samples);
  const p = a / samples.length;
  const q = 1 - p;
  return 1 - (p * p + q * q);
}

function trainDecisionStump(samples) {
  if (!samples.length) {
    return {
      threshold: 0,
      leftAcidicProbability: 0.5,
      rightAcidicProbability: 0.5,
    };
  }

  const sorted = [...samples].sort((a, b) => a.ph - b.ph);
  const unique = Array.from(new Set(sorted.map((s) => s.ph)));

  if (unique.length === 1) {
    const p = countAcidic(sorted) / sorted.length;
    return {
      threshold: unique[0],
      leftAcidicProbability: p,
      rightAcidicProbability: p,
    };
  }

  const candidates = [];
  for (let i = 0; i < unique.length - 1; i++) {
    candidates.push((unique[i] + unique[i + 1]) / 2);
  }

  let bestThreshold = candidates[0];
  let bestScore = Number.POSITIVE_INFINITY;

  for (const t of candidates) {
    const left = sorted.filter((s) => s.ph <= t);
    const right = sorted.filter((s) => s.ph > t);
    const score = (left.length / sorted.length) * gini(left) + (right.length / sorted.length) * gini(right);
    if (score < bestScore) {
      bestScore = score;
      bestThreshold = t;
    }
  }

  const left = sorted.filter((s) => s.ph <= bestThreshold);
  const right = sorted.filter((s) => s.ph > bestThreshold);

  const leftP = left.length ? countAcidic(left) / left.length : countAcidic(sorted) / sorted.length;
  const rightP = right.length ? countAcidic(right) / right.length : countAcidic(sorted) / sorted.length;

  return {
    threshold: bestThreshold,
    leftAcidicProbability: leftP,
    rightAcidicProbability: rightP,
  };
}

function predictLabel(ph, model) {
  const p = ph <= model.threshold ? model.leftAcidicProbability : model.rightAcidicProbability;
  return p >= 0.5 ? "Acidic" : "Non-Acidic";
}

function confusionMatrix(samples, model) {
  const m = { tp: 0, tn: 0, fp: 0, fn: 0 };
  for (const s of samples) {
    const pred = predictLabel(s.ph, model);
    if (pred === "Acidic" && s.label === "Acidic") m.tp++;
    else if (pred === "Non-Acidic" && s.label === "Non-Acidic") m.tn++;
    else if (pred === "Acidic" && s.label === "Non-Acidic") m.fp++;
    else m.fn++;
  }
  return m;
}

function accuracy(cm) {
  const total = cm.tp + cm.tn + cm.fp + cm.fn;
  return total ? (cm.tp + cm.tn) / total : 0;
}

function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`ERROR: coffee.csv not found at ${CSV_PATH}`);
    process.exit(2);
  }

  const rows = parseCsv(fs.readFileSync(CSV_PATH, "utf8"));

  const samples = [];
  const unknownLabels = new Set();

  for (const row of rows) {
    const phRaw = row.prototype_pH;
    const labelRaw = String(row.label || "").trim().toUpperCase();

    const ph = Number.parseFloat(phRaw);
    if (!Number.isFinite(ph)) continue;

    const mapped = labelMap[labelRaw];
    if (!mapped) {
      unknownLabels.add(labelRaw);
      continue;
    }

    samples.push({ ph, label: mapped });
  }

  if (unknownLabels.size) {
    console.warn("WARNING: Unknown labels (ignored):", Array.from(unknownLabels));
  }

  const model = trainDecisionStump(samples);
  const cm = confusionMatrix(samples, model);

  console.log("\n=== coffee.csv decision-stump model ===");
  console.log(`Samples used: ${samples.length}`);
  console.log(`Threshold: ${model.threshold}`);
  console.log(`Left acidic prob (ph <= threshold): ${model.leftAcidicProbability}`);
  console.log(`Right acidic prob (ph > threshold): ${model.rightAcidicProbability}`);
  console.log("Confusion matrix:", cm);
  console.log(`Accuracy: ${accuracy(cm)}`);

  console.log("\nPaste into app:");
  console.log(
    JSON.stringify(
      {
        threshold: Number(model.threshold.toFixed(6)),
        leftAcidicProbability: Number(model.leftAcidicProbability.toFixed(6)),
        rightAcidicProbability: Number(model.rightAcidicProbability.toFixed(6)),
      },
      null,
      2
    )
  );
}

main();
