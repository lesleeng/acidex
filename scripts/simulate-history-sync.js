const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const dotenv = require("dotenv");

for (const fileName of [".env.local", ".env"]) {
  const envPath = path.join(__dirname, "..", fileName);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_EMAIL = process.env.SUPABASE_EMAIL;
const SUPABASE_PASSWORD = process.env.SUPABASE_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.");
  console.error("Set them in your shell or create mobile/acidex/.env or .env.local.");
  process.exit(1);
}

if (!SUPABASE_ACCESS_TOKEN && (!SUPABASE_EMAIL || !SUPABASE_PASSWORD)) {
  console.error("Missing SUPABASE_ACCESS_TOKEN or SUPABASE_EMAIL/SUPABASE_PASSWORD.");
  console.error("EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are used for the project connection.");
  console.error("Provide a real user token, or let the script sign in with email/password.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const record = {
  id: process.env.HISTORY_ID || `demo-${Date.now()}`,
  createdAt: new Date().toISOString(),
  coffeeType: process.env.COFFEE_TYPE || "Sample 1",
  ph: Number(process.env.PH || 5.2),
  classification: process.env.CLASSIFICATION || "Moderate",
  binaryLabel: null,
  mlConfidence: null,
  mlModelKey: null,
  mlModelName: null,
  stabilizationTimeSec: null,
  averageVoltage: null,
  samplesCollected: null,
  sampleId: null,
  note: process.env.NOTE || null,
  stomachState: process.env.STOMACH_STATE || "After meal",
  cupsToday: null,
  riskLevel: process.env.RISK_LEVEL || "Moderate Risk",
  narrative: null,
};

async function main() {
  let user = null;

  if (SUPABASE_ACCESS_TOKEN) {
    const looksLikeJwt = SUPABASE_ACCESS_TOKEN.split(".").length === 3;
    if (!looksLikeJwt) {
      console.error("SUPABASE_ACCESS_TOKEN does not look like a JWT.");
      console.error("It is usually the access_token from a Supabase session, not the anon key or refresh token.");
    } else {
      const { data: userData, error: userError } = await supabase.auth.getUser(SUPABASE_ACCESS_TOKEN);
      if (!userError && userData.user) {
        user = userData.user;
      } else {
        console.error("getUser failed:", userError ? userError.message : "no user returned");
      }
    }
  }

  if (!user) {
    if (!SUPABASE_EMAIL || !SUPABASE_PASSWORD) {
      console.error("Cannot fall back to email/password because SUPABASE_EMAIL or SUPABASE_PASSWORD is missing.");
      process.exit(1);
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: SUPABASE_EMAIL,
      password: SUPABASE_PASSWORD,
    });

    if (signInError) {
      console.error("signInWithPassword failed:", signInError.message);
      process.exit(1);
    }

    user = signInData.user;
  }

  if (!user) {
    console.error("No user session available.");
    process.exit(1);
  }

  const payload = {
    id: record.id,
    profile_id: user.id,
    created_at: record.createdAt,
    coffee_type: record.coffeeType,
    ph: record.ph,
    classification: record.classification,
    binary_label: record.binaryLabel,
    ml_confidence: record.mlConfidence,
    ml_model_key: record.mlModelKey,
    ml_model_name: record.mlModelName,
    stabilization_time_sec: record.stabilizationTimeSec,
    average_voltage: record.averageVoltage,
    samples_collected: record.samplesCollected,
    sample_id: record.sampleId,
    note: record.note,
    stomach_state: record.stomachState,
    cups_today: record.cupsToday,
    risk_level: record.riskLevel,
    narrative: record.narrative,
    is_bookmarked: true,
  };

  const { data, error } = await supabase
    .from("history")
    .upsert(payload, { onConflict: "id" })
    .select();

  if (error) {
    console.error("history upsert failed:", error.message);
    process.exit(1);
  }

  console.log("History sync simulated successfully:");
  console.log(JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});