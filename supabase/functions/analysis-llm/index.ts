// @ts-nocheck
// Deploy with Supabase Edge Functions and set GROQ_API_KEY in function secrets.
// Optional: set GROQ_MODEL, otherwise llama-3.1-8b-instant is used.

type AnalysisInput = {
  coffeeType?: string;
  ph?: number;
  classification?: string;
  riskLevel?: string;
  stomachState?: string;
  cupsToday?: number;
  stabilizationTimeSec?: number;
  averageVoltage?: number;
  samplesCollected?: number;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    if (!groqApiKey) {
      throw new Error("GROQ_API_KEY is not configured.");
    }

    const model = Deno.env.get("GROQ_MODEL") || "llama-3.1-8b-instant";
    const { record } = (await request.json()) as { record?: AnalysisInput };
    if (!record) {
      return Response.json({ error: "Missing record payload." }, { status: 400, headers: corsHeaders });
    }

    const inputText = [
      "You are generating coffee acidity result guidance for a mobile app.",
      "Use only the provided measurements. Do not invent medical diagnoses.",
      "Keep the tone concise and practical.",
      "Return valid JSON only.",
      "Required keys: summary, likelyEffectTitle, likelyEffectItems, advisory, tips, safeTiming, impactItems.",
      "likelyEffectItems, tips, and impactItems must be arrays of strings.",
      "",
      `Coffee type: ${record.coffeeType ?? "Unknown"}`,
      `pH: ${record.ph ?? "Unknown"}`,
      `Classification: ${record.classification ?? "Unknown"}`,
      `Risk level: ${record.riskLevel ?? "Unknown"}`,
      `Stomach state: ${record.stomachState ?? "Unknown"}`,
      `Cups today: ${record.cupsToday ?? "Unknown"}`,
      `Stabilization time: ${record.stabilizationTimeSec ?? "Unknown"}`,      `Average voltage: ${record.averageVoltage ?? "Unknown"}`,
      `Samples collected: ${record.samplesCollected ?? "Unknown"}`,
    ].join("\n");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: inputText,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const message = `Groq request failed: ${response.status} ${errorText}`;
      return Response.json(
        {
          error: message,
          upstreamStatus: response.status,
        },
        { status: 502, headers: corsHeaders }
      );
    }

    const payload = await response.json();
    const outputText = payload?.choices?.[0]?.message?.content;
    if (!outputText || typeof outputText !== "string") {
      throw new Error("Groq response did not include valid content.");
    }

    const narrative = JSON.parse(outputText) as Record<string, unknown>;
    return Response.json(
      {
        ...narrative,
        model,
        generatedAt: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown LLM analysis error.";
    return Response.json(
      {
        error: message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
});
