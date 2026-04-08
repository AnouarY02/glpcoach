import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface AnalyzeRequest {
  description: string;
  photoBase64?: string;
}

interface AnalyzeResponse {
  protein_estimate_g: number;
  tips: string[];
  analysis: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AnalyzeRequest = await request.json();
    const { description, photoBase64 } = body;

    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        { error: "Beschrijving is verplicht" },
        { status: 400 }
      );
    }

    const prompt = `Analyseer deze maaltijdbeschrijving en schat het eiwitgehalte in gram. Geef ook 1-2 tips om meer eiwit toe te voegen. Wees kort en praktisch.

Maaltijd: "${description.trim()}"

Antwoord ALLEEN in dit JSON formaat (geen andere tekst):
{
  "protein_estimate_g": <getal>,
  "tips": ["tip 1", "tip 2"],
  "analysis": "<korte 1-zin analyse>"
}`;

    // Build message content — include image if provided
    const messageContent: Anthropic.MessageParam["content"] = photoBase64
      ? [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: photoBase64,
            },
          },
          { type: "text", text: prompt },
        ]
      : prompt;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: messageContent }],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON response — be lenient with extraction
    let parsed: AnalyzeResponse;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsed = JSON.parse(jsonMatch[0]) as AnalyzeResponse;

      // Validate and clamp
      parsed.protein_estimate_g = Math.min(
        Math.max(Math.round(Number(parsed.protein_estimate_g) || 0), 0),
        200
      );
      if (!Array.isArray(parsed.tips)) parsed.tips = [];
      parsed.tips = parsed.tips.slice(0, 2).map(String);
      if (typeof parsed.analysis !== "string") parsed.analysis = "";
    } catch {
      // Fallback if parsing fails
      parsed = {
        protein_estimate_g: 0,
        tips: ["Voeg Griekse yoghurt of cottage cheese toe voor extra eiwit."],
        analysis: "Kon de maaltijd niet nauwkeurig analyseren.",
      };
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("Meal analyze error:", error);
    return NextResponse.json(
      { error: "Analyse mislukt. Probeer opnieuw." },
      { status: 500 }
    );
  }
}
