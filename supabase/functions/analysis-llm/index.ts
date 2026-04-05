// @ts-nocheck
// Deploy with Supabase Edge Functions and set OPENAI_API_KEY in the function secrets.
// Optional: set OPENAI_MODEL, otherwise gpt-5.4-mini is used.

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
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const model = Deno.env.get("OPENAI_MODEL") || "gpt-5.4-mini";
    const { record } = (await request.json()) as { record?: AnalysisInput };
    if (!record) {
      return Response.json({ error: "Missing record payload." }, { status: 400, headers: corsHeaders });
    }

    const inputText = [
      "You are generating coffee acidity result guidance for a mobile app.",
      "Use only the provided measurements. Do not invent medical diagnoses.",
      "Keep the tone concise and practical.",
      "",
      `Coffee type: ${record.coffeeType ?? "Unknown"}`,
      `pH: ${record.ph ?? "Unknown"}`,
      `Classification: ${record.classification ?? "Unknown"}`,
      `Risk level: ${record.riskLevel ?? "Unknown"}`,
      `Stomach state: ${record.stomachState ?? "Unknown"}`,
      `Cups today: ${record.cupsToday ?? "Unknown"}`,
      `Stabilization time: ${record.stabilizationTimeSec ?? "Unknown"}`,
      `Average voltage: ${record.averageVoltage ?? "Unknown"}`,
      `Samples collected: ${record.samplesCollected ?? "Unknown"}`,
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: inputText,
        text: {
          format: {
            type: "json_schema",
            name: "coffee_analysis_narrative",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                likelyEffectTitle: { type: "string" },
                likelyEffectItems: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 2,
                  maxItems: 4,
                },
                advisory: { type: "string" },
                tips: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 3,
                  maxItems: 4,
                },
                safeTiming: { type: "string" },
                impactItems: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 2,
                  maxItems: 4,
                },
              },
              required: [
                "summary",
                "likelyEffectTitle",
                "likelyEffectItems",
                "advisory",
                "tips",
                "safeTiming",
                "impactItems",
              ],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
    }

    const payload = await response.json();
    const outputText = payload?.output?.[0]?.content?.[0]?.text;
    if (!outputText || typeof outputText !== "string") {
      throw new Error("OpenAI response did not include structured text output.");
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
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
